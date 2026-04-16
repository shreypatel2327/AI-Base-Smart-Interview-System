const http = require('http');

// First delete the old test user, then signup fresh
const deleteOldUser = () => {
  return new Promise((resolve) => {
    require('dotenv').config();
    const mongoose = require('mongoose');
    mongoose.connect(process.env.MONGO_URI).then(async () => {
      await mongoose.connection.collection('users').deleteOne({ email: 'tempemail101024@gmail.com' });
      console.log('Deleted old test user from DB');
      await mongoose.connection.close();
      resolve();
    }).catch(err => {
      console.log('DB cleanup error:', err.message);
      resolve();
    });
  });
};

const testSignup = () => {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      firstName: 'Test',
      lastName: 'User',
      email: 'tempemail101024@gmail.com',
      password: 'test123'
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/signup',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Signup Status:', res.statusCode);
        console.log('Signup Response:', data);
        resolve();
      });
    });

    req.on('error', err => {
      console.error('Request error:', err.message);
      reject(err);
    });

    req.setTimeout(15000, () => {
      console.log('Request timed out');
      req.destroy();
      reject(new Error('timeout'));
    });

    req.write(payload);
    req.end();
  });
};

(async () => {
  await deleteOldUser();
  await testSignup();
  process.exit(0);
})();
