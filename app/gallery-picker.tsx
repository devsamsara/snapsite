import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { AppAlert } from '@/components/ui/app-alert';

export default function GalleryPickerScreen() {
  const router = useRouter();
  const colors = useColors();
  const { projectId } = useLocalSearchParams<{ projectId?: string }>();
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
      AppAlert.alert(
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

    // Launch image library
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        // Redirigir al editor con la imagen seleccionada y el projectId
        router.replace({
          pathname: "/image-editor",
          params: { imageUri: result.assets[0].uri, projectId },
        });
      } else {
        // El usuario canceló, volver atrás
        setIsPickerOpen(false);
        router.back();
      }
    } catch (error) {
      console.error("Error picking image:", error);
      AppAlert.alert("Error", "No se pudo seleccionar la imagen");
      setIsPickerOpen(false);
      router.back();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <IconSymbol name="photo.on.rectangle" size={64} color={colors.muted} />
      <Text style={[styles.text, { color: colors.muted }]}>
        Abriendo galería...
      </Text>
      <TouchableOpacity 
        onPress={() => router.back()}
        style={styles.cancelButton}
      >
        <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '500' }}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    marginTop: 16,
  },
  cancelButton: {
    marginTop: 32,
    padding: 10,
  }
});
