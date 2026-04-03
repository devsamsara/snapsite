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
 * Layout:
 *   SafeAreaView (edges top) → header fijo con safe area real
 *   View flex:1             → foto ocupa todo el espacio disponible
 *   ModalBody scrollable    → metadatos
 *   ModalFooter             → botón anotar
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
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ModalBody, ModalFooter } from "@/components/ui/modal-layout";
import { Button } from "@/components/ui/button";
import { useColors } from "@/hooks/use-colors";

const { width: W, height: H } = Dimensions.get("window");

// ─── Component ────────────────────────────────────────────────────────────────

export default function PhotoLightboxModal() {
  const router  = useRouter();
  const colors  = useColors();
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

  // Altura de la foto: 55% de la pantalla para dejar espacio a los metadatos
  const photoH = H * 0.55;

  return (
    <View style={S.root}>

      {/* ── Header con safe area real (edges:["top"] respeta Dynamic Island) ── */}
      <SafeAreaView edges={["top"]} style={S.headerSafe}>
        <View style={S.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={S.closeBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MaterialIcons name="close" size={20} color="#FFF" />
          </TouchableOpacity>

          <Text style={S.headerTitle} numberOfLines={1}>
            {params.caption}
          </Text>

          {/* Spacer derecho para centrar el título */}
          <View style={S.closeBtn} pointerEvents="none" />
        </View>
      </SafeAreaView>

      {/* ── Foto ── */}
      <View style={[S.photoContainer, { height: photoH }]}>
        <Image
          source={{ uri: params.url }}
          style={StyleSheet.absoluteFill}
          resizeMode="contain"
        />
      </View>

      {/* ── Metadatos (scrollable) ── */}
      <ModalBody
        scrollable
        style={{ backgroundColor: colors.surface }}
        paddingH={20}
      >
        <Text style={[S.caption, { color: colors.foreground }]}>
          {params.caption}
        </Text>

        <View style={S.dateRow}>
          <MaterialIcons name="access-time" size={13} color={colors.muted} />
          <Text style={[S.date, { color: colors.muted }]}>{params.date}</Text>
        </View>

        {tags.length > 0 && (
          <View style={S.tags}>
            {tags.map((tag) => (
              <View
                key={tag}
                style={[
                  S.tag,
                  { backgroundColor: colors.background, borderColor: colors.border },
                ]}
              >
                <Text style={[S.tagTxt, { color: colors.muted }]}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </ModalBody>

      {/* ── Footer ── */}
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

  // SafeAreaView + header — siempre visible, nunca tapado por la foto
  headerSafe: {
    backgroundColor: "rgba(0,0,0,0.75)",
    zIndex: 10,
  },
  header: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: {
    flex: 1, color: "#FFF",
    fontSize: 15, fontWeight: "600",
    textAlign: "center", marginHorizontal: 8,
  },

  // Foto
  photoContainer: {
    width: W,
    backgroundColor: "#000",
  },

  // Metadatos
  caption: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  dateRow: {
    flexDirection: "row", alignItems: "center",
    gap: 4, marginBottom: 14,
  },
  date: { fontSize: 13 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  tag: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 14, borderWidth: 1,
  },
  tagTxt: { fontSize: 13, fontWeight: "500" },
});
