import { Text, View, TouchableOpacity, Alert, StyleSheet, Dimensions, Platform } from "react-native";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { CameraView, CameraType, useCameraPermissions, FlashMode } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function CameraCaptureScreen() {
  const router = useRouter();
  const colors = useColors();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isReady, setIsReady] = useState(false);

  if (!permission) {
    return <View style={[styles.container, { backgroundColor: '#000' }]} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background, paddingHorizontal: 24 }]}>
        <IconSymbol name="camera.fill" size={64} color={colors.muted} />
        <Text style={[styles.permissionTitle, { color: colors.foreground }]}>
          Permiso de Cámara Requerido
        </Text>
        <Text style={[styles.permissionText, { color: colors.muted }]}>
          Necesitamos acceso a tu cámara para capturar fotos del proyecto con la mejor calidad.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={[styles.permissionButton, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.permissionButtonText}>Permitir Acceso</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.muted, fontSize: 16 }}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFlash(current => {
      if (current === 'off') return 'on';
      if (current === 'on') return 'auto';
      return 'off';
    });
  };

  const takePicture = async () => {
    if (cameraRef.current && isReady) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1,
          base64: false,
          exif: true,
        });
        
        if (photo) {
          router.push({
            pathname: "/image-editor",
            params: { imageUri: photo.uri }
          });
        }
      } catch (error) {
        Alert.alert("Error", "No se pudo capturar la foto. Inténtalo de nuevo.");
      }
    }
  };

  const renderFlashIcon = () => {
    switch (flash) {
      case 'on': return 'bolt.fill';
      case 'auto': return 'bolt.badge.a.fill';
      default: return 'bolt.slash.fill';
    }
  };

  return (
    <View style={styles.container}>
      <CameraView 
        ref={cameraRef} 
        style={styles.camera} 
        facing={facing}
        flash={flash}
        onCameraReady={() => setIsReady(true)}
      >
        {/* Top Controls Overlay */}
        <View style={styles.topControls}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <IconSymbol name="xmark" size={22} color="#FFF" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={toggleFlash} style={styles.iconButton}>
            <IconSymbol name={renderFlashIcon()} size={22} color={flash !== 'off' ? '#FFD60A' : '#FFF'} />
          </TouchableOpacity>
        </View>

        {/* Bottom Controls Overlay */}
        <View style={styles.bottomContainer}>
          <View style={styles.controlsRow}>
            {/* Gallery Preview Placeholder or Last Photo */}
            <TouchableOpacity 
              onPress={() => router.push('/gallery-picker')}
              style={styles.thumbnailButton}
            >
              <IconSymbol name="photo.on.rectangle" size={24} color="#FFF" />
            </TouchableOpacity>

            {/* Capture Button */}
            <TouchableOpacity onPress={takePicture} style={styles.captureOuter}>
              <View style={styles.captureInner} />
            </TouchableOpacity>

            {/* Flip Camera */}
            <TouchableOpacity onPress={toggleCameraFacing} style={styles.thumbnailButton}>
              <IconSymbol name="arrow.triangle.2.circlepath.camera" size={26} color="#FFF" />
            </TouchableOpacity>
          </View>
          
          {/* Mode Selector Placeholder */}
          <View style={styles.modeSelector}>
            <Text style={styles.modeTextActive}>FOTO</Text>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
  },
  captureOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF',
  },
  thumbnailButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeTextActive: {
    color: '#FFD60A',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 24,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 32,
    lineHeight: 22,
  },
  permissionButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
