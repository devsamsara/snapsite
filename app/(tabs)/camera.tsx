// components/InstagramCamera.tsx
import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  Alert,
  Image,
  Modal,
  Platform,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  PhotoFile,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import PhotoEditorModal from "@/components/PhotoEditorModal";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type CameraMode = 'photo' | 'scan';

const CameraScreen: React.FC = () => {
  const camera = useRef<Camera>(null);

  const [mode, setMode] = useState<CameraMode>('photo');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [cameraPosition, setCameraPosition] = useState<'back' | 'front'>('back');
  const [capturedPhoto, setCapturedPhoto] = useState<PhotoFile | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [detectedQR, setDetectedQR] = useState<string | null>(null);

  const device = useCameraDevice(cameraPosition);
  const { hasPermission, requestPermission } = useCameraPermission();

  // Scanner de QR y documentos
  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'],
    onCodeScanned: (codes) => {
      if (mode === 'scan' && codes.length > 0) {
        const qrValue = codes[0].value;
        setDetectedQR(qrValue);

        // Si es URL, mostrar opción de abrir
        if (qrValue?.startsWith('http')) {
          Alert.alert(
              'QR Detectado',
              qrValue,
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Abrir', onPress: () => console.log('Abrir:', qrValue) },
              ]
          );
        }
      }
    },
  });

  // Solicitar permisos
  React.useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }

    (async () => {
      await MediaLibrary.requestPermissionsAsync();
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    })();
  }, [hasPermission]);

  // Tomar foto
  const takePhoto = async () => {
    if (!camera.current) return;

    try {
      const photo = await camera.current.takePhoto({
        flash: flash,
        enableShutterSound: true,
      });

      setCapturedPhoto(photo);
      setShowEditor(true);

    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  // Abrir galería
  const openGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        // Convertir a formato PhotoFile para el editor
        const photo: PhotoFile = {
          path: result.assets[0].uri,
          width: result.assets[0].width || 0,
          height: result.assets[0].height || 0,
        };

        setCapturedPhoto(photo);
        setShowEditor(true);
      }
    } catch (error) {
      console.error('Error opening gallery:', error);
    }
  };

  // Guardar foto editada
  const handleSavePhoto = async (editedUri: string) => {
    try {
      const asset = await MediaLibrary.createAssetAsync(editedUri);
      await MediaLibrary.createAlbumAsync('SnapSite', asset, false);

      Alert.alert('Guardado', 'Foto guardada en la galería');
      setShowEditor(false);
      setCapturedPhoto(null);
    } catch (error) {
      console.error('Error saving photo:', error);
      Alert.alert('Error', 'No se pudo guardar la foto');
    }
  };

  // Descartar foto
  const handleDiscardPhoto = () => {
    setShowEditor(false);
    setCapturedPhoto(null);
  };

  // Toggle flash
  const toggleFlash = () => {
    setFlash((prev) => (prev === 'off' ? 'on' : 'off'));
  };

  // Toggle cámara
  const toggleCamera = () => {
    setCameraPosition((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  // Cerrar (volver atrás)
  const handleClose = () => {
    // Navegar hacia atrás
    console.log('Close camera');
  };

  if (!hasPermission) {
    return (
        <View style={styles.container}>
          <Text style={{ color: 'white' }}>Solicitando permisos...</Text>
        </View>
    );
  }

  if (!device) {
    return (
        <View style={styles.container}>
          <Text style={{ color: 'white' }}>Cámara no disponible</Text>
        </View>
    );
  }

  return (
      <View style={styles.container}>
        {/* Cámara */}
        <Camera
            ref={camera}
            device={device}
            isActive={!showEditor}
            style={StyleSheet.absoluteFill}
            photo={true}
            codeScanner={mode === 'scan' ? codeScanner : undefined}
        />

        {/* Grid Overlay */}
        {showGrid && <GridOverlay />}

        {/* Indicador de QR detectado */}
        {mode === 'scan' && detectedQR && (
            <View style={styles.qrIndicator}>
              <Text style={styles.qrText}>QR Detectado</Text>
            </View>
        )}

        {/* Top Bar - Estilo Instagram */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.topButton} onPress={handleClose}>
            <Ionicons name="close" size={32} color="white" />
          </TouchableOpacity>

          <View style={styles.topRight}>
            <TouchableOpacity style={styles.topButton} onPress={toggleFlash}>
              <Ionicons
                  name={flash === 'off' ? 'flash-off' : 'flash'}
                  size={28}
                  color="white"
              />
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.topButton}
                onPress={() => setShowGrid(!showGrid)}
            >
              <Ionicons name="grid-outline" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Controls - Estilo Instagram */}
        <View style={styles.bottomContainer}>
          {/* Mode Selector */}
          <View style={styles.modeSelector}>
            <TouchableOpacity
                style={styles.modeButton}
                onPress={() => setMode('photo')}
            >
              <Text
                  style={[
                    styles.modeText,
                    mode === 'photo' && styles.modeTextActive,
                  ]}
              >
                FOTO
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.modeButton}
                onPress={() => setMode('scan')}
            >
              <Text
                  style={[
                    styles.modeText,
                    mode === 'scan' && styles.modeTextActive,
                  ]}
              >
                ESCANEAR
              </Text>
            </TouchableOpacity>
          </View>

          {/* Capture Row */}
          <View style={styles.captureRow}>
            {/* Galería */}
            <TouchableOpacity style={styles.galleryButton} onPress={openGallery}>
              <Ionicons name="images" size={28} color="white" />
            </TouchableOpacity>

            {/* Botón de captura */}
            <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>

            {/* Flip camera */}
            <TouchableOpacity style={styles.flipButton} onPress={toggleCamera}>
              <Ionicons name="camera-reverse" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Editor Modal */}
        {capturedPhoto && (
            <PhotoEditorModal
                visible={showEditor}
                photoUri={`file://${capturedPhoto.path}`}
                onSave={handleSavePhoto}
                onDiscard={handleDiscardPhoto}
            />
        )}
      </View>
  );
};

// Grid Overlay
const GridOverlay: React.FC = () => (
    <View style={styles.gridOverlay} pointerEvents="none">
      <View style={[styles.gridLine, { top: '33.33%' }]} />
      <View style={[styles.gridLine, { top: '66.66%' }]} />
      <View style={[styles.gridLine, styles.gridLineVertical, { left: '33.33%' }]} />
      <View style={[styles.gridLine, styles.gridLineVertical, { left: '66.66%' }]} />
    </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  topButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topRight: {
    flexDirection: 'row',
    gap: 8,
  },
  qrIndicator: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    zIndex: 5,
  },
  qrText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.3)',
    height: 1,
    width: '100%',
  },
  gridLineVertical: {
    width: 1,
    height: '100%',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
    zIndex: 10,
  },
  modeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 32,
  },
  modeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  modeText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '600',
  },
  modeTextActive: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  captureRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  captureButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'white',
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CameraScreen;