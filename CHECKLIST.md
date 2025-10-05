# 📋 ProofVid Setup Checklist

Follow these steps in order to get ProofVid running:

## Backend Setup

- [ ] Navigate to `backend/` directory
- [ ] Create virtual environment: `python3 -m venv venv`
- [ ] Activate virtual environment: `source venv/bin/activate`
- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Start server: `python app.py`
- [ ] Verify server is running at `http://localhost:5050`

## Network Configuration

- [ ] Find your computer's IP address:
  - Mac: `ifconfig | grep "inet " | grep -v 127.0.0.1`
  - Windows: `ipconfig`
- [ ] Note down your IP (e.g., `192.168.1.100`)

## iOS App Configuration

- [ ] Open `ios-app/App.js` in editor
- [ ] Find line 21: `const API_URL = 'http://YOUR_SERVER_IP:5050';`
- [ ] Replace `YOUR_SERVER_IP` with your actual IP
- [ ] Save the file

## iPhone Setup

- [ ] Open App Store on iPhone
- [ ] Search for "Expo Go"
- [ ] Install Expo Go app
- [ ] Make sure iPhone is on same WiFi as computer

## Run the App

- [ ] Navigate to `ios-app/` directory
- [ ] Dependencies already installed (npm install was run)
- [ ] Start Expo: `npm start`
- [ ] Wait for QR code to appear
- [ ] Open Camera app on iPhone
- [ ] Point camera at QR code
- [ ] Tap notification to open in Expo Go

## Test the App

- [ ] Grant camera permission when prompted
- [ ] Grant microphone permission when prompted
- [ ] Tap red button to start recording
- [ ] Record a short test video
- [ ] Tap button again to stop
- [ ] Wait for hash calculation
- [ ] Receive certificate with ID
- [ ] Note the certificate ID

## Verify on Web

- [ ] Open browser on computer
- [ ] Go to `http://localhost:5050`
- [ ] Try "Verify by Certificate ID"
- [ ] Enter the certificate ID from app
- [ ] See verification success! ✅

## Troubleshooting

If something doesn't work:

- [ ] Backend server is running?
- [ ] iPhone and computer on same WiFi?
- [ ] Correct IP address in App.js?
- [ ] Expo Go installed on iPhone?
- [ ] Permissions granted in app?

## Success! 🎉

If all steps are checked, you have:
- ✅ Working backend server
- ✅ iOS app running on your iPhone
- ✅ Video recording and authentication
- ✅ Web verification interface

---

**Next Steps:**
- Record more videos and test
- Try verifying by uploading video file
- Try verifying by hash
- Explore the code and customize!
