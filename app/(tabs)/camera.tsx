/**
 * app/(tabs)/camera.tsx
 *
 * Botón centrado en pantalla. paddingBottom = insets.bottom + 60
 * evita que el NativeTab bar tape el contenido.
 */
import { View, StyleSheet, Text, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function CameraTab() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 60 }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.center}>
        <Text style={styles.emoji}>📸</Text>
        <Text style={styles.heading}>Editor de Fotos</Text>
        <Text style={styles.sub}>
          Edita, recorta, dibuja y ajusta{'\n'}tus fotos al estilo iPhone
        </Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => router.push('/photo-editor')}
          activeOpacity={0.8}
        >
          <Text style={styles.btnTxt}>Abrir Editor</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  center:  { alignItems: 'center', gap: 16 },
  emoji:   { fontSize: 64, marginBottom: 8 },
  heading: { fontSize: 26, fontWeight: '700', color: '#fff', letterSpacing: -0.4 },
  sub:     { fontSize: 14, color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  btn:     { marginTop: 8, backgroundColor: '#FFD60A', paddingHorizontal: 40, paddingVertical: 16, borderRadius: 30 },
  btnTxt:  { fontSize: 17, fontWeight: '700', color: '#000', letterSpacing: 0.2 },
});
