# MEDIX

A **production-ready, full-stack patient-owned digital medical records platform** with real AI-powered medical document understanding and QR-based emergency access.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)
![MongoDB](https://img.shields.io/badge/database-MongoDB-green.svg)

---

## 🎯 Core Features

### 👤 Patient Portal
- **Pulse ID**: Unique medical identifier auto-generated on registration
- **QR Code**: Downloadable QR code for emergency access
- **Medical Records Upload**: PDF, JPG, PNG supported (10MB max)
- **AI Document Analysis**: Real OCR + LLM medical information extraction
- **Health Summary Dashboard**: AI-generated summaries and timelines
- **Access Control**: OTP-based consent with full audit logs

### 🏥 Hospital/Doctor Access
- **QR Code Scanner**: Instant emergency profile access
- **OTP Consent System**: Request full access via SMS OTP
- **Record Upload**: Doctors can upload treatment records
- **Access Logging**: All access is logged and auditable

### 🤖 Real AI Integration
- **OCR**: Tesseract.js for text extraction from documents
- **LLM**: Google Gemini for medical analysis
- **Structured Extraction**: Diagnoses, medications, allergies, surgeries
- **Risk Assessment**: RED/YELLOW/GREEN risk indicators
- **Drug Interaction Detection**: Automated safety checks
- **Multiple Summaries**: Emergency, doctor, and patient-friendly versions

### 🆘 Emergency Features
- **Public Emergency Page**: QR-based access without login
- **Critical Info Display**: Blood group, allergies, medications, chronic conditions
- **SOS Button**: Shares medical data + location to emergency contact
- **Offline Card**: Downloadable PDF emergency card

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js + Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT + bcrypt
- **File Storage**: Cloudinary
- **OCR**: Tesseract.js
- **AI/LLM**: Google Gemini API
- **QR Generation**: qrcode package
- **Security**: Helmet, CORS, Rate Limiting, AES-256 Encryption

### Frontend
- **Framework**: Next.js 14 (React 18)
- **Styling**: Tailwind CSS
- **State Management**: React Query
- **QR Scanning**: html5-qrcode
- **Charts**: Chart.js + react-chartjs-2

---

## 📦 Installation

### Prerequisites
- Node.js >= 16.0.0
- MongoDB (local or Atlas)
- Google Gemini API Key ([Get one here](https://ai.google.dev/))
- Cloudinary Account ([Sign up here](https://cloudinary.com/))

### Backend Setup

```bash
cd backend
npm install
```

Create `.env` file (copy from `.env.example`):

```env
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/medix

# JWT Secret (change this!)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Encryption Key (32 characters for AES-256)
ENCRYPTION_KEY=your_32_character_encryption_key

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Emergency Page Base URL
EMERGENCY_BASE_URL=http://localhost:3000/emergency

# SMS (Optional - using mock by default)
SMS_PROVIDER=mock
```

Start backend:
```bash
npm run dev
```

Backend runs on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
```

Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Start frontend:
```bash
npm run dev
```

Frontend runs on `http://localhost:3000`

---

## 🚀 Usage

### 1. Patient Registration
- Visit `http://localhost:3000`
- Click **"Get Started Free"**
- Fill in personal information:
  - Name, DOB, Gender, Blood Group
  - Emergency Contact details
  - Email & Password
- Pulse ID auto-generated on registration
- QR code created automatically

### 2. Upload Medical Records
- Login to dashboard
- Click **"Upload Records"**
- Select PDF/JPG/PNG medical document
- Choose document type (lab report, prescription, etc.)
- AI processes automatically:
  - OCR extracts text
  - LLM analyzes medical content
  - Risk assessment performed
  - Summaries generated

### 3. Emergency Access (No Login Required)
- Scan patient QR code OR
- Visit `http://localhost:3000/emergency/[PULSE-ID]`
- View critical medical information instantly
- All access logged for patient review

### 4. Hospital Access with Consent
- Hospital staff scans QR code
- Views emergency info (no login)
- Requests full access
- OTP sent to patient emergency contact
- Patient approves with OTP
- Full records accessible for duration of consent

---

## 📚 API Endpoints

### Authentication
```
POST   /api/auth/register    - Register new user
POST   /api/auth/login       - Login user
GET    /api/auth/me          - Get current user
```

### Profile
```
GET    /api/profile                  - Get profile
PUT    /api/profile                  - Update profile
GET    /api/profile/access-logs      - View access logs
GET    /api/profile/health-summary   - AI health summary
```

### Medical Records
```
POST   /api/records/upload           - Upload document (triggers AI)
GET    /api/records                  - List all records
GET    /api/records/:id              - Get specific record
DELETE /api/records/:id              - Delete record
GET    /api/records/user/timeline    - Medical timeline
```

### Emergency (Public)
```
GET    /api/emergency/:pulseId       - Emergency profile
POST   /api/emergency/sos            - Trigger SOS alert
GET    /api/emergency/card/:pulseId  - Download PDF card
```

### Hospital Access
```
GET    /api/hospital/scan/:pulseId         - QR scan emergency view
POST   /api/hospital/request-access        - Request OTP
POST   /api/hospital/verify-otp            - Verify OTP
GET    /api/hospital/patient/:pulseId      - Full records (needs consent)
POST   /api/hospital/upload-record         - Upload treatment record
```

---

## 🧪 Testing AI Features

### Upload a Test Document

1. Create a fake prescription PDF or use a real one
2. Upload via the dashboard
3. AI will:
   - Extract text using OCR
   - Analyze with Gemini LLM
   - Return structured JSON:
     - Diagnoses
     - Medications (with dosages)
     - Allergies
     - Risk level (RED/YELLOW/GREEN)
     - Emergency summary
     - Patient-friendly explanation

### View AI Results
- Dashboard shows AI health summary
- Records page shows extracted information
- Emergency page displays critical data

---

## 🔐 Security Features

✅ **Encryption**: Medical files encrypted at rest (AES-256)  
✅ **Authentication**: JWT with 30-day expiry  
✅ **Password Hashing**: bcrypt with salt rounds  
✅ **Rate Limiting**: 100 requests per 15 minutes  
✅ **CORS**: Configured for frontend only  
✅ **Access Logs**: Full audit trail  
✅ **OTP Verification**: 3 attempts max, 5-minute expiry  
✅ **Emergency Bypass**: Public access logged and auditable  

---

## 🎨 UI Design Principles

- **Mobile-First**: Fully responsive design
- **Fast Emergency Access**: ≤3 clicks to critical info
- **Medical Theme**: Calming blues, clear typography
- **Risk Indicators**: Color-coded (RED/YELLOW/GREEN)
- **Accessibility**: High contrast, ARIA labels
- **Professional**: Clean, trust-building aesthetics

---

## 📊 Database Schema

### User
```javascript
{
  email, password (hashed),
  pulseId: "PULSE-XXXXXXXX" (auto-generated),
  name, dateOfBirth, gender, bloodGroup,
  emergencyContact: { name, relationship, phone },
  qrCodeUrl,
  role: 'patient' | 'doctor' | 'admin'
}
```

### MedicalRecord
```javascript
{
  userId, fileName, fileUrl, fileType,
  extractedText, // from OCR
  aiAnalysis: {
    diagnoses, medications, allergies, surgeries,
    emergencySummary, doctorSummary, patientExplanation,
    riskLevel: 'RED' | 'YELLOW' | 'GREEN',
    riskFactors, drugInteractions
  },
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed'
}
```

### AccessLog
```javascript
{
  userId, accessType, accessedBy,
  consentGiven, otpVerified,
  ipAddress, location, timestamp
}
```

### Consent
```javascript
{
  userId, requester,
  otp (hashed), otpExpiry,
  status: 'pending' | 'approved' | 'denied',
  accessExpiry
}
```

---

## 🚧 Future Enhancements

- [ ] Real SMS integration (Twilio)
- [ ] Blockchain for immutable audit logs
- [ ] Multi-language support
- [ ] Voice-based emergency alerts
- [ ] Integration with hospital EMR systems
- [ ] Wearable device integration
- [ ] Family account linking
- [ ] Insurance claim integration

---

## 📝 License

MIT License - See LICENSE file for details

---

## 🤝 Contributing

This is a demo/educational project. Feel free to fork and customize!

---

## 📧 Support

For issues or questions, create a GitHub issue or contact the maintainers.

---

## ⭐ Acknowledgments

- **Google Gemini** for AI capabilities
- **Tesseract.js** for OCR
- **Cloudinary** for secure file storage
- **MongoDB** for flexible data modeling
- **Next.js & Tailwind** for modern frontend

---

**Made with ❤️ for better healthcare access**
