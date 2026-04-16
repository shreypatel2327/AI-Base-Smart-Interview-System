const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    originalFileName: {
        type: String,
        required: true
    },
    extractedText: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Resume', resumeSchema);
