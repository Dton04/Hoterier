const crypto = require('crypto');
const Booking = require('../models/booking');


exports.momoIPN = async (req, res) => {
   try {
      console.log('MoMo IPN received:', req.body);

      const {
         partnerCode,
         orderId,
         requestId,
         amount,
         orderInfo,
         orderType,
         transId,
         resultCode,
         message,
         payType,
         responseTime,
         extraData,
         signature
      } = req.body;

      // Verify signature
      const secretKey = process.env.MOMO_SECRET_KEY;
      const rawSignature = `accessKey=${process.env.MOMO_ACCESS_KEY}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

      const expectedSignature = crypto.createHmac('sha256', secretKey)
         .update(rawSignature)
         .digest('hex');

      if (signature !== expectedSignature) {
         console.error('Invalid MoMo signature');
         return res.status(400).json({ message: 'Invalid signature' });
      }

      // Find booking by orderId
      const booking = await Booking.findOne({ momoOrderId: orderId });

      if (!booking) {
         console.error('Booking not found for orderId:', orderId);
         return res.status(404).json({ message: 'Booking not found' });
      }

      // Update booking based on result code
      if (resultCode === 0) {
         // Payment successful
         await Booking.findByIdAndUpdate(booking._id, {
            paymentStatus: 'paid',
            status: 'confirmed',
            momoTransId: transId,
            momoPayType: payType,
            momoResponseTime: responseTime,
         });
         console.log('MoMo payment successful for booking:', booking._id);

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
                  console.log(`Tích ${pointsEarned} điểm cho user ${user.email}`);
               }
            }
         } catch (pointsError) {
            console.error('Lỗi khi tích điểm tự động:', pointsError);
            // Don't fail the payment if points accumulation fails
         }
      } else {
         // Payment failed
         await Booking.findByIdAndUpdate(booking._id, {
            paymentStatus: 'canceled',
            status: 'canceled',
         });
         console.log('MoMo payment failed for booking:', booking._id, 'Result code:', resultCode);
      }

      // Respond to MoMo
      res.status(200).json({ message: 'IPN processed successfully' });
   } catch (error) {
      console.error('Error processing MoMo IPN:', error);
      res.status(500).json({ message: 'Internal server error' });
   }
};
