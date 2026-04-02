import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';

export default function AddPhotosPromptScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams<{ projectId: string, projectName: string }>();

  const handleAddPhotos = () => {
    // Navegar a la cámara pasando el ID del proyecto para vincular las fotos
    router.push({
      pathname: '/camera-capture',
      params: { projectId: params.projectId }
    });
  };

  const handleSkip = () => {
    // Ir directamente a los detalles del proyecto
    router.push({
      pathname: '/(tabs)/projects', // Por ahora a la lista, o a un detalle si existiera la ruta
      params: { id: params.projectId }
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
          <IconSymbol name="photo.on.rectangle.angled" size={60} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>
          ¡Proyecto Creado!
        </Text>
        
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          ¿Deseas añadir las primeras fotos a "{params.projectName || 'tu proyecto'}" ahora mismo?
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]} 
            onPress={handleAddPhotos}
          >
            <IconSymbol name="camera.fill" size={20} color="#FFF" />
            <Text style={styles.buttonText}>Añadir Fotos Ahora</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.secondaryButton, { borderColor: colors.border }]} 
            onPress={handleSkip}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.muted }]}>
              Ver Detalles del Proyecto
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  button: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
