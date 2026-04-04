/**
 * modals/project-tags.tsx
 *
 * formSheet modal — Gestión de etiquetas del proyecto.
 *
 * Funcionalidades:
 *   - Ver etiquetas actuales como chips con botón de eliminar
 *   - Añadir nueva etiqueta (validación Zod: min 2, max 24, sin duplicados, max 10)
 *   - Sugerencias rápidas de etiquetas comunes
 *   - Guardar cambios
 *
 * Params recibidos:
 *   - projectId: string
 *   - projectName: string
 *   - tags: string  (JSON.stringify de string[])
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
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ModalBody, ModalFooter, ModalHeader, ModalRoot } from "@/components/ui/modal-layout";
import { AppInput } from "@/components/ui/app-input";
import { useColors } from "@/hooks/use-colors";

// ─── Suggestions ──────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  "Construcción", "Renovación", "Diseño", "Arquitectura",
  "Interior", "Exterior", "Urgente", "Cliente VIP",
  "Presupuesto alto", "Residencial", "Comercial", "Industrial",
];

// ─── Zod schema ───────────────────────────────────────────────────────────────

function buildSchema(t: (k: string) => string) {
  return z.object({
    tag: z
      .string()
      .min(2, t("projectTags.errorMin"))
      .max(24, t("projectTags.errorMax")),
  });
}

type FormValues = { tag: string };

// ─── Tag chip colors ──────────────────────────────────────────────────────────

const CHIP_COLORS = [
  "#2563EB", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16",
];

function chipColor(index: number) {
  return CHIP_COLORS[index % CHIP_COLORS.length];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProjectTagsModal() {
  const { t }   = useTranslation();
  const router  = useRouter();
  const colors  = useColors();

  const { projectId, projectName, tags: tagsParam } =
    useLocalSearchParams<{ projectId: string; projectName: string; tags: string }>();

  const [tags, setTags] = useState<string[]>(() => {
    try { return JSON.parse(tagsParam ?? "[]"); }
    catch { return []; }
  });

  const [isSaving, setIsSaving] = useState(false);

  const schema = buildSchema(t);

  const { control, handleSubmit, reset, setError, formState: { errors } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: { tag: "" },
    });

  const addTag = (value: string) => {
    const trimmed = value.trim();
    if (tags.length >= 10) {
      setError("tag", { message: t("projectTags.maxReached") });
      return;
    }
    if (tags.map((t) => t.toLowerCase()).includes(trimmed.toLowerCase())) {
      setError("tag", { message: t("projectTags.duplicate") });
      return;
    }
    setTags((prev) => [...prev, trimmed]);
    reset({ tag: "" });
  };

  const onSubmitAdd = (data: FormValues) => addTag(data.tag);

  const removeTag = (index: number) => {
    setTags((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      // TODO: call API to update tags
      router.back();
    } catch {
      Alert.alert(t("common.error"), t("common.tryAgain"));
    } finally {
      setIsSaving(false);
    }
  };

  const availableSuggestions = SUGGESTIONS.filter(
    (s) => !tags.map((t) => t.toLowerCase()).includes(s.toLowerCase())
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
    >
      <ModalRoot>
        <ModalHeader
          title={t("projectTags.title")}
          subtitle={projectName ?? ""}
          onClose={() => router.back()}
        />

        <ModalBody>
          <ScrollView
            contentContainerStyle={S.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Add tag input ── */}
            <View style={S.addRow}>
              <View style={{ flex: 1 }}>
                <AppInput
                  name="tag"
                  control={control}
                  placeholder={t("projectTags.addPlaceholder")}
                  autoCapitalize="words"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit(onSubmitAdd)}
                  maxLength={24}
                />
              </View>
              <TouchableOpacity
                onPress={handleSubmit(onSubmitAdd)}
                style={[S.addBtn, { backgroundColor: colors.primary }]}
                activeOpacity={0.8}
              >
                <MaterialIcons name="add" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* ── Current tags ── */}
            {tags.length > 0 ? (
              <View style={S.section}>
                <View style={S.chipWrap}>
                  {tags.map((tag, i) => {
                    const color = chipColor(i);
                    return (
                      <View
                        key={`${tag}-${i}`}
                        style={[S.chip, { backgroundColor: color + "18", borderColor: color + "40" }]}
                      >
                        <Text style={[S.chipText, { color }]}>{tag}</Text>
                        <TouchableOpacity
                          onPress={() => removeTag(i)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <MaterialIcons name="close" size={14} color={color} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : (
              <View style={S.emptyBox}>
                <MaterialIcons name="label-off" size={36} color={colors.muted} />
                <Text style={[S.emptyTitle, { color: colors.foreground }]}>
                  {t("projectTags.empty")}
                </Text>
                <Text style={[S.emptyDesc, { color: colors.muted }]}>
                  {t("projectTags.emptyDesc")}
                </Text>
              </View>
            )}

            {/* ── Suggestions ── */}
            {availableSuggestions.length > 0 && (
              <View style={S.section}>
                <Text style={[S.sectionLabel, { color: colors.muted }]}>
                  {t("projectTags.suggestions")}
                </Text>
                <View style={S.chipWrap}>
                  {availableSuggestions.slice(0, 8).map((s, i) => (
                    <TouchableOpacity
                      key={s}
                      onPress={() => addTag(s)}
                      style={[S.suggestionChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="add" size={13} color={colors.muted} />
                      <Text style={[S.suggestionText, { color: colors.muted }]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </ModalBody>

        <ModalFooter>
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            style={[S.saveBtn, { backgroundColor: isSaving ? colors.border : colors.primary }]}
            activeOpacity={0.8}
          >
            <Text style={[S.saveBtnText, { color: isSaving ? colors.muted : "#fff" }]}>
              {isSaving ? t("common.saving") : t("projectTags.save")}
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 16,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: "500",
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: "center",
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
});
