/**
 * usePhotoPicker
 *
 * Hook único para seleccionar una foto (cámara o galería) y navegar al editor.
 * Centraliza la lógica de permisos + picker + navegación en un solo lugar.
 *
 * Uso:
 *   const { openCamera, openGallery } = usePhotoPicker({ projectId });
 *   <Button onPress={openCamera} />
 *   <Button onPress={openGallery} />
 *
 * Tras seleccionar la foto, navega a /image-editor con imageUri y projectId.
 * El caller puede pasar onBeforeNavigate para hacer cleanup antes de navegar.
 */

import { useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { AppAlert } from '@/components/ui/app-alert';

interface UsePhotoPickerOptions {
  /** ID del proyecto al que se asociará la foto. Puede ser vacío si se seleccionará después. */
  projectId?: string;
  /**
   * Source que se pasa al editor para que sepa a dónde volver al cancelar/guardar.
   * Ej: 'add-photos-prompt' para volver al inicio, 'project' para volver al proyecto.
   */
  source?: string;
  /**
   * Callback ejecutado justo antes de navegar al editor.
   * Útil para cerrar modales o limpiar el stack.
   * Si devuelve false, se cancela la navegación.
   */
  onBeforeNavigate?: () => void | boolean | Promise<void | boolean>;
}

export function usePhotoPicker({ projectId, source, onBeforeNavigate }: UsePhotoPickerOptions = {}) {
  const router = useRouter();

  const goToEditor = useCallback(
    async (imageUri: string) => {
      if (onBeforeNavigate) {
        const result = await onBeforeNavigate();
        if (result === false) return;
      }
      router.push({
        pathname: '/image-editor',
        params: {
          imageUri,
          projectId: projectId ?? '',
          ...(source ? { source } : {}),
        },
      });
    },
    [router, projectId, source, onBeforeNavigate]
  );

  const openCamera = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      AppAlert.alert(
        'Permiso requerido',
        'Necesitamos acceso a la cámara. Ve a Ajustes > Privacidad > Cámara y actívalo.'
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets?.[0]) {
      await goToEditor(result.assets[0].uri);
    }
  }, [goToEditor]);

  const openGallery = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      AppAlert.alert(
        'Permiso requerido',
        'Necesitamos acceso a tu galería. Ve a Ajustes > Privacidad > Fotos y actívalo.'
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets?.[0]) {
      await goToEditor(result.assets[0].uri);
    }
  }, [goToEditor]);

  return { openCamera, openGallery };
}
