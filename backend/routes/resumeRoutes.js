const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middlewares/authMiddleware');
const { uploadResume, getResume } = require('../controllers/resumeController');

// Multer memory storage configuration for PDF upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.route('/')
    .get(protect, getResume);

router.get('/download', protect, require('../controllers/resumeController').downloadResumePdf);

router.post('/upload', protect, upload.single('resume'), uploadResume);

module.exports = router;
