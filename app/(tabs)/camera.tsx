// components/AdvancedCameraUI.tsx
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';

export const CameraScreen: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'4:3' | '16:9'>('4:3');
  const [showGrid, setShowGrid] = useState(false);
  const [showLevel, setShowLevel] = useState(false);
  const [stampGPS, setStampGPS] = useState(false);
  const [stampDateTime, setStampDateTime] = useState(false);
  const [mode, setMode] = useState<'photo' | 'video' | 'scan'>('photo');

  const device = useCameraDevice('back');

  return (
      <View style={styles.container}>
        <Camera
            device={device!}
            isActive={true}
            style={StyleSheet.absoluteFill}
            photo={mode === 'photo'}
            video={mode === 'video'}
        />

        {/* Settings Overlay */}
        {showSettings && (
            <View style={styles.settingsPanel}>
              <View style={styles.settingsGrid}>
                <SettingButton
                    icon="4:3"
                    label="Relación de aspecto"
                    active={aspectRatio === '4:3'}
                    onPress={() => setAspectRatio('4:3')}
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
                    onPress={() => {}}
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
          <TouchableOpacity style={styles.topButton}>
            <Text style={styles.topButtonIcon}>⚡</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.topButton}>
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
          {/* Mode Selector */}
          <View style={styles.modeSelector}>
            {['ESCANEAR', 'NOTA DE AI', 'FOTO', 'VIDEO', 'VIDEO DUAL'].map((m) => (
                <TouchableOpacity key={m} style={styles.modeButton}>
                  <Text
                      style={[
                        styles.modeText,
                        m === 'FOTO' && styles.modeTextActive
                      ]}
                  >
                    {m}
                  </Text>
                </TouchableOpacity>
            ))}
          </View>

          {/* Capture Controls */}
          <View style={styles.captureRow}>
            <TouchableOpacity style={styles.galleryButton}>
              <Text style={styles.buttonIcon}>🖼️</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.captureButton}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.doneButton}>
              <Text style={styles.doneButtonText}>Listo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
      <View style={styles.gridLine} />
      <View style={styles.gridLine} />
      <View style={[styles.gridLine, styles.gridLineVertical]} />
      <View style={[styles.gridLine, styles.gridLineVertical]} />
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
  },
  settingsPanel: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(28, 39, 60, 0.95)',
    borderRadius: 16,
    padding: 16,
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
  },
  modeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 16,
  },
  modeButton: {
    paddingVertical: 8,
  },
  modeText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '600',
  },
  modeTextActive: {
    color: 'white',
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
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
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