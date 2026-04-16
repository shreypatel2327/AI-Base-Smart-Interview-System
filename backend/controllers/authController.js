const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

/* ─────────────────────────────────────────────────────────────────
   1. Register — Saves to DB immediately with isVerified: false
   ───────────────────────────────────────────────────────────────── */
exports.registerUser = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        if (!firstName || !email || !password) {
            return res.status(400).json({ success: false, message: 'Please fill all required fields.' });
        }

        // 1. Check if email exists
        let user = await User.findOne({ email });

        if (user) {
            // 2. IF isVerified === true → Reject
            if (user.isVerified) {
                return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
            }

            // 3. IF isVerified === false → Update OTP and Resend
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
            
            user.otp = hashedOtp;
            user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
            // If they provided a new password, update it
            if (password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(password, salt);
            }
            await user.save();

            console.log(`[Signup] Updating OTP for existing unverified user: ${email}...`);
            const sent = await sendVerificationEmail(email, otp);
            
            if (!sent) {
                return res.status(500).json({ success: false, message: 'Failed to send verification email.' });
            }

            return res.status(200).json({
                success: true,
                message: 'User already exists but is unverified. A new OTP has been sent.'
            });
        }

        // 4. ELSE → Create new user (isVerified = false)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

        user = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            isVerified: false,
            otp: hashedOtp,
            otpExpiry: new Date(Date.now() + 10 * 60 * 1000)
        });

        console.log(`[Signup] Creating new user and sending OTP to ${email}...`);
        const sent = await sendVerificationEmail(email, otp);
        
        if (!sent) {
            // Even if email fails, user is saved as unverified. They can use resend later.
            return res.status(201).json({ 
                success: true, 
                message: 'User registered, but email failed to send. Please request a new OTP.' 
            });
        }

        res.status(201).json({
            success: true,
            message: 'User registered. Please check email for OTP verification.'
        });
    } catch (error) {
        console.error('[Register Error]', error);
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
};

/* ─────────────────────────────────────────────────────────────────
   2. Verify OTP
   ───────────────────────────────────────────────────────────────── */
exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        if (user.isVerified) {
            return res.status(400).json({ success: false, message: 'User is already verified.' });
        }

        // Check expiry
        if (user.otpExpiry < new Date()) {
            return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
        }

        const hashedOtp = crypto.createHash('sha256').update(otp.toString()).digest('hex');
        if (user.otp !== hashedOtp) {
            return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
        }

        // success
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            _id: user.id,
            name: `${user.firstName} ${user.lastName || ''}`.trim(),
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            token: generateToken(user._id)
        });
    } catch (error) {
        console.error('[Verify OTP Error]', error);
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
};

/* ─────────────────────────────────────────────────────────────────
   3. Resend OTP
   ───────────────────────────────────────────────────────────────── */
exports.resendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

        const user = await User.findOne({ email, isVerified: false });
        if (!user) {
            return res.status(404).json({ success: false, message: 'No unverified user found with this email.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

        user.otp = hashedOtp;
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        console.log(`[Resend OTP] Sending new OTP to ${email}...`);
        const sent = await sendVerificationEmail(email, otp);
        if (!sent) {
            return res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.' });
        }

        res.status(200).json({ success: true, message: 'A new OTP has been sent to your email.' });
    } catch (error) {
        console.error('[Resend OTP Error]', error);
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
};

/* ─────────────────────────────────────────────────────────────────
   4. Login
   ───────────────────────────────────────────────────────────────── */
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password.' });
        }

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        if (!user.isVerified) {
            return res.status(403).json({ success: false, message: 'Please verify your email first.', isVerified: false });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        res.json({
            success: true,
            _id: user.id,
            name: `${user.firstName} ${user.lastName || ''}`.trim(),
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            token: generateToken(user._id)
        });
    } catch (error) {
        console.error('[Login Error]', error);
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
};

/* ─────────────────────────────────────────────────────────────────
   5. Forgot Password
   ───────────────────────────────────────────────────────────────── */
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

        const user = await User.findOne({ email, isVerified: true });
        if (!user) {
            // Keep it vague for security
            return res.status(200).json({ success: true, message: 'If this email exists, a reset link has been sent.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
        await user.save({ validateBeforeSave: false });

        const sent = await sendPasswordResetEmail(user.email, resetToken);
        if (!sent) {
            user.resetToken = undefined;
            user.resetTokenExpiry = undefined;
            await user.save({ validateBeforeSave: false });
            return res.status(500).json({ success: false, message: 'Failed to send reset email.' });
        }

        res.status(200).json({ success: true, message: 'If this email exists, a reset link has been sent.' });
    } catch (error) {
        console.error('[Forgot Password Error]', error);
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
};

/* ─────────────────────────────────────────────────────────────────
   6. Reset Password
   ───────────────────────────────────────────────────────────────── */
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({
            resetToken: hashedToken,
            resetTokenExpiry: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        user.isVerified = true;
        await user.save({ validateBeforeSave: false });

        res.status(200).json({ success: true, message: 'Password has been reset successfully.' });
    } catch (error) {
        console.error('[Reset Password Error]', error);
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
};

/* ─────────────────────────────────────────────────────────────────
   7. Social Login (Google only, GitHub moved to dedicated flow)
   ───────────────────────────────────────────────────────────────── */
exports.socialLogin = async (req, res) => {
    try {
            });
            providerId = ghUser.data.id.toString();
            const primaryEmail = ghEmails.data.find(e => e.primary);
            email = primaryEmail ? primaryEmail.email : ghUser.data.email;
            const nameParts = (ghUser.data.name || ghUser.data.login || '').split(' ');
            firstName = nameParts[0] || 'GitHub User';
            lastName = nameParts.slice(1).join(' ') || '';
        } else {
            return res.status(400).json({ success: false, message: 'Invalid provider.' });
        }

        let user = await User.findOne({ email });
        if (!user) {
            user = await User.create({ firstName, lastName, email, isVerified: true, provider, providerId });
        } else {
            user.provider = provider;
            user.providerId = providerId;
            user.isVerified = true;
            await user.save({ validateBeforeSave: false });
        }

        res.status(200).json({
            success: true,
            _id: user.id,
            name: `${user.firstName} ${user.lastName || ''}`.trim(),
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            token: generateToken(user._id)
        });
    } catch (error) {
        console.error('[Social Login Error]', error);
        res.status(500).json({ success: false, message: 'Social login failed.', error: error.message });
    }
};

/* ─────────────────────────────────────────────────────────────────
   8. Get Current User
   ───────────────────────────────────────────────────────────────── */
exports.getMe = async (req, res) => {
    res.status(200).json({
        success: true,
        data: {
            _id: req.user.id,
            name: `${req.user.firstName} ${req.user.lastName || ''}`.trim(),
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            email: req.user.email,
            isVerified: req.user.isVerified
        }
    });
};
