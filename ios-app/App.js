import React, {useState, useRef, useEffect} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {StatusBar} from 'expo-status-bar';
import {Camera} from 'expo-camera';
import {Audio} from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Crypto from 'expo-crypto';
import axios from 'axios';

// IMPORTANT: Replace with your server's IP address
const API_URL = 'http://YOUR_SERVER_IP:5000';

const App = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.back);
  const [certificate, setCertificate] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const cameraRef = useRef(null);
  const recordingInterval = useRef(null);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const {status: cameraStatus} = await Camera.requestCameraPermissionsAsync();
    const {status: audioStatus} = await Audio.requestPermissionsAsync();
    setHasPermission(cameraStatus === 'granted' && audioStatus === 'granted');
  };

  const toggleCamera = () => {
    setCameraType(
      cameraType === Camera.Constants.Type.back
        ? Camera.Constants.Type.front
        : Camera.Constants.Type.back,
    );
  };

  const startRecording = async () => {
    if (cameraRef.current) {
      try {
        setIsRecording(true);
        setRecordingTime(0);

        // Start timer
        recordingInterval.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);

        const video = await cameraRef.current.recordAsync({
          quality: Camera.Constants.VideoQuality['720p'],
          maxDuration: 300, // 5 minutes max
        });

        setIsRecording(false);
        if (recordingInterval.current) {
          clearInterval(recordingInterval.current);
        }

        await processVideo(video.uri);
      } catch (error) {
        console.error('Recording error:', error);
        setIsRecording(false);
        if (recordingInterval.current) {
          clearInterval(recordingInterval.current);
        }
        Alert.alert('Error', 'Failed to record video');
      }
    }
  };

  const stopRecording = async () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    }
  };

  const selectVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await processVideo(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error selecting video:', err);
      Alert.alert('Error', 'Failed to select video');
    }
  };

  const calculateSHA256 = async fileUri => {
    try {
      // Read file and calculate hash
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
        }),
        {encoding: Crypto.CryptoEncoding.HEX},
      );
      return hash;
    } catch (error) {
      console.error('Hash calculation error:', error);
      throw new Error('Failed to calculate hash');
    }
  };

  const processVideo = async videoPath => {
    setIsProcessing(true);
    setCertificate(null);

    try {
      // Calculate SHA-256 hash locally
      Alert.alert('Processing', 'Calculating video hash...');
      const videoHash = await calculateSHA256(videoPath);

      // Get device info
      const deviceInfo = `${Platform.OS} ${Platform.Version}`;

      // Register hash with server
      const response = await axios.post(`${API_URL}/api/register`, {
        hash: videoHash,
        device_info: deviceInfo,
        metadata: JSON.stringify({
          timestamp: new Date().toISOString(),
          platform: Platform.OS,
        }),
      });

      if (response.data.success) {
        setCertificate(response.data);
        Alert.alert(
          'Success! 🎉',
          `Video authenticated!\n\nCertificate ID: ${response.data.certificate_id}`,
        );
      }
    } catch (error) {
      console.error('Processing error:', error);
      
      if (error.response?.status === 409) {
        Alert.alert(
          'Already Registered',
          'This video has already been registered in the ProofVid system.',
        );
      } else {
        Alert.alert(
          'Error',
          error.response?.data?.error || 'Failed to register video hash',
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          Camera and microphone permissions are required
        </Text>
        <TouchableOpacity style={styles.button} onPress={checkPermissions}>
          <Text style={styles.buttonText}>Grant Permissions</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>🎥 ProofVid</Text>
        <Text style={styles.subtitle}>Record & Authenticate</Text>
      </View>

      <View style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          type={cameraType}
          ratio="16:9"
        />
        
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>REC {formatTime(recordingTime)}</Text>
          </View>
        )}

        <View style={styles.cameraControls}>
          <TouchableOpacity
            style={styles.smallButton}
            onPress={toggleCamera}
            disabled={isRecording}>
            <Text style={styles.smallButtonText}>🔄</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.recordButton,
              isRecording && styles.recordButtonActive,
            ]}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}>
            <View
              style={[
                styles.recordButtonInner,
                isRecording && styles.recordButtonInnerActive,
              ]}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.smallButton}
            onPress={selectVideo}
            disabled={isRecording || isProcessing}>
            <Text style={styles.smallButtonText}>📁</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.infoContainer}>
        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.processingText}>Processing video...</Text>
          </View>
        )}

        {certificate && (
          <View style={styles.certificateContainer}>
            <Text style={styles.certificateTitle}>✅ Certificate Issued</Text>
            <View style={styles.certificateDetails}>
              <Text style={styles.certificateLabel}>Certificate ID:</Text>
              <Text style={styles.certificateValue}>{certificate.certificate_id}</Text>
              
              <Text style={styles.certificateLabel}>Video Hash:</Text>
              <Text style={styles.certificateHash}>{certificate.hash}</Text>
              
              <Text style={styles.certificateLabel}>Timestamp:</Text>
              <Text style={styles.certificateValue}>
                {new Date(certificate.timestamp).toLocaleString()}
              </Text>
            </View>
            <Text style={styles.certificateNote}>
              Your video has been authenticated! Use the certificate ID or hash to verify it on the ProofVid website.
            </Text>
          </View>
        )}

        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>How it works:</Text>
          <Text style={styles.instructionsText}>
            1. Record a video or select from library{'\n'}
            2. SHA-256 hash is calculated locally{'\n'}
            3. Only the hash is sent to the server{'\n'}
            4. You receive a certificate of authenticity{'\n'}
            5. Anyone can verify your video on the website
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#667eea',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  cameraContainer: {
    height: 400,
    backgroundColor: 'black',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  recordingIndicator: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff3b30',
    marginRight: 8,
  },
  recordingText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  cameraControls: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  recordButtonActive: {
    borderColor: '#ff3b30',
  },
  recordButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ff3b30',
  },
  recordButtonInnerActive: {
    borderRadius: 8,
    width: 40,
    height: 40,
  },
  smallButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallButtonText: {
    fontSize: 24,
  },
  infoContainer: {
    flex: 1,
    padding: 20,
  },
  processingContainer: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'white',
    borderRadius: 15,
    marginBottom: 20,
  },
  processingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  certificateContainer: {
    backgroundColor: '#d4edda',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#28a745',
  },
  certificateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#155724',
    marginBottom: 15,
  },
  certificateDetails: {
    marginBottom: 15,
  },
  certificateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#155724',
    marginTop: 10,
  },
  certificateValue: {
    fontSize: 14,
    color: '#155724',
    marginTop: 2,
  },
  certificateHash: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#155724',
    marginTop: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: 8,
    borderRadius: 5,
  },
  certificateNote: {
    fontSize: 13,
    color: '#155724',
    fontStyle: 'italic',
    marginTop: 10,
  },
  instructions: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#667eea',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default App;
