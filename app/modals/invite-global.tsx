/**
 * app/modals/invite-global.tsx
 *
 * Modal para invitar a un miembro desde la vista principal.
 * A diferencia de invite-member (que recibe el projectId ya fijado),
 * este modal incluye un selector de proyecto.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/use-colors';
import { useCardStyle } from '@/hooks/use-card-style';
import {ModalHeader, ModalBody, ModalFooter, ModalRoot} from '@/components/ui/modal-layout';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

// ── Mocks ────────────────────────────────────────────────────────────────────
const MOCK_PROJECTS = [
  { id: '1', name: 'Fintech App UI',       location: 'Downtown, NYC',  color: '#3B82F6' },
  { id: '2', name: 'Edtech App Design',    location: 'Queens, NY',     color: '#10B981' },
  { id: '3', name: 'Roof Installation',    location: 'Brooklyn, NY',   color: '#8B5CF6' },
  { id: '4', name: 'Bridge Construction',  location: 'Manhattan, NY',  color: '#F59E0B' },
  { id: '5', name: 'Office Renovation',    location: 'Bronx, NY',      color: '#EF4444' },
];

const ROLES = ['Jefe de Obra', 'Arquitecto/a', 'Electricista', 'Pintor/a', 'Fontanero/a', 'Inspector', 'Otro'];

// ─────────────────────────────────────────────────────────────────────────────

export default function InviteGlobalModal() {
  const router  = useRouter();
  const colors  = useColors();
  const card    = useCardStyle();

  const [name,              setName]              = useState('');
  const [email,             setEmail]             = useState('');
  const [selectedRole,      setSelectedRole]      = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectSearch,     setProjectSearch]     = useState('');
  const [loading,           setLoading]           = useState(false);
  const [nameError,         setNameError]         = useState('');
  const [emailError,        setEmailError]        = useState('');
  const [projectError,      setProjectError]      = useState('');

  const filteredProjects = MOCK_PROJECTS.filter(p =>
    p.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
    p.location.toLowerCase().includes(projectSearch.toLowerCase()),
  );

  const selectedProject = MOCK_PROJECTS.find(p => p.id === selectedProjectId);

  const validate = () => {
    let ok = true;
    setNameError(''); setEmailError(''); setProjectError('');
    if (!name.trim())                  { setNameError('El nombre es obligatorio');      ok = false; }
    if (!email.trim())                 { setEmailError('El correo es obligatorio');     ok = false; }
    else if (!/\S+@\S+\.\S+/.test(email)) { setEmailError('Correo no válido');         ok = false; }
    if (!selectedProjectId)            { setProjectError('Selecciona un proyecto');     ok = false; }
    return ok;
  };

  const handleInvite = () => {
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Invitación enviada',
        `Se ha enviado un correo a ${email} para unirse a "${selectedProject?.name}".`,
        [{ text: 'OK', onPress: () => router.back() }],
      );
    }, 1200);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[S.root, { backgroundColor: colors.background }]}
    >
      <ModalRoot>
        <ModalHeader
            title="Invitar miembro"
            subtitle="Selecciona un proyecto y completa los datos"
            onClose={() => router.back()}
        />

        <ModalBody scrollable={false}>
          <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={S.scrollContent}
          >

            {/* ── Selector de proyecto ── */}
            <Text style={[S.sectionLabel, { color: colors.foreground }]}>Proyecto</Text>

            {/* Buscador de proyecto */}
            <View style={[S.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MaterialIcons name="search" size={18} color={colors.muted} />
              <TextInput
                  style={[S.searchInput, { color: colors.foreground }]}
                  placeholder="Buscar proyecto..."
                  placeholderTextColor={colors.muted}
                  value={projectSearch}
                  onChangeText={setProjectSearch}
              />
              {projectSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setProjectSearch('')}>
                    <MaterialIcons name="close" size={16} color={colors.muted} />
                  </TouchableOpacity>
              )}
            </View>

            {/* Lista de proyectos */}
            <View style={[S.projectList, card]}>
              {filteredProjects.length === 0 ? (
                  <Text style={[S.emptyText, { color: colors.muted }]}>
                    No se encontraron proyectos
                  </Text>
              ) : (
                  filteredProjects.map((p, idx) => (
                      <TouchableOpacity
                          key={p.id}
                          onPress={() => { setSelectedProjectId(p.id); setProjectError(''); }}
                          style={[
                            S.projectRow,
                            idx < filteredProjects.length - 1 && {
                              borderBottomWidth: StyleSheet.hairlineWidth,
                              borderBottomColor: colors.border,
                            },
                            selectedProjectId === p.id && {
                              backgroundColor: colors.primary + '10',
                            },
                          ]}
                      >
                        <View style={[S.projectDot, { backgroundColor: p.color }]} />
                        <View style={S.projectInfo}>
                          <Text style={[S.projectName, { color: colors.foreground }]}>{p.name}</Text>
                          <Text style={[S.projectLoc,  { color: colors.muted }]}>{p.location}</Text>
                        </View>
                        {selectedProjectId === p.id && (
                            <MaterialIcons name="check-circle" size={20} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                  ))
              )}
            </View>
            {!!projectError && (
                <Text style={[S.errorText, { color: colors.error }]}>{projectError}</Text>
            )}

            {/* ── Datos del invitado ── */}
            <Text style={[S.sectionLabel, { color: colors.foreground, marginTop: 20 }]}>
              Datos del invitado
            </Text>

            {/* Nombre */}
            <View style={[S.inputWrap, { backgroundColor: colors.surface, borderColor: nameError ? colors.error : colors.border }]}>
              <MaterialIcons name="person-outline" size={18} color={colors.muted} style={S.inputIcon} />
              <TextInput
                  style={[S.input, { color: colors.foreground }]}
                  placeholder="Nombre completo"
                  placeholderTextColor={colors.muted}
                  value={name}
                  onChangeText={t => { setName(t); setNameError(''); }}
                  returnKeyType="next"
              />
            </View>
            {!!nameError && <Text style={[S.errorText, { color: colors.error }]}>{nameError}</Text>}

            {/* Email */}
            <View style={[S.inputWrap, { backgroundColor: colors.surface, borderColor: emailError ? colors.error : colors.border, marginTop: 10 }]}>
              <MaterialIcons name="email" size={18} color={colors.muted} style={S.inputIcon} />
              <TextInput
                  style={[S.input, { color: colors.foreground }]}
                  placeholder="Correo electrónico"
                  placeholderTextColor={colors.muted}
                  value={email}
                  onChangeText={t => { setEmail(t); setEmailError(''); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="done"
              />
            </View>
            {!!emailError && <Text style={[S.errorText, { color: colors.error }]}>{emailError}</Text>}

            {/* Rol */}
            <Text style={[S.sectionLabel, { color: colors.foreground, marginTop: 20 }]}>Rol</Text>
            <View style={S.roles}>
              {ROLES.map(r => (
                  <TouchableOpacity
                      key={r}
                      onPress={() => setSelectedRole(r)}
                      style={[
                        S.roleChip,
                        {
                          backgroundColor: selectedRole === r ? colors.primary : colors.surface,
                          borderColor:     selectedRole === r ? colors.primary : colors.border,
                        },
                      ]}
                  >
                    <Text
                        style={[
                          S.roleText,
                          { color: selectedRole === r ? '#FFF' : colors.foreground },
                        ]}
                    >
                      {r}
                    </Text>
                  </TouchableOpacity>
              ))}
            </View>

            {/* Info */}
            {selectedProject && (
                <View style={[S.infoBox, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
                  <MaterialIcons name="info-outline" size={15} color={colors.primary} />
                  <Text style={[S.infoText, { color: colors.primary }]}>
                    Se enviará un correo de invitación a <Text style={{ fontWeight: '700' }}>{selectedProject.name}</Text>.
                  </Text>
                </View>
            )}
          </ScrollView>
        </ModalBody>

        <ModalFooter row>
          <Button title="Cancelar" variant="ghost"   onPress={() => router.back()} fullWidth={false} style={S.btn} />
          <Button title="Invitar"  variant="primary"  onPress={handleInvite} isLoading={loading} fullWidth={false} style={S.btn} />
        </ModalFooter>
      </ModalRoot>
    </KeyboardAvoidingView>
  );
}

const S = StyleSheet.create({
  root:         { flex: 1 },
  scrollContent: { paddingBottom: 16 },
  sectionLabel: { fontSize: 13, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  // Buscador
  searchWrap:   { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10, gap: 8 },
  searchInput:  { flex: 1, fontSize: 14 },
  // Lista proyectos
  projectList:  { borderRadius: 14, overflow: 'hidden', marginBottom: 4 },
  projectRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, gap: 12 },
  projectDot:   { width: 10, height: 10, borderRadius: 5 },
  projectInfo:  { flex: 1 },
  projectName:  { fontSize: 14, fontWeight: '600' },
  projectLoc:   { fontSize: 12, marginTop: 1 },
  emptyText:    { textAlign: 'center', paddingVertical: 20, fontSize: 14 },
  // Inputs
  inputWrap:    { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 12 },
  inputIcon:    { marginRight: 8 },
  input:        { flex: 1, fontSize: 14 },
  errorText:    { fontSize: 12, marginTop: 4, marginLeft: 4 },
  // Roles
  roles:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  roleChip:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  roleText:     { fontSize: 13, fontWeight: '500' },
  // Info
  infoBox:      { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, marginTop: 4 },
  infoText:     { flex: 1, fontSize: 12, lineHeight: 18 },
  // Footer
  btn:          { flex: 1 },
});
