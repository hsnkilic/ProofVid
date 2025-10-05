# ProofVid iOS App

React Native app built with Expo for recording and authenticating videos.

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Update server URL**:
   - Open `App.js`
   - Find: `const API_URL = 'http://YOUR_SERVER_IP:5000';`
   - Replace `YOUR_SERVER_IP` with your computer's local IP address

3. **Install Expo Go on your iPhone**:
   - Download "Expo Go" from the App Store

4. **Start the development server**:
   ```bash
   npm start
   ```

5. **Run on your iPhone**:
   - Scan the QR code with your iPhone camera
   - The app will open in Expo Go

## Features

- 📹 Record videos with front/back camera
- 📁 Select videos from library
- 🔐 Calculate SHA-256 hash locally on device
- 📜 Receive certificate of authenticity
- ⏱️ Recording timer
- 🎨 Beautiful UI

## How to Find Your Server IP

**On Mac**:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Or: System Preferences → Network → Your connection → IP Address

**On Windows**:
```bash
ipconfig
```

Look for "IPv4 Address"

## Troubleshooting

**Camera not working?**
- Make sure you granted camera and microphone permissions
- Try restarting the Expo Go app

**Can't connect to server?**
- Ensure your iPhone and computer are on the same WiFi network
- Check that the backend server is running
- Verify the IP address in `App.js` is correct

**Hash calculation failing?**
- Large videos may take time to process
- Check console logs for errors
