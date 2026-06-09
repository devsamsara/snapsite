/**
 * add-photo-modal.tsx
 *
 * Flujo:
 *   project/[id]  →push→  add-photo-modal  →replace→  image-editor  →back→  project/[id]
 *
 * Vistas internas (sin navegación entre rutas):
 *   "options"  → pantalla inicial: elegir entre Cámara o Galería
 *   "camera"   → CameraView a pantalla completa (reemplaza el modal visualmente)
 *
 * Al obtener una foto (cámara o galería):
 *   router.replace('/image-editor', { imageUri, projectId })
 *   → el add-photo-modal desaparece del stack (replace lo elimina)
 *   → el image-editor arranca directamente en modo editor
 *
 * Al guardar/cancelar en el image-editor:
 *   router.back() → vuelve al project/[id] limpiamente
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
  // router.replace elimina add-photo-modal del stack → image-editor queda solo
  // → router.back() desde el editor vuelve directamente al project/[id]
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
        AppAlert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para seleccionar fotos.');
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

    // Gestionar permiso antes de mostrar la cámara
    if (!permission) {
      // Hook aún cargando — pedir permiso directamente
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

    // Permiso concedido → mostrar cámara
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
  // VISTA: Opciones
  // ────────────────────────────────────────────────────────────────────────────
  if (view === 'options') {
    return (
      <View style={[S.flex1, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[S.header, { paddingTop: insets.top + 16 }]}>
          <Text style={[S.title, { color: colors.foreground }]}>Agregar Foto</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[S.closeBtn, { backgroundColor: colors.surface }]}
          >
            <IconSymbol name="xmark" size={16} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Options */}
        <View style={S.optionsWrapper}>
          {/* Camera */}
          <TouchableOpacity
            onPress={handleCameraOption}
            disabled={busy}
            style={[
              S.optionCard,
              S.optionCardMargin,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={[S.optionIcon, { backgroundColor: colors.primary + '20' }]}>
              <IconSymbol name="camera.fill" size={28} color={colors.primary} />
            </View>
            <View style={S.flex1}>
              <Text style={[S.optionTitle, { color: colors.foreground }]}>Tomar Foto</Text>
              <Text style={[S.optionDesc, { color: colors.muted }]}>
                Usa la cámara para capturar una nueva foto
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.muted} />
          </TouchableOpacity>

          {/* Gallery */}
          <TouchableOpacity
            onPress={handleGalleryOption}
            disabled={busy}
            style={[
              S.optionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={[S.optionIcon, { backgroundColor: '#34C75920' }]}>
              <IconSymbol name="photo.on.rectangle" size={28} color="#34C759" />
            </View>
            <View style={S.flex1}>
              <Text style={[S.optionTitle, { color: colors.foreground }]}>
                Seleccionar de Galería
              </Text>
              <Text style={[S.optionDesc, { color: colors.muted }]}>
                Elige una foto de tu biblioteca
              </Text>
            </View>
            {busy ? (
              <ActivityIndicator size="small" color={colors.muted} />
            ) : (
              <IconSymbol name="chevron.right" size={20} color={colors.muted} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // VISTA: Cámara
  // Todos los checks de permiso están en handleCameraOption, no aquí.
  // Si llegamos aquí, el permiso ya está concedido.
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
  // ── Options ─────────────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 20, fontWeight: '700' },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsWrapper: { paddingHorizontal: 24, paddingTop: 40 },
  optionCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionCardMargin: { marginBottom: 16 },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionTitle: { fontSize: 17, fontWeight: '600', marginBottom: 4 },
  optionDesc: { fontSize: 14 },
  // ── Camera ──────────────────────────────────────────────────────────────────
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
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryPreview: { width: '100%', height: '100%' },
  galleryPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
