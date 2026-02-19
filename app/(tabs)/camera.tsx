// components/AdvancedCameraUI.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  FlatList,
  Alert,
} from 'react-native';
import { Camera, useCameraDevice, PhotoFile, VideoFile } from 'react-native-vision-camera';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MODE_WIDTH = 100;

type CameraMode = {
  id: string;
  label: string;
  type: 'scan' | 'ai-note' | 'photo' | 'video' | 'dual-video';
};

const CAMERA_MODES: CameraMode[] = [
  { id: 'scan', label: 'ESCANEAR', type: 'scan' },
  { id: 'ai-note', label: 'NOTA DE AI', type: 'ai-note' },
  { id: 'photo', label: 'FOTO', type: 'photo' },
  { id: 'video', label: 'VIDEO', type: 'video' },
  { id: 'dual-video', label: 'VIDEO DUAL', type: 'dual-video' },
];

const CameraScreen: React.FC = () => {
  const camera = useRef<Camera>(null);
  const modeListRef = useRef<FlatList>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'4:3' | '16:9'>('4:3');
  const [showGrid, setShowGrid] = useState(false);
  const [showLevel, setShowLevel] = useState(false);
  const [stampGPS, setStampGPS] = useState(false);
  const [stampDateTime, setStampDateTime] = useState(false);
  const [activeMode, setActiveMode] = useState(2); // FOTO por defecto
  const [flash, setFlash] = useState<'off' | 'on' | 'auto'>('off');
  const [isRecording, setIsRecording] = useState(false);
  const [cameraPosition, setCameraPosition] = useState<'back' | 'front'>('back');

  const device = useCameraDevice(cameraPosition);

  // Tomar foto
  const takePhoto = async () => {
    if (!camera.current) return;

    try {
      const photo: PhotoFile = await camera.current.takePhoto({
        flash: flash,
        enableShutterSound: true,
      });

      console.log('Photo taken:', photo.path);
      Alert.alert('Foto capturada', `Guardada en: ${photo.path}`);

      // Aquí puedes procesar la foto (agregar GPS, fecha/hora, etc.)

    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  // Grabar video
  const toggleRecording = async () => {
    if (!camera.current) return;

    try {
      if (isRecording) {
        await camera.current.stopRecording();
        setIsRecording(false);
      } else {
        setIsRecording(true);
        const video: VideoFile = await camera.current.startRecording({
          flash: flash,
          onRecordingFinished: (video) => {
            console.log('Video recorded:', video.path);
            Alert.alert('Video grabado', `Guardado en: ${video.path}`);
            setIsRecording(false);
          },
          onRecordingError: (error) => {
            console.error('Recording error:', error);
            setIsRecording(false);
          },
        });
      }
    } catch (error) {
      console.error('Error recording:', error);
      setIsRecording(false);
    }
  };

  // Cambiar modo
  const handleModeChange = (index: number) => {
    setActiveMode(index);
    modeListRef.current?.scrollToIndex({
      index,
      animated: true,
      viewPosition: 0.5,
    });
  };

  // Cambiar flash
  const toggleFlash = () => {
    setFlash((prev) => {
      if (prev === 'off') return 'on';
      if (prev === 'on') return 'auto';
      return 'off';
    });
  };

  // Cambiar cámara
  const toggleCamera = () => {
    setCameraPosition((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  // Handler para captura según modo
  const handleCapture = () => {
    const mode = CAMERA_MODES[activeMode].type;

    if (mode === 'photo' || mode === 'scan') {
      takePhoto();
    } else if (mode === 'video' || mode === 'dual-video') {
      toggleRecording();
    } else if (mode === 'ai-note') {
      // Implementar lógica de nota AI
      Alert.alert('Nota AI', 'Función en desarrollo');
    }
  };

  if (!device) {
    return (
        <View style={styles.container}>
          <Text style={{ color: 'white' }}>Cámara no disponible</Text>
        </View>
    );
  }

  const currentMode = CAMERA_MODES[activeMode].type;

  return (
      <View style={styles.container}>
        <Camera
            ref={camera}
            device={device}
            isActive={true}
            style={StyleSheet.absoluteFill}
            photo={currentMode === 'photo' || currentMode === 'scan'}
            video={currentMode === 'video' || currentMode === 'dual-video'}
            audio={currentMode === 'video' || currentMode === 'dual-video'}
        />

        {/* Settings Overlay */}
        {showSettings && (
            <View style={styles.settingsPanel}>
              <View style={styles.settingsGrid}>
                <SettingButton
                    icon="4:3"
                    label="Relación de aspecto"
                    active={aspectRatio === '4:3'}
                    onPress={() => setAspectRatio(aspectRatio === '4:3' ? '16:9' : '4:3')}
                />
                <SettingButton
                    icon="⊞"
                    label="Mostrar Cuadrícula"
                    active={showGrid}
                    onPress={() => setShowGrid(!showGrid)}
                />
                <SettingButton
                    icon="⚖"
                    label="Mostrar Level"
                    active={showLevel}
                    onPress={() => setShowLevel(!showLevel)}
                />
                <SettingButton
                    icon="✎"
                    label="Modo de Edición"
                    onPress={() => Alert.alert('Modo edición', 'Función en desarrollo')}
                />
                <SettingButton
                    icon="📍"
                    label="Sellar Lat/Long"
                    active={stampGPS}
                    onPress={() => setStampGPS(!stampGPS)}
                />
                <SettingButton
                    icon="📅"
                    label="Sellar Date/Time"
                    active={stampDateTime}
                    onPress={() => setStampDateTime(!stampDateTime)}
                />
              </View>

              <TouchableOpacity style={styles.allSettings}>
                <Text style={styles.allSettingsText}>
                  Todos los ajustes de cámara ›
                </Text>
              </TouchableOpacity>
            </View>
        )}

        {/* Grid Overlay */}
        {showGrid && <GridOverlay />}

        {/* Top Controls */}
        <View style={styles.topControls}>
          <TouchableOpacity style={styles.topButton} onPress={toggleFlash}>
            <Text style={styles.topButtonIcon}>
              {flash === 'off' ? '⚡' : flash === 'on' ? '⚡' : 'A'}
            </Text>
            {flash !== 'off' && (
                <View style={styles.flashIndicator}>
                  <Text style={styles.flashText}>{flash === 'on' ? 'ON' : 'A'}</Text>
                </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.topButton} onPress={toggleCamera}>
            <Text style={styles.topButtonIcon}>🔄</Text>
          </TouchableOpacity>

          <TouchableOpacity
              style={styles.topButton}
              onPress={() => setShowSettings(!showSettings)}
          >
            <Text style={styles.topButtonIcon}>⚙</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          {/* Mode Selector - Estilo iPhone */}
          <View style={styles.modeSelectorContainer}>
            <FlatList
                ref={modeListRef}
                data={CAMERA_MODES}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={MODE_WIDTH}
                decelerationRate="fast"
                contentContainerStyle={styles.modeList}
                initialScrollIndex={2}
                getItemLayout={(data, index) => ({
                  length: MODE_WIDTH,
                  offset: MODE_WIDTH * index,
                  index,
                })}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / MODE_WIDTH);
                  setActiveMode(index);
                }}
                renderItem={({ item, index }) => (
                    <ModeButton
                        mode={item}
                        isActive={index === activeMode}
                        onPress={() => handleModeChange(index)}
                    />
                )}
                keyExtractor={(item) => item.id}
            />
          </View>

          {/* Capture Controls */}
          <View style={styles.captureRow}>
            <TouchableOpacity style={styles.galleryButton}>
              <Text style={styles.buttonIcon}>🖼️</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[
                  styles.captureButton,
                  isRecording && styles.captureButtonRecording,
                ]}
                onPress={handleCapture}
            >
              <View
                  style={[
                    styles.captureButtonInner,
                    isRecording && styles.captureButtonInnerRecording,
                  ]}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.doneButton}>
              <Text style={styles.doneButtonText}>Listo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
  );
};

// Botón de modo estilo iPhone
const ModeButton: React.FC<{
  mode: CameraMode;
  isActive: boolean;
  onPress: () => void;
}> = ({ mode, isActive, onPress }) => {
  return (
      <TouchableOpacity
          style={[styles.modeButton, { width: MODE_WIDTH }]}
          onPress={onPress}
          activeOpacity={0.7}
      >
        <Text
            style={[
              styles.modeText,
              isActive && styles.modeTextActive,
            ]}
        >
          {mode.label}
        </Text>
      </TouchableOpacity>
  );
};

const SettingButton: React.FC<{
  icon: string;
  label: string;
  active?: boolean;
  onPress: () => void;
}> = ({ icon, label, active, onPress }) => (
    <TouchableOpacity
        style={[styles.settingButton, active && styles.settingButtonActive]}
        onPress={onPress}
    >
      <Text style={styles.settingIcon}>{icon}</Text>
      <Text style={styles.settingLabel}>{label}</Text>
    </TouchableOpacity>
);

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
  topControls: {
    position: 'absolute',
    top: 50,
    right: 16,
    gap: 12,
    zIndex: 10,
  },
  topButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topButtonIcon: {
    fontSize: 20,
    color: 'white',
  },
  flashIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FFD700',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  flashText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: 'black',
  },
  settingsPanel: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(28, 39, 60, 0.95)',
    borderRadius: 16,
    padding: 16,
    zIndex: 10,
  },
  settingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  settingButton: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  settingButtonActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
  },
  settingIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  settingLabel: {
    color: 'white',
    fontSize: 10,
    textAlign: 'center',
  },
  allSettings: {
    padding: 12,
    alignItems: 'center',
  },
  allSettingsText: {
    color: 'white',
    fontSize: 14,
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
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
    zIndex: 10,
  },
  modeSelectorContainer: {
    height: 60,
    marginBottom: 24,
    justifyContent: 'center',
  },
  modeList: {
    paddingHorizontal: (SCREEN_WIDTH - MODE_WIDTH) / 2,
  },
  modeButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  modeText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  modeTextActive: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  captureRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonIcon: {
    fontSize: 24,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  captureButtonRecording: {
    borderColor: '#FF0000',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  captureButtonInnerRecording: {
    width: 30,
    height: 30,
    borderRadius: 4,
    backgroundColor: '#FF0000',
  },
  doneButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CameraScreen;