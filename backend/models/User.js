const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'Please add a first name']
    },
    lastName: {
        type: String
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true
    },
    password: {
        type: String,
        required: function() {
            // Password is required only if provider is 'local' or not specified
            return !this.provider || this.provider === 'local';
        },
        select: false
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    otp: {
        type: String
    },
    otpExpiry: {
        type: Date
    },
    resetToken: {
        type: String
    },
    resetTokenExpiry: {
        type: Date
    },
    provider: {
        type: String,
        enum: ['local', 'google', 'github'],
        default: 'local'
    },
    providerId: {
        type: String
    },
    plan: {
        type: String,
        enum: ['free', 'pro'],
        default: 'free'
    },
    planExpiry: {
        type: Date
    }
}, { timestamps: true });

// Password is pre-hashed in the controller before User.create() is called.
// matchPassword is used for login comparison.
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
