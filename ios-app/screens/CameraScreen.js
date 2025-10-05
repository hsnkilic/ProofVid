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
import {CameraView, useCameraPermissions, useMicrophonePermissions} from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5050';

const CameraScreen = ({navigation}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [audioPermission, requestAudioPermission] = useMicrophonePermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('back');
  const [certificate, setCertificate] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [toastMessage, setToastMessage] = useState('');

  const cameraRef = useRef(null);
  const recordingInterval = useRef(null);
  const toastTimeout = useRef(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
    if (!audioPermission?.granted) {
      requestAudioPermission();
    }
    if (!mediaPermission?.granted) {
      requestMediaPermission();
    }
  }, []);

  const showToast = (message) => {
    setToastMessage(message);
    if (toastTimeout.current) {
      clearTimeout(toastTimeout.current);
    }
    toastTimeout.current = setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  const toggleCamera = () => {
    setCameraFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const saveVideoToLibrary = async (videoUri) => {
    try {
      const asset = await MediaLibrary.createAssetAsync(videoUri);
      return asset.uri;
    } catch (error) {
      console.error('Error saving to library:', error);
      return videoUri;
    }
  };

  const saveRecordingMetadata = async (videoData) => {
    try {
      const existingRecordings = await AsyncStorage.getItem('recordings');
      const recordings = existingRecordings ? JSON.parse(existingRecordings) : [];
      recordings.unshift(videoData);
      await AsyncStorage.setItem('recordings', JSON.stringify(recordings));
    } catch (error) {
      console.error('Error saving metadata:', error);
    }
  };

  const calculateSHA256 = async fileUri => {
    try {
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        await FileSystem.readAsStringAsync(fileUri, {
          encoding: 'base64',
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
      showToast('Calculating video hash...');
      const videoHash = await calculateSHA256(videoPath);

      const platformName = Platform.OS === 'ios' ? 'iOS' : (Platform.OS === 'android' ? 'Android' : Platform.OS);
      const deviceInfo = `${platformName} ${Platform.Version}`;

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
        
        // Save video to library (returns Photos/asset URI on iOS)
        const savedUri = await saveVideoToLibrary(videoPath);
        
        // Save metadata; persist both file and library URIs
        await saveRecordingMetadata({
          uri: videoPath, // prefer file:// for thumbnails
          fileUri: videoPath,
          libraryUri: savedUri,
          hash: videoHash,
          certificateId: response.data.certificate_id,
          timestamp: response.data.timestamp,
          deviceInfo: deviceInfo,
        });

        Alert.alert(
          'Success! 🎉',
          `Video authenticated and saved!\n\nCertificate ID: ${response.data.certificate_id}`,
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

  const startRecording = async () => {
    if (cameraRef.current) {
      try {
        setIsRecording(true);
        setRecordingTime(0);

        recordingInterval.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);

        const video = await cameraRef.current.recordAsync({
          maxDuration: 300,
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

  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!permission || !audioPermission || !mediaPermission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  if (!permission.granted || !audioPermission.granted || !mediaPermission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          Camera, microphone, and media library permissions are required
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => {
          requestPermission();
          requestAudioPermission();
          requestMediaPermission();
        }}>
          <Text style={styles.buttonText}>Grant Permissions</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={cameraFacing}
          mode="video"
        />
        
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>REC {formatTime(recordingTime)}</Text>
          </View>
        )}

        <View style={styles.cameraControls}>
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
            style={[styles.smallButton, styles.switchButton]}
            onPress={toggleCamera}
            disabled={isRecording}>
            <Text style={styles.smallButtonText}>🔄</Text>
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
              Video saved to your library! Check the Recordings tab to view all your authenticated videos.
            </Text>
          </View>
        )}

        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>How it works:</Text>
          <Text style={styles.instructionsText}>
            1. Record a video using the in-app camera{'\n'}
            2. A SHA-256 hash is calculated locally on your device{'\n'}
            3. Only the hash (and minimal device metadata) is sent to the server{'\n'}
            4. You receive a certificate of authenticity for the recording{'\n'}
            5. The video is saved to your device library{'\n'}
            6. View all authenticated recordings in the Recordings tab
          </Text>
        </View>
      </ScrollView>

      {toastMessage !== '' && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    justifyContent: 'center',
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
  switchButton: {
    position: 'absolute',
    right: 40,
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
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#667eea',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    marginHorizontal: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  toastContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toastText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default CameraScreen;
