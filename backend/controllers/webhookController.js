const crypto = require('crypto');
const Payment = require('../models/Payment');
const User = require('../models/User');

exports.razorpayWebhook = async (req, res) => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers['x-razorpay-signature'];

        if (!secret) {
             return res.status(400).send('Webhook secret not configured');
        }

        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(req.body))
            .digest('hex');

        if (signature !== expectedSignature) {
            return res.status(400).send('Invalid webhook signature');
        }

        const event = req.body.event;
        const payload = req.body.payload;

        if (event === 'payment.captured') {
            const paymentEntity = payload.payment.entity;
            const orderId = paymentEntity.order_id;
            const paymentId = paymentEntity.id;

            // Update payment record idempotently
            const payment = await Payment.findOne({ orderId: orderId });
            if (payment && payment.status !== 'success') {
                payment.status = 'success';
                payment.paymentId = paymentId;
                await payment.save();

                // Upgrade User
                const user = await User.findById(payment.userId);
                if (user && user.plan !== 'pro') {
                    user.plan = 'pro';
                    user.planExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                    await user.save();
                }
            }
        } else if (event === 'payment.failed') {
            const paymentEntity = payload.payment.entity;
            const orderId = paymentEntity.order_id;
            const paymentId = paymentEntity.id;

            const payment = await Payment.findOne({ orderId: orderId });
            if (payment && payment.status !== 'success') {
                payment.status = 'failed';
                payment.paymentId = paymentId;
                await payment.save();
            }
        }

        res.status(200).send('Webhook processed');
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).send('Webhook error');
    }
}
