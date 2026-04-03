/**
 * modals/photo-lightbox.tsx
 *
 * Stack.Screen modal (fullScreenModal, fade) — visualizar una foto del
 * proyecto con sus metadatos y acceso al editor de anotaciones.
 *
 * Params recibidos:
 *   - url: string
 *   - caption: string
 *   - date: string
 *   - tags: string  (JSON array)
 *   - projectId: string
 *
 * Nota: modal fullscreen — el header es flotante sobre la foto (no Stack header).
 * Usa ModalBody/ModalFooter para la sección de metadatos.
 */

import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ModalBody, ModalFooter } from "@/components/ui/modal-layout";
import { Button } from "@/components/ui/button";
import { useColors } from "@/hooks/use-colors";

const { width: W } = Dimensions.get("window");

// ─── Component ────────────────────────────────────────────────────────────────

export default function PhotoLightboxModal() {
  const router  = useRouter();
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const params  = useLocalSearchParams<{
    url: string; caption: string; date: string; tags: string; projectId: string;
  }>();

  const tags: string[] = (() => {
    try { return JSON.parse(params.tags ?? "[]"); } catch { return []; }
  })();

  const handleAnnotate = () => {
    router.replace({
      pathname: "/image-editor",
      params: { imageUri: params.url, projectId: params.projectId },
    });
  };

  return (
    <View style={S.root}>

      {/* ── Floating header sobre la foto ── */}
      <View style={[S.floatingHeader, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={S.closeBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <MaterialIcons name="close" size={20} color="#FFF" />
        </TouchableOpacity>
        <Text style={S.headerTitle} numberOfLines={1}>{params.caption}</Text>
        {/* Spacer para centrar el título */}
        <View style={S.closeBtn} pointerEvents="none" />
      </View>

      {/* ── Foto ── */}
      <Image
        source={{ uri: params.url }}
        style={S.photo}
        resizeMode="contain"
      />

      {/* ── Metadatos ── */}
      <ModalBody
        scrollable
        style={{ backgroundColor: colors.surface }}
        paddingH={20}
      >
        <Text style={[S.caption, { color: colors.foreground }]}>{params.caption}</Text>

        <View style={S.dateRow}>
          <MaterialIcons name="access-time" size={13} color={colors.muted} />
          <Text style={[S.date, { color: colors.muted }]}>{params.date}</Text>
        </View>

        {tags.length > 0 && (
          <View style={S.tags}>
            {tags.map((tag) => (
              <View
                key={tag}
                style={[S.tag, { backgroundColor: colors.background, borderColor: colors.border }]}
              >
                <Text style={[S.tagTxt, { color: colors.muted }]}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </ModalBody>

      {/* ── Footer con botón de anotación ── */}
      <ModalFooter style={{ backgroundColor: colors.surface }}>
        <Button
          title="Anotar Foto"
          onPress={handleAnnotate}
          variant="primary"
          size="lg"
          leftIcon="edit"
        />
      </ModalFooter>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },

  floatingHeader: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: "rgba(0,0,0,0.50)",
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: {
    flex: 1, color: "#FFF", fontSize: 15, fontWeight: "600",
    textAlign: "center", marginHorizontal: 8,
  },

  photo: { width: W, height: W * 0.75, marginTop: 80 },

  caption: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 14 },
  date: { fontSize: 13 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, borderWidth: 1 },
  tagTxt: { fontSize: 13, fontWeight: "500" },
});
