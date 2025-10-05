# ProofVid iOS App

React Native app built with Expo for recording and authenticating videos.

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Update server URL**:
   - Open `App.js`
   - Find: `const API_URL = 'http://YOUR_SERVER_IP:5050';`
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

<p style="color:#d32f2f; margin-top: 8px;">
  <strong>Important:</strong> Please make sure to read the <a href="#disclaimer">Disclaimer</a> before using this app.
</p>

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

<a id="disclaimer"></a>
## ⚠️ Disclaimer

This is a proof-of-concept application. For production use, consider:
- Allowing the app to only create videos on non-rooted (secure) devices
- Using HTTPS for all communications
- Implementing user authentication
- Adding rate limiting to prevent abuse
- Using a production-grade database (PostgreSQL, MySQL)
- Implementing proper error handling and logging
- Adding backup and recovery mechanisms

### Security and Authenticity

- To strengthen trust, consider:
  - Hardware-backed attestation and signing (iOS App Attest/Secure Enclave; Android Play Integrity/Key attestation - for future development as Android is not supported yet).
  - Challenge–response with short-lived nonces signed by the device key alongside the video hash.
  - Blocking rooted/jailbroken/emulator devices; enable TLS pinning and anti-tamper checks.

