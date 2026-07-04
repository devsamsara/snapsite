/**
 * app/modals/project-picker.tsx
 *
 * Modal selector de proyectos. Se abre desde el image-editor cuando
 * el usuario llega sin un projectId (ej: desde el FAB del inicio).
 * Al seleccionar un proyecto, resuelve el projectPickerStore y vuelve
 * al editor para que continúe el guardado.
 */
import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/hooks/use-colors';
import { useCardStyle } from '@/hooks/use-card-style';
import { ModalBody, ModalHeader, ModalRoot } from '@/components/ui/modal-layout';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SearchInput } from '@/components/ui/search-input';
import { useQuery } from '@apollo/client/react';
import { GetMyProjectsDocument } from '@/gql/graphql';
import { GraphQLError } from '@/components/ui/graphql-error';
import { projectPickerStore } from '@/lib/modal-stores';

// ─── Status config ────────────────────────────────────────────────────────────
function statusConfig(status: string): { icon: any; color: string } {
  const s = status?.toLowerCase() ?? '';
  if (s === 'active')       return { icon: 'bolt.fill',           color: '#007AFF' };
  if (s === 'ongoing')      return { icon: 'arrow.2.circlepath',  color: '#34C759' };
  if (s === 'paused')       return { icon: 'pause.circle.fill',   color: '#FF9500' };
  if (s === 'completed')    return { icon: 'checkmark.seal.fill', color: '#30D158' };
  if (s === 'archived')     return { icon: 'archivebox.fill',     color: '#8E8E93' };
  if (s.includes('cancel')) return { icon: 'xmark.circle.fill',  color: '#FF3B30' };
  return { icon: 'folder.fill', color: '#8E8E93' };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ProjectPickerModal() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const card = useCardStyle();

  const [search, setSearch] = useState('');

  const { data, loading, error, refetch } = useQuery(GetMyProjectsDocument);

  const projects = (data?.getMyProjects ?? []).filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.location ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (projectId: string, projectName: string) => {
    projectPickerStore.resolve({ projectId, projectName });
    router.back();
  };

  const handleClose = () => {
    projectPickerStore.cancel();
    router.back();
  };

  const renderItem = ({ item }: { item: typeof projects[0] }) => {
    const cfg = statusConfig(item.status);
    const initials = item.name
      .split(' ')
      .slice(0, 2)
      .map((w: string) => w[0]?.toUpperCase() ?? '')
      .join('');

    return (
      <TouchableOpacity
        style={[S.row, card, { backgroundColor: colors.surface }]}
        onPress={() => handleSelect(item.id, item.name)}
        activeOpacity={0.7}
      >
        {/* Thumbnail or initials */}
        <View style={[S.thumb, { backgroundColor: colors.primary + '22' }]}>
          <Text style={[S.thumbInitials, { color: colors.primary }]}>{initials}</Text>
        </View>

        {/* Info */}
        <View style={S.info}>
          <Text style={[S.name, { color: colors.foreground }]} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={S.meta}>
            <IconSymbol name="location.fill" size={11} color={colors.muted} />
            <Text style={[S.metaText, { color: colors.muted }]} numberOfLines={1}>
              {item.location || '—'}
            </Text>
          </View>
        </View>

        {/* Status badge */}
        <View style={[S.badge, { backgroundColor: cfg.color + '18' }]}>
          <IconSymbol name={cfg.icon} size={13} color={cfg.color} />
        </View>

        {/* Chevron */}
        <IconSymbol
          name="chevron.right"
          size={14}
          color={colors.muted}
          style={{ marginLeft: 4 }}
        />
      </TouchableOpacity>
    );
  };

  return (
    <ModalRoot>
      <ModalHeader
        title={t('projectPicker.title', 'Seleccionar proyecto')}
        onClose={handleClose}
      />
      <ModalBody>
        <SearchInput
          placeholder={t('projectPicker.search', 'Buscar proyecto...')}
          value={search}
          onChangeText={setSearch}
        />

        {loading ? (
          <View style={S.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : error ? (
          <GraphQLError onRetry={() => refetch()} />
        ) : projects.length === 0 ? (
          <View style={S.center}>
            <IconSymbol
              name="folder.badge.questionmark"
              size={48}
              color={colors.border}
            />
            <Text style={[S.emptyText, { color: colors.muted }]}>
              {search
                ? t('projectPicker.noResults', 'Sin resultados')
                : t('projectPicker.empty', 'No tienes proyectos activos')}
            </Text>
          </View>
        ) : (
          <FlatList
            data={projects}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={S.list}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          />
        )}
      </ModalBody>
    </ModalRoot>
  );
}

const S = StyleSheet.create({
  list: { paddingTop: 12, paddingBottom: 24 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 16,
  },
  emptyText: { fontSize: 15, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  thumbInitials: { fontSize: 16, fontWeight: '700' },
  info: { flex: 1, marginRight: 8 },
  name: { fontSize: 15, fontWeight: '600', marginBottom: 3 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 12 },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
