/**
 * modals/add-note.tsx
 *
 * Stack.Screen modal (formSheet) — agregar una nota al proyecto.
 * Devuelve el resultado via addNoteStore.
 */

import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalRoot,
} from '@/components/ui/modal-layout';
import { Button } from '@/components/ui/button';
import { useColors } from '@/hooks/use-colors';
import { AppInput } from '@/components/ui/app-input';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@apollo/client/react';
import {
  CreateNoteDocument,
  FindProjectDocument,
  GetMyProjectsDocument,
} from '@/gql/graphql';

type FormValues = { note: string };

export default function AddNoteModal() {
  const { t } = useTranslation();
  const router = useRouter();
  const { projectId } = useLocalSearchParams<{ projectId?: string }>();
  const [createNote, { data, loading }] = useMutation(CreateNoteDocument);
  const [text, setText] = useState('');

  const schema = z.object({
    note: z.string().min(1, t('validation.required')),
  });

  const { control, handleSubmit, getValues } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { note: '' },
  });

  const handleSave = async (formData: any) => {
    if (!formData.note.trim()) return;

    await createNote({
      variables: {
        input: {
          content: text,
          projectId: projectId!,
          pinned: false,
        },
      },
      refetchQueries: [FindProjectDocument, GetMyProjectsDocument],
    });
    router.back();
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
          title={t('modals.addNote.title')}
          subtitle={t('modals.addNote.subtitle')}
          onClose={handleCancel}
        />

        <ModalBody style={S.modalBody}>
          <AppInput
            name="note"
            control={control}
            label={t('modals.addNote.label')}
            placeholder={t('modals.addNote.placeholder')}
            autoCapitalize="none"
            multiline
            autoFocus
            onChange={()=>setText(getValues('note'))}
            maxLength={450}
            textAlignVertical="top"
            numberOfLines={6}
            style={S.input}
            showLength
          />
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
              title={t('modals.addNote.save')}
              onPress={handleSubmit(handleSave)}
              variant="primary"
              size="md"
              leftIcon="check"
              disabled={!getValues('note').trim()}
              isLoading={loading}
            />
          </View>
        </ModalFooter>
      </ModalRoot>
    </KeyboardAvoidingView>
  );
}

const S = StyleSheet.create({
  flex1: { flex: 1 },
  modalBody: { flex: 1, height: 140 * 1.7 },
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
