/**
 * add-photo-modal.tsx
 *
 * Flujo:
 *   project/[id]  →push→  add-photo-modal  →replace→  image-editor  →back→  project/[id]
 *   add-photos-prompt →push→  add-photo-modal  →replace→  image-editor  →back→  add-photos-prompt
 *
 * Vistas internas (sin navegación entre rutas):
 *   "options"  → pantalla inicial: elegir entre Tomar Foto o Seleccionar de Galería
 *   "camera"   → CameraView a pantalla completa
 *
 * Al obtener una foto (cámara o galería):
 *   router.replace('/image-editor', { imageUri, projectId })
 *   → el add-photo-modal desaparece del stack (replace lo elimina)
 *   → el image-editor arranca directamente en modo editor
 *
 * Al guardar/cancelar en el image-editor:
 *   router.back() → vuelve al project/[id] limpiamente
 *
 * Estilo: mismo lenguaje visual que add-photos-prompt
 *   (centrado, icono grande en círculo, botones grandes con fondo de color)
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions, FlashMode } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { AppAlert } from '@/components/ui/app-alert';

type ModalView = 'options' | 'camera';

export default function AddPhotoModal() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { projectId } = useLocalSearchParams<{ projectId?: string }>();

  const [view, setView] = useState<ModalView>('options');
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [camReady, setCamReady] = useState(false);
  const [lastPhoto, setLastPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();

  // ── Navegar al editor reemplazando este modal ────────────────────────────────
  const goToEditor = (imageUri: string) => {
    router.replace({
      pathname: '/image-editor',
      params: { imageUri, projectId: projectId ?? '' },
    });
  };

  // ── Opción: Galería ──────────────────────────────────────────────────────────
  const handleGalleryOption = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        AppAlert.alert(
          'Permiso requerido',
          'Necesitamos acceso a tu galería para seleccionar fotos.',
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });
      if (!result.canceled && result.assets?.[0]) {
        goToEditor(result.assets[0].uri);
      }
    } catch (err) {
      console.error('[AddPhotoModal] Gallery error:', err);
      AppAlert.alert('Error', 'No se pudo abrir la galería.');
    } finally {
      setBusy(false);
    }
  };

  // ── Opción: Cámara ───────────────────────────────────────────────────────────
  const handleCameraOption = async () => {
    if (busy) return;

    if (!permission) {
      const r = await requestPermission();
      if (!r.granted) {
        AppAlert.alert('Permiso requerido', 'Necesitamos acceso a la cámara para tomar fotos.');
        return;
      }
    } else if (!permission.granted) {
      if (permission.canAskAgain) {
        const r = await requestPermission();
        if (!r.granted) {
          AppAlert.alert('Permiso requerido', 'Necesitamos acceso a la cámara para tomar fotos.');
          return;
        }
      } else {
        AppAlert.alert(
          'Permiso denegado',
          'Ve a Ajustes > Privacidad > Cámara y activa el permiso para esta app.',
        );
        return;
      }
    }

    setCamReady(false);
    setView('camera');
  };

  // ── Cámara: tomar foto ───────────────────────────────────────────────────────
  const takePicture = async () => {
    if (!cameraRef.current || !camReady || busy) return;
    setBusy(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        base64: false,
        exif: true,
      });
      if (photo?.uri) {
        setLastPhoto(photo.uri);
        goToEditor(photo.uri);
      }
    } catch (err) {
      console.error('[AddPhotoModal] Camera error:', err);
      AppAlert.alert('Error', 'No se pudo capturar la foto. Inténtalo de nuevo.');
      setBusy(false);
    }
  };

  // ── Cámara: abrir galería desde la vista de cámara ───────────────────────────
  const pickFromCameraView = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });
      if (!result.canceled && result.assets?.[0]) {
        goToEditor(result.assets[0].uri);
      } else {
        setBusy(false);
      }
    } catch {
      setBusy(false);
    }
  };

  const toggleFacing = () => {
    setFacing(c => (c === 'back' ? 'front' : 'back'));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleFlash = () => {
    setFlash(c => (c === 'off' ? 'on' : c === 'on' ? 'auto' : 'off'));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const flashIcon =
    flash === 'on' ? 'bolt.fill' : flash === 'auto' ? 'bolt.badge.a.fill' : 'bolt.slash.fill';

  // ────────────────────────────────────────────────────────────────────────────
  // VISTA: Opciones — mismo estilo que add-photos-prompt
  // ────────────────────────────────────────────────────────────────────────────
  if (view === 'options') {
    return (
      <SafeAreaView
        style={[S.container, { backgroundColor: colors.background }]}
        edges={['top', 'bottom']}
      >
        {/* Botón cerrar — esquina superior derecha */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={[S.closeBtn, { backgroundColor: colors.surface, top: insets.top + 12 }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <IconSymbol name="xmark" size={16} color={colors.foreground} />
        </TouchableOpacity>

        <View style={S.content}>
          {/* Icono central */}
          <View style={[S.iconCircle, { backgroundColor: colors.primary + '18' }]}>
            <IconSymbol name="camera.on.rectangle.fill" size={60} color={colors.primary} />
          </View>

          {/* Título y subtítulo */}
          <Text style={[S.title, { color: colors.foreground }]}>Agregar Foto</Text>
          <Text style={[S.subtitle, { color: colors.muted }]}>
            Toma una foto con la cámara o selecciona una de tu galería
          </Text>

          {/* Botones */}
          <View style={S.buttonContainer}>
            {/* Tomar Foto */}
            <TouchableOpacity
              style={[S.primaryButton, { backgroundColor: colors.primary }]}
              onPress={handleCameraOption}
              disabled={busy}
              activeOpacity={0.85}
            >
              <IconSymbol name="camera.fill" size={20} color="#FFF" />
              <Text style={S.primaryButtonText}>Tomar Foto</Text>
            </TouchableOpacity>

            {/* Seleccionar de Galería */}
            <TouchableOpacity
              style={[S.secondaryButton, { borderColor: colors.border }]}
              onPress={handleGalleryOption}
              disabled={busy}
              activeOpacity={0.7}
            >
              {busy ? (
                <ActivityIndicator size="small" color={colors.muted} />
              ) : (
                <>
                  <IconSymbol name="photo.on.rectangle" size={20} color={colors.foreground} />
                  <Text style={[S.secondaryButtonText, { color: colors.foreground }]}>
                    Seleccionar de Galería
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // VISTA: Cámara
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <View style={[S.flex1, { backgroundColor: '#000' }]}>
      <CameraView
        ref={cameraRef}
        style={S.camera}
        facing={facing}
        flash={flash}
        onCameraReady={() => setCamReady(true)}
      >
        {/* Top Controls */}
        <View style={[S.topControls, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            onPress={() => { setBusy(false); setView('options'); }}
            style={S.iconButton}
          >
            <IconSymbol name="xmark" size={22} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleFlash} style={S.iconButton}>
            <IconSymbol
              name={flashIcon}
              size={22}
              color={flash !== 'off' ? '#FFD60A' : '#FFF'}
            />
          </TouchableOpacity>
        </View>

        {/* Bottom Controls */}
        <View style={[S.bottomControls, { paddingBottom: insets.bottom + 16 }]}>
          <View style={S.controlsRow}>
            {/* Gallery thumbnail */}
            <TouchableOpacity onPress={pickFromCameraView} style={S.galleryButton} disabled={busy}>
              {lastPhoto ? (
                <Image source={{ uri: lastPhoto }} style={S.galleryPreview} />
              ) : (
                <View style={S.galleryPlaceholder}>
                  <IconSymbol name="photo.on.rectangle" size={24} color="#FFF" />
                </View>
              )}
            </TouchableOpacity>

            {/* Shutter */}
            <TouchableOpacity
              onPress={takePicture}
              style={[S.shutterOuter, busy && S.shutterDisabled]}
              disabled={busy || !camReady}
            >
              {busy ? (
                <ActivityIndicator size="large" color="#FFF" />
              ) : (
                <View style={S.shutterInner} />
              )}
            </TouchableOpacity>

            {/* Flip */}
            <TouchableOpacity onPress={toggleFacing} style={S.iconButton} disabled={busy}>
              <IconSymbol name="arrow.triangle.2.circlepath" size={26} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const S = StyleSheet.create({
  flex1: { flex: 1 },

  // ── Options view ─────────────────────────────────────────────────────────────
  container: {
    flex: 1,
  },
  closeBtn: {
    position: 'absolute',
    right: 24,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
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

  // ── Camera view ──────────────────────────────────────────────────────────────
  camera: { flex: 1 },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    zIndex: 10,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 30,
    zIndex: 10,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterDisabled: { opacity: 0.5 },
  shutterInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#FFF',
  },
  galleryButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    overflow: 'hidden',
  },
  galleryPreview: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  galleryPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
