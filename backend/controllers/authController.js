const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

/* 1. Register User (Signup + OTP) */
exports.registerUser = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        if (!firstName || !email || !password) {
            return res.status(400).json({ success: false, message: 'Please add all required fields' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        // Hash the OTP (so it's not stored plain text)
        const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        const user = await User.create({
            firstName,
            lastName,
            email,
            password,
            isVerified: false,
            otp: hashedOtp,
            otpExpiry
        });

        if (user) {
            // Send OTP email
            await sendVerificationEmail(user.email, otp);
            res.status(201).json({
                success: true,
                message: 'User registered. Please check email for OTP verification.'
            });
        } else {
            res.status(400).json({ success: false, message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

/* 2. Verify OTP */
exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Please provide email and OTP' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ success: false, message: 'User is already verified' });
        }

        if (user.otpExpiry < new Date()) {
            return res.status(400).json({ success: false, message: 'OTP has expired' });
        }

        const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
        if (user.otp !== hashedOtp) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        // Mark user internally verified
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
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

/* 3. Login Flow */
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        // Block if not verified
        if (!user.isVerified) {
            return res.status(403).json({ success: false, message: 'Please verify your email first', isVerified: false });
        }

        // Compare password (if local provider)
        if (user.provider === 'local') {
            if (!(await user.matchPassword(password))) {
                return res.status(401).json({ success: false, message: 'Invalid email or password' });
            }
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
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

/* 4. Forgot Password */
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString('hex');
        
        // Hash it before saving
        user.resetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
        await user.save({ validateBeforeSave: false });

        // Send email
        const emailSent = await sendPasswordResetEmail(user.email, resetToken);
        
        if (emailSent) {
            res.status(200).json({ success: true, message: 'Password reset link sent to email' });
        } else {
            user.resetToken = undefined;
            user.resetTokenExpiry = undefined;
            await user.save({ validateBeforeSave: false });
            res.status(500).json({ success: false, message: 'Email could not be sent' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

/* 5. Reset Password */
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            resetToken: hashedToken,
            resetTokenExpiry: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
        }

        user.password = newPassword; // Will be hashed via pre-save hook
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        // Also verify the user just in case
        user.isVerified = true; 
        
        await user.save();

        res.status(200).json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

/* 6. Social Login (Google & Github via React tokens) */
exports.socialLogin = async (req, res) => {
    try {
        const { provider, credential, githubCode } = req.body;

        let email, firstName, lastName, providerId;

        if (provider === 'google') {
            const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
            const ticket = await client.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            email = payload.email;
            firstName = payload.given_name;
            lastName = payload.family_name;
            providerId = payload.sub;
        } else if (provider === 'github') {
            // NOTE: GitHub oauth flow exchanges "code" for "access_token", then gets user details.
            // Simplified handling for frontend bridging:
            if (!githubCode) return res.status(400).json({ success: false, message: 'Missing github access token or code' });
            
            // To maintain scope, this assumes githubCode here is already an access_token provided by React 
            // OR you would exchange the code here. Let's assume we expect the accessToken:
            const ghUserResponse = await axios.get('https://api.github.com/user', {
                headers: { Authorization: `Bearer ${githubCode}` }
            });
            const ghEmailResponse = await axios.get('https://api.github.com/user/emails', {
                headers: { Authorization: `Bearer ${githubCode}` }
            });
            
            providerId = ghUserResponse.data.id.toString();
            // find primary email
            const primaryEmailObj = ghEmailResponse.data.find(e => e.primary);
            email = primaryEmailObj ? primaryEmailObj.email : ghUserResponse.data.email;
            
            const nameParts = (ghUserResponse.data.name || ghUserResponse.data.login || '').split(' ');
            firstName = nameParts[0] || 'GithubUser';
            lastName = nameParts.slice(1).join(' ') || '';
        } else {
            return res.status(400).json({ success: false, message: 'Invalid provider' });
        }

        if (!email) {
            return res.status(400).json({ success: false, message: 'Failed to retrieve email from provider' });
        }

        // Find existing user or create new one
        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                firstName,
                lastName,
                email,
                isVerified: true, // Auto-verified from Social providers
                provider,
                providerId
            });
        } else {
            // Link provider if it was previously local but same email? Optional
            // Just update provider flags if needed, or leave local
            if (!user.providerId) {
                user.provider = provider;
                user.providerId = providerId;
                user.isVerified = true;
                await user.save();
            }
        }

        // Return JWT
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
        console.error('Social Login Error:', error);
        res.status(500).json({ success: false, message: 'Server error during social login', error: error.message });
    }
};

/* 7. Get Current User */
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
