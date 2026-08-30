/**
 * Mock SMS service for demo purposes
 * Replace with real Twilio implementation for production
 */

/**
 * Send OTP via SMS
 * @param {String} phoneNumber - Recipient phone number
 * @param {String} otp - OTP code
 * @returns {Object} Result
 */
const sendOTP = async (phoneNumber, otp) => {
    // Mock implementation
    console.log(`📱 [MOCK SMS] Sending OTP to ${phoneNumber}: ${otp}`);

    // In production, use Twilio:
    // const client = require('twilio')(accountSid, authToken);
    // await client.messages.create({
    //   body: `Your CareChain Passport OTP is: ${otp}. Valid for 5 minutes.`,
    //   from: twilioNumber,
    //   to: phoneNumber
    // });

    return {
        success: true,
        message: `OTP sent to ${phoneNumber}`,
        mockOtp: otp, // Only for demo - remove in production
    };
};

/**
 * Send emergency SOS alert
 * @param {String} phoneNumber - Emergency contact phone
 * @param {Object} data - Emergency data {patientName, location, summary}
 * @returns {Object} Result
 */
const sendEmergencyAlert = async (phoneNumber, data) => {
    const { patientName, location, summary } = data;

    // location may arrive as a { lat, lng } object, a plain string, or be absent
    let locationText = 'Unknown';
    if (location && typeof location === 'object' && (location.lat || location.latitude)) {
        const lat = location.lat ?? location.latitude;
        const lng = location.lng ?? location.longitude;
        locationText = `https://maps.google.com/?q=${lat},${lng}`;
    } else if (typeof location === 'string' && location.trim()) {
        locationText = location;
    }

    console.log(`🚨 [MOCK SMS] Sending emergency alert to ${phoneNumber}`);
    console.log(`Patient: ${patientName}`);
    console.log(`Location: ${locationText}`);
    console.log(`Summary: ${summary}`);

    // In production, use Twilio for SMS
    const message = `🚨 EMERGENCY ALERT 🚨
${patientName} has triggered an SOS.
Location: ${locationText}
Medical Summary: ${summary}

This is an automated alert from CareChain Passport.`;

    return {
        success: true,
        message: 'Emergency alert sent',
        mockMessage: message,
    };
};

/**
 * Generate random 6-digit OTP
 * @returns {String} OTP code
 */
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = {
    sendOTP,
    sendEmergencyAlert,
    generateOTP,
};
