const Tesseract = require('tesseract.js');

/**
 * Extract text from image using OCR
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {String} Extracted text
 */
const extractTextFromImage = async (imageBuffer) => {
    try {
        console.log('🔍 Starting OCR text extraction...');

        const { data: { text } } = await Tesseract.recognize(
            imageBuffer,
            'eng',
            {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
                    }
                },
            }
        );

        console.log('✅ OCR extraction completed');
        return text.trim();
    } catch (error) {
        console.error('❌ OCR extraction failed:', error.message);
        throw new Error(`OCR failed: ${error.message}`);
    }
};

/**
 * Extract text from PDF 
 * NOTE: Tesseract.js does not support PDF buffers directly.
 * Gemini Multimodal (Direct File) is the primary engine for PDFs.
 * This is a fallback that returns a notice for now.
 * @param {Buffer} pdfBuffer - PDF buffer
 * @returns {String} Extracted text notice
 */
const extractTextFromPDF = async (pdfBuffer) => {
    try {
        console.log('📄 PDF OCR Request: Tesseract does not support direct PDF buffers.');
        return '[PDF Document Content - Please use Gemini Multimodal for extraction]';
    } catch (error) {
        console.error('❌ PDF text extraction failed:', error.message);
        throw new Error(`PDF extraction failed: ${error.message}`);
    }
};


/**
 * Main OCR function that handles both images and PDFs
 * @param {Buffer} fileBuffer - File buffer
 * @param {String} fileType - 'image' or 'pdf'
 * @returns {String} Extracted text
 */
const performOCR = async (fileBuffer, fileType) => {
    try {
        if (fileType === 'pdf') {
            return await extractTextFromPDF(fileBuffer);
        } else {
            return await extractTextFromImage(fileBuffer);
        }
    } catch (error) {
        throw new Error(`OCR processing failed: ${error.message}`);
    }
};

module.exports = {
    performOCR,
    extractTextFromImage,
    extractTextFromPDF,
};
