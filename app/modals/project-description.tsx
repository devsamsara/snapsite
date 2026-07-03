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
import { Button } from '@/components/ui/button';
import { FindProjectDocument, UpdateProjectDocument } from '@/gql/graphql';
import { useMutation } from '@apollo/client/react';

// ─── Zod schema ───────────────────────────────────────────────────────────────

function buildSchema(t: (k: string) => string) {
  return z.object({
    description: z
      .string()
      .min(10, t('projectDescription.errorMin'))
      .max(1000, t('projectDescription.errorMax')),
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
  const [text, setText] = useState('');
  const [updateProject, { data, loading, }] = useMutation(UpdateProjectDocument,{refetchQueries: [FindProjectDocument]});
  const schema = buildSchema(t);

  const { control, handleSubmit, watch, formState: { isDirty, isValid }, getValues } =
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
      await updateProject({
        variables: {
          id: projectId,
          input: {
            name: projectName,
            description: data.description,

          },
        },
      });

      AppAlert.alert(t("projectDescription.successTitle"), t("projectDescription.successMsg"));
      router.back();
    } catch {
      AppAlert.alert(t("common.error"), t("common.tryAgain"));
    } finally {
      setIsSaving(false);
    }
  };
  const handleCancel = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={S.flex1}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ModalRoot>
        <ModalHeader
          title={t('projectDescription.title')}
          subtitle={projectName ?? ''}
          onClose={() => router.back()}
        />

        <ModalBody style={S.modalBody}>
          <ScrollView
            contentContainerStyle={S.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Description textarea ── */}
            <AppInput
              name="description"
              control={control}
              label={t('projectDescription.label')}
              placeholder={t('projectDescription.placeholder')}
              multiline
              autoCapitalize="sentences"
              returnKeyType="default"
              maxLength={1000}
              autoFocus
              onChange={() => setText(getValues('description'))}
              textAlignVertical="top"
              numberOfLines={6}
              style={S.input}
              showLength
            />

            {/* ── Char counter ── */}
            <View style={S.counter}>
              <Text
                style={[
                  S.counter,
                  { color: charCount > 900 ? colors.warning : colors.muted },
                ]}
              >
                {charCount} / 1000 {t('projectDescription.chars')}
              </Text>
            </View>
          </ScrollView>
        </ModalBody>

        <ModalFooter row>
          <View style={S.flex1}>
            <Button
              title={t('common.cancel')}
              onPress={handleCancel}
              variant="secondary"
              size="md"
            />
          </View>
          <View style={S.flex1}>
            <Button
              title={
                isSaving
                  ? t('projectDescription.saving')
                  : t('projectDescription.save')
              }
              onPress={handleSubmit(onSubmit)}
              variant="primary"
              size="md"
              leftIcon="check"
              disabled={!getValues('description').trim()}
              isLoading={loading}
            />
          </View>
        </ModalFooter>
      </ModalRoot>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  flex1: { flex: 1 },
  body: {
    paddingTop: 8,
    paddingBottom: 24,
    gap: 16,
  },
  modalBody: { flex: 1, height: 140 * 1.7 },
  textarea: {
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 140,
    textAlignVertical: 'top',
  },
  input: {
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 140,
    textAlignVertical: 'top',
  },
  counter: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: 6,
  },
});
