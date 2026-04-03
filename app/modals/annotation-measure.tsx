/**
 * modals/annotation-measure.tsx
 *
 * Stack.Screen modal (formSheet) — personalizar la etiqueta de una medición.
 * Devuelve el resultado via annotationMeasureStore.
 *
 * Validación: Zod + react-hook-form
 */
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { annotationMeasureStore } from "@/lib/modal-stores";
import { ModalHeader, ModalBody, ModalFooter, ModalRoot } from "@/components/ui/modal-layout";
import { Button } from "@/components/ui/button";
import { AppInput } from "@/components/ui/app-input";
import { useColors } from "@/hooks/use-colors";

// ─── Schema ───────────────────────────────────────────────────────────────────
const schema = z.object({
  label: z
    .string()
    .min(1, "La etiqueta no puede estar vacía")
    .max(30, "Máximo 30 caracteres"),
});
type FormValues = z.infer<typeof schema>;

// ─── Presets ──────────────────────────────────────────────────────────────────
const PRESETS = [
  "0.5 m", "1 m", "1.5 m", "2 m", "2.5 m",
  "3 m", "50 cm", "100 cm", "120 cm", "200 cm",
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function AnnotationMeasureModal() {
  const router  = useRouter();
  const colors  = useColors();
  const params  = useLocalSearchParams<{ label?: string; color?: string }>();

  const { control, handleSubmit, setValue, watch, formState: { isValid } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { label: params.label ?? "" },
    mode: "onChange",
  });

  const currentLabel = watch("label");

  const onConfirm = (data: FormValues) => {
    annotationMeasureStore.resolve({ label: data.label.trim() });
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
          {/* Input con validación */}
          <AppInput
            name="label"
            control={control}
            label="Medida"
            placeholder="Ej: 2.5 m"
            icon="ruler"
            autoFocus
            selectTextOnFocus
            returnKeyType="done"
            maxLength={30}
            onSubmitEditing={handleSubmit(onConfirm)}
          />

          {/* Presets */}
          <Text style={[S.sectionLabel, { color: colors.muted }]}>Valores rápidos</Text>
          <View style={S.presets}>
            {PRESETS.map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setValue("label", p, { shouldValidate: true })}
                style={[
                  S.preset,
                  { backgroundColor: colors.background, borderColor: colors.border },
                  currentLabel === p && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
              >
                <Text style={[
                  S.presetTxt,
                  { color: colors.muted },
                  currentLabel === p && { color: "#FFF" },
                ]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ModalBody>

        {/* ── Footer ── */}
        <ModalFooter row>
          <Button title="Cancelar"  onPress={handleCancel}              variant="secondary" size="md" />
          <Button
            title="Confirmar"
            onPress={handleSubmit(onConfirm)}
            variant="primary"
            size="md"
            leftIcon="check"
            disabled={!isValid}
          />
        </ModalFooter>
      </ModalRoot>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
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
