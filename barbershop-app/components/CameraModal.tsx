import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
  Image,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { HairStyle, assetService } from '../lib/assetService';

interface CameraModalProps {
  visible: boolean;
  onClose: () => void;
  selectedHairstyle: HairStyle | null;
}

export function CameraModal({ visible, onClose, selectedHairstyle }: CameraModalProps) {
  const [facing, setFacing] = useState<CameraType>('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [isActive, setIsActive] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  
  
  // Hairstyle selection state
  const [currentHairstyle, setCurrentHairstyle] = useState<HairStyle | null>(selectedHairstyle);
  const [showHairstyleSelector, setShowHairstyleSelector] = useState(false);
  
  

  useEffect(() => {
    if (visible && permission?.granted) {
      // Add a small delay to ensure camera is ready
      setTimeout(() => {
        setIsActive(true);
      }, 500);
    } else if (visible && !permission?.granted) {
      requestPermission();
    }
  }, [visible, permission, requestPermission]);

  // Handle camera errors and retry
  useEffect(() => {
    if (isActive && cameraRef.current) {
      const timeout = setTimeout(() => {
        console.log('Camera timeout, retrying...');
        setIsActive(false);
        setTimeout(() => setIsActive(true), 1000);
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    }
  }, [isActive]);

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const handleHairstyleSelect = (hairstyle: HairStyle) => {
    setCurrentHairstyle(hairstyle);
    setShowHairstyleSelector(false);
  };


  if (!permission) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.container}>
          <Text style={styles.text}>Requesting camera permission...</Text>
        </View>
      </Modal>
    );
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.container}>
          <Text style={styles.text}>Camera permission is required</Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={onClose}>
            <Text style={styles.headerButtonText}>✕ Close</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {selectedHairstyle ? `Try: ${selectedHairstyle.name}` : 'Camera'}
          </Text>
          <TouchableOpacity style={styles.headerButton} onPress={toggleCameraFacing}>
            <Text style={styles.headerButtonText}>🔄 Flip</Text>
          </TouchableOpacity>
        </View>

        {/* Camera View */}
        <View style={styles.cameraContainer}>
          {isActive && (
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={facing}
              mode="picture"
              onCameraReady={() => {
                console.log('📷 Camera is ready');
              }}
              onMountError={(error) => {
                console.log('❌ Camera mount error:', error);
                // Retry after a delay
                setTimeout(() => {
                  setIsActive(false);
                  setTimeout(() => setIsActive(true), 1000);
                }, 2000);
              }}
            />
          )}
          
          {/* AR Hairstyle Overlay - shows how it would look on user */}
          {currentHairstyle && (
            <View style={styles.overlay}>
               {/* AR Overlay - transparent hairstyle positioned directly on user's head */}
               <View style={styles.arOverlay}>
                 <Image
                   source={currentHairstyle.image}
                   style={styles.arHairstyleImage}
                   resizeMode="contain"
                 />
               </View>
              
            </View>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.hairstyleButton} onPress={() => setShowHairstyleSelector(true)}>
            <Text style={styles.hairstyleButtonText}>✂️</Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          {currentHairstyle ? (
            <Text style={styles.instructionText}>
              ✂️ Try {currentHairstyle.name}
            </Text>
          ) : (
            <>
              <Text style={styles.instructionText}>
                ✂️ Tap scissors to choose a hairstyle
              </Text>
              <Text style={styles.instructionText}>
                🔄 Tap flip to switch cameras
              </Text>
            </>
          )}
        </View>

        {/* Hairstyle Selector Modal */}
        {showHairstyleSelector && (
          <View style={styles.hairstyleSelectorOverlay}>
            <View style={styles.hairstyleSelector}>
              <View style={styles.hairstyleSelectorHeader}>
                <Text style={styles.hairstyleSelectorTitle}>Choose Hairstyle</Text>
                <TouchableOpacity onPress={() => setShowHairstyleSelector(false)}>
                  <Text style={styles.closeSelectorText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.hairstyleGrid}>
                {assetService.getHairstyles().map((hairstyle) => (
                  <TouchableOpacity
                    key={hairstyle.id}
                    style={[
                      styles.hairstyleOption,
                      currentHairstyle?.id === hairstyle.id && styles.selectedHairstyleOption
                    ]}
                    onPress={() => handleHairstyleSelect(hairstyle)}
                  >
                    <Image source={hairstyle.image} style={styles.hairstyleOptionImage} />
                    <Text style={styles.hairstyleOptionText}>{hairstyle.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 10,
    backgroundColor: 'transparent', // Make header transparent
    position: 'absolute', // Position over camera
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10, // Ensure it's above camera
  },
  headerButton: {
    padding: 10,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  cameraContainer: {
    flex: 1,
    marginHorizontal: 0, // Remove horizontal margins for full width
    marginVertical: 0, // Remove vertical margins for full screen
    borderRadius: 0, // Remove border radius for full width
    overflow: 'hidden',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 100,
    pointerEvents: 'none', // Allow touches to pass through to camera
  },
  arOverlay: {
    position: 'absolute',
    top: '60%', // Moved lower
    left: '60%', // Moved right
    transform: [{ translateX: -250 }, { translateY: -250 }], // Perfect center for bigger size
    width: 500, // Much bigger for maximum visibility
    height: 500, // Much bigger for maximum visibility
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8, // Fully visible
  },
  arHairstyleImage: {
    width: 480, // Perfect fit for 500x500 overlay
    height: 480, // Perfect fit for 500x500 overlay
    opacity: 0.9, // More visible
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    gap: 30,
  },
  hairstyleButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  hairstyleButtonText: {
    fontSize: 20,
    color: '#fff',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#ccc',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#333',
  },
  instructions: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  instructionText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 5,
  },
  text: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  hairstyleSelectorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hairstyleSelector: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  hairstyleSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  hairstyleSelectorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  closeSelectorText: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
  hairstyleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  hairstyleOption: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 15,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
  },
  selectedHairstyleOption: {
    backgroundColor: '#007AFF',
  },
  hairstyleOptionImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 5,
  },
  hairstyleOptionText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#000',
  },
});
