/**
 * add-photo-modal.tsx
 *
 * Flujo simplificado — stack mínimo:
 *   project/[id]  →  image-editor  (fullScreenModal)
 *
 * Este archivo ya NO es el flujo principal. El project/[id] navega directamente
 * al image-editor, que tiene sus propios modos picker/camera/editor.
 *
 * Este modal se mantiene como fallback para otros flujos que aún lo referencien
 * (add-photos-prompt, create-project-location, etc.).
 *
 * Vistas internas:
 *   "options"  → pantalla inicial: elegir entre Cámara o Galería
 *   "camera"   → CameraView a pantalla completa
 */

import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { CameraView, useCameraPermissions, FlashMode } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { AppAlert } from "@/components/ui/app-alert";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type ModalView = "options" | "camera";

export default function AddPhotoModal() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { projectId } = useLocalSearchParams<{ projectId?: string }>();

  const [view, setView] = useState<ModalView>("options");
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [isReady, setIsReady] = useState(false);
  const [lastPhoto, setLastPhoto] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();

  // ── Navegar al editor con la foto capturada ──────────────────────────────────
  const goToEditor = (imageUri: string) => {
    router.replace({
      pathname: "/image-editor",
      params: { imageUri, projectId },
    });
  };

  // ── Opción: Cámara ───────────────────────────────────────────────────────────
  const handleCameraOption = async () => {
    // Si el permiso aún no se ha determinado, esperar
    if (!permission) return;

    if (!permission.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        AppAlert.alert(
          "Permiso requerido",
          "Necesitamos acceso a la cámara para tomar fotos.",
        );
        return;
      }
    }
    setView("camera");
  };

  // ── Opción: Galería ──────────────────────────────────────────────────────────
  const handleGalleryOption = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      AppAlert.alert(
        "Permiso requerido",
        "Necesitamos acceso a tu galería para seleccionar fotos.",
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets?.[0]) {
        goToEditor(result.assets[0].uri);
      }
    } catch (error) {
      console.error("[AddPhotoModal] Gallery error:", error);
      AppAlert.alert("Error", "No se pudo abrir la galería.");
    }
  };

  // ── Cámara: tomar foto ───────────────────────────────────────────────────────
  const takePicture = async () => {
    if (!cameraRef.current || !isReady) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        base64: false,
        exif: true,
      });
      if (photo) {
        setLastPhoto(photo.uri);
        goToEditor(photo.uri);
      }
    } catch {
      AppAlert.alert("Error", "No se pudo capturar la foto. Inténtalo de nuevo.");
    }
  };

  // ── Cámara: abrir galería desde la cámara ────────────────────────────────────
  const pickFromCameraView = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets?.[0]) {
      goToEditor(result.assets[0].uri);
    }
  };

  const toggleFacing = () => {
    setFacing((c) => (c === "back" ? "front" : "back"));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleFlash = () => {
    setFlash((c) => {
      if (c === "off") return "on";
      if (c === "on") return "auto";
      return "off";
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const flashIcon =
    flash === "on"
      ? "bolt.fill"
      : flash === "auto"
        ? "bolt.badge.a.fill"
        : "bolt.slash.fill";

  // ────────────────────────────────────────────────────────────────────────────
  // VISTA: Opciones (pantalla inicial del modal)
  // ────────────────────────────────────────────────────────────────────────────
  if (view === "options") {
    return (
      <View style={[S.flex1, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[S.header, { paddingTop: insets.top + 16 }]}>
          <Text style={[S.title, { color: colors.foreground }]}>
            {t("addPhoto.title", "Agregar Foto")}
          </Text>
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
            style={[
              S.optionCard,
              S.optionCardMargin,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View
              style={[
                S.optionIcon,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <IconSymbol name="camera.fill" size={28} color={colors.primary} />
            </View>
            <View style={S.flex1}>
              <Text style={[S.optionTitle, { color: colors.foreground }]}>
                {t("addPhoto.takePhoto", "Tomar Foto")}
              </Text>
              <Text style={[S.optionDesc, { color: colors.muted }]}>
                {t("addPhoto.takePhotoDesc", "Usa la cámara para capturar una nueva foto")}
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.muted} />
          </TouchableOpacity>

          {/* Gallery */}
          <TouchableOpacity
            onPress={handleGalleryOption}
            style={[
              S.optionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View
              style={[
                S.optionIcon,
                { backgroundColor: "#34C75920" },
              ]}
            >
              <IconSymbol
                name="photo.on.rectangle"
                size={28}
                color="#34C759"
              />
            </View>
            <View style={S.flex1}>
              <Text style={[S.optionTitle, { color: colors.foreground }]}>
                {t("addPhoto.selectGallery", "Seleccionar de Galería")}
              </Text>
              <Text style={[S.optionDesc, { color: colors.muted }]}>
                {t("addPhoto.selectGalleryDesc", "Elige una foto de tu biblioteca")}
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.muted} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // VISTA: Cámara (pantalla completa dentro del modal)
  // view === "camera" — todos los checks de permiso van AQUÍ, no antes
  // ────────────────────────────────────────────────────────────────────────────

  // Permiso aún cargando
  if (!permission) {
    return <View style={[S.flex1, { backgroundColor: "#000" }]} />;
  }

  // Permiso denegado — mostrar pantalla de solicitud
  if (!permission.granted) {
    return (
      <View style={[S.flex1, S.center, { backgroundColor: "#000" }]}>
        <Text style={S.permissionMsg}>
          Necesitamos permiso para usar la cámara
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={S.permissionButton}
        >
          <Text style={S.permissionButtonText}>Conceder Permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Cámara activa
  return (
    <View style={[S.flex1, { backgroundColor: "#000" }]}>
      <CameraView
        ref={cameraRef}
        style={S.camera}
        facing={facing}
        flash={flash}
        onCameraReady={() => setIsReady(true)}
      >
        {/* Top Controls */}
        <View style={[S.topControls, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            onPress={() => setView("options")}
            style={S.iconButton}
          >
            <IconSymbol name="xmark" size={22} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleFlash} style={S.iconButton}>
            <IconSymbol
              name={flashIcon}
              size={22}
              color={flash !== "off" ? "#FFD60A" : "#FFF"}
            />
          </TouchableOpacity>
        </View>

        {/* Bottom Controls */}
        <View style={[S.bottomControls, { paddingBottom: insets.bottom + 16 }]}>
          <View style={S.controlsRow}>
            {/* Gallery thumbnail */}
            <TouchableOpacity
              onPress={pickFromCameraView}
              style={S.galleryButton}
            >
              {lastPhoto ? (
                <Image
                  source={{ uri: lastPhoto }}
                  style={S.galleryPreview}
                />
              ) : (
                <View style={S.galleryPlaceholder}>
                  <IconSymbol
                    name="photo.on.rectangle"
                    size={24}
                    color="#FFF"
                  />
                </View>
              )}
            </TouchableOpacity>

            {/* Shutter */}
            <TouchableOpacity onPress={takePicture} style={S.shutterOuter}>
              <View style={S.shutterInner} />
            </TouchableOpacity>

            {/* Flip */}
            <TouchableOpacity onPress={toggleFacing} style={S.iconButton}>
              <IconSymbol
                name="arrow.triangle.2.circlepath"
                size={26}
                color="#FFF"
              />
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const S = StyleSheet.create({
  flex1: { flex: 1 },
  center: { justifyContent: "center", alignItems: "center", padding: 20 },
  // ── Options view ────────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 20, fontWeight: "700" },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  optionsWrapper: { paddingHorizontal: 24, paddingTop: 40 },
  optionCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  optionCardMargin: { marginBottom: 16 },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  optionTitle: { fontSize: 17, fontWeight: "600", marginBottom: 4 },
  optionDesc: { fontSize: 14 },
  // ── Camera view ─────────────────────────────────────────────────────────────
  camera: { flex: 1 },
  topControls: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 25,
    zIndex: 10,
  },
  bottomControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 30,
    zIndex: 10,
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  shutterOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  shutterInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "#FFF",
  },
  galleryButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  galleryPreview: { width: "100%", height: "100%" },
  galleryPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  // ── Permission screen ────────────────────────────────────────────────────────
  permissionMsg: {
    color: "#FFF",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  permissionButtonText: { color: "#FFF", fontWeight: "bold", fontSize: 15 },
});
