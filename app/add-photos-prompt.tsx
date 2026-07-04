/**
 * add-photos-prompt.tsx
 *
 * Pantalla post-creación de proyecto.
 * Usa usePhotoPicker directamente — sin pasar por add-photo-modal.
 *
 * Flujo:
 *   Tomar Foto     → cámara nativa → image-editor (con projectId)
 *   Galería        → picker nativo → image-editor (con projectId)
 *   Ver Detalles   → router.replace limpio a project/[id] (borra historial)
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { useCardStyle } from '@/hooks/use-card-style';
import { usePhotoPicker } from '@/hooks/use-photo-picker';

export default function AddPhotosPromptScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const cardElevation = useCardStyle();
  const [busy, setBusy] = useState(false);

  const { projectId, projectName } = useLocalSearchParams<{
    projectId: string;
    projectName: string;
  }>();

  const { openCamera, openGallery } = usePhotoPicker({
    projectId: projectId ?? '',
  });

  const handleCamera = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await openCamera();
    } finally {
      setBusy(false);
    }
  };

  const handleGallery = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await openGallery();
    } finally {
      setBusy(false);
    }
  };

  // Navegar a los detalles del proyecto limpiando el historial de navegación.
  // router.replace elimina add-photos-prompt del stack y navega directamente.
  const handleViewDetails = () => {
    if (!projectId) return;
    router.replace({
      pathname: `/project/${projectId}` as any,
      params: { source: 'home' },
    });
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
            style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: busy ? 0.6 : 1 }]}
            onPress={handleCamera}
            disabled={busy}
            activeOpacity={0.85}
          >
            {busy ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <IconSymbol name="camera.fill" size={20} color="#FFF" />
                <Text style={styles.primaryButtonText}>
                  {t('addPhotosPrompt.takePhoto')}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Seleccionar de la Galería */}
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              { borderColor: colors.border, backgroundColor: colors.surface, opacity: busy ? 0.6 : 1 },
              cardElevation,
            ]}
            onPress={handleGallery}
            disabled={busy}
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
            disabled={busy}
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
