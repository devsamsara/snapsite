/**
 * app/(tabs)/camera.tsx
 *
 * En lugar de renderizar <PhotoEditor /> aquí dentro (donde la tab bar
 * lo tapa), simplemente navegamos a la ruta full-screen /photo-editor.
 */
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CameraTab() {
  const insets = useSafeAreaInsets();

  const openEditor = () => {
    // Pushes /photo-editor como fullScreenModal — sin tab bar
    router.push('/photo-editor');
  };

  return (
      <View style={styles.container}>
        {/* Aquí va tu UI de cámara existente (preview, botones, etc.) */}

        <TouchableOpacity
            style={[styles.editButton, { bottom: insets.bottom + 24 }]}
            onPress={openEditor}
        >
          <Text style={styles.editButtonText}>✎  Edit Photo</Text>
        </TouchableOpacity>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  editButton: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#FFD60A',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 32,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.3,
  },
});