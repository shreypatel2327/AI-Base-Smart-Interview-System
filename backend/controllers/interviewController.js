const Interview = require('../models/Interview');
const Resume = require('../models/Resume');
const { extractTextFromPDF } = require('../services/resumeParserService');
const { generateFirstQuestion, generateNextQuestion, generateFinalReport } = require('../services/geminiService');

const MAX_QUESTIONS = 5;

exports.uploadResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a PDF resume' });
        }

        const extractedText = await extractTextFromPDF(req.file.buffer);

        const resume = await Resume.create({
            userId: req.user._id,
            originalFileName: req.file.originalname,
            extractedText
        });

        res.status(201).json({
            success: true,
            data: { resumeId: resume._id }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error during resume upload', error: error.message });
    }
};

exports.startInterview = async (req, res) => {
    try {
        const { resumeId } = req.body;

        if (!resumeId) {
            return res.status(400).json({ success: false, message: 'Resume ID is required' });
        }

        const resume = await Resume.findOne({ _id: resumeId, userId: req.user._id });
        if (!resume) {
            return res.status(404).json({ success: false, message: 'Resume not found' });
        }

        // Generate the first question using AI
        const firstQuestion = await generateFirstQuestion(resume.extractedText);

        const interview = await Interview.create({
            userId: req.user._id,
            resumeId: resume._id,
            status: 'ongoing',
            currentQuestionIndex: 1, // we generated 1 question so far
            qaHistory: [
                { question: firstQuestion, answer: "" } // answer empty until candidate responds
            ]
        });

        res.status(201).json({
            success: true,
            data: {
                interviewId: interview._id,
                question: firstQuestion,
                questionIndex: 1,
                maxQuestions: MAX_QUESTIONS
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error starting interview', error: error.message });
    }
};

exports.answerQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const { answer } = req.body;

        if (!answer) {
            return res.status(400).json({ success: false, message: 'Answer text is required' });
        }

        const interview = await Interview.findOne({ _id: id, userId: req.user._id });
        if (!interview) {
            return res.status(404).json({ success: false, message: 'Interview not found' });
        }

        if (interview.status === 'completed') {
            return res.status(400).json({ success: false, message: 'Interview is already completed' });
        }

        // Update the last question with the given answer
        const lastIndex = interview.qaHistory.length - 1;
        interview.qaHistory[lastIndex].answer = answer;

        const resume = await Resume.findById(interview.resumeId);

        // Check if limit reached
        if (interview.currentQuestionIndex >= MAX_QUESTIONS) {
            interview.status = 'completed';
            await interview.save();

            // End of interview, we could choose to return "completed" message here
            // Frontend will then call /report
            return res.status(200).json({
                success: true,
                message: 'Interview completed. Please fetch the report.',
                data: {
                    completed: true
                }
            });
        }

        // Generate next question
        // Context optimization: Get only last 2 Q&As
        const recentQAKeys = interview.qaHistory.slice(-2);
        const nextQuestion = await generateNextQuestion(resume.extractedText, recentQAKeys);

        // Add new question to history
        interview.qaHistory.push({ question: nextQuestion, answer: "" });
        interview.currentQuestionIndex += 1;

        await interview.save();

        res.status(200).json({
            success: true,
            data: {
                question: nextQuestion,
                questionIndex: interview.currentQuestionIndex,
                maxQuestions: MAX_QUESTIONS,
                completed: false
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error processing answer', error: error.message });
    }
};

exports.getReport = async (req, res) => {
    try {
        const { id } = req.params;

        const interview = await Interview.findOne({ _id: id, userId: req.user._id });
        if (!interview) {
            return res.status(404).json({ success: false, message: 'Interview not found' });
        }

        if (interview.status !== 'completed') {
            return res.status(400).json({ success: false, message: 'Interview is not completed yet' });
        }

        // Check if report already exists
        if (interview.report && interview.report.score !== undefined) {
            return res.status(200).json({
                success: true,
                data: interview.report
            });
        }

        // Generate final report using full QA history
        const evaluation = await generateFinalReport(interview.qaHistory);

        // Save report to DB
        interview.report = evaluation;
        await interview.save();

        res.status(200).json({
            success: true,
            data: evaluation
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error getting report', error: error.message });
    }
};

exports.getInterviews = async (req, res) => {
    try {
        const interviews = await Interview.find({ userId: req.user._id }).sort('-createdAt');
        res.status(200).json({ success: true, data: interviews });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
}
