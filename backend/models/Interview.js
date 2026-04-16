const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    resumeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resume',
        required: true
    },
    status: {
        type: String,
        enum: ['ongoing', 'completed'],
        default: 'ongoing'
    },
    currentQuestionIndex: {
        type: Number,
        default: 0
    },
    qaHistory: [{
        question: String,
        answer: String
    }],
    report: {
        score: Number,
        strengths: [String],
        weaknesses: [String],
        suggestions: [String]
    }
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);
