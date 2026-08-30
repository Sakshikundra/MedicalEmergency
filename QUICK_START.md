# CareChain Passport - Quick Start Guide

## 🚀 Quick Start (5 Minutes)

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Setup Environment Variables

**Backend** - Create `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/carechain-passport
JWT_SECRET=change-this-secret-key-in-production
ENCRYPTION_KEY=must-be-exactly-32-characters!!
GEMINI_API_KEY=your_gemini_key_here
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
FRONTEND_URL=http://localhost:3000
EMERGENCY_BASE_URL=http://localhost:3000/emergency
SMS_PROVIDER=mock
```

**Frontend** - Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 3. Start MongoDB
```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas cloud database
```

### 4. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend will run on `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend will run on `http://localhost:3000`

### 5. Test the Application

1. **Register**: Visit `http://localhost:3000` and create an account
2. **Upload**: Upload a medical document (PDF/image)
3. **AI Analysis**: Wait 1-2 minutes for AI to process
4. **View Results**: Check dashboard for AI-generated summaries
5. **QR Code**: Download your emergency QR code
6. **Emergency Test**: Visit `http://localhost:3000/emergency/YOUR-PULSE-ID`

---

## 🔑 Get API Keys

### Google Gemini (Required for AI)
1. Visit https://ai.google.dev/
2. Click "Get API Key"
3. Create new project or use existing
4. Copy API key to `.env` as `GEMINI_API_KEY`

### Cloudinary (Required for file storage)
1. Visit https://cloudinary.com/
2. Sign up for free account
3. Go to Dashboard
4. Copy:
   - Cloud Name → `CLOUDINARY_CLOUD_NAME`
   - API Key → `CLOUDINARY_API_KEY`
   - API Secret → `CLOUDINARY_API_SECRET`

---

## 📝 Sample Medical Documents

For testing, you can:
1. **Use Real Documents**: Lab reports, prescriptions, etc.
2. **Create Fake Documents**: Make a PDF with sample medical text:
   ```
   PRESCRIPTION
   
   Patient: John Doe
   Date: 2026-01-22
   
   Diagnoses: Hypertension, Type 2 Diabetes
   
   Medications:
   - Metformin 500mg twice daily
   - Lisinopril 10mg once daily
   
   Allergies: Penicillin
   
   Dr. Jane Smith, MD
   ```

---

## 🔍 Troubleshooting

### Backend won't start
- Check MongoDB is running: `mongod --version`
- Verify `.env` file exists in backend folder
- Check port 5000 is available

### Frontend build errors
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Check Node version >= 16

### AI not working
- Verify GEMINI_API_KEY is correct
- Check backend logs for error messages
- Test with smaller images first

### File upload fails
- Check Cloudinary credentials
- Verify file size < 10MB
- Ensure file is PDF, JPG, or PNG

---

## 📱 Demo Flow

1. **Patient registers** → Gets Pulse ID `PULSE-ABC123`
2. **Uploads lab report** → AI extracts diagnoses, medications
3. **Views dashboard** → See AI health summary with risk level
4. **Downloads QR code** → Print and keep in wallet
5. **Emergency scenario**: EMT scans QR → Instant access to critical info
6. **Hospital visit**: Doctor requests full access → OTP sent to patient → Patient approves → Doctor views all records

---

## 🎯 Key Features to Test

✅ Pulse ID auto-generation  
✅ QR code creation and download  
✅ OCR text extraction from documents  
✅ AI medical analysis with Gemini  
✅ Risk level assessment (RED/YELLOW/GREEN)  
✅ Emergency public page (no login)  
✅ Access audit logging  
✅ OTP consent system (mock SMS)  

---

**Need help? Check the main README.md for full documentation!**
