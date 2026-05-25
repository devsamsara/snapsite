/**
 * app/modals/invite-global.tsx
 *
 * Modal para invitar a un miembro desde la vista principal.
 * A diferencia de invite-member (que recibe el projectId ya fijado),
 * este modal incluye un selector de proyecto.
 *
 * Validación: Zod + react-hook-form
 * Componentes: AppInput, SearchInput (sistema de diseño)
 */
import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useColors } from '@/hooks/use-colors';
import { useCardStyle } from '@/hooks/use-card-style';
import {
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalRoot,
} from '@/components/ui/modal-layout';
import { Button } from '@/components/ui/button';
import { AppInput } from '@/components/ui/app-input';
import { SearchInput } from '@/components/ui/search-input';
import { IconSymbol } from '@/components/ui/icon-symbol';
import {
  GetMyProjectsDocument,
  InviteMemberDocument,
  UserRole,
} from '@/gql/graphql';
import { useLazyQuery, useQuery } from '@apollo/client/react';
import { InviteGlobalSkeleton } from '@/components/invite-global-skeleton';
import { AppAlert } from '@/components/ui/app-alert';
import { GraphQLError } from '@/components/ui/graphql-error';

type InviteForm = {
  name: string;
  email: string;
  role: UserRole;
  projectId: string;
};

// Los valores de los roles se resuelven en runtime con t('roles.<key>')
// para que cambien automáticamente según el idioma activo.
const ROLE_KEYS = [
  UserRole.Admin,
  UserRole.Root,
  UserRole.User,
  UserRole.Client,
  UserRole.Technician,
  UserRole.Viewer,
];

export default function InviteGlobalModal() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const cardElevation = useCardStyle();

  const [projectSearch, setProjectSearch] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectError, setProjectError] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [roleError, setRoleError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data, loading: dataLoading, error, refetch } = useQuery(GetMyProjectsDocument);
  const [inviteMember, { loading: isLoading }] = useLazyQuery(InviteMemberDocument)

  const inviteSchema = z.object({
    name: z.string().min(2, t('validation.nameRequired')),
    email: z
      .string()
      .min(1, t('validation.required'))
      .email(t('validation.emailInvalid')),
    role: z.nativeEnum(UserRole).optional(),
    projectId: z.string().optional(),
  });

  const { control, handleSubmit } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      name: '',
      email: '',
      role: UserRole.Client,
      projectId: '',
    },
  });

  // ── Proyectos: usa los datos reales del backend, con fallback a lista vacía ──
  const allProjects = data?.getMyProjects ?? [];

  const filteredProjects = useMemo(
    () =>
      allProjects.filter(
        p =>
          p.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
          p.location.toLowerCase().includes(projectSearch.toLowerCase())
      ),
    [allProjects, projectSearch]
  );

  // selectedProject busca en la misma fuente que se usa para renderizar
  const selectedProject = allProjects.find(p => p.id === selectedProjectId) ?? null;

  const onSubmit = async (formData: InviteForm) => {
    // Validación manual de los campos fuera de react-hook-form
    let valid = true;
    if (!selectedProjectId) {
      setProjectError(t('modals.inviteGlobal.selectProject'));
      valid = false;
    }
    if (!selectedRole) {
      setRoleError(t('modals.inviteGlobal.selectRole'));
      valid = false;
    }
    if (!valid) return;

    setSubmitting(true);
    try {
      const { error: mutError } = await inviteMember({
        variables: {
          input: {
            name: formData.name,
            email: formData.email,
            projectId: selectedProjectId!,
            role: selectedRole as UserRole,
          },
        },
      });
      if (mutError) throw mutError;

      AppAlert.alert(
        t('modals.inviteGlobal.successTitle'),
        t('modals.inviteGlobal.successMessage', {
          email: formData.email,
          project: selectedProject?.name ?? '',
        }),
        [{ text: t('common.ok'), style: 'default', onPress: () => router.back() }],
        { type: 'success' },
      );
    } catch (err) {
      AppAlert.alert(
        t('modals.inviteGlobal.errorTitle'),
        t('modals.inviteGlobal.errorMessage'),
        [{ text: t('common.ok'), style: 'cancel' }],
        { type: 'error' },
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getColorByProgress = (progress: number): string => {
    const COLOR_RANGES = [
      { max: 25, color: '#EF4444' },
      { max: 60, color: '#F59E0B' },
      { max: 85, color: '#3B82F6' },
      { max: 100, color: '#10B981' },
    ];
    return COLOR_RANGES.find(r => progress <= r.max)?.color ?? '#9CA3AF';
  };

  // ── Estados de carga y error ──────────────────────────────────────────────────
  if (dataLoading) return <InviteGlobalSkeleton />;

  if (error) {
    return (
      <ModalRoot>
        <ModalHeader
          title={t('modals.inviteGlobal.title')}
          onClose={() => router.back()}
        />
        <ModalBody>
          <GraphQLError variant="compact" onRetry={() => refetch()} />
        </ModalBody>
      </ModalRoot>
    );
  }

  // ── Render principal ──────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={S.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
    >
      <ModalRoot>
        <ModalHeader
          title={t('modals.inviteGlobal.title')}
          subtitle={t('modals.inviteGlobal.subtitle')}
          onClose={() => router.back()}
        />

        <ModalBody>
          {/* ── Selector de proyecto ── */}
          <Text style={[S.sectionLabel, { color: colors.foreground }]}>
            {t('modals.inviteGlobal.project')}
          </Text>

          <SearchInput
            placeholder={t('modals.inviteGlobal.searchProject')}
            value={projectSearch}
            onChangeText={setProjectSearch}
          />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={S.scrollContent}
          >
            <View style={[S.projectList, cardElevation, S.projectListMargin]}>
              {filteredProjects.length === 0 ? (
                <Text style={[S.emptyText, { color: colors.muted }]}>
                  {t('common.noResults')}
                </Text>
              ) : (
                filteredProjects.map((p, idx) => {
                  const isSelected = selectedProjectId === p.id;
                  const isLast = idx === filteredProjects.length - 1;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => {
                        setSelectedProjectId(p.id);
                        setProjectError('');
                      }}
                      style={[
                        S.projectRow,
                        {
                          backgroundColor: isSelected
                            ? colors.primary + '12'
                            : 'transparent',
                          borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
                          borderBottomColor: colors.border,
                        },
                      ]}
                    >
                      <View
                        style={[
                          S.projectDot,
                          { backgroundColor: getColorByProgress(p.progress) },
                        ]}
                      />
                      <View style={S.projectInfo}>
                        <Text style={[S.projectName, { color: colors.foreground }]}>
                          {p.name}
                        </Text>
                        <Text style={[S.projectLoc, { color: colors.muted }]}>
                          {p.location}
                        </Text>
                      </View>
                      {/* Progress bar */}
                      <View style={S.progressWrap}>
                        <View style={[S.progressBg, { backgroundColor: colors.border }]}>
                          <View
                            style={[
                              S.progressFill,
                              {
                                width: `${p.progress}%` as any,
                                backgroundColor: getColorByProgress(p.progress),
                              },
                            ]}
                          />
                        </View>
                        <Text style={[S.progressPct, { color: colors.muted }]}>
                          {p.progress}%
                        </Text>
                      </View>
                      {isSelected && (
                        <IconSymbol
                          name="checkmark.circle.fill"
                          size={20}
                          color={colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            {!!projectError && (
              <Text style={[S.errorText, { color: colors.error }]}>
                {projectError}
              </Text>
            )}

            {/* ── Datos del invitado ── */}
            <Text
              style={[S.sectionLabel, { color: colors.foreground, marginTop: 24 }]}
            >
              {t('modals.inviteGlobal.guestData')}
            </Text>

            <AppInput
              label={t('modals.inviteMember.name')}
              name="name"
              control={control}
              icon="person.fill"
              placeholder={t('modals.inviteMember.namePlaceholder')}
              returnKeyType="next"
              autoCapitalize="words"
            />

            <AppInput
              label={t('modals.inviteMember.email')}
              name="email"
              control={control}
              icon="envelope.fill"
              placeholder={t('modals.inviteMember.emailPlaceholder')}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="done"
            />

            {/* ── Rol ── */}
            <Text style={[S.sectionLabel, { color: colors.foreground }]}>
              {t('modals.inviteGlobal.role')}
            </Text>
            <View style={S.roles}>
              {ROLE_KEYS.map(roleKey => {
                const active = selectedRole === roleKey;
                return (
                  <TouchableOpacity
                    key={roleKey}
                    onPress={() => {
                      setSelectedRole(roleKey);
                      setRoleError('');
                    }}
                    style={[
                      S.roleChip,
                      {
                        backgroundColor: active ? colors.primary : colors.surface,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        S.roleText,
                        { color: active ? '#FFF' : colors.foreground },
                      ]}
                    >
                      {t(`roles.${roleKey}`)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {!!roleError && (
              <Text style={[S.errorText, { color: colors.error }]}>
                {roleError}
              </Text>
            )}

            {/* ── Info box: datos del proyecto seleccionado ── */}
            {selectedProject && (
              <View
                style={[
                  S.infoBox,
                  {
                    backgroundColor: colors.primary + '10',
                    borderColor: colors.primary + '30',
                  },
                ]}
              >
                <IconSymbol
                  name="info.circle.fill"
                  size={16}
                  color={colors.primary}
                />
                <View style={S.infoContent}>
                  <Text style={[S.infoText, { color: colors.primary }]}>
                    {t('modals.inviteGlobal.infoText', {
                      project: selectedProject.name,
                    })}
                  </Text>
                  <Text style={[S.infoSubText, { color: colors.primary + 'CC' }]}>
                    {t('modals.inviteGlobal.selectedProjectProgress', {
                      progress: selectedProject.progress,
                    })}
                    {'  ·  '}
                    {selectedProject.location}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        </ModalBody>

        <ModalFooter row>
          <Button
            title={t('common.cancel')}
            variant="ghost"
            onPress={() => router.back()}
            fullWidth={false}
            style={S.btn}
          />
          <Button
            title={t('modals.inviteGlobal.send')}
            variant="primary"
            onPress={handleSubmit(onSubmit)}
            isLoading={submitting}
            fullWidth={false}
            style={S.btn}
          />
        </ModalFooter>
      </ModalRoot>
    </KeyboardAvoidingView>
  );
}

const S = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Lista proyectos
  projectList: { borderRadius: 14, overflow: 'hidden', marginBottom: 4 },
  projectListMargin: { marginTop: 10 },
  projectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 12,
  },
  projectDot: { width: 10, height: 10, borderRadius: 5 },
  projectInfo: { flex: 1 },
  projectName: { fontSize: 14, fontWeight: '600' },
  projectLoc: { fontSize: 12, marginTop: 1 },
  progressWrap: { alignItems: 'flex-end', gap: 3 },
  progressBg: { width: 56, height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  progressPct: { fontSize: 11 },
  emptyText: { textAlign: 'center', paddingVertical: 20, fontSize: 14 },
  errorText: { fontSize: 12, marginTop: 4, marginLeft: 4, marginBottom: 4 },
  // Roles
  roles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  roleText: { fontSize: 13, fontWeight: '500' },
  // Info box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  infoContent: { flex: 1, gap: 3 },
  infoText: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  infoSubText: { fontSize: 12, lineHeight: 16 },
  // Footer
  btn: { flex: 1 },
});
