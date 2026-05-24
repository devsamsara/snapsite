/**
 * modals/project-description.tsx
 *
 * formSheet modal — Editar descripción del proyecto.
 *
 * Funcionalidades:
 *   - Textarea multilinea con contador de caracteres
 *   - Validación Zod: max 1000 chars
 *   - Botón guardar deshabilitado si no hay cambios o inválido
 *
 * Params recibidos:
 *   - projectId: string
 *   - projectName: string
 *   - description: string
 */
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { ModalBody, ModalFooter, ModalHeader, ModalRoot } from "@/components/ui/modal-layout";
import { AppInput } from "@/components/ui/app-input";
import { useColors } from "@/hooks/use-colors";
import { AppAlert } from '@/components/ui/app-alert';

// ─── Zod schema ───────────────────────────────────────────────────────────────

function buildSchema(t: (k: string) => string) {
  return z.object({
    description: z
      .string()
      .max(1000, t("projectDescription.errorMax")),
  });
}

type FormValues = { description: string };

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProjectDescriptionModal() {
  const { t }   = useTranslation();
  const router  = useRouter();
  const colors  = useColors();

  const { projectId, projectName, description: descParam } =
    useLocalSearchParams<{ projectId: string; projectName: string; description: string }>();

  const [isSaving, setIsSaving] = useState(false);

  const schema = buildSchema(t);

  const { control, handleSubmit, watch, formState: { isDirty, isValid } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: { description: descParam ?? "" },
      mode: "onChange",
    });

  const currentDesc = watch("description") ?? "";
  const charCount   = currentDesc.length;

  const onSubmit = async (data: FormValues) => {
    setIsSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 700));
      // TODO: call API to update description
      AppAlert.alert(t("projectDescription.successTitle"), t("projectDescription.successMsg"));
      router.back();
    } catch {
      AppAlert.alert(t("common.error"), t("common.tryAgain"));
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = isDirty && isValid && !isSaving;

  return (
    <KeyboardAvoidingView
      style={S.flex1}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
    >
      <ModalRoot>
        <ModalHeader
          title={t("projectDescription.title")}
          subtitle={projectName ?? ""}
          onClose={() => router.back()}
        />

        <ModalBody>
          <ScrollView
            contentContainerStyle={S.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Description textarea ── */}
            <AppInput
              name="description"
              control={control}
              label={t("projectDescription.label")}
              placeholder={t("projectDescription.placeholder")}
              multiline
              numberOfLines={10}
              autoCapitalize="sentences"
              returnKeyType="default"
              maxLength={1000}
              style={S.textarea as any}
            />

            {/* ── Char counter ── */}
            <View style={S.counterRow}>
              <Text
                style={[
                  S.counter,
                  { color: charCount > 900 ? colors.warning : colors.muted },
                ]}
              >
                {charCount} / 1000 {t("projectDescription.chars")}
              </Text>
            </View>
          </ScrollView>
        </ModalBody>

        <ModalFooter>
          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            disabled={!canSave}
            style={[
              S.saveBtn,
              { backgroundColor: canSave ? colors.primary : colors.border },
            ]}
            activeOpacity={0.8}
          >
            <Text style={[S.saveBtnText, { color: canSave ? "#fff" : colors.muted }]}>
              {isSaving ? t("projectDescription.saving") : t("projectDescription.save")}
            </Text>
          </TouchableOpacity>
        </ModalFooter>
      </ModalRoot>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  body: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 4,
  },
  counterRow: {
    alignItems: "flex-end",
    marginTop: -4,
  },
  counter: {
    fontSize: 12,
    fontWeight: "500",
  },
  saveBtn: {
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "700",
  },
  textarea: { minHeight: 180, textAlignVertical: "top" },
  flex1: { flex: 1 },
});
