import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { FlipHorizontal, Image as ImageIcon, Camera } from "lucide-react-native";
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/use-colors";

export default function CameraScreen() {
  const router = useRouter();
  const colors = useColors();
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);

  const getLocation = async () => {
    if (Platform.OS === "web") {
      return null;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return null;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const addresses = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      const address = addresses[0];
      const addressString = address
        ? `${address.street || ""} ${address.city || ""}, ${address.region || ""}`
        : "Unknown location";

      return {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        address: addressString.trim(),
      };
    } catch (error) {
      console.log("Error getting location:", error);
      return null;
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync();
      if (photo?.uri) {
        // Get location
        const loc = await getLocation();
        
        // Navigate to image editor with the photo and location
        router.push({
          pathname: "/image-editor",
          params: { 
            imageUri: photo.uri,
            latitude: loc?.latitude?.toString() || "",
            longitude: loc?.longitude?.toString() || "",
            address: loc?.address || "",
          },
        });
      }
    } catch (error) {
      console.log("Error taking picture:", error);
      Alert.alert("Error", "Failed to take picture");
    } finally {
      setIsCapturing(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        // Get location
        const loc = await getLocation();
        
        // Navigate to image editor
        router.push({
          pathname: "/image-editor",
          params: { 
            imageUri: result.assets[0].uri,
            latitude: loc?.latitude?.toString() || "",
            longitude: loc?.longitude?.toString() || "",
            address: loc?.address || "",
          },
        });
      }
    } catch (error) {
      console.log("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  if (!permission) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
        <View style={styles.permissionContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
        <View style={styles.permissionContainer}>
          <Camera size={64} color={colors.primary} />
          <Text style={[styles.permissionText, { color: colors.foreground }]}>
            Necesitamos tu permiso para usar la cámara
          </Text>
          <TouchableOpacity 
            style={[styles.permissionButton, { backgroundColor: colors.primary }]} 
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Permitir Acceso</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {Platform.OS !== "web" ? (
        <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
          <View style={styles.cameraOverlay}>
            <View style={styles.cameraHeader}>
              <View style={styles.cameraHeaderLeft}>
                <Camera size={24} color="#FFFFFF" />
                <Text style={styles.cameraHeaderText}>Camera</Text>
              </View>
              <TouchableOpacity style={styles.iconButton} onPress={toggleCameraFacing}>
                <FlipHorizontal size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.cameraFooter}>
              <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
                <ImageIcon size={28} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.captureButton} 
                onPress={takePicture}
                disabled={isCapturing}
              >
                {isCapturing ? (
                  <ActivityIndicator size="large" color="#FFFFFF" />
                ) : (
                  <View style={styles.captureButtonInner} />
                )}
              </TouchableOpacity>

              <View style={styles.galleryButton} />
            </View>
          </View>
        </CameraView>
      ) : (
        <View style={[styles.webCameraPlaceholder, { backgroundColor: colors.background }]}>
          <Camera size={64} color={colors.muted} />
          <Text style={[styles.webCameraText, { color: colors.muted }]}>
            La cámara no está disponible en web
          </Text>
          <TouchableOpacity 
            style={[styles.webPickButton, { backgroundColor: colors.primary }]} 
            onPress={pickImage}
          >
            <ImageIcon size={28} color="#FFFFFF" />
            <Text style={styles.webPickButtonText}>Seleccionar de Galería</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 24,
  },
  permissionText: {
    fontSize: 16,
    textAlign: "center",
    maxWidth: 280,
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: "space-between",
  },
  cameraHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  cameraHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  cameraHeaderText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  iconButton: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 25,
  },
  cameraFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  galleryButton: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 25,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#FFFFFF",
  },
  webCameraPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 24,
  },
  webCameraText: {
    fontSize: 16,
  },
  webPickButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  webPickButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
