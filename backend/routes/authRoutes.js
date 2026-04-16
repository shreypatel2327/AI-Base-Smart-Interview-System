const express = require('express');
const router = express.Router();
const { 
    registerUser, 
    loginUser, 
    verifyOtp,
    forgotPassword,
    resetPassword,
    socialLogin,
    getMe 
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/signup', registerUser); // changed from /register to match prompt
router.post('/verify-otp', verifyOtp);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/social-login', socialLogin);

router.get('/me', protect, getMe);

module.exports = router;
