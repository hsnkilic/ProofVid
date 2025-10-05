import React, {useState, useEffect, useCallback} from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as VideoThumbnails from 'expo-video-thumbnails';
import {useFocusEffect} from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';

const RecordingsScreen = () => {
  const [recordings, setRecordings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [thumbnails, setThumbnails] = useState({});

  const loadRecordings = async () => {
    try {
      const data = await AsyncStorage.getItem('recordings');
      if (data) {
        const parsedRecordings = JSON.parse(data);
        setRecordings(parsedRecordings);
        
        // Generate thumbnails for videos that don't have them
        for (const recording of parsedRecordings) {
          if (!thumbnails[recording.uri]) {
            await generateThumbnail(recording);
          }
        }
      }
    } catch (error) {
      console.error('Error loading recordings:', error);
    }
  };

  const generateThumbnail = async (recording) => {
    try {
      // Prefer original file path for thumbnail generation
      const sourceUri = recording.fileUri || recording.uri;
      if (!sourceUri || !sourceUri.startsWith('file://')) {
        // Unsupported URL for thumbnail generation (e.g., ph:// or asset-library://)
        return;
      }
      const {uri} = await VideoThumbnails.getThumbnailAsync(sourceUri, {
        time: 1000,
      });
      // Store thumbnail against display key (recording.uri) to avoid refactor in render
      setThumbnails(prev => ({...prev, [recording.uri]: uri}));
    } catch (error) {
      console.error('Error generating thumbnail:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRecordings();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecordings();
    setRefreshing(false);
  };

  const deleteRecording = async (uri) => {
    Alert.alert(
      'Delete Recording',
      'Are you sure you want to remove this recording from the list?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedRecordings = recordings.filter(r => r.uri !== uri);
              await AsyncStorage.setItem('recordings', JSON.stringify(updatedRecordings));
              setRecordings(updatedRecordings);
            } catch (error) {
              console.error('Error deleting recording:', error);
            }
          },
        },
      ]
    );
  };

  const copyToClipboard = async (text, label) => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('Copied', `${label} copied to clipboard`);
    } catch (e) {
      console.error('Clipboard error:', e);
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  const renderRecording = ({item}) => (
    <View style={styles.recordingCard}>
      <View style={styles.thumbnailContainer}>
        {thumbnails[item.uri] ? (
          <Image source={{uri: thumbnails[item.uri]}} style={styles.thumbnail} />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Text style={styles.thumbnailPlaceholderText}>🎥</Text>
          </View>
        )}
      </View>
      
      <View style={styles.recordingInfo}>
        <Text style={styles.recordingDate}>
          {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString()}
        </Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Certificate ID:</Text>
          <TouchableOpacity onPress={() => copyToClipboard(item.certificateId, 'Certificate ID')}>
            <Text style={styles.detailValue} numberOfLines={1}>
              {item.certificateId}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Hash:</Text>
          <TouchableOpacity onPress={() => copyToClipboard(item.hash, 'Hash')}>
            <Text style={styles.hashValue} selectable={true}>
              {item.hash}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Device:</Text>
          <Text style={styles.detailValue}>
            {(() => {
              // Normalize capitalization for legacy entries like "ios 26.0"
              if (!item.deviceInfo) return '';
              if (item.deviceInfo.startsWith('ios ')) return item.deviceInfo.replace(/^ios\s/, 'iOS ');
              if (item.deviceInfo.startsWith('android ')) return item.deviceInfo.replace(/^android\s/, 'Android ');
              return item.deviceInfo;
            })()}
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteRecording(item.uri)}>
          <Text style={styles.deleteButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (recordings.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📹</Text>
        <Text style={styles.emptyTitle}>No Recordings Yet</Text>
        <Text style={styles.emptyText}>
          Record your first video in the Camera tab to see it here with its certificate!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={recordings}
        renderItem={renderRecording}
        keyExtractor={(item, index) => `${item.uri}-${index}`}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 15,
  },
  recordingCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  thumbnailContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#000',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  thumbnailPlaceholderText: {
    fontSize: 60,
  },
  recordingInfo: {
    padding: 15,
  },
  recordingDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  detailRow: {
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
  },
  hashValue: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#667eea',
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 4,
    flexWrap: 'wrap',
  },
  deleteButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#ff3b30',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f5f5f5',
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default RecordingsScreen;
