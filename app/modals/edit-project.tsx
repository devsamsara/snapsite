/**
 * modals/edit-project.tsx
 *
 * formSheet modal — Editar datos del proyecto.
 *
 * Campos: nombre, ubicación, estado (selector), fecha inicio, fecha fin
 * Validación: Zod + react-hook-form + AppInput
 *
 * Params recibidos:
 *   - projectId: string
 *   - projectName: string
 *   - projectLocation: string
 *   - projectStatus: string  ("active" | "paused" | "completed" | "cancelled")
 *   - projectStartDate: string
 *   - projectEndDate: string
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

// ─── Status options ───────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "active",    icon: "play-circle-filled",   color: "#10B981" },
  { value: "paused",    icon: "pause-circle-filled",  color: "#F59E0B" },
  { value: "completed", icon: "check-circle",         color: "#2563EB" },
  { value: "cancelled", icon: "cancel",               color: "#EF4444" },
] as const;

type StatusValue = (typeof STATUS_OPTIONS)[number]["value"];

// ─── Zod schema ───────────────────────────────────────────────────────────────

function buildSchema(t: (k: string) => string) {
  const dateRegex = /^(\d{2}\/\d{2}\/\d{4})?$/;
  return z.object({
    name: z
      .string()
      .min(1, t("editProject.errorName"))
      .min(3, t("editProject.errorNameMin"))
      .max(80, t("editProject.errorNameMax")),
    location: z
      .string()
      .min(1, t("editProject.errorLocation")),
    startDate: z
      .string()
      .regex(dateRegex, t("editProject.errorDateFormat"))
      .optional()
      .or(z.literal("")),
    endDate: z
      .string()
      .regex(dateRegex, t("editProject.errorDateFormat"))
      .optional()
      .or(z.literal("")),
  });
}

type FormValues = {
  name: string;
  location: string;
  startDate: string;
  endDate: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function EditProjectModal() {
  const { t }    = useTranslation();
  const router   = useRouter();
  const colors   = useColors();

  const {
    projectId,
    projectName,
    projectLocation,
    projectStatus,
    projectStartDate,
    projectEndDate,
  } = useLocalSearchParams<{
    projectId: string;
    projectName: string;
    projectLocation: string;
    projectStatus: string;
    projectStartDate: string;
    projectEndDate: string;
  }>();

  const [status, setStatus] = useState<StatusValue>(
    (projectStatus as StatusValue) ?? "active"
  );
  const [isSaving, setIsSaving] = useState(false);

  const schema = buildSchema(t);

  const { control, handleSubmit, formState: { errors, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:      projectName      ?? "",
      location:  projectLocation  ?? "",
      startDate: projectStartDate ?? "",
      endDate:   projectEndDate   ?? "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSaving(true);
    try {
      // TODO: call API to update project
      await new Promise((r) => setTimeout(r, 800));
      Alert.alert(t("editProject.successTitle"), t("editProject.successMsg"));
      router.back();
    } catch {
      Alert.alert(t("common.error"), t("common.tryAgain"));
    } finally {
      setIsSaving(false);
    }
  };

  const selectedStatus = STATUS_OPTIONS.find((s) => s.value === status)!;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
    >
      <ModalRoot>
        <ModalHeader
          title={t("editProject.title")}
          subtitle={t("editProject.subtitle")}
          onClose={() => router.back()}
        />

        <ModalBody>
          <ScrollView
            contentContainerStyle={S.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Name ── */}
            <AppInput
              name="name"
              control={control}
              label={t("editProject.name")}
              placeholder={t("editProject.namePlaceholder")}
              autoCapitalize="words"
              returnKeyType="next"
              maxLength={80}
              showLength
            />

            {/* ── Location ── */}
            <AppInput
              name="location"
              control={control}
              label={t("editProject.location")}
              placeholder={t("editProject.locationPlaceholder")}
              autoCapitalize="words"
              returnKeyType="next"
            />

            {/* ── Status selector ── */}
            <View style={S.fieldGroup}>
              <Text style={[S.label, { color: colors.foreground }]}>
                {t("editProject.status")}
              </Text>
              <View style={S.statusRow}>
                {STATUS_OPTIONS.map((opt) => {
                  const active = opt.value === status;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => setStatus(opt.value)}
                      style={[
                        S.statusChip,
                        {
                          backgroundColor: active ? opt.color + "18" : colors.surface,
                          borderColor:     active ? opt.color        : colors.border,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons
                        name={opt.icon as any}
                        size={16}
                        color={active ? opt.color : colors.muted}
                      />
                      <Text
                        style={[
                          S.statusLabel,
                          { color: active ? opt.color : colors.muted },
                        ]}
                      >
                        {t(`editProject.status${opt.value.charAt(0).toUpperCase() + opt.value.slice(1)}`)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* ── Dates ── */}
            <View style={S.dateRow}>
              <View style={{ flex: 1 }}>
                <AppInput
                  name="startDate"
                  control={control}
                  label={t("editProject.startDate")}
                  placeholder={t("editProject.datePlaceholder")}
                  keyboardType="numbers-and-punctuation"
                  returnKeyType="next"
                  maxLength={10}
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppInput
                  name="endDate"
                  control={control}
                  label={t("editProject.endDate")}
                  placeholder={t("editProject.datePlaceholder")}
                  keyboardType="numbers-and-punctuation"
                  returnKeyType="done"
                  maxLength={10}
                />
              </View>
            </View>
          </ScrollView>
        </ModalBody>

        <ModalFooter>
          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            disabled={isSaving || !isDirty}
            style={[
              S.saveBtn,
              {
                backgroundColor:
                  isSaving || !isDirty ? colors.border : colors.primary,
              },
            ]}
            activeOpacity={0.8}
          >
            <Text style={[S.saveBtnText, { color: isSaving || !isDirty ? colors.muted : "#fff" }]}>
              {isSaving ? t("editProject.saving") : t("editProject.save")}
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
  fieldGroup: {
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 4,
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  dateRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
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
