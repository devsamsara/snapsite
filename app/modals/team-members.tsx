/**
 * app/modals/team-members.tsx
 *
 * Modal que muestra todos los usuarios de los proyectos
 * en los que está incluido el usuario actual.
 * Se abre al tocar los avatares del header de la vista principal.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/use-colors';
import { useCardStyle } from '@/hooks/use-card-style';
import { ModalHeader, ModalBody } from '@/components/ui/modal-layout';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

// ── Mocks ────────────────────────────────────────────────────────────────────
const MOCK_MEMBERS = [
  { id: '1',  name: 'Ana García',       role: 'Arquitecta',    project: 'Fintech App UI',      online: true,  initials: 'AG', color: '#3B82F6' },
  { id: '2',  name: 'Carlos López',     role: 'Jefe de Obra',  project: 'Fintech App UI',      online: false, initials: 'CL', color: '#3B82F6' },
  { id: '3',  name: 'María Rodríguez',  role: 'Electricista',  project: 'Edtech App Design',   online: true,  initials: 'MR', color: '#10B981' },
  { id: '4',  name: 'Pedro Sánchez',    role: 'Pintor',        project: 'Edtech App Design',   online: false, initials: 'PS', color: '#10B981' },
  { id: '5',  name: 'Laura Martínez',   role: 'Inspectora',    project: 'Roof Installation',   online: true,  initials: 'LM', color: '#8B5CF6' },
  { id: '6',  name: 'Juan Torres',      role: 'Fontanero',     project: 'Roof Installation',   online: false, initials: 'JT', color: '#8B5CF6' },
  { id: '7',  name: 'Sofia Hernández',  role: 'Arquitecta',    project: 'Bridge Construction', online: true,  initials: 'SH', color: '#F59E0B' },
  { id: '8',  name: 'Diego Ramírez',    role: 'Jefe de Obra',  project: 'Bridge Construction', online: true,  initials: 'DR', color: '#F59E0B' },
  { id: '9',  name: 'Elena Jiménez',    role: 'Electricista',  project: 'Bridge Construction', online: false, initials: 'EJ', color: '#F59E0B' },
  { id: '10', name: 'Roberto Morales',  role: 'Inspector',     project: 'Office Renovation',   online: false, initials: 'RM', color: '#EF4444' },
  { id: '11', name: 'Isabel Ruiz',      role: 'Pintora',       project: 'Office Renovation',   online: true,  initials: 'IR', color: '#EF4444' },
  { id: '12', name: 'Miguel Fernández', role: 'Fontanero',     project: 'Fintech App UI',      online: false, initials: 'MF', color: '#3B82F6' },
];

type Member = typeof MOCK_MEMBERS[0];
// ─────────────────────────────────────────────────────────────────────────────

export default function TeamMembersModal() {
  const router  = useRouter();
  const colors  = useColors();
  const card    = useCardStyle();
  const [search, setSearch] = useState('');

  const filtered = MOCK_MEMBERS.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.role.toLowerCase().includes(search.toLowerCase()) ||
    m.project.toLowerCase().includes(search.toLowerCase()),
  );

  const onlineCount  = MOCK_MEMBERS.filter(m => m.online).length;
  const totalCount   = MOCK_MEMBERS.length;

  const renderMember = ({ item, index }: { item: Member; index: number }) => (
    <View
      style={[
        S.memberRow,
        index < filtered.length - 1 && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
      ]}
    >
      {/* Avatar */}
      <View style={[S.avatar, { backgroundColor: item.color + '25', borderColor: item.color + '50' }]}>
        <Text style={[S.avatarText, { color: item.color }]}>{item.initials}</Text>
        {item.online && (
          <View style={[S.onlineDot, { backgroundColor: colors.success, borderColor: colors.surface }]} />
        )}
      </View>

      {/* Info */}
      <View style={S.memberInfo}>
        <Text style={[S.memberName, { color: colors.foreground }]}>{item.name}</Text>
        <Text style={[S.memberRole, { color: colors.muted }]}>{item.role}</Text>
        <View style={S.projectTag}>
          <View style={[S.projectDot, { backgroundColor: item.color }]} />
          <Text style={[S.projectName, { color: colors.muted }]} numberOfLines={1}>
            {item.project}
          </Text>
        </View>
      </View>

      {/* Estado */}
      <View style={[
        S.statusBadge,
        { backgroundColor: item.online ? colors.success + '15' : colors.border + '60' },
      ]}>
        <Text style={[
          S.statusText,
          { color: item.online ? colors.success : colors.muted },
        ]}>
          {item.online ? 'Online' : 'Offline'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[S.root, { backgroundColor: colors.background }]}>
      <ModalHeader
        title="Equipo"
        subtitle={`${onlineCount} online · ${totalCount} miembros en total`}
        onClose={() => router.back()}
      />

      {/* Stats rápidas */}
      <View style={[S.statsRow, { paddingHorizontal: 20, paddingBottom: 12 }]}>
        <View style={[S.statChip, { backgroundColor: colors.success + '15' }]}>
          <View style={[S.statDot, { backgroundColor: colors.success }]} />
          <Text style={[S.statText, { color: colors.success }]}>{onlineCount} online</Text>
        </View>
        <View style={[S.statChip, { backgroundColor: colors.border + '60' }]}>
          <MaterialIcons name="people-outline" size={13} color={colors.muted} />
          <Text style={[S.statText, { color: colors.muted }]}>{totalCount} total</Text>
        </View>
        <View style={[S.statChip, { backgroundColor: colors.primary + '15' }]}>
          <MaterialIcons name="folder-open" size={13} color={colors.primary} />
          <Text style={[S.statText, { color: colors.primary }]}>5 proyectos</Text>
        </View>
      </View>

      {/* Buscador */}
      <View style={[S.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border, marginHorizontal: 20, marginBottom: 12 }]}>
        <MaterialIcons name="search" size={18} color={colors.muted} />
        <TextInput
          style={[S.searchInput, { color: colors.foreground }]}
          placeholder="Buscar por nombre, rol o proyecto..."
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <MaterialIcons name="close" size={16} color={colors.muted} />
          </TouchableOpacity>
        )}
      </View>

      <ModalBody scrollable={false}>
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderMember}
          contentContainerStyle={[S.listContent, card, { marginHorizontal: 20, borderRadius: 16, overflow: 'hidden' }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={S.emptyWrap}>
              <MaterialIcons name="people-outline" size={40} color={colors.muted} />
              <Text style={[S.emptyText, { color: colors.muted }]}>
                No se encontraron miembros
              </Text>
            </View>
          }
        />
      </ModalBody>
    </View>
  );
}

const S = StyleSheet.create({
  root:        { flex: 1 },
  // Stats
  statsRow:    { flexDirection: 'row', gap: 8 },
  statChip:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  statDot:     { width: 7, height: 7, borderRadius: 4 },
  statText:    { fontSize: 12, fontWeight: '600' },
  // Buscador
  searchWrap:  { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  searchInput: { flex: 1, fontSize: 14 },
  // Lista
  listContent: { paddingBottom: 20 },
  memberRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, gap: 12 },
  // Avatar
  avatar:      { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatarText:  { fontSize: 15, fontWeight: '700' },
  onlineDot:   { position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: 6, borderWidth: 2 },
  // Info
  memberInfo:  { flex: 1, gap: 2 },
  memberName:  { fontSize: 14, fontWeight: '600' },
  memberRole:  { fontSize: 12 },
  projectTag:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  projectDot:  { width: 7, height: 7, borderRadius: 4 },
  projectName: { fontSize: 11, flex: 1 },
  // Status
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText:  { fontSize: 11, fontWeight: '600' },
  // Empty
  emptyWrap:   { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText:   { fontSize: 14 },
});
