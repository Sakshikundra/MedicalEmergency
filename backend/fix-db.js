const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

const DB_FILE = path.join(__dirname, 'utils', 'mock_db.json');
const EMERGENCY_BASE_URL = 'http://localhost:3000/emergency';

async function fixRecords() {
    try {
        if (!fs.existsSync(DB_FILE)) {
            console.log('DB file not found:', DB_FILE);
            return;
        }

        const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        let changed = false;

        for (const user of data.users) {
            if (!user.pulseId) {
                user.pulseId = `PULSE-${uuidv4().split('-')[0].toUpperCase()}`;
                console.log(`✅ Added Pulse ID to ${user.email}: ${user.pulseId}`);
                changed = true;
            }

            if (!user.qrCodeUrl) {
                const emergencyUrl = `${EMERGENCY_BASE_URL}/${user.pulseId}`;
                user.qrCodeUrl = await QRCode.toDataURL(emergencyUrl);
                console.log(`✅ Generated QR Code for ${user.email}`);
                changed = true;
            }
        }

        if (changed) {
            fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
            console.log('🏁 Mock DB fixed and saved!');
        } else {
            console.log('✨ All users already have Pulse IDs and QR Codes!');
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

fixRecords();
