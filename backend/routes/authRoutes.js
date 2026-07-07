const express = require('express');
const router = express.Router();
const { 
    registerUser, 
    loginUser, 
    verifyOtp,
    resendOtp,
    forgotPassword,
    resetPassword,
    socialLogin,
    githubAuth,
    githubCallback,
    getMe 
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/github', githubAuth);
router.get('/github/callback', githubCallback);

router.post('/signup', registerUser);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/social-login', socialLogin);

router.get('/me', protect, getMe);

module.exports = router;
