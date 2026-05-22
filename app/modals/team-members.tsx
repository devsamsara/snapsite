/**
 * app/modals/team-members.tsx
 *
 * Modal que muestra todos los usuarios de los proyectos
 * en los que está incluido el usuario actual.
 * Se abre al tocar los avatares del header de la vista principal.
 */
import React, { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/hooks/use-colors';
import { useCardStyle } from '@/hooks/use-card-style';
import {
  ModalBody,
  ModalHeader,
  ModalRoot,
} from '@/components/ui/modal-layout';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SearchInput } from '@/components/ui/search-input';
import { useQuery } from '@apollo/client/react';
import { CompanyMember, MemberProject, MembersDocument } from '@/gql/graphql'; // ── Mocks ────────────────────────────────────────────────────────────────────

// ── Mocks ────────────────────────────────────────────────────────────────────
const COLORS: string[] = [
  '#3B82F6',
  '#3B82F6',
  '#10B981',
  '#10B981',
  '#8B5CF6',
  '#8B5CF6',
  '#F59E0B',
  '#F59E0B',
  '#F59E0B',
  '#EF4444',
  '#EF4444',
  '#3B82F6',
];

type Member = CompanyMember;
// ─────────────────────────────────────────────────────────────────────────────

export default function TeamMembersModal() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const card = useCardStyle();
  const [search, setSearch] = useState('');
  const { data, loading, error } = useQuery(MembersDocument);

  const filtered = data?.getCompanyMembers.members.filter(
    m =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.role.toLowerCase().includes(search.toLowerCase()) ||
      m.projects.some((project: MemberProject) =>
        project.name.toLowerCase().includes(search.toLowerCase())
      )
  );

  const renderMember = ({ item, index }: { item: Member; index: number }) => (
    <View
      style={[
        S.memberRow,
        index < data!.getCompanyMembers.members.length - 1 && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
      ]}
    >
      {/* Avatar */}
      <View
        style={[
          S.avatar,
          {
            backgroundColor: '#3B82F6' + '25',
            borderColor: '#3B82F6' + '50',
          },
        ]}
      >
        <Text style={[S.avatarText, { color: 'blue' }]}>{item.name.at(0)}</Text>
        {item.isOnline && (
          <View
            style={[
              S.onlineDot,
              { backgroundColor: colors.success, borderColor: colors.surface },
            ]}
          />
        )}
      </View>

      {/* Info */}
      <View style={S.memberInfo}>
        <Text style={[S.memberName, { color: colors.foreground }]}>
          {item.name}
        </Text>
        <Text style={[S.memberRole, { color: colors.muted }]}>{item.role}</Text>
        {item.projects.map((project: MemberProject, index: number) => (
          <View key={project.id} style={S.projectTag}>
            <View style={[S.projectDot, { backgroundColor: COLORS[index] }]} />
            <Text
              style={[S.projectName, { color: colors.muted }]}
              numberOfLines={1}
            >
              {project.name}
            </Text>
          </View>
        ))}
      </View>

      {/* Estado */}
      <View
        style={[
          S.statusBadge,
          {
            backgroundColor: item.isOnline
              ? colors.success + '15'
              : colors.border + '60',
          },
        ]}
      >
        <Text
          style={[
            S.statusText,
            { color: item.isOnline ? colors.success : colors.muted },
          ]}
        >
          {item.isOnline ? t('team.online') : t('team.offline')}
        </Text>
      </View>
    </View>
  );

  return (
    data && (
      <KeyboardAvoidingView
        style={S.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ModalRoot>
          <ModalHeader
            title={t('team.title')}
            subtitle={`${data.getCompanyMembers.onlineCount} ${t('team.online')} · ${data.getCompanyMembers.members.length} ${t('team.membersTotal')}`}
            onClose={() => router.back()}
          />

          {/* Stats rápidas */}
          <View
            style={[S.statsRow, { paddingHorizontal: 16, paddingBottom: 12 }]}
          >
            <View
              style={[S.statChip, { backgroundColor: colors.success + '15' }]}
            >
              <View style={[S.statDot, { backgroundColor: colors.success }]} />
              <Text style={[S.statText, { color: colors.success }]}>
                {data.getCompanyMembers.onlineCount} {t('team.online')}
              </Text>
            </View>
            <View
              style={[S.statChip, { backgroundColor: colors.border + '60' }]}
            >
              <MaterialIcons
                name="people-outline"
                size={13}
                color={colors.muted}
              />
              <Text style={[S.statText, { color: colors.muted }]}>
                {data.getCompanyMembers.members.length} {t('team.total')}
              </Text>
            </View>
            <View
              style={[S.statChip, { backgroundColor: colors.primary + '15' }]}
            >
              <MaterialIcons
                name="folder-open"
                size={13}
                color={colors.primary}
              />
              <Text style={[S.statText, { color: colors.primary }]}>
                {data.getCompanyMembers.totalProjects} {t('team.projects')}
              </Text>
            </View>
          </View>

          {/* Buscador */}
          <View style={[{ marginHorizontal: 20, marginBottom: 12 }]}>
            <SearchInput
              placeholder={t('team.searchPlaceholder')}
              value={search}
              onChangeText={setSearch}
              style={S.mb16}
            />
          </View>

          <ModalBody scrollable={false}>
            <FlatList
              data={filtered}
              keyExtractor={item => item.id}
              renderItem={renderMember}
              contentContainerStyle={[
                S.listContent,
                card,
                { borderRadius: 16, overflow: 'hidden' },
              ]}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={S.emptyWrap}>
                  <MaterialIcons
                    name="people-outline"
                    size={40}
                    color={colors.muted}
                  />
                  <Text style={[S.emptyText, { color: colors.muted }]}>
                    {t('team.noMembers')}
                  </Text>
                </View>
              }
            />
          </ModalBody>
        </ModalRoot>
      </KeyboardAvoidingView>
    )
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },
  // Stats
  statsRow: { flexDirection: 'row', gap: 8 },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statDot: { width: 7, height: 7, borderRadius: 4 },
  statText: { fontSize: 12, fontWeight: '600' },
  // Buscador
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14 },
  // Lista
  listContent: { paddingBottom: 16 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 12,
  },
  // Avatar
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarText: { fontSize: 15, fontWeight: '700' },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
  },
  // Info
  memberInfo: { flex: 1, gap: 2 },
  memberName: { fontSize: 14, fontWeight: '600' },
  memberRole: { fontSize: 12 },
  projectTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  projectDot: { width: 7, height: 7, borderRadius: 4 },
  projectName: { fontSize: 11, flex: 1 },
  // Status
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '600' },
  // Empty
  emptyWrap: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 14 },
  flex1: { flex: 1 },
  mb16: { marginBottom: 16 },
});
