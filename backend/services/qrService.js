const QRCode = require('qrcode');

/**
 * Generate QR code for Pulse ID
 * @param {String} pulseId - User's Pulse ID
 * @returns {String} QR code data URL (base64 image)
 */
const generateQRCode = async (pulseId) => {
    try {
        const baseUrl = process.env.EMERGENCY_BASE_URL ||
            (process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/emergency` : 'http://localhost:3000/emergency');
        const emergencyUrl = `${baseUrl}/${pulseId}`;

        const qrCodeDataUrl = await QRCode.toDataURL(emergencyUrl, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF',
            },
        });

        return qrCodeDataUrl;
    } catch (error) {
        throw new Error(`QR Code generation failed: ${error.message}`);
    }
};

/**
 * Generate QR code as buffer (for file storage)
 * @param {String} pulseId - User's Pulse ID
 * @returns {Buffer} QR code image buffer
 */
const generateQRCodeBuffer = async (pulseId) => {
    try {
        const baseUrl = process.env.EMERGENCY_BASE_URL ||
            (process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/emergency` : 'http://localhost:3000/emergency');
        const emergencyUrl = `${baseUrl}/${pulseId}`;

        const buffer = await QRCode.toBuffer(emergencyUrl, {
            errorCorrectionLevel: 'H',
            type: 'png',
            width: 300,
            margin: 2,
        });

        return buffer;
    } catch (error) {
        throw new Error(`QR Code buffer generation failed: ${error.message}`);
    }
};

module.exports = {
    generateQRCode,
    generateQRCodeBuffer,
};
