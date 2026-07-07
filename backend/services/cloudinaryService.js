const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadPDF = (buffer) => {
    return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream(
            {
                folder: "smart-interview",
                resource_type: "image", // Treating as image lets Cloudinary preview it perfectly in their Media Library platform
                format: "pdf"
            },
            (error, result) => {
                if (result) {
                    resolve({
                        secure_url: result.secure_url,
                        public_id: result.public_id
                    });
                } else {
                    reject(error);
                }
            }
        );

        streamifier.createReadStream(buffer).pipe(stream);
    });
};

const deletePDF = async (publicId) => {
    try {
        // Since we changed from raw to image for PDFs, we should attempt to delete both 
        // to handle legacy uploads cleanly without leaving orphan files
        let result = await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
        if (result.result !== 'ok') {
            result = await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
        }
        return result;
    } catch (error) {
        throw error;
    }
};

module.exports = {
    uploadPDF,
    deletePDF
};
