import { Text, View, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';

export default function GalleryPickerScreen() {
  const router = useRouter();
  const colors = useColors();
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  useEffect(() => {
    if (!isPickerOpen) {
      pickImage();
    }
  }, []);

  const pickImage = async () => {
    setIsPickerOpen(true);
    
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permiso Requerido',
        'Necesitamos acceso a tu galería para seleccionar fotos.',
        [
          { 
            text: 'Cancelar', 
            onPress: () => {
              setIsPickerOpen(false);
              router.back();
            }, 
            style: 'cancel' 
          },
        ]
      );
      return;
    }

    // Launch image picker
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        // Navigate to image editor with the selected photo
        router.replace({
          pathname: "/image-editor",
          params: { imageUri: result.assets[0].uri }
        });
      } else {
        // User cancelled, go back
        setIsPickerOpen(false);
        router.back();
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "No se pudo seleccionar la imagen");
      setIsPickerOpen(false);
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
