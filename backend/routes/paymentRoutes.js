const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { createOrder, verifyPayment, handlePaymentFailure } = require('../controllers/paymentController');
const { razorpayWebhook } = require('../controllers/webhookController');

router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.post('/failed', protect, handlePaymentFailure);
router.post('/webhook', razorpayWebhook);

module.exports = router;
