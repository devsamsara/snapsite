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
import { useCardStyle } from '@/hooks/use-card-style';

export default function AddPhotosPromptScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const cardElevation = useCardStyle();
  const { projectId, projectName } = useLocalSearchParams<{
    projectId: string;
    projectName: string;
  }>();

  // ── Abrir cámara directamente ────────────────────────────────────────────────
  const handleCamera = () => {
    router.push({
      pathname: '/add-photo-modal',
      params: { projectId: projectId ?? '', mode: 'camera' },
    });
  };

  // ── Abrir galería directamente ───────────────────────────────────────────────
  const handleGallery = () => {
    router.push({
      pathname: '/add-photo-modal',
      params: { projectId: projectId ?? '', mode: 'gallery' },
    });
  };

  // ── Ir directamente a los detalles del proyecto ──────────────────────────────
  const handleViewDetails = () => {
    if (!projectId) return;
    // Pasar source=home para que el botón Volver en project/[id] vaya al inicio
    router.replace({ pathname: `/project/${projectId}`, params: { source: 'home' } });
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
            onPress={handleCamera}
            activeOpacity={0.85}
          >
            <IconSymbol name="camera.fill" size={20} color="#FFF" />
            <Text style={styles.primaryButtonText}>
              {t('addPhotosPrompt.takePhoto')}
            </Text>
          </TouchableOpacity>

          {/* Seleccionar de la Galería */}
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.surface }, cardElevation]}
            onPress={handleGallery}
            activeOpacity={0.8}
          >
            <IconSymbol name="photo.on.rectangle" size={20} color={colors.primary} />
            <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>
              {t('addPhotosPrompt.selectFromGallery')}
            </Text>
          </TouchableOpacity>

          {/* Ver Detalles del Proyecto */}
          <TouchableOpacity
            style={styles.ghostButton}
            onPress={handleViewDetails}
            activeOpacity={0.7}
          >
            <Text style={[styles.ghostButtonText, { color: colors.muted }]}>
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
    gap: 14,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  ghostButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  ghostButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
