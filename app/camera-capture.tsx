import { Text, View, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';

export default function CameraCaptureScreen() {
  const router = useRouter();
  const colors = useColors();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <View className="flex-1 bg-background" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-background justify-center items-center px-6">
        <IconSymbol name="camera.fill" size={64} color={colors.muted} />
        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground, marginTop: 24, marginBottom: 12, textAlign: 'center' }}>
          Permiso de Cámara Requerido
        </Text>
        <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 32, textAlign: 'center' }}>
          Necesitamos acceso a tu cámara para capturar fotos del proyecto.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 32,
            paddingVertical: 16,
            borderRadius: 16,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>
            Permitir Acceso
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            marginTop: 16,
            paddingVertical: 12,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '500', color: colors.muted }}>
            Cancelar
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });
        
        if (photo) {
          // Navigate to image editor with the captured photo
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

  return (
    <View className="flex-1 bg-black">
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing}>
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 24,
            paddingTop: 60,
            paddingBottom: 16,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconSymbol name="xmark" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={toggleCameraFacing}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconSymbol name="arrow.triangle.2.circlepath.camera" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Bottom Controls */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingBottom: 40,
            paddingHorizontal: 24,
            alignItems: 'center',
          }}
        >
          <TouchableOpacity
            onPress={takePicture}
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: '#FFFFFF',
              borderWidth: 6,
              borderColor: 'rgba(255, 255, 255, 0.3)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />
        </View>
      </CameraView>
    </View>
  );
}
