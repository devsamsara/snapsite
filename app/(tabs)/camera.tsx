import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions, Platform, Image, Alert } from 'react-native';
import { useRouter } from "expo-router";
import { CameraView, CameraType, useCameraPermissions, FlashMode } from 'expo-camera';
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CameraScreen: React.FC = () => {
  const router = useRouter();
  const colors = useColors();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [permission, requestPermission] = useCameraPermissions();
  const [lastPhoto, setLastPhoto] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const [isReady, setIsReady] = useState(false);
  
  // Zoom state
  const zoom = useSharedValue(0);
  const startZoom = useSharedValue(0);

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
      </View>
    );
  }

  const toggleCameraFacing = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFacing(current => (current === 'back' ? 'front' : 'back'));
    zoom.value = 0; // Reset zoom on flip
  };

  const toggleFlash = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFlash(current => {
      if (current === 'off') return 'on';
      if (current === 'on') return 'auto';
      return 'off';
    });
  };

  const openGallery = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permiso Requerido', 'Necesitamos acceso a tu galería.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      router.push({
        pathname: "/image-editor",
        params: { imageUri: result.assets[0].uri }
      });
    }
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
          setLastPhoto(photo.uri);
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

  // Pinch to Zoom Gesture
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      startZoom.value = zoom.value;
    })
    .onUpdate((event) => {
      const newZoom = startZoom.value + (event.scale - 1) * 0.5;
      zoom.value = Math.max(0, Math.min(1, newZoom));
    })
    .runOnJS(true);

  const renderFlashIcon = () => {
    switch (flash) {
      case 'on': return 'bolt.fill';
      case 'auto': return 'bolt.badge.a.fill';
      default: return 'bolt.slash.fill';
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={pinchGesture}>
        <View style={styles.container}>
          <CameraView 
            ref={cameraRef} 
            style={StyleSheet.absoluteFill} 
            facing={facing}
            flash={flash}
            zoom={zoom.value}
            onCameraReady={() => setIsReady(true)}
          >
            {/* Top Controls Overlay */}
            <View style={styles.topControls}>
              <View style={styles.topBlurContainer}>
                <BlurView intensity={20} tint="dark" style={styles.blurWrapper}>
                  <TouchableOpacity onPress={toggleFlash} style={styles.iconButton}>
                    <IconSymbol name={renderFlashIcon()} size={22} color={flash !== 'off' ? '#FFD60A' : '#FFF'} />
                  </TouchableOpacity>
                </BlurView>
              </View>
              
              <View style={styles.topBlurContainer}>
                <BlurView intensity={20} tint="dark" style={styles.blurWrapper}>
                  <TouchableOpacity onPress={toggleCameraFacing} style={styles.iconButton}>
                    <IconSymbol name="arrow.triangle.2.circlepath.camera" size={22} color="#FFF" />
                  </TouchableOpacity>
                </BlurView>
              </View>
            </View>

            {/* Zoom Indicator */}
            {zoom.value > 0 && (
              <View style={styles.zoomIndicator}>
                <BlurView intensity={30} tint="dark" style={styles.zoomBlur}>
                  <Text style={styles.zoomText}>{(1 + zoom.value * 4).toFixed(1)}x</Text>
                </BlurView>
              </View>
            )}

            {/* Bottom Controls Overlay */}
            <View style={styles.bottomContainer}>
              <BlurView intensity={40} tint="dark" style={styles.bottomBlur}>
                <View style={styles.controlsRow}>
                  {/* Gallery Preview */}
                  <TouchableOpacity 
                    onPress={openGallery}
                    style={styles.thumbnailButton}
                  >
                    {lastPhoto ? (
                      <Image source={{ uri: lastPhoto }} style={styles.thumbnailImage} />
                    ) : (
                      <IconSymbol name="photo.on.rectangle" size={24} color="#FFF" />
                    )}
                  </TouchableOpacity>

                  {/* Capture Button */}
                  <TouchableOpacity onPress={takePicture} style={styles.captureOuter}>
                    <View style={styles.captureInner} />
                  </TouchableOpacity>

                  {/* Placeholder to maintain spacing */}
                  <View style={styles.spacer} />
                </View>
                
                {/* Mode Selector */}
                <View style={styles.modeSelector}>
                  <Text style={styles.modeTextActive}>FOTO</Text>
                </View>
              </BlurView>
            </View>
          </CameraView>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  topBlurContainer: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  blurWrapper: {
    padding: 2,
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomIndicator: {
    position: 'absolute',
    bottom: 180,
    alignSelf: 'center',
    borderRadius: 20,
    overflow: 'hidden',
  },
  zoomBlur: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  zoomText: {
    color: '#FFD60A',
    fontSize: 14,
    fontWeight: '700',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    overflow: 'hidden',
  },
  bottomBlur: {
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
    paddingTop: 20,
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
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
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
  spacer: {
    width: 50,
  },
});

export default CameraScreen;
