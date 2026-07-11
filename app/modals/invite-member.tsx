/**
 * modals/invite-member.tsx
 *
 * Stack.Screen formSheet — Invitar un nuevo miembro al proyecto.
 *
 * Campos:
 *   - Nombre completo (requerido)
 *   - Email (requerido, validación básica)
 *   - Rol (selector: Jefe de Obra, Arquitecto/a, Electricista, Pintor/a,
 *           Fontanero/a, Inspector, Otro)
 *
 * Patrón idéntico a add-note:
 *   1. project/[id].tsx llama inviteMemberStore.open() + router.push()
 *   2. Este modal llama inviteMemberStore.resolve(data) + router.back()
 *
 * Params recibidos:
 *   - projectId: string
 */
import { PressableScale } from '@/components/ui/pressable-scale';

import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalRoot,
} from '@/components/ui/modal-layout';
import { Button } from '@/components/ui/button';
import { inviteMemberStore } from '@/lib/modal-stores';
import { useColors } from '@/hooks/use-colors';
import { AppInput } from '@/components/ui/app-input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLazyQuery, useQuery } from '@apollo/client/react';
import {
  FindProjectDocument,
  InviteMemberDocument,
  UserRole,
} from '@/gql/graphql';
import { AppAlert } from '@/components/ui/app-alert';
import { useRefetch } from 'expo-router/build/rsc/router/host';

type InviteForm = {
  name: string;
  email: string;
  role: UserRole;
  projectId: string;
};

const ROLE_KEYS = [
  UserRole.Admin,
  UserRole.Root,
  UserRole.User,
  UserRole.Client,
  UserRole.Technician,
  UserRole.Viewer,
];

export default function InviteMemberModal() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams<{ projectId: string }>();

  const [selectedRole, setSelectedRole] = useState('');
  const [roleError, setRoleError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [inviteMember, { loading: isLoading}] =
    useLazyQuery(InviteMemberDocument);
  const { data: project, refetch } = useQuery(FindProjectDocument, {
    variables: {
      findProjectId: params.projectId,
    },
  });

  const inviteSchema = z.object({
    name: z.string().min(2, t('validation.nameRequired')),
    email: z
      .string()
      .min(1, t('validation.required'))
      .email(t('validation.emailInvalid')),
    role: z.enum(ROLE_KEYS),
    projectId: z.string(),
  });

  const { control, handleSubmit } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      name: '',
      email: '',
      role: UserRole.Client,
      projectId: params.projectId,
    },
  });

  const validateEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const handleCancel = () => {
    inviteMemberStore.cancel();
    router.back();
  };

  const onSubmit = async (formData: InviteForm) => {
    let valid = true;

    if (!selectedRole) {
      setRoleError(t('modals.inviteGlobal.selectRole'));
      valid = false;
    }
    if (!valid) return;

    setSubmitting(true);
    try {
      const { error: mutError, } = await inviteMember({
        variables: {
          input: {
            name: formData.name,
            email: formData.email,
            projectId: params.projectId,
            role: selectedRole as UserRole,
          },
        },
      });
      if (mutError) throw mutError;

      await refetch();

      AppAlert.alert(
        t('modals.inviteGlobal.successTitle'),
        t('modals.inviteGlobal.successMessage', {
          email: formData.email,
          project: project?.findProject.name ?? '',
        }),
        [
          {
            text: t('common.ok'),
            style: 'default',
            onPress: () => router.back(),
          },
        ],
        { type: 'success' }
      );
    } catch (err) {
      AppAlert.alert(
        t('modals.inviteGlobal.errorTitle'),
        t('modals.inviteGlobal.errorMessage'),
        [{ text: t('common.ok'), style: 'cancel' }],
        { type: 'error' }
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[S.root]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ModalRoot>
        <ModalHeader
          title={t('modals.inviteMember.title')}
          subtitle={t('modals.inviteMember.subtitle')}
          onClose={handleCancel}
        />
        <ModalBody>
          <AppInput
            label={t('modals.inviteMember.name')}
            name="name"
            control={control}
            placeholder={t('modals.inviteMember.namePlaceholder')}
            icon="person.fill"
            autoCapitalize="words"
            autoCorrect={false}
          />
          <AppInput
            label={t('modals.inviteMember.email')}
            name="email"
            control={control}
            placeholder={t('modals.inviteMember.emailPlaceholder')}
            icon="envelope.fill"
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="done"
            autoCorrect={false}
          />
          <View style={S.rolesGrid}>
            {ROLE_KEYS.map(roleKey => {
              const selected = selectedRole === roleKey;
              return (
                <PressableScale
                  key={roleKey}
                  onPress={() => setSelectedRole(roleKey)}
                  style={[
                    S.roleChip,
                    {
                      backgroundColor: selected
                        ? colors.primary
                        : colors.background,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      S.roleChipText,
                      { color: selected ? '#FFF' : colors.foreground },
                    ]}
                  >
                    {t(`roles.${roleKey}`)}
                  </Text>
                </PressableScale>
              );
            })}
          </View>
          {!!roleError && (
            <Text style={[S.errorText, { color: colors.error }]}>
              {roleError}
            </Text>
          )}

          {/* Nota informativa */}
          <View
            style={[
              S.infoBox,
              {
                backgroundColor: colors.primary + '12',
                borderColor: colors.primary + '30',
              },
            ]}
          >
            <MaterialIcons
              name="info-outline"
              size={16}
              color={colors.primary}
            />
            <Text style={[S.infoText, { color: colors.primary }]}>
              {t('modals.inviteMember.infoText')}
            </Text>
          </View>
        </ModalBody>
        <ModalFooter row>
          <Button
            title={t('common.cancel')}
            onPress={handleCancel}
            variant="ghost"
            size="md"
            style={S.flex1}
          />
          <Button
            title={t('modals.inviteMember.invite')}
            onPress={handleSubmit(onSubmit)}
            variant="primary"
            size="md"
            leftIcon="person-add"
            style={S.flex2}
            isLoading={submitting}
          />
        </ModalFooter>
      </ModalRoot>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  root: { flex: 1 },

  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },

  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },

  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  roleChipText: {
    fontSize: 13,
    fontWeight: '600',
  },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 20,
    marginBottom: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  flex2: { flex: 2 },
  flex1: { flex: 1 },
});
