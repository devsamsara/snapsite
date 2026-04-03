/**
 * modals/annotation-measure.tsx
 *
 * Stack.Screen modal (formSheet) — personalizar la etiqueta de una medición.
 * Devuelve el resultado via annotationMeasureStore.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { annotationMeasureStore } from "@/lib/modal-stores";
import { ModalHeader, ModalBody, ModalFooter, ModalRoot } from "@/components/ui/modal-layout";
import { Button } from "@/components/ui/button";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

// ─── Presets ──────────────────────────────────────────────────────────────────

const PRESETS = ["0.5 m", "1 m", "1.5 m", "2 m", "2.5 m", "3 m", "50 cm", "100 cm", "120 cm", "200 cm"];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AnnotationMeasureModal() {
  const router  = useRouter();
  const colors  = useColors();
  const params  = useLocalSearchParams<{ label?: string; color?: string }>();

  const [label, setLabel] = useState(params.label ?? "");

  const handleConfirm = () => {
    annotationMeasureStore.resolve({ label: label.trim() || (params.label ?? "") });
    router.back();
  };

  const handleCancel = () => {
    annotationMeasureStore.cancel();
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
          title="Etiqueta de Medida"
          subtitle='Personaliza la etiqueta (ej: "2.5 m", "120 cm")'
          onClose={handleCancel}
        />

        {/* ── Body ── */}
        <ModalBody>

          {/* Input con icono */}
          <View style={[S.inputRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <MaterialIcons name="straighten" size={20} color={colors.muted} style={S.inputIcon} />
            <TextInput
              value={label}
              onChangeText={setLabel}
              placeholder="Ej: 2.5 m"
              placeholderTextColor={colors.muted}
              style={[S.input, { color: colors.foreground }]}
              autoFocus
              selectTextOnFocus
              returnKeyType="done"
              onSubmitEditing={handleConfirm}
            />
          </View>

          {/* Presets */}
          <Text style={[S.sectionLabel, { color: colors.muted }]}>Valores rápidos</Text>
          <View style={S.presets}>
            {PRESETS.map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setLabel(p)}
                style={[
                  S.preset,
                  { backgroundColor: colors.background, borderColor: colors.border },
                  label === p && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
              >
                <Text style={[
                  S.presetTxt,
                  { color: colors.muted },
                  label === p && { color: "#FFF" },
                ]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

        </ModalBody>

        {/* ── Footer ── */}
        <ModalFooter row>
          <Button title="Cancelar"  onPress={handleCancel}  variant="secondary" size="md" />
          <Button title="Confirmar" onPress={handleConfirm} variant="primary"   size="md" leftIcon="check" />
        </ModalFooter>

      </ModalRoot>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  inputRow: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, marginBottom: 24,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 18, fontWeight: "600", paddingVertical: 14 },
  sectionLabel: {
    fontSize: 12, fontWeight: "600",
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12,
  },
  presets: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  preset: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
  },
  presetTxt: { fontSize: 14, fontWeight: "500" },
});
