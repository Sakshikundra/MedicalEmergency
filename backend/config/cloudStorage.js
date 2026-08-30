const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: (process.env.CLOUDINARY_CLOUD_NAME || '').trim(),
    api_key: (process.env.CLOUDINARY_API_KEY || '').trim(),
    api_secret: (process.env.CLOUDINARY_API_SECRET || '').trim(),
    secure: true
});

/**
 * Upload file to Cloudinary
 * @param {Buffer} fileBuffer - File buffer
 * @param {String} folder - Cloudinary folder name
 * @param {String} resourceType - 'image', 'raw', or 'auto'
 * @returns {Object} Upload result with secure_url
 */
const uploadToCloud = async (fileBuffer, folder = 'medical-records', resourceType = 'auto') => {
    // Check if running with default/missing credentials
    const apiKey = process.env.CLOUDINARY_API_KEY ? process.env.CLOUDINARY_API_KEY.trim() : '';
    const isPlaceholder = !apiKey ||
        apiKey.toLowerCase().includes('your_api_key') ||
        apiKey.toLowerCase().includes('your_cloudinary_key');

    if (isPlaceholder) {
        console.log('⚠️ Using inline fallback for storage (Cloudinary Key not configured)');
        const base64Data = fileBuffer ? `data:image/png;base64,${fileBuffer.toString('base64')}` : 'https://via.placeholder.com/500x600.png?text=Medical+Record';
        return {
            secure_url: base64Data,
            public_id: `mock_${Date.now()}`,
            format: 'png',
        };
    }

    try {
        return await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: folder,
                    resource_type: resourceType,
                },
                (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            );

            uploadStream.end(fileBuffer);
        });
    } catch (err) {
        console.warn('⚠️ Cloudinary upload failed, using inline fallback:', err.message);
        const base64Data = fileBuffer ? `data:image/png;base64,${fileBuffer.toString('base64')}` : 'https://via.placeholder.com/500x600.png?text=Medical+Record';
        return {
            secure_url: base64Data,
            public_id: `fallback_${Date.now()}`,
            format: 'png',
        };
    }
};

/**
 * Delete file from Cloudinary
 * @param {String} publicId - Cloudinary public ID
 * @returns {Object} Deletion result
 */
const deleteFromCloud = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        throw new Error(`Cloudinary deletion failed: ${error.message}`);
    }
};

module.exports = {
    cloudinary,
    uploadToCloud,
    deleteFromCloud,
};
