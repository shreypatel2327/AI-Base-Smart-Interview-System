// Test the exact controller flow in isolation
require('dotenv').config();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { sendVerificationEmail } = require('./services/emailService');

(async () => {
  try {
    console.log('Step 1: Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('test123', salt);
    console.log('Password hashed OK');

    console.log('Step 2: Generating OTP...');
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    console.log('OTP generated:', otp);

    console.log('Step 3: Calling sendVerificationEmail...');
    const sent = await sendVerificationEmail('tempemail101024@gmail.com', otp);
    console.log('sendVerificationEmail returned:', sent);

    if (!sent) {
      console.log('EMAIL FAILED - sent returned false');
    } else {
      console.log('EMAIL SUCCESS!');
    }
  } catch (err) {
    console.error('EXCEPTION in controller flow:', err.message);
  }
  process.exit(0);
})();
