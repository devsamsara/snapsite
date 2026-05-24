import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Text, Alert, Dimensions, Image } from "react-native";
import { CameraView, useCameraPermissions, FlashMode } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useRouter, useLocalSearchParams } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { AppAlert } from '@/components/ui/app-alert';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CameraCaptureScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ projectId?: string }>();
  const colors = useColors();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [isReady, setIsReady] = useState(false);
  const [lastPhoto, setLastPhoto] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.message}>Necesitamos permiso para usar la cámara</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
          <Text style={styles.permissionButtonText}>Conceder Permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === "back" ? "front" : "back"));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleFlash = () => {
    setFlash(current => {
      if (current === "off") return "on";
      if (current === "on") return "auto";
      return "off";
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      router.push({
        pathname: "/image-editor",
        params: { 
          imageUri: result.assets[0].uri,
          projectId: params.projectId
        }
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
            params: { 
              imageUri: photo.uri,
              projectId: params.projectId 
            }
          });
        }
      } catch (error) {
        AppAlert.alert("Error", "No se pudo capturar la foto. Inténtalo de nuevo.");
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
            <IconSymbol 
              name={renderFlashIcon()} 
              size={22} 
              color={flash !== 'off' ? '#FFD60A' : '#FFF'} 
            />
          </TouchableOpacity>
        </View>

        {/* Bottom Controls Overlay */}
        <View style={styles.bottomControls}>
          <View style={styles.controlsRow}>
            {/* Gallery Preview / Button */}
            <TouchableOpacity onPress={pickImage} style={styles.galleryButton}>
              {lastPhoto ? (
                <Image source={{ uri: lastPhoto }} style={styles.galleryPreview} />
              ) : (
                <View style={styles.galleryPlaceholder}>
                  <IconSymbol name="photo.on.rectangle" size={24} color="#FFF" />
                </View>
              )}
            </TouchableOpacity>

            {/* Shutter Button */}
            <TouchableOpacity onPress={takePicture} style={styles.shutterOuter}>
              <View style={styles.shutterInner} />
            </TouchableOpacity>

            {/* Flip Camera Button */}
            <TouchableOpacity onPress={toggleCameraFacing} style={styles.iconButton}>
              <IconSymbol name="arrow.triangle.2.circlepath" size={26} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  camera: {
    flex: 1,
  },
  topControls: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 25,
    zIndex: 10,
  },
  bottomControls: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    paddingHorizontal: 30,
    zIndex: 10,
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  shutterOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  shutterInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "#FFF",
  },
  galleryButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  galleryPreview: {
    width: "100%",
    height: "100%",
  },
  galleryPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  message: {
    color: "#FFF",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  permissionButtonText: {
    color: "#FFF",
    fontWeight: "bold",
  },
});
