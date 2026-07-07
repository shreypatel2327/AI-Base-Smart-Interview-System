const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middlewares/authMiddleware');
const { 
    startInterview, 
    answerQuestion, 
    getReport,
    getInterviews
} = require('../controllers/interviewController');

// Multer memory storage configuration for PDF upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.route('/')
    .get(protect, getInterviews);

router.post('/start', protect, startInterview);
router.post('/:id/answer', protect, answerQuestion);
router.get('/:id/report', protect, getReport);

module.exports = router;
