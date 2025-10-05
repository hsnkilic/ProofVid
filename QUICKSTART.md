# 🚀 ProofVid Quick Start Guide

Get ProofVid running in 5 minutes!

## Step 1: Start the Backend Server

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

The server will start at `http://localhost:5050`

## Step 2: Find Your Computer's IP Address

**On Mac**:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

You'll see something like: `inet 192.168.1.100`

**On Windows**:
```bash
ipconfig
```

Look for "IPv4 Address" (e.g., `192.168.1.100`)

## Step 3: Configure the iOS App

1. Navigate to the `ios-app` directory
2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and update the API URL:
   ```
   EXPO_PUBLIC_API_URL=http://192.168.1.100:5050
   ```
   Replace `192.168.1.100` with your IP from Step 2

## Step 4: Install Expo Go on iPhone

1. Open App Store on your iPhone
2. Search for "Expo Go"
3. Install the app

## Step 5: Start the iOS App

```bash
cd ios-app
npm start
```

A QR code will appear in the terminal.

## Step 6: Run on iPhone

1. Open the Camera app on your iPhone
2. Point it at the QR code in the terminal
3. Tap the notification that appears
4. The app will open in Expo Go!

## Step 7: Test the App

1. **Grant permissions** when prompted
2. **Record a video** by tapping the red button
3. **Wait for processing** - the hash is calculated locally
4. **Receive your certificate** with a unique ID!

## Step 8: Verify on the Website

1. Open `http://localhost:5050` in your browser
2. Upload the same video or enter the hash/certificate ID
3. See the verification result!

---

## Troubleshooting

### "Cannot connect to server"
- Make sure backend is running (`python app.py`)
- Verify iPhone and computer are on same WiFi
- Check IP address in `.env` file is correct
- Make sure the port matches (5050 by default)

### "Camera not working"
- Grant camera/microphone permissions
- Restart Expo Go app

### "Hash calculation failed"
- Large videos take longer to process
- Check console for errors

---

## What's Next?

- Deploy the backend to a cloud server
- Build a standalone iOS app
- Add more features (GPS, metadata, etc.)

Enjoy using ProofVid! 🎥✨
