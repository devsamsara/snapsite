/**
 * add-photos-prompt.tsx
 *
 * Pantalla post-creación de proyecto.
 * Ofrece dos opciones:
 *   - Tomar Foto → add-photo-modal (con projectId, abre cámara)
 *   - Seleccionar de Galería → add-photo-modal (con projectId, abre galería)
 *   - Ver Detalles → project/[id]
 *
 * El projectId se pasa siempre desde create-project-details.tsx.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';

export default function AddPhotosPromptScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const { projectId, projectName } = useLocalSearchParams<{
    projectId: string;
    projectName: string;
  }>();

  // ── Navegar al modal de foto pasando el projectId ────────────────────────────
  const handleAddPhotos = () => {
    router.push({
      pathname: '/add-photo-modal',
      params: { projectId: projectId ?? '' },
    });
  };

  // ── Ir directamente a los detalles del proyecto ──────────────────────────────
  const handleViewDetails = () => {
    if (!projectId) return;
    router.replace(`/project/${projectId}`);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      <View style={styles.content}>
        {/* Icono */}
        <View style={[styles.iconCircle, { backgroundColor: colors.primary + '18' }]}>
          <IconSymbol name="photo.on.rectangle.angled" size={60} color={colors.primary} />
        </View>

        {/* Título y subtítulo */}
        <Text style={[styles.title, { color: colors.foreground }]}>
          {t('addPhotosPrompt.title')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          {t('addPhotosPrompt.subtitle', {
            name: projectName || t('addPhotosPrompt.yourProject'),
          })}
        </Text>

        {/* Botones de acción */}
        <View style={styles.buttonContainer}>
          {/* Tomar Foto */}
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={handleAddPhotos}
            activeOpacity={0.85}
          >
            <IconSymbol name="camera.fill" size={20} color="#FFF" />
            <Text style={styles.primaryButtonText}>
              {t('addPhotosPrompt.addNow')}
            </Text>
          </TouchableOpacity>

          {/* Ver Detalles */}
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.border }]}
            onPress={handleViewDetails}
            activeOpacity={0.7}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.muted }]}>
              {t('addPhotosPrompt.viewDetails')}
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
  primaryButton: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
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
