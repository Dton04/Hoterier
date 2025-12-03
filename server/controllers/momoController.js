const https = require('https');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Booking = require('../models/booking');
const Room = require('../models/room');

// MoMo configuration (Test environment)
const config = {
    partnerCode: process.env.MOMO_PARTNER_CODE,
    accessKey: process.env.MOMO_ACCESS_KEY,
    secretKey: process.env.MOMO_SECRET_KEY,
    redirectUrl: process.env.MOMO_REDIRECT_URL || 'http://localhost:3000/bookings',
    ipnUrl: process.env.MOMO_IPN_URL || 'https://your-production-ipn-url',
    requestType: 'payWithMethod',
    autoCapture: true,
    lang: 'vi',
    hostname: 'test-payment.momo.vn',
    path: '/v2/gateway/api/create',
};

// Kiểm tra cấu hình MoMo
if (!config.partnerCode || !config.accessKey || !config.secretKey) {
    throw new Error('Thiếu cấu hình MoMo: partnerCode, accessKey hoặc secretKey không được định nghĩa');
}

// @desc    Create MoMo payment request
// @route   POST /api/momo/create-payment
// @access  Private
const createMomoPayment = async (req, res) => {
    try {
        const { amount, orderId, orderInfo, bookingId } = req.body;

        // Xác thực đầu vào
        if (!amount || !orderId || !orderInfo || !bookingId) {
            return res.status(400).json({ message: 'Thiếu các trường bắt buộc: amount, orderId, orderInfo, bookingId' });
        }

        // Kiểm tra bookingId hợp lệ
        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({ message: 'bookingId không hợp lệ' });
        }

        // Kiểm tra đặt phòng tồn tại và ở trạng thái pending
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Không tìm thấy đặt phòng' });
        }
        if (booking.paymentStatus !== 'pending') {
            return res.status(400).json({ message: 'Đặt phòng không ở trạng thái chờ thanh toán' });
        }

        // Luôn dùng số tiền từ booking để tránh sai lệch phía client
        let parsedAmount = Math.round(Number(booking.totalAmount || 0));
        try {
            if (Array.isArray(booking.rooms) && booking.rooms.length > 0) {
                const totalByRooms = booking.rooms.reduce((sum, r) => {
                    const nights = Math.max(1, Math.ceil((new Date(r.checkout) - new Date(r.checkin)) / (1000 * 60 * 60 * 24)));
                    return sum + (Number(r.rentperday || 0) * nights * Number(r.roomsBooked || 1));
                }, 0);
                const adjusted = Math.max(0, totalByRooms - (booking.voucherDiscount || 0) - (booking.discount?.amountReduced || 0));
                if (!parsedAmount || Math.abs(parsedAmount - adjusted) >= 1) parsedAmount = Math.round(adjusted);
            } else if (booking.roomid) {
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

        const requestId = orderId;
        const extraData = ''; // Optional
        const orderGroupId = '';

        // Tạo raw signature
        const rawSignature = `accessKey=${config.accessKey}&amount=${parsedAmount}&extraData=${extraData}&ipnUrl=${config.ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${config.partnerCode}&redirectUrl=${config.redirectUrl}&requestId=${requestId}&requestType=${config.requestType}`;
        
        // Tạo chữ ký
        const signature = crypto.createHmac('sha256', config.secretKey)
            .update(rawSignature)
            .digest('hex');

        // Tạo body yêu cầu
        const requestBody = JSON.stringify({
            partnerCode: config.partnerCode,
            partnerName: 'Test',
            storeId: 'MomoTestStore',
            requestId: requestId,
            amount: parsedAmount,
            orderId: orderId,
            orderInfo: orderInfo,
            redirectUrl: config.redirectUrl,
            ipnUrl: config.ipnUrl,
            lang: config.lang,
            requestType: config.requestType,
            autoCapture: config.autoCapture,
            extraData: extraData,
            orderGroupId: orderGroupId,
            signature: signature,
        });

        // Tùy chọn yêu cầu HTTPS
        const options = {
            hostname: config.hostname,
            port: 443,
            path: config.path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody),
            },
        };

        // Gửi yêu cầu đến MoMo
        const momoReq = https.request(options, (momoRes) => {
            let data = '';
            momoRes.setEncoding('utf8');
            momoRes.on('data', (chunk) => {
                data += chunk;
            });
            momoRes.on('end', async () => {
                const response = JSON.parse(data);
                if (response.resultCode === 0) {
                    // Thành công: Lưu momoOrderId và momoRequestId vào đặt phòng
                    try {
                        await Booking.findByIdAndUpdate(bookingId, {
                            momoOrderId: orderId,
                            momoRequestId: requestId,
                        });
                        res.status(200).json({
                            payUrl: response.payUrl,
                            orderId: orderId,
                            requestId: requestId,
                            bookingId: bookingId,
                        });
                    } catch (updateError) {
                        console.error('Lỗi khi cập nhật đặt phòng:', updateError);
                        res.status(500).json({ message: 'Lỗi khi lưu thông tin MoMo vào đặt phòng' });
                    }
                } else {
                    // Lỗi từ MoMo
                    console.error('Lỗi từ MoMo:', response);
                    res.status(400).json({
                        message: response.message || 'Không thể tạo hóa đơn MoMo',
                        resultCode: response.resultCode,
                    });
                }
            });
        });

        momoReq.on('error', (e) => {
            console.error('Lỗi yêu cầu MoMo:', e);
            res.status(500).json({ message: `Lỗi yêu cầu MoMo: ${e.message}` });
        });

        // Gửi dữ liệu yêu cầu
        momoReq.write(requestBody);
        momoReq.end();
    } catch (error) {
        console.error('Lỗi server:', error);
        res.status(500).json({ message: `Lỗi server: ${error.message}` });
    }
};

module.exports = {
    createMomoPayment,
};
