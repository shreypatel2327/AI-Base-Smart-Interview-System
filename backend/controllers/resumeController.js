const Resume = require('../models/Resume');
const { extractTextFromPDF } = require('../services/resumeParserService');
const { uploadPDF, deletePDF } = require('../services/cloudinaryService');

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

exports.uploadResume = async (req, res) => {
    let uploadedCloudinaryAsset = null;

    try {
        console.log(`[Upload Phase] Initiating resume upload for User: ${req.user._id}`);
        
        // 1. Validate File
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a PDF resume' });
        }
        if (req.file.mimetype !== 'application/pdf') {
            return res.status(400).json({ success: false, message: 'Only PDF files are allowed' });
        }
        if (req.file.size > MAX_FILE_SIZE) {
            return res.status(400).json({ success: false, message: 'File size must be strictly under 5MB' });
        }

        // 2. Clear old resume if existing
        const existingResume = await Resume.findOne({ userId: req.user._id });
        if (existingResume) {
            console.log(`[Upload Phase] Found legacy Resume. Deleting publicId: ${existingResume.publicId}`);
            try {
                await deletePDF(existingResume.publicId);
                await existingResume.deleteOne();
                console.log(`[Upload Phase] Successfully wiped old legacy resume from Cloudinary and DB.`);
            } catch (err) {
                console.error(`[Upload Phase Error] Failed to delete legacy resume:`, err);
                return res.status(500).json({ success: false, message: 'Error clearing previous resume.' });
            }
        }

        // 3. Upload new to Cloudinary
        console.log(`[Upload Phase] Streaming new PDF buffer to Cloudinary...`);
        try {
            uploadedCloudinaryAsset = await uploadPDF(req.file.buffer);
            console.log(`[Upload Phase] Successfully mapped new upload. PublicId: ${uploadedCloudinaryAsset.public_id}`);
        } catch (uploadError) {
            console.error(`[Upload Phase Error] Cloudinary stream failure:`, uploadError);
            return res.status(500).json({ success: false, message: 'Failed to upload file to Cloudinary' });
        }
        
        // 4. Extract Text
        let extractedText;
        try {
            console.log(`[Upload Phase] Extracting text buffer...`);
            extractedText = await extractTextFromPDF(req.file.buffer);
        } catch (extractError) {
            console.error(`[Upload Phase Error] PDF Parsing failed. Triggering rollback.`, extractError);
            await deletePDF(uploadedCloudinaryAsset.public_id);
            return res.status(500).json({ success: false, message: 'Failed to parse text from the PDF. Upload aborted.' });
        }

        // 5. Save to Database
        try {
            const resume = await Resume.create({
                userId: req.user._id,
                originalFileName: req.file.originalname,
                fileUrl: uploadedCloudinaryAsset.secure_url,
                publicId: uploadedCloudinaryAsset.public_id,
                extractedText,
                fileData: req.file.buffer
            });

            console.log(`[Upload Phase] Database save successful. UID: ${resume._id}`);
            res.status(201).json({
                success: true,
                data: resume
            });
        } catch (dbError) {
            console.error(`[Upload Phase Error] Database mapping failed. Triggering Cloudinary rollback...`, dbError);
            await deletePDF(uploadedCloudinaryAsset.public_id);
            console.log(`[Upload Phase Error] Rollback complete. Old orphan prevented.`);
            res.status(500).json({ success: false, message: 'Database failure during save.' });
        }

    } catch (error) {
        console.error(`[Upload Phase System Error] Completely unhandled exception:`, error);
        res.status(500).json({ success: false, message: 'Server Error during resume upload', error: error.message });
    }
};

exports.getResume = async (req, res) => {
    try {
        const resume = await Resume.findOne({ userId: req.user._id }).select('-extractedText');
        if (!resume) {
            return res.status(404).json({ success: false, message: 'No active resume found' });
        }
        
        res.status(200).json({
            success: true,
            data: resume
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error retrieving resume.' });
    }
};

exports.downloadResumePdf = async (req, res) => {
    try {
        const resume = await Resume.findOne({ userId: req.user._id });
        if (!resume) {
            return res.status(404).json({ success: false, message: 'No active resume found' });
        }

        // 1. Primary delivery method: Bypass Cloudinary entirely by serving DB buffer
        if (resume.fileData && resume.fileData.length > 0) {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="${resume.originalFileName}"`);
            return res.send(resume.fileData);
        }

        // 2. Fallback legacy method (will hit Cloudinary CDN blocks for image/pdf, but works for old raw uploads)
        const https = require('https');
        https.get(resume.fileUrl, (proxyRes) => {
            if (proxyRes.statusCode !== 200) {
                return res.status(500).json({ success: false, message: 'Failed to fetch resume from storage.' });
            }
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="${resume.originalFileName}"`);
            proxyRes.pipe(res);
        }).on('error', (err) => {
            console.error('Proxy Error:', err);
            res.status(500).json({ success: false, message: 'Error streaming resume.' });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error downloading resume.' });
    }
};
