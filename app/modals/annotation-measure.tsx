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
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { annotationMeasureStore } from "@/lib/modal-stores";
import { ModalHeader, ModalBody, ModalFooter, ModalRoot } from "@/components/ui/modal-layout";
import { Button } from "@/components/ui/button";
import { AppInput } from "@/components/ui/app-input";
import { useColors } from "@/hooks/use-colors";

type FormValues = { label: string };

// ─── Presets ──────────────────────────────────────────────────────────────────
const PRESETS = [
  "0.5 m", "1 m", "1.5 m", "2 m", "2.5 m",
  "3 m", "50 cm", "100 cm", "120 cm", "200 cm",
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function AnnotationMeasureModal() {
  const { t }   = useTranslation();
  const router  = useRouter();
  const colors  = useColors();
  const params  = useLocalSearchParams<{ label?: string; color?: string }>();

  const schema = z.object({
    label: z
      .string()
      .min(1, t('validation.required'))
      .max(30, t('validation.maxLength', { max: 30 })),
  });

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
          title={t('annotation.measure.title')}
          subtitle={t('annotation.measure.subtitle')}
          onClose={handleCancel}
        />

        {/* ── Body ── */}
        <ModalBody>
          {/* Input con validación */}
          <AppInput
            name="label"
            control={control}
            label={t('annotation.measure.label')}
            placeholder={t('annotation.measure.placeholder')}
            icon="ruler"
            autoFocus
            selectTextOnFocus
            returnKeyType="done"
            maxLength={30}
            onSubmitEditing={handleSubmit(onConfirm)}
          />

          {/* Presets */}
          <Text style={[S.sectionLabel, { color: colors.muted }]}>{t('annotation.measure.presets')}</Text>
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
          <Button title={t('common.cancel')}  onPress={handleCancel}              variant="secondary" size="md" />
          <Button
            title={t('common.confirm')}
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
