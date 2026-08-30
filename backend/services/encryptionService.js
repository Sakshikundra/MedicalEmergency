const CryptoJS = require('crypto-js');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-32-char-key-change-this';

/**
 * Encrypt text using AES-256
 * @param {String} text - Plain text to encrypt
 * @returns {String} Encrypted text
 */
const encrypt = (text) => {
    try {
        const encrypted = CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
        return encrypted;
    } catch (error) {
        throw new Error(`Encryption failed: ${error.message}`);
    }
};

/**
 * Decrypt encrypted text
 * @param {String} encryptedText - Encrypted text
 * @returns {String} Decrypted plain text
 */
const decrypt = (encryptedText) => {
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        return decrypted;
    } catch (error) {
        throw new Error(`Decryption failed: ${error.message}`);
    }
};

/**
 * Encrypt file buffer (for medical records)
 * @param {Buffer} buffer - File buffer
 * @returns {String} Encrypted data
 */
const encryptFile = (buffer) => {
    const base64 = buffer.toString('base64');
    return encrypt(base64);
};

/**
 * Decrypt file data back to buffer
 * @param {String} encryptedData - Encrypted file data
 * @returns {Buffer} Decrypted file buffer
 */
const decryptFile = (encryptedData) => {
    const base64 = decrypt(encryptedData);
    return Buffer.from(base64, 'base64');
};

module.exports = {
    encrypt,
    decrypt,
    encryptFile,
    decryptFile,
};
