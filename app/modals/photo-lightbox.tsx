/**
 * modals/photo-lightbox.tsx
 *
 * Stack.Screen modal (fullScreenModal, fade).
 *
 * Layout (de arriba a abajo, sin solapamientos):
 *
 *   ┌─────────────────────────────────┐  ← insets.top (Dynamic Island / notch)
 *   │  HEADER (44pt, fondo oscuro)    │
 *   ├─────────────────────────────────┤
 *   │  FOTO  (flex:1, contain)        │
 *   ├─────────────────────────────────┤
 *   │  METADATOS (ScrollView, ~35%)   │
 *   ├─────────────────────────────────┤
 *   │  FOOTER (botón anotar)          │
 *   └─────────────────────────────────┘  ← insets.bottom
 *
 * Buenas prácticas aplicadas:
 * - useSafeAreaInsets() directo (no SafeAreaView) para control preciso
 *   del paddingTop del header — funciona correctamente en fullScreenModal
 * - Header en flujo normal (no position:absolute) → nunca tapado por la foto
 * - Foto con flex:1 entre header y metadatos → ocupa exactamente el espacio
 *   disponible sin desbordarse
 * - ModalFooter con safe area bottom automática
 */

import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Button } from "@/components/ui/button";
import { useColors } from "@/hooks/use-colors";

// ─── Component ────────────────────────────────────────────────────────────────

export default function PhotoLightboxModal() {
  const { t } = useTranslation();
  const router  = useRouter();
  const colors  = useColors();
  const insets  = useSafeAreaInsets();

  const params = useLocalSearchParams<{
    url: string;
    caption: string;
    date: string;
    tags: string;
    projectId: string;
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

      {/*
        ── HEADER ──
        paddingTop = insets.top garantiza que el contenido del header
        empiece justo debajo del Dynamic Island / notch, sin hardcoding.
        El header está en el flujo normal (no absolute) → la foto
        empieza siempre debajo de él.
      */}
      <View style={[S.header, { paddingTop: insets.top }]}>
        <View style={S.headerInner}>
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

          {/* Spacer derecho para centrar el título visualmente */}
          <View style={S.closeBtn} pointerEvents="none" />
        </View>
      </View>

      {/*
        ── FOTO ──
        flex:1 hace que la foto ocupe todo el espacio disponible entre
        el header y la sección de metadatos, sin desbordarse.
      */}
      <View style={S.photoArea}>
        <Image
          source={{ uri: params.url }}
          style={StyleSheet.absoluteFill}
          resizeMode="contain"
        />
      </View>

      {/*
        ── METADATOS ──
        Altura fija (~35% de la pantalla) con scroll interno.
        Fondo del tema para separar visualmente de la foto.
      */}
      <View style={[S.metaContainer, { backgroundColor: colors.surface }]}>
        <ScrollView
          contentContainerStyle={S.metaContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
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
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[S.tagTxt, { color: colors.muted }]}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      {/*
        ── FOOTER ──
        paddingBottom = insets.bottom garantiza que el botón no quede
        detrás del home indicator de iPhone.
      */}
      <View
        style={[
          S.footer,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 16) + 8,
          },
        ]}
      >
        <Button
          title={t('lightbox.annotate')}
          onPress={handleAnnotate}
          variant="primary"
          size="lg"
          leftIcon="edit"
        />
      </View>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },

  // Header — en flujo normal, nunca tapado
  header: {
    backgroundColor: "rgba(0,0,0,0.85)",
    zIndex: 1,
  },
  headerInner: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    marginHorizontal: 8,
  },

  // Foto — ocupa todo el espacio disponible entre header y metadatos
  photoArea: {
    flex: 1,
    backgroundColor: "#000",
  },

  // Metadatos — altura fija, scroll interno
  metaContainer: {
    maxHeight: 200,
  },
  metaContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },

  caption: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
  },
  date: { fontSize: 13 },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  tagTxt: { fontSize: 13, fontWeight: "500" },

  // Footer
  footer: {
    paddingTop: 14,
    paddingHorizontal: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
