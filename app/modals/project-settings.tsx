
import React, { useEffect, useState } from 'react';
import { PressableScale } from '@/components/ui/pressable-scale';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ModalBody, ModalHeader, ModalRoot } from "@/components/ui/modal-layout";
import { useColors } from "@/hooks/use-colors";
import { AppAlert } from '@/components/ui/app-alert';
import { useMutation, useQuery } from '@apollo/client/react';
import {
  ArchiveProjectDocument,
  DeleteProjectDocument,
  FindProjectDocument,
  GetMyProjectsDocument,
  Project,
  ProjectStatus,
} from '@/gql/graphql';

// ─── ActionItem sub-component ─────────────────────────────────────────────────

interface ActionRow {
  icon: string;
  label: string;
  description?: string;
  onPress: () => void;
  color?: string;
  showChevron?: boolean;
  loading?: boolean;
}

function ActionItem({
  icon,
  label,
  description,
  onPress,
  color,
  showChevron = true,
  loading = false,
}: Readonly<ActionRow>) {
  const colors = useColors();
  return (
    <PressableScale
      onPress={onPress}
      style={[S.actionRow, { borderBottomColor: colors.border }]}
      disabled={loading}
    >
      <View
        style={[
          S.actionIcon,
          { backgroundColor: (color ?? colors.primary) + '18' },
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={color ?? colors.primary} />
        ) : (
          <MaterialIcons
            name={icon as any}
            size={20}
            color={color ?? colors.primary}
          />
        )}
      </View>
      <View style={S.actionText}>
        <Text style={[S.actionLabel, { color: color ?? colors.foreground }]}>
          {label}
        </Text>
        {!!description && (
          <Text style={[S.actionDesc, { color: colors.muted }]}>
            {description}
          </Text>
        )}
      </View>
      {showChevron && !loading && (
        <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
      )}
    </PressableScale>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProjectSettingsModal() {
  const { t }    = useTranslation();
  const router   = useRouter();
  const colors   = useColors();

  const { projectId } = useLocalSearchParams<{ projectId: string }>();

  const [project, setProject] = useState<Project | undefined>(undefined);

  const { data } = useQuery(FindProjectDocument, {
    variables: { findProjectId: projectId },
  });

  useEffect(() => {
    if (data) {
      setProject(data.findProject as Project);
    }
  }, [data]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const [deleteProject, { loading: deleting }] = useMutation(DeleteProjectDocument, {
    refetchQueries: [{ query: GetMyProjectsDocument }],
    awaitRefetchQueries: true,
  });

  const [archiveProject, { loading: archiving }] = useMutation(ArchiveProjectDocument, {
    refetchQueries: [{ query: GetMyProjectsDocument }],
    awaitRefetchQueries: true,
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleEdit = () => {
    if (project)
      router.push({
        pathname: '/modals/edit-project',
        params: {
          projectId,
          projectName: project.name,
          projectLocation: project.location,
          projectLatitude: project.latitude ?? '',
          projectLongitude: project.longitude ?? '',
          projectStatus: project.status ?? 'active',
          projectStartDate: project.startDate ?? '',
          projectEndDate: project.endDate ?? '',
          projectProgress: project.progress ?? 0,
        },
      });
  };

  const handleShare = () => {
    router.push({
      pathname: "/modals/project-share",
      params: { projectId, projectName: project?.name },
    });
  };

  const handleExport = () => {
    router.push({
      pathname: '/modals/project-export',
      params: { projectId, projectName: project?.name, projectLocation: project?.location },
    });
  };

  const handleContacts = () => {
    router.push({
      pathname: '/modals/project-contacts',
      params: { projectId, projectName: project?.name },
    });
  };

  const handleTags = () => {
    router.push({
      pathname: '/modals/project-tags',
      params: {
        projectId,
        projectName: project?.name,
        tags: project?.tags ?? [],
      },
    });
  };

  const handleDescription = () => {
    router.push({
      pathname: "/modals/project-description",
      params: {
        projectId,
        projectName: project?.name,
        description: project?.description ?? "",
      },
    });
  };

  const handleCollaborators = () => {
    router.push({
      pathname: '/modals/invite-member',
      params: { projectId, projectName: project?.name },
    });
  };

  const handleArchive = () => {
    // Si ya está archivado, mostrar opción de restaurar
    const isArchived = project?.status === ProjectStatus.Archived;

    if (isArchived) {
      AppAlert.alert(
        t("projectSettings.restoreTitle", { defaultValue: "Restaurar proyecto" }),
        t("projectSettings.restoreMsg", { defaultValue: "El proyecto volverá a estar activo." }),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("projectSettings.restoreBtn", { defaultValue: "Restaurar" }),
            style: "default",
            onPress: async () => {
              try {
                const { error: errors } = await archiveProject({
                  variables: {
                    id: projectId,
                    input: { status: ProjectStatus.Active },
                  },
                });
              } catch (err: any) {
                AppAlert.alert(
                  t("common.error", { defaultValue: "Error" }),
                  err?.message ?? t("common.unexpectedError", { defaultValue: "Ha ocurrido un error inesperado." })
                );
              }
            },
          },
        ]
      );
      return;
    }

    AppAlert.alert(
      t("projectSettings.archiveTitle"),
      t("projectSettings.archiveMsg"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("projectSettings.archiveBtn"),
          style: "default",
          onPress: async () => {
            try {
              const { error: errors } = await archiveProject({
                variables: {
                  id: projectId,
                  input: { status: ProjectStatus.Archived },
                },
              });
              if (errors) throw new Error(errors.message);
              // Cerrar el modal de settings y volver al listado de proyectos
              router.dismiss();
              router.replace('/(tabs)/projects');
            } catch (err: any) {
              AppAlert.alert(
                t("common.error", { defaultValue: "Error" }),
                err?.message ?? t("common.unexpectedError", { defaultValue: "Ha ocurrido un error inesperado." })
              );
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    AppAlert.alert(
      t('projectSettings.deleteTitle'),
      t('projectSettings.deleteMsg', { name: project?.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const { error: errors } = await deleteProject({
                variables: { id: projectId },
              });
              if (errors) throw new Error(errors?.message);
              // Cerrar el modal de settings y volver al listado de proyectos
              router.dismiss();
              router.replace('/(tabs)/projects');
            } catch (err: any) {
              AppAlert.alert(
                t("common.error", { defaultValue: "Error" }),
                err?.message ?? t("common.unexpectedError", { defaultValue: "Ha ocurrido un error inesperado." })
              );
            }
          },
        },
      ]
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const isArchived = project?.status === ProjectStatus.Archived;

  return (
    <KeyboardAvoidingView
      style={S.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
    >
      <ModalRoot>
        <ModalHeader
          title={t("projectSettings.title")}
          subtitle={project?.name ?? t("projectSettings.defaultProject")}
          onClose={() => router.back()}
        />

        <ModalBody>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={S.scrollContent}
          >
            {/* ── Project info card ── */}
            <View
              style={[
                S.infoBox,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View
                style={[
                  S.infoIcon,
                  { backgroundColor: colors.primary + "18" },
                ]}
              >
                <MaterialIcons name="folder" size={22} color={colors.primary} />
              </View>
              <View style={S.flex1}>
                <Text
                  style={[S.infoName, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {project?.name ?? t("projectSettings.defaultProject")}
                </Text>
                {!!project?.location && (
                  <View style={S.locationRow}>
                    <MaterialIcons
                      name="location-on"
                      size={12}
                      color={colors.muted}
                    />
                    <Text
                      style={[S.infoLoc, { color: colors.muted }]}
                      numberOfLines={1}
                    >
                      {project?.location}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* ── Archived notice ── */}
            {isArchived && (
              <View style={[S.archivedNotice, { backgroundColor: '#7C5C1E20', borderColor: '#B8860B' }]}>
                <MaterialIcons name="lock" size={16} color="#B8860B" style={{ marginRight: 8 }} />
                <Text style={[S.archivedNoticeText, { color: '#B8860B' }]}>
                  {t('project.archivedBannerDesc')}
                </Text>
              </View>
            )}

            {/* ── Actions section — oculto si archivado ── */}
            {!isArchived && (
              <>
            <Text style={[S.sectionTitle, { color: colors.muted }]}>
              {t("projectSettings.sectionActions")}
            </Text>
            <View
              style={[
                S.section,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <ActionItem
                icon="edit"
                label={t("projectSettings.editProject")}
                description={t("projectSettings.editProjectDesc")}
                onPress={handleEdit}
              />
              <ActionItem
                icon="share"
                label={t("projectSettings.share")}
                description={t("projectSettings.shareDesc")}
                onPress={handleShare}
              />
              <ActionItem
                icon="picture-as-pdf"
                label={t("projectSettings.export")}
                description={t("projectSettings.exportDesc")}
                onPress={handleExport}
                showChevron={false}
              />
            </View>

            {/* ── Manage section ── */}
            <Text style={[S.sectionTitle, { color: colors.muted }]}>
              {t("projectSettings.sectionManage")}
            </Text>
            <View
              style={[
                S.section,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <ActionItem
                icon="label"
                label={t("projectSettings.tags")}
                description={t("projectSettings.tagsDesc")}
                onPress={handleTags}
              />
              <ActionItem
                icon="description"
                label={t("projectSettings.description")}
                description={t("projectSettings.descriptionDesc")}
                onPress={handleDescription}
              />
              <ActionItem
                icon="group-add"
                label={t("projectSettings.collaborators")}
                description={t("projectSettings.collaboratorsDesc")}
                onPress={handleCollaborators}
              />
            </View>
              </>
            )}

            {/* ── Danger zone ── */}
            <Text style={[S.sectionTitle, { color: colors.muted }]}>
              {t("projectSettings.sectionDanger")}
            </Text>
            <View
              style={[
                S.section,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <ActionItem
                icon={isArchived ? "unarchive" : "archive"}
                label={
                  isArchived
                    ? t("projectSettings.restore", { defaultValue: "Restaurar proyecto" })
                    : t("projectSettings.archive")
                }
                description={
                  isArchived
                    ? t("projectSettings.restoreDesc", { defaultValue: "Volver a activar el proyecto" })
                    : t("projectSettings.archiveDesc")
                }
                onPress={handleArchive}
                color={colors.warning}
                showChevron={false}
                loading={archiving}
              />
              <ActionItem
                icon="delete-forever"
                label={t("projectSettings.delete")}
                description={t("projectSettings.deleteDesc")}
                onPress={handleDelete}
                color={colors.error}
                showChevron={false}
                loading={deleting}
              />
            </View>
          </ScrollView>
        </ModalBody>
      </ModalRoot>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  root: { flex: 1 },

  scrollContent: {
    paddingBottom: 32,
  },

  flex1: { flex: 1 },

  archivedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 12,
    marginBottom: 4,
  },
  archivedNoticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },

  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  infoName: {
    fontSize: 15,
    fontWeight: "700",
  },
  infoLoc: {
    fontSize: 12,
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginTop: 20,
    marginBottom: 6,
  },

  section: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { flex: 1 },
  actionLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  actionDesc: {
    fontSize: 12,
    marginTop: 1,
  },
});
