/**
 * modals/annotation-text.tsx
 *
 * Stack.Screen modal (formSheet) — agregar una anotación de texto al editor.
 * Devuelve el resultado via annotationTextStore.
 *
 * Fix: paleta de colores contenida correctamente (paddingVertical en
 * contentContainerStyle para que el scale(1.2) del dot activo no quede recortado).
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { annotationTextStore } from "@/lib/modal-stores";
import { ModalHeader, ModalBody, ModalFooter, ModalRoot } from "@/components/ui/modal-layout";
import { Button } from "@/components/ui/button";
import { useColors } from "@/hooks/use-colors";

// ─── Constants ────────────────────────────────────────────────────────────────

const PALETTE = [
  "#FFFFFF", "#000000", "#FF3B30", "#FF9500", "#FFCC00",
  "#34C759", "#00C7BE", "#007AFF", "#5856D6", "#FF2D55",
  "#AF52DE", "#A2845E",
];
const FONTSIZES = [14, 18, 22, 28, 36, 48];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AnnotationTextModal() {
  const router  = useRouter();
  const colors  = useColors();
  const params  = useLocalSearchParams<{
    color?: string; fontSize?: string; x?: string; y?: string;
  }>();

  const [text,     setText]     = useState("");
  const [color,    setColor]    = useState(params.color ?? "#FFFFFF");
  const [fontSize, setFontSize] = useState(Number(params.fontSize ?? 22));

  const handleConfirm = () => {
    if (!text.trim()) { router.back(); return; }
    annotationTextStore.resolve({
      text: text.trim(), color, fontSize,
      x: Number(params.x ?? 0), y: Number(params.y ?? 0),
    });
    router.back();
  };

  const handleCancel = () => {
    annotationTextStore.cancel();
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ModalRoot>

        {/* ── Header ── */}
        <ModalHeader
          title="Agregar Texto"
          subtitle="Luego puedes arrastrarlo y escalarlo con dos dedos."
          onClose={handleCancel}
        />

        {/* ── Body ── */}
        <ModalBody scrollable>

          {/* Preview */}
          <View style={[S.preview, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[S.previewTxt, { color, fontSize }]} numberOfLines={3}>
              {text || "Vista previa…"}
            </Text>
          </View>

          {/* Input */}
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Escribe aquí..."
            placeholderTextColor={colors.muted}
            style={[S.input, {
              color: colors.foreground,
              backgroundColor: colors.background,
              borderColor: colors.border,
            }]}
            autoFocus
            multiline
            maxLength={200}
          />
          <Text style={[S.counter, { color: colors.muted }]}>{text.length}/200</Text>

          {/* ── Color palette ── */}
          <Text style={[S.label, { color: colors.muted }]}>Color</Text>
          {/*
            FIX: paddingVertical: 6 en contentContainerStyle da espacio para que
            el transform scale(1.2) del dot seleccionado no quede recortado por
            el overflow del ScrollView.
          */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={S.paletteScroll}
            contentContainerStyle={S.paletteContent}
          >
            {PALETTE.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setColor(c)}
                style={[
                  S.dot,
                  { backgroundColor: c },
                  c === "#FFFFFF" && { borderColor: "rgba(0,0,0,0.18)" },
                  color === c && [S.dotActive, { borderColor: colors.primary }],
                ]}
              />
            ))}
          </ScrollView>

          {/* ── Font size ── */}
          <Text style={[S.label, { color: colors.muted }]}>Tamaño</Text>
          <View style={S.sizeRow}>
            {FONTSIZES.map((fs) => (
              <TouchableOpacity
                key={fs}
                onPress={() => setFontSize(fs)}
                style={[
                  S.sizeBtn,
                  { backgroundColor: colors.background, borderColor: colors.border },
                  fontSize === fs && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
              >
                <Text style={[
                  S.sizeTxt,
                  { color: colors.muted },
                  fontSize === fs && { color: "#FFF" },
                ]}>
                  {fs}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

        </ModalBody>

        {/* ── Footer ── */}
        <ModalFooter row>
          <Button title="Cancelar" onPress={handleCancel} variant="secondary" size="md" />
          <Button
            title="Agregar"
            onPress={handleConfirm}
            variant="primary"
            size="md"
            leftIcon="check"
            disabled={!text.trim()}
          />
        </ModalFooter>

      </ModalRoot>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  preview: {
    borderRadius: 12, borderWidth: 1,
    minHeight: 64, justifyContent: "center", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 16,
  },
  previewTxt: { fontWeight: "700", textAlign: "center" },
  input: {
    borderRadius: 12, borderWidth: 1,
    padding: 14, fontSize: 16, minHeight: 88, textAlignVertical: "top",
  },
  counter: { fontSize: 11, textAlign: "right", marginTop: 6, marginBottom: 20 },
  label: {
    fontSize: 12, fontWeight: "600",
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12,
  },
  paletteScroll: { marginBottom: 20 },
  paletteContent: { gap: 12, paddingHorizontal: 2, paddingVertical: 6, alignItems: "center" },
  dot: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: "transparent" },
  dotActive: { transform: [{ scale: 1.2 }] },
  sizeRow: { flexDirection: "row", gap: 8, marginBottom: 24, flexWrap: "wrap" },
  sizeBtn: {
    flex: 1, minWidth: 44, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1, alignItems: "center",
  },
  sizeTxt: { fontSize: 14, fontWeight: "600" },
});
