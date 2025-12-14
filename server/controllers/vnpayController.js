const crypto = require('crypto');
const querystring = require('qs');
const mongoose = require('mongoose');
const Booking = require('../models/booking');
const Room = require('../models/room');
const moment = require('moment');

const config = {
    tmnCode: process.env.VNPAY_TMN_CODE,
    hashSecret: process.env.VNPAY_HASH_SECRET,
    vnpUrl: process.env.VNPAY_URL,
    returnUrl: process.env.VNPAY_RETURN_URL,
    apiUrl: process.env.VNPAY_API,
};

// Validate VNPay configuration
if (!config.tmnCode || !config.hashSecret || !config.vnpUrl || !config.returnUrl) {
    throw new Error('Thiếu cấu hình VNPay: tmnCode, hashSecret, vnpUrl hoặc returnUrl không được định nghĩa');
}

// Utility function to sort object
const sortObject = (obj) => {
    if (obj === null || obj === undefined || typeof obj !== 'object' || Array.isArray(obj)) {
        console.error('Invalid input to sortObject:', obj);
        return {};
    }

    const sorted = {};
    Object.keys(obj)
        .sort()
        .forEach(key => {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+');
            }
        });
    return sorted;
};

// @desc    Create VNPay payment URL
// @route   POST /api/vnpay/create-payment
// @access  Public
exports.createPayment = async (req, res) => {
    try {
        const { amount, orderId, orderInfo, bookingId } = req.body;

        // Validation
        if (!amount || !orderId || !orderInfo || !bookingId) {
            return res.status(400).json({ message: 'Thiếu các trường bắt buộc: amount, orderId, orderInfo, bookingId' });
        }

        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({ message: 'bookingId không hợp lệ' });
        }

        // Check booking exists and is pending
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Không tìm thấy đặt phòng' });
        }
        if (booking.paymentStatus !== 'pending') {
            return res.status(400).json({ message: 'Đặt phòng không ở trạng thái chờ thanh toán' });
        }

        // Lấy số tiền CHUẨN từ booking để tránh sai lệch phía client
        let parsedAmount = Math.round(Number(booking.totalAmount || 0));
        try {
            if (Array.isArray(booking.rooms) && booking.rooms.length > 0) {
                // Multi-room: tính tổng theo từng phòng
                const totalByRooms = booking.rooms.reduce((sum, r) => {
                    const nights = Math.max(1, Math.ceil((new Date(r.checkout) - new Date(r.checkin)) / (1000 * 60 * 60 * 24)));
                    return sum + (Number(r.rentperday || 0) * nights * Number(r.roomsBooked || 1));
                }, 0);
                const adjusted = Math.max(0, totalByRooms - (booking.voucherDiscount || 0) - (booking.discount?.amountReduced || 0));
                if (!parsedAmount || Math.abs(parsedAmount - adjusted) >= 1) parsedAmount = Math.round(adjusted);
            } else if (booking.roomid) {
                // Single-room
                const room = await Room.findById(booking.roomid).lean();
                if (room) {
                    const nights = Math.max(1, Math.ceil((new Date(booking.checkout) - new Date(booking.checkin)) / (1000 * 60 * 60 * 24)));
                    const expected = room.rentperday * nights * Number(booking.roomsBooked || 1);
                    const adjusted = Math.max(0, expected - (booking.voucherDiscount || 0) - (booking.discount?.amountReduced || 0));
                    if (!parsedAmount || Math.abs(parsedAmount - adjusted) >= 1) parsedAmount = Math.round(adjusted);
                }
            }
        } catch (e) { }

        // Đồng bộ lại DB nếu lệch
        if (Math.abs((booking.totalAmount || 0) - parsedAmount) >= 1) {
            await Booking.findByIdAndUpdate(bookingId, { totalAmount: parsedAmount });
        }
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ message: 'Số tiền không hợp lệ từ đặt phòng' });
        }

        // Set timezone and create date
        process.env.TZ = 'Asia/Ho_Chi_Minh';
        const date = new Date();
        const createDate = moment(date).format('YYYYMMDDHHmmss');

        // Get client IP
        const ipAddr =
            req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;

        // Create VNPay parameters
        let vnp_Params = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: config.tmnCode,
            vnp_Locale: 'vn',
            vnp_CurrCode: 'VND',
            vnp_TxnRef: orderId,
            vnp_OrderInfo: orderInfo,
            vnp_OrderType: 'other',
            vnp_Amount: parsedAmount * 100,
            vnp_ReturnUrl: config.returnUrl,
            vnp_IpAddr: ipAddr,
            vnp_CreateDate: createDate,
        };

        vnp_Params = sortObject(vnp_Params);

        // Create signature
        const signData = querystring.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac('sha512', config.hashSecret);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
        vnp_Params['vnp_SecureHash'] = signed;

        // Create payment URL
        const vnpUrl = config.vnpUrl + '?' + querystring.stringify(vnp_Params, { encode: false });

        // Update booking with VNPay order info
        await Booking.findByIdAndUpdate(bookingId, {
            vnpOrderId: orderId,
            vnpRequestId: orderId,
        });

        res.status(200).json({
            payUrl: vnpUrl,
            orderId: orderId,
            bookingId: bookingId,
        });
    } catch (error) {
        console.error('Lỗi server:', error);
        res.status(500).json({ message: `Lỗi server: ${error.message}` });
    }
};

// @desc    Handle VNPay return callback
// @route   GET /api/vnpay/vnpay_return
// @access  Public
exports.vnpayReturn = async (req, res) => {
    try {
        let vnp_Params = req.query;
        console.log('Received VNPay callback data:', vnp_Params);

        const secureHash = vnp_Params['vnp_SecureHash'];

        // Remove hash parameters for verification
        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = sortObject(vnp_Params);

        // Verify signature
        const signData = querystring.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac('sha512', config.hashSecret);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        // Find booking by order ID
        const orderId = vnp_Params['vnp_TxnRef'];
        const booking = await Booking.findOne({ vnpOrderId: orderId }).catch(err => {
            console.error('Lỗi khi tìm booking:', err);
            throw err;
        });

        if (!booking) {
            return res.status(400).json({ message: 'Không tìm thấy đặt phòng' });
        }

        // Process payment result
        if (secureHash === signed) {
            if (vnp_Params['vnp_ResponseCode'] === '00') {
                // Payment successful
                await Booking.findByIdAndUpdate(booking._id, {
                    paymentStatus: 'paid',
                    status: 'confirmed',
                    vnpTransactionNo: vnp_Params['vnp_TransactionNo'],
                    vnpBankTranNo: vnp_Params['vnp_BankTranNo'],
                    vnpPayDate: vnp_Params['vnp_PayDate'],
                    vnpBankCode: vnp_Params['vnp_BankCode'],
                    vnpCardType: vnp_Params['vnp_CardType'],
                }).catch(err => {
                    console.error('Lỗi khi cập nhật booking:', err);
                    throw err;
                });

                // Auto accumulate points after successful payment
                try {
                    const User = require('../models/user');
                    const Transaction = require('../models/transaction');

                    const user = await User.findOne({ email: booking.email.toLowerCase() });
                    if (user) {
                        // Check if transaction already exists
                        const existingTransaction = await Transaction.findOne({ bookingId: booking._id });
                        if (!existingTransaction) {
                            const updatedBooking = await Booking.findById(booking._id).populate('roomid');
                            const checkinDate = new Date(updatedBooking.checkin);
                            const checkoutDate = new Date(updatedBooking.checkout);
                            const days = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
                            const totalAmount = updatedBooking.totalAmount || 0;
                            const pointsEarned = Math.floor(totalAmount * 0.01); // 1% of total

                            const transaction = new Transaction({
                                userId: user._id,
                                bookingId: booking._id,
                                amount: totalAmount,
                                points: pointsEarned,
                                type: 'earn',
                                status: 'completed',
                            });
                            await transaction.save();

                            user.points = (user.points || 0) + pointsEarned;
                            await user.save();
                            console.log(`✅ Tích ${pointsEarned} điểm cho user ${user.email}`);
                        }
                    }
                } catch (pointsError) {
                    console.error('Lỗi khi tích điểm tự động:', pointsError);
                    // Don't fail the payment if points accumulation fails
                }

                // Redirect to success page with payment type
                res.redirect(`http://localhost:3000/payment-callback?type=vnpay&bookingId=${booking._id}&vnp_ResponseCode=00`);
            } else {
                // Payment failed
                await Booking.findByIdAndUpdate(booking._id, {
                    paymentStatus: 'canceled',
                    status: 'canceled',
                }).catch(err => {
                    console.error('Lỗi khi cập nhật booking thất bại:', err);
                    throw err;
                });
                res.redirect(`http://localhost:3000/payment-callback?type=vnpay&bookingId=${booking._id}&vnp_ResponseCode=${vnp_Params['vnp_ResponseCode']}`);
            }
        } else {
            res.status(400).json({ message: 'Chữ ký không hợp lệ' });
        }
    } catch (error) {
        console.error('Lỗi xử lý callback VNPay:', error);
        res.status(500).json({ message: `Lỗi server: ${error.message}` });
    }
};
