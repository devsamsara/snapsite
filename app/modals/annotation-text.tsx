/**
 * modals/annotation-text.tsx
 *
 * Stack.Screen modal (formSheet) — agregar/editar una anotación de texto.
 * Devuelve el resultado via annotationTextStore.
 *
 * Validación: Zod + react-hook-form
 */
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
import { annotationTextStore } from "@/lib/modal-stores";
import { ModalHeader, ModalBody, ModalFooter, ModalRoot } from "@/components/ui/modal-layout";
import { Button } from "@/components/ui/button";
import { AppInput } from "@/components/ui/app-input";
import { useColors } from "@/hooks/use-colors";

type FormValues = { text: string };

// ─── Constantes ───────────────────────────────────────────────────────────────
const PALETTE = [
  "#FFFFFF", "#000000", "#FF3B30", "#FF9500", "#FFCC00",
  "#34C759", "#00C7BE", "#007AFF", "#5856D6", "#FF2D55",
  "#AF52DE", "#A2845E",
];
const FONTSIZES = [14, 18, 22, 28, 36, 48];

// ─── Component ────────────────────────────────────────────────────────────────
export default function AnnotationTextModal() {
  const { t }   = useTranslation();
  const router  = useRouter();
  const colors  = useColors();
  const params  = useLocalSearchParams<{
    color?: string; fontSize?: string; x?: string; y?: string;
  }>();

  const [color,    setColor]    = useState(params.color ?? "#FFFFFF");
  const [fontSize, setFontSize] = useState(Number(params.fontSize ?? 22));

  const schema = z.object({
    text: z
      .string()
      .min(1, t('validation.required'))
      .max(200, t('validation.maxLength', { max: 200 })),
  });

  const { control, handleSubmit, watch, formState: { isValid } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { text: "" },
    mode: "onChange",
  });

  const textValue = watch("text");

  const onConfirm = (data: FormValues) => {
    annotationTextStore.resolve({
      text: data.text.trim(), color, fontSize,
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
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ModalRoot>
        {/* ── Header ── */}
        <ModalHeader
          title={t('annotation.text.title')}
          subtitle={t('annotation.text.subtitle')}
          onClose={handleCancel}
        />

        <ModalBody>
          <ScrollView
            style={S.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
            overScrollMode="never"
          >
            {/* Vista previa */}
            <View style={[S.preview, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[S.previewTxt, { color, fontSize }]} numberOfLines={3}>
                {textValue?.trim() || t('annotation.text.preview')}
              </Text>
            </View>

            {/* Input con validación */}
            <AppInput
              name="text"
              control={control}
              label={t('annotation.text.label')}
              placeholder={t('annotation.text.placeholder')}
              autoFocus
              multiline
              maxLength={200}
              showLength
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Paleta de color */}
            <Text style={[S.label, { color: colors.muted }]}>{t('annotation.text.color')}</Text>
            <View style={S.paletteWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
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
            </View>

            {/* Selector de tamaño */}
            <Text style={[S.label, { color: colors.muted }]}>{t('annotation.text.size')}</Text>
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
          </ScrollView>
        </ModalBody>

        {/* ── Footer ── */}
        <ModalFooter row>
          <View style={{ flex: 1 }}>
            <Button title={t('common.cancel')} onPress={handleCancel} variant="secondary" size="md" />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              title={t('common.add')}
              onPress={handleSubmit(onConfirm)}
              variant="primary"
              size="md"
              leftIcon="check"
              disabled={!isValid}
            />
          </View>
        </ModalFooter>
      </ModalRoot>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  scroll: { flex: 1 },
  preview: {
    borderRadius: 12, borderWidth: 1,
    minHeight: 64, justifyContent: "center", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 8,
  },
  previewTxt: { fontWeight: "700", textAlign: "center" },
  label: {
    fontSize: 12, fontWeight: "600",
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8,
  },
  paletteWrapper: { marginBottom: 16, overflow: "visible" },
  paletteContent: {
    gap: 12, paddingHorizontal: 2,
    paddingVertical: 6, alignItems: "center",
  },
  dot: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 2, borderColor: "transparent",
  },
  dotActive: { transform: [{ scale: 1.2 }] },
  sizeRow: { flexDirection: "row", gap: 8, marginBottom: 8, flexWrap: "wrap" },
  sizeBtn: {
    flex: 1, minWidth: 44, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1, alignItems: "center",
  },
  sizeTxt: { fontSize: 14, fontWeight: "600" },
});
