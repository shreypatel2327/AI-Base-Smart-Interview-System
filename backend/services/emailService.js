const nodemailer = require('nodemailer');

const createTransporter = () => {
    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // STARTTLS
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
    });
};

exports.sendVerificationEmail = async (toEmail, otp) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: process.env.EMAIL_USER || 'no-reply@ai-interview.com',
            to: toEmail,
            subject: 'Verify Your Account - AI Interview System',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Welcome to AI Interview System!</h2>
                    <p>Thank you for registering. Please use the following OTP to verify your email address:</p>
                    <h1 style="color: #4f46e5; letter-spacing: 2px;">${otp}</h1>
                    <p>This OTP is valid for 10 minutes.</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Verification email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('Email send error:', error);
        return false;
    }
};

exports.sendPasswordResetEmail = async (toEmail, resetToken) => {
    try {
        const transporter = createTransporter();
        
        // The URL points to the frontend reset password route
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

        const mailOptions = {
            from: process.env.EMAIL_USER || 'no-reply@ai-interview.com',
            to: toEmail,
            subject: 'Password Reset Request',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Password Reset Request</h2>
                    <p>You requested a password reset. Click the button below to set a new password:</p>
                    <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
                    <p>Or copy this link: <br> ${resetUrl}</p>
                    <p>This link is valid for 15 minutes.</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Password reset email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('Email send error:', error);
        return false;
    }
};
