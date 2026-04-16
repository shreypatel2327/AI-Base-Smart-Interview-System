const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
            }

            if (!req.user.isVerified) {
                return res.status(403).json({ success: false, message: 'Not authorized, user email not verified' });
            }

            // Plan expiry check
            if (req.user.plan === 'pro' && req.user.planExpiry && req.user.planExpiry < Date.now()) {
                req.user.plan = 'free';
                req.user.planExpiry = undefined;
                await req.user.save();
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
};

module.exports = { protect };
