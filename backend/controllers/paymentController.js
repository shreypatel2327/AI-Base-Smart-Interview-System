const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const User = require('../models/User');
const dotenv = require('dotenv');
dotenv.config();

const PRO_PLAN_PRICE = 49900; // 499 INR in paise

const getRazorpayInstance = () => {
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
};

exports.createOrder = async (req, res) => {
    try {
        const razorpay = getRazorpayInstance();
        const options = {
            amount: PRO_PLAN_PRICE,
            currency: "INR",
            // receipt: `rcpt_${req.user._id}_${Date.now()}`
            receipt: `order_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);

        // Create payment tracking record
        await Payment.create({
            userId: req.user._id,
            orderId: order.id,
            amount: PRO_PLAN_PRICE,
            status: 'created'
        });

        res.status(200).json({
            success: true,
            data: {
                order_id: order.id,
                amount: order.amount,
                currency: order.currency
            }
        });
    } catch (error) {
        console.error("Create Order Error:", error);
        res.status(500).json({ success: false, message: 'Could not create order', error: error.message });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // Idempotency check
        const existingPayment = await Payment.findOne({ paymentId: razorpay_payment_id, status: 'success' });
        if (existingPayment) {
            return res.status(200).json({ success: true, message: 'Payment already verified' });
        }

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            // Update payment record
            await Payment.findOneAndUpdate(
                { orderId: razorpay_order_id, userId: req.user._id },
                {
                    paymentId: razorpay_payment_id,
                    status: 'success'
                }
            );

            // Upgrade User
            const user = await User.findById(req.user._id);
            user.plan = 'pro';
            // Set expiry to 30 days
            user.planExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            await user.save();

            res.status(200).json({ success: true, message: 'Payment verified successfully. Plan upgraded to Pro.' });
        } else {
            res.status(400).json({ success: false, message: 'Invalid signature' });
        }
    } catch (error) {
        console.error("Verify Payment Error:", error);
        res.status(500).json({ success: false, message: 'Error verifying payment', error: error.message });
    }
};

exports.handlePaymentFailure = async (req, res) => {
    try {
        const { error_code, error_description, error_source, error_step, error_reason, order_id, payment_id } = req.body;

        await Payment.findOneAndUpdate(
            { orderId: order_id, userId: req.user._id },
            {
                status: 'failed',
                paymentId: payment_id
            }
        );

        res.status(200).json({ success: true, message: 'Failure recorded' });
    } catch (error) {
        console.error("Handle Payment Failure Error:", error);
        res.status(500).json({ success: false, message: 'Error recording failure', error: error.message });
    }
};
