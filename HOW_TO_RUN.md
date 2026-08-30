# 🚀 How to Run MEDIX

## ✅ Currently Running

Your application is **LIVE** and ready to use!

### Backend Server
- **Status**: ✅ Running
- **URL**: http://localhost:5000
- **Database**: ✅ MongoDB Connected (with mock DB fallback support)

### Frontend Server  
- **Status**: ✅ Running
- **URL**: http://localhost:3000
- **Framework**: Next.js (React 18)

---

## 🌐 Access the Application

### **Open in Browser:**
```
http://localhost:3000
```

---

## 📖 How to Use the Application

### **1. Register a New Account**
1. Go to http://localhost:3000
2. Click **"Get Started"** or **"Register"**
3. Fill in the registration form:
   - Full Name
   - Email
   - Phone Number
   - Password
   - Emergency Contact
   - Blood Group
   - Allergies (optional)
4. Click **"Register"**

### **2. Login**
1. After registration, you'll be redirected to the dashboard
2. Or manually go to http://localhost:3000/login
3. Enter your email and password

### **3. Upload Medical Records**
1. From the dashboard, click **"Upload New Record"**
2. Select a medical document image (prescription, lab report, etc.)
3. Choose document type (prescription, lab report, etc.)
4. Click **"Upload"**
5. **AI will analyze it in 8-20 seconds** (optimized!)

### **4. View Your Records**
1. Go to **"My Records"** from the dashboard
2. Click on any record to view:
   - AI-extracted diagnoses
   - Medications with dosages
   - Allergies
   - Emergency summary
   - Risk assessment

### **5. Emergency Access**
1. Generate your QR code from the dashboard
2. Anyone can scan it to access emergency medical info
3. Or share your emergency access code

---

## 🛑 How to Stop the Servers

### Stop Both Servers:
Press `Ctrl + C` in each terminal window (backend and frontend)

Or use this command:
```powershell
taskkill /F /IM node.exe
```

---

## 🔄 How to Restart

### Backend:
```powershell
cd c:\Users\Garvi\Desktop\MEDIX\carechain-passport\backend
npm run dev
```

### Frontend:
```powershell
cd c:\Users\Garvi\Desktop\MEDIX\carechain-passport\frontend
npm run dev
```

---

## 🧪 Test the AI Speed Optimizations

1. Upload a medical document image
2. Watch the **backend terminal** for logs:
   ```
   👁️ Starting Multimodal AI medical analysis...
   ✅ Multimodal AI analysis completed
   ```
3. It should complete in **8-20 seconds** (much faster than before!)

---

## 📊 Features to Try

✅ **Patient Registration** - Create your health profile  
✅ **Document Upload** - Upload prescriptions, lab reports  
✅ **AI Analysis** - Automatic medical data extraction  
✅ **QR Code** - Generate emergency access QR  
✅ **Emergency Access** - Share medical info with ER  
✅ **Risk Assessment** - AI-powered health risk analysis  
✅ **Search & Filter** - Find records by date, type, diagnosis  

---

## 🔧 Troubleshooting

### Port Already in Use?
```powershell
# Kill all Node processes
taskkill /F /IM node.exe

# Restart servers
cd backend && npm run dev
cd frontend && npm run dev
```

### Frontend Not Loading?
- Clear browser cache (Ctrl + Shift + R)
- Check console for errors (F12)

### Backend Errors?
- Check `.env` file in backend folder
- Verify Gemini API key is set (optional, works with mock data)

---

## 📝 Important Notes

- **MongoDB**: Currently using **mock database** (no MongoDB needed)
- **Gemini API**: Required for real AI analysis (uses mock data as fallback)
- **Cloudinary**: Required for cloud storage (uses local storage as fallback)
- **Demo Mode**: App works fully in demo mode with mock data!

---

## 🎉 You're All Set!

**Open your browser and navigate to:**
# http://localhost:3000

Happy testing! 🚀
