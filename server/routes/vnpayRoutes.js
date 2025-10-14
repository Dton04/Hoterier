const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const querystring = require('qs');
const mongoose = require('mongoose');
const Booking = require('../models/booking');
const moment = require('moment');

const config = {
    tmnCode: process.env.VNPAY_TMN_CODE,
    hashSecret: process.env.VNPAY_HASH_SECRET,
    vnpUrl: process.env.VNPAY_URL,
    returnUrl: process.env.VNPAY_RETURN_URL,
    apiUrl: process.env.VNPAY_API,
};

if (!config.tmnCode || !config.hashSecret || !config.vnpUrl || !config.returnUrl) {
    throw new Error('Thiếu cấu hình VNPay: tmnCode, hashSecret, vnpUrl hoặc returnUrl không được định nghĩa');
}

function sortObject(obj) {
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
}

router.post('/create-payment', async (req, res) => {
    try {
        const { amount, orderId, orderInfo, bookingId } = req.body;

        if (!amount || !orderId || !orderInfo || !bookingId) {
            return res.status(400).json({ message: 'Thiếu các trường bắt buộc: amount, orderId, orderInfo, bookingId' });
        }

        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({ message: 'bookingId không hợp lệ' });
        }

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Không tìm thấy đặt phòng' });
        }
        if (booking.paymentStatus !== 'pending') {
            return res.status(400).json({ message: 'Đặt phòng không ở trạng thái chờ thanh toán' });
        }

        const parsedAmount = parseInt(amount, 10);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ message: 'Số tiền không hợp lệ' });
        }

        process.env.TZ = 'Asia/Ho_Chi_Minh';
        const date = new Date();
        const createDate = moment(date).format('YYYYMMDDHHmmss');

        const ipAddr =
            req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;

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

        const signData = querystring.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac('sha512', config.hashSecret);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
        vnp_Params['vnp_SecureHash'] = signed;

        const vnpUrl = config.vnpUrl + '?' + querystring.stringify(vnp_Params, { encode: false });

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
});

router.get('/vnpay_return', async (req, res) => {
    try {
        let vnp_Params = req.query;
        console.log('Received VNPay callback data:', vnp_Params);

        const secureHash = vnp_Params['vnp_SecureHash'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = sortObject(vnp_Params);

        const signData = querystring.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac('sha512', config.hashSecret);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        const orderId = vnp_Params['vnp_TxnRef'];
        const booking = await Booking.findOne({ vnpOrderId: orderId }).catch(err => {
            console.error('Lỗi khi tìm booking:', err);
            throw err;
        });

        if (!booking) {
            return res.status(400).json({ message: 'Không tìm thấy đặt phòng' });
        }

        if (secureHash === signed) {
            if (vnp_Params['vnp_ResponseCode'] === '00') {
                // Thanh toán thành công, lưu thông tin giao dịch
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

                // Redirect về client với URL đầy đủ (development)
                res.redirect(`http://localhost:3000/booking-success?bookingId=${booking._id}`);
            } else {
                await Booking.findByIdAndUpdate(booking._id, {
                    paymentStatus: 'canceled',
                }).catch(err => {
                    console.error('Lỗi khi cập nhật booking thất bại:', err);
                    throw err;
                });
                res.redirect(`http://localhost:3000/booking-failed?bookingId=${booking._id}`);
            }
        } else {
            res.status(400).json({ message: 'Chữ ký không hợp lệ' });
        }
    } catch (error) {
        console.error('Lỗi xử lý callback VNPay:', error);
        res.status(500).json({ message: `Lỗi server: ${error.message}` });
    }
});

module.exports = router;