import { Text, View, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import * as ImagePicker from 'expo-image-picker';
import { useEffect } from 'react';

export default function GalleryPickerScreen() {
  const router = useRouter();
  const colors = useColors();

  useEffect(() => {
    // Automatically open the image picker when the screen loads
    pickImage();
  }, []);

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permiso Requerido',
        'Necesitamos acceso a tu galería para seleccionar fotos.',
        [
          { text: 'Cancelar', onPress: () => router.back(), style: 'cancel' },
          { text: 'Configuración', onPress: () => {
            // TODO: Open app settings
            router.back();
          }},
        ]
      );
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      // Navigate to image editor with the selected photo
      router.push({
        pathname: "/image-editor",
        params: { imageUri: result.assets[0].uri }
      });
    } else {
      // User cancelled, go back
      router.back();
    }
  };

  return (
    <View className="flex-1 bg-background justify-center items-center">
      <IconSymbol name="photo.on.rectangle" size={64} color={colors.muted} />
      <Text style={{ fontSize: 16, color: colors.muted, marginTop: 16 }}>
        Seleccionando foto...
      </Text>
    </View>
  );
}
