import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  StyleSheet,
  Alert,
  Animated as RNAnimated,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { addNoteStore, inviteMemberStore } from "@/lib/modal-stores";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useCardStyle, useCardStyleSm } from "@/hooks/use-card-style";
import { useState, useRef, useCallback } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { AppAlert } from '@/components/ui/app-alert';
import { ProjectDetailSkeleton } from '@/components/project-detail-skeleton';
import { useQuery } from '@apollo/client/react';
import {
  FindProjectDocument,
  Note,
  Photo,
  Project,
  TimelineEvent,
  User,
  UserRole,
} from '@/gql/graphql';

const { width: W } = Dimensions.get("window");

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_PROJECTS: Record<string, Project> = {
  "1": {
    id: "1",
    name: "Office Renovation",
    location: "3 C. Ponce de León, Huelva, AN 21004",
    thumbnail: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop",
    description: "Complete renovation of the main office building including new flooring, painting, electrical work, and furniture installation.",
    status: "active",
    progress: 67,
    startDate: "Jan 10, 2026",
    endDate: "Apr 30, 2026",
    photos: [
      { id: "p1", url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop", date: "Hace 2 horas", caption: "Avance piso principal", tags: ["piso", "electricidad"] },
      { id: "p2", url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400&h=300&fit=crop", date: "Hace 5 horas", caption: "Instalación eléctrica", tags: ["electricidad"] },
      { id: "p3", url: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=400&h=300&fit=crop", date: "Ayer", caption: "Pintura sala de reuniones", tags: ["pintura"] },
      { id: "p4", url: "https://images.unsplash.com/photo-1497366412874-3415097a27e7?w=400&h=300&fit=crop", date: "Ayer", caption: "Mobiliario recibido", tags: ["mobiliario"] },
      { id: "p5", url: "https://images.unsplash.com/photo-1497366858526-0766cadbe8fa?w=400&h=300&fit=crop", date: "Hace 2 días", caption: "Demolición completada", tags: ["demolición"] },
      { id: "p6", url: "https://images.unsplash.com/photo-1497366672149-e5e4b4d34eb3?w=400&h=300&fit=crop", date: "Hace 3 días", caption: "Inicio de obra", tags: ["inicio"] },
    ],
    timeline: [
      { id: "t1", date: "Hoy, 10:30", title: "Fotos de avance subidas", description: "Juan subió 3 fotos del avance del piso principal.", type: "photo", photoUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&h=150&fit=crop" },
      { id: "t2", date: "Hoy, 09:15", title: "Nota agregada", description: "Se reportó retraso en entrega de materiales de pintura.", type: "note" },
      { id: "t3", date: "Ayer, 16:45", title: "Instalación eléctrica completada", description: "El equipo eléctrico finalizó el cableado del piso 2.", type: "milestone" },
      { id: "t4", date: "Ayer, 11:00", title: "Nuevo miembro agregado", description: "María García se unió al proyecto.", type: "team" },
      { id: "t5", date: "Hace 2 días, 14:20", title: "Fotos de demolición", description: "Registro fotográfico de la demolición de tabiques.", type: "photo", photoUrl: "https://images.unsplash.com/photo-1497366858526-0766cadbe8fa?w=200&h=150&fit=crop" },
      { id: "t6", date: "Hace 3 días, 09:00", title: "Proyecto iniciado", description: "SnapSite comenzó el seguimiento del proyecto.", type: "milestone" },
    ],
    team: [
      { id: "u1", name: "Juan Pérez",    role: "Jefe de Obra", initials: "JP", color: "#007AFF", lastActivity: "Hace 2 horas", online: true  },
      { id: "u2", name: "María García",  role: "Arquitecta",   initials: "MG", color: "#FF2D55", lastActivity: "Hace 1 día",   online: false },
      { id: "u3", name: "Carlos López",  role: "Electricista", initials: "CL", color: "#FF9500", lastActivity: "Ayer",          online: false },
      { id: "u4", name: "Ana Martínez",  role: "Pintora",      initials: "AM", color: "#4CD964", lastActivity: "Hace 3 días",   online: false },
    ],
    notes: [
      { id: "n1", author: "Juan Pérez",   initials: "JP", authorColor: "#007AFF", content: "Retraso en entrega de materiales de pintura. Proveedor confirma entrega para el lunes.", date: "Hoy, 09:15",   pinned: true  },
      { id: "n2", author: "María García", initials: "MG", authorColor: "#FF2D55", content: "Revisar planos actualizados antes de continuar con la tabiquería del piso 3.",           date: "Ayer, 14:30",  pinned: false },
      { id: "n3", author: "Carlos López", initials: "CL", authorColor: "#FF9500", content: "Instalación eléctrica del piso 2 completada. Pendiente inspección municipal.",           date: "Ayer, 16:50",  pinned: false },
    ],
  },
};

type TabId = "gallery" | "timeline" | "team" | "notes";

const TABS: { id: TabId; icon: string; labelKey: string }[] = [
  { id: "gallery",  icon: "photo-library", labelKey: "project.tabs.gallery"  },
  { id: "timeline", icon: "timeline",       labelKey: "project.tabs.timeline" },
  { id: "team",     icon: "group",          labelKey: "project.tabs.team"     },
  { id: "notes",    icon: "notes",          labelKey: "project.tabs.notes"    },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9); }

function timelineIcon(type: TimelineEvent["type"]) {
  switch (type) {
    case "photo":     return "photo-camera";
    case "note":      return "notes";
    case "milestone": return "flag";
    case "team":      return "person-add";
  }
}

function timelineColor(type: TimelineEvent["type"], colors: any) {
  switch (type) {
    case "photo":     return colors.primary;
    case "note":      return colors.warning;
    case "milestone": return colors.success;
    case "team":      return "#FF2D55";
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProjectDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const cardElevation = useCardStyle();
  const cardSmElevation = useCardStyleSm();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {data} = useQuery(FindProjectDocument, {
    variables: {
      findProjectId: id
    }
  })

  // isLoading: cuando se integre el useQuery real, reemplazar por { loading } del hook.
  // Mientras tanto se usa false (datos mock siempre disponibles).
  const isLoading = false;
  const project: Project = data?.findProject;

  const [activeTab, setActiveTab] = useState<TabId>("gallery");
  const [notes, setNotes] = useState<Note[]>(project?.notes);
  const [photos, setPhotos] = useState<Photo[]>(project?.photos);
  const [team, setTeam] = useState<User[]>(project?.members);
  const [filterTag, setFilterTag] = useState<string | null>(null);

  const tabAnim = useRef(new RNAnimated.Value(0)).current;

  const switchTab = (tab: TabId) => { Haptics.selectionAsync(); setActiveTab(tab); };

  const handleAddPhoto = () => {
    router.push({ pathname: "/add-photo-modal", params: { projectId: project.id } });
  };

  const openInviteModal = useCallback(() => {
    const promise = inviteMemberStore.open();
    router.push({ pathname: "/modals/invite-member", params: { projectId: project.id } });
    promise.then((result) => {
      if (!result) return;
      const initials = result.name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
      const palette = ["#007AFF", "#FF2D55", "#FF9500", "#4CD964", "#5856D6", "#FF3B30", "#34C759"];
      const color = palette[Math.floor(Math.random() * palette.length)];
      const newMember  = { id: uid(), name: result.name, role: result.role as UserRole } as User;
      setTeam((p) => [...p, newMember]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });
  }, [project.id, router]);

  const openNoteModal = useCallback(() => {
    const promise = addNoteStore.open();
    router.push({ pathname: "/modals/add-note", params: { projectId: project.id } });
    promise.then((result) => {
      if (!result) return;
      const newNote: Note = { id: uid(), content: result.text, date: "Ahora", pinned: false };
      setNotes((p) => [newNote, ...p]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });
  }, [project.id, colors.primary, router]);

  const openLightbox = useCallback((photo: Photo) => {
    router.push({ pathname: "/modals/photo-lightbox", params: { url: photo.url, caption: photo.caption, date: photo.createdAt, tags: JSON.stringify(photo.tags), projectId: project.id } });
  }, [project.id, router]);

  const togglePin = (noteId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotes((p) => p.map((n) => n.id === noteId ? { ...n, pinned: !n.pinned } : n));
  };

  const deleteNote = (noteId: string) => {
    AppAlert.alert(t("project.deleteNoteTitle"), t("project.deleteNoteConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("common.delete"), style: "destructive", onPress: () => setNotes((p) => p.filter((n) => n.id !== noteId)) },
    ]);
  };

  const allTags = Array.from(new Set(photos.flatMap((p) => p.tags)));
  const filteredPhotos = filterTag ? photos.filter((p) => p!.tags!.includes(filterTag)) : photos;

  // ─── Tab: Gallery ─────────────────────────────────────────────────────────

  const renderGallery = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.galleryScroll}>
      {/* Tag filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.tagScroll}>
        <TouchableOpacity
          onPress={() => setFilterTag(null)}
          style={[S.tag, { backgroundColor: !filterTag ? colors.primary : colors.surface, borderColor: colors.border }]}
        >
          <Text style={[S.tagText, { color: !filterTag ? "#FFF" : colors.muted }]}>{t("project.all")}</Text>
        </TouchableOpacity>
        {allTags.map((tag) => (
          <TouchableOpacity
            key={tag}
            /*onPress={() => setFilterTag(filterTag === tag ? null : tag)}*/
            style={[S.tag, { backgroundColor: filterTag === tag ? colors.primary : colors.surface, borderColor: colors.border }]}
          >
            <Text style={[S.tagText, { color: filterTag === tag ? "#FFF" : colors.muted }]}>#{tag}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Photo count + add */}
      <View style={S.photoCountRow}>
        <Text style={[S.photoCountText, { color: colors.muted }]}>
          {filteredPhotos.length} {filteredPhotos.length === 1 ? t("project.photo") : t("project.photos")}
        </Text>
        <TouchableOpacity onPress={handleAddPhoto} style={[S.addPhotoBtn, { backgroundColor: colors.primary + "20" }]}>
          <MaterialIcons name="add-a-photo" size={16} color={colors.primary} />
          <Text style={[S.addPhotoBtnText, { color: colors.primary }]}>{t("project.add")}</Text>
        </TouchableOpacity>
      </View>

      {/* Grid */}
      <View style={S.gridWrapper}>
        <View style={S.grid}>
          {filteredPhotos.map((photo) => (
            <TouchableOpacity
              key={photo.id}
              onPress={() => openLightbox(photo)}
              style={[S.gridItem, { width: (W - 40) / 2 }]}
            >
              <Image source={{ uri: photo.url }} style={S.gridItemImg} resizeMode="cover" />
              <View style={S.gridItemOverlay}>
                <Text style={S.gridItemCaption} numberOfLines={1}>{photo.caption}</Text>
                <Text style={S.gridItemDate}>{photo.createdAt}</Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push({ pathname: "/image-editor", params: { imageUri: photo.url, projectId: project.id } })}
                style={S.gridItemEditBtn}
              >
                <MaterialIcons name="edit" size={14} color="#FFF" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {filteredPhotos.length === 0 && (
          <View style={S.emptyState}>
            <MaterialIcons name="photo-library" size={48} color={colors.border} />
            <Text style={[S.emptyStateText, { color: colors.muted }]}>
              {t("project.noPhotos")}{filterTag ? ` #${filterTag}` : ""}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  // ─── Tab: Timeline ────────────────────────────────────────────────────────

  const renderTimeline = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.timelineScroll}>
      {project?.timeline?.map((event, idx) => {
        const iconName = timelineIcon(event.type);
        const iconColor = timelineColor(event.type, colors);
        const isLast = idx === project!.timeline!.length - 1;
        return (
          <View key={event.id} style={S.timelineRow}>
            {/* Line + icon */}
            <View style={S.timelineIconCol}>
              <View style={[S.timelineIconBg, { backgroundColor: iconColor + "20" }]}>
                <MaterialIcons name={iconName as any} size={18} color={iconColor} />
              </View>
              {!isLast && <View style={[S.timelineLine, { backgroundColor: colors.border }]} />}
            </View>
            {/* Content */}
            <View style={[S.timelineContent, isLast && S.timelineContentLast]}>
              <Text style={[S.timelineDate, { color: colors.muted }]}>{event.createdAt}</Text>
              <View style={[S.cardBase, cardElevation]}>
                <Text style={[S.timelineTitle, { color: colors.foreground }]}>{event.title}</Text>
                <Text style={[S.timelineDesc, { color: colors.muted }]}>{event.description}</Text>
                {event.photoUrl && (
                  <Image source={{ uri: event.photoUrl }} style={S.timelinePhoto} resizeMode="cover" />
                )}
              </View>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );

  // ─── Tab: Team ────────────────────────────────────────────────────────────

  const renderTeam = () => (
    <View style={S.flex1}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.teamScroll}>
        {/* Stats row */}
        <View style={S.statsRow}>
          {[
            { label: t("project.members"),    value: team.length,                          icon: "group",               color: colors.primary },
            { label: t("project.activeToday"), value: team.filter((m) => true).length, icon: "fiber-manual-record", color: colors.success },
          ].map((stat) => (
            <View key={stat.label} style={[S.statCard, cardSmElevation, S.flex1]}>
              <MaterialIcons name={stat.icon as any} size={22} color={stat.color} />
              <Text style={[S.statValue, { color: colors.foreground }]}>{stat.value}</Text>
              <Text style={[S.statLabel, { color: colors.muted }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Members list */}
        {team.map((member) => (
          <View key={member.id} style={[S.cardBase, cardElevation, S.memberCard]}>
            <View style={[S.memberAvatar, { backgroundColor: 'blue' + "25" }]}>
              <Text style={[S.memberInitials, { color: 'blue' }]}>JJ</Text>
            </View>
            <View style={S.flex1}>
              <View style={S.memberNameRow}>
                <Text style={[S.memberName, { color: colors.foreground }]}>{member.name}</Text>
                {true && <View style={[S.onlineDot, { backgroundColor: colors.success }]} />}
              </View>
              <Text style={[S.memberRole, { color: colors.primary }]}>{member.role}</Text>
              <Text style={[S.memberActivity, { color: colors.muted }]}>
                {t("project.active")}: {member.lastLoginAt}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => AppAlert.alert(t("project.messageTitle"), t("project.messageTo", { name: member.name }))}
              style={[S.chatBtn, { backgroundColor: colors.primary + "15" }]}
            >
              <MaterialIcons name="chat" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity onPress={openInviteModal} style={[S.fab, { backgroundColor: colors.primary }]}>
        <MaterialIcons name="person-add" size={26} color="#FFF" />
      </TouchableOpacity>
    </View>
  );

  // ─── Tab: Notes ───────────────────────────────────────────────────────────

  const sortedNotes = [...notes].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  const renderNotes = () => (
    <View style={S.flex1}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.notesScroll}>
        {sortedNotes.length === 0 && (
          <View style={S.emptyState}>
            <MaterialIcons name="notes" size={48} color={colors.border} />
            <Text style={[S.emptyStateText, { color: colors.muted }]}>{t("project.noNotes")}</Text>
          </View>
        )}
        {sortedNotes.map((note) => (
          <View
            key={note.id}
            style={[
              S.cardBase,
              cardElevation,
              S.noteCard,
              { borderColor: note.pinned ? colors.warning : (cardElevation as any).borderColor, borderWidth: note.pinned ? 1.5 : (cardElevation as any).borderWidth ?? 0 },
            ]}
          >
            {note.pinned && (
              <View style={S.pinnedRow}>
                <MaterialIcons name="push-pin" size={12} color={colors.warning} />
                <Text style={[S.pinnedText, { color: colors.warning }]}>{t("project.pinned")}</Text>
              </View>
            )}
            <View style={S.noteAuthorRow}>
              <View style={[S.noteAuthorAvatar, { backgroundColor: 'blue'+ "25" }]}>
                <Text style={[S.noteAuthorInitials, { color: 'blue' }]}>JJ</Text>
              </View>
              <View style={S.flex1}>
                <Text style={[S.noteAuthorName, { color: colors.foreground }]}>{note.author.name}</Text>
                <Text style={[S.noteDate, { color: colors.muted }]}>{note.createdAt}</Text>
              </View>
              <TouchableOpacity onPress={() => togglePin(note.id)} style={S.noteAction}>
                <MaterialIcons name="push-pin" size={18} color={note.pinned ? colors.warning : colors.muted} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteNote(note.id)} style={S.noteAction}>
                <MaterialIcons name="delete-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
            <Text style={[S.noteContent, { color: colors.foreground }]}>{note.content}</Text>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity onPress={() => openNoteModal()} style={[S.fab, { backgroundColor: colors.primary }]}>
        <MaterialIcons name="add" size={28} color="#FFF" />
      </TouchableOpacity>
    </View>
  );

  // ─── Main Render ──────────────────────────────────────────────────────────

  // Mostrar skeleton mientras se cargan los datos del proyecto
  if (isLoading) {
    return (
      <ScreenContainer className="p-0">
        <ProjectDetailSkeleton />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0">
      <View style={[S.flex1, { backgroundColor: colors.background }]}>

        {/* ── Header ── */}
        <View style={[S.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={S.backBtn}>
            <MaterialIcons name="arrow-back" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={S.headerTitleWrapper}>
            <Text style={[S.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
              {project.name}
            </Text>
            <View style={S.headerLocationRow}>
              <MaterialIcons name="location-on" size={12} color={colors.muted} />
              <Text style={[S.headerLocation, { color: colors.muted }]} numberOfLines={1}>{project.location}</Text>
            </View>
          </View>
          <View style={S.headerActions}>
            <TouchableOpacity
              onPress={handleAddPhoto}
              style={[S.headerActionBtn, { backgroundColor: colors.primary + "15" }]}
            >
              <MaterialIcons name="add-a-photo" size={18} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push({ pathname: "/modals/project-settings", params: { projectId: project.id, projectName: project.name, projectLocation: project.location } })}
              style={[S.headerActionBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
            >
              <MaterialIcons name="more-vert" size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Hero card ── */}
        <View style={S.heroWrapper}>
          <View style={[S.heroCard, cardElevation]}>
            <Image source={{ uri: project.thumbnail }} style={S.heroImg} resizeMode="cover" />
            <View style={S.heroBody}>
              <View style={S.progressLabelRow}>
                <Text style={[S.progressLabel, { color: colors.foreground }]}>{t("project.projectProgress")}</Text>
                <Text style={[S.progressValue, { color: colors.primary }]}>{project.progress}%</Text>
              </View>
              <View style={[S.progressTrack, { backgroundColor: colors.border }]}>
                <View style={[S.progressFill, { width: `${project.progress}%`, backgroundColor: colors.primary }]} />
              </View>
              <View style={S.datesRow}>
                <View style={S.dateItem}>
                  <MaterialIcons name="event" size={13} color={colors.muted} />
                  <Text style={[S.dateText, { color: colors.muted }]}>{t("project.start")}: {project.startDate}</Text>
                </View>
                <View style={S.dateItem}>
                  <MaterialIcons name="event-available" size={13} color={colors.muted} />
                  <Text style={[S.dateText, { color: colors.muted }]}>{t("project.end")}: {project.endDate}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ── Tabs ── */}
        <View style={[S.tabBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => switchTab(tab.id)}
                style={[S.tabItem, active && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              >
                <MaterialIcons name={tab.icon as any} size={20} color={active ? colors.primary : colors.muted} />
                <Text style={[S.tabLabel, { color: active ? colors.primary : colors.muted, fontWeight: active ? "700" : "500" }]}>
                  {t(tab.labelKey)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Tab content ── */}
        <View style={S.flex1}>
          {activeTab === "gallery"  && renderGallery()}
          {activeTab === "timeline" && renderTimeline()}
          {activeTab === "team"     && renderTeam()}
          {activeTab === "notes"    && renderNotes()}
        </View>

      </View>
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  // Layout
  flex1:                { flex: 1 },

  // Header
  header:               { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn:              { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitleWrapper:   { flex: 1, marginHorizontal: 12 },
  headerTitle:          { fontSize: 17, fontWeight: "700" },
  headerLocationRow:    { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  headerLocation:       { fontSize: 12 },
  headerActions:        { flexDirection: "row", gap: 8 },
  headerActionBtn:      { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },

  // Hero
  heroWrapper:          { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  heroCard:             { borderRadius: 20, borderWidth: 1, overflow: "hidden" },
  heroImg:              { width: "100%", height: 140 },
  heroBody:             { padding: 14 },
  progressLabelRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  progressLabel:        { fontSize: 13, fontWeight: "600" },
  progressValue:        { fontSize: 13, fontWeight: "800" },
  progressTrack:        { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill:         { height: "100%", borderRadius: 3 },
  datesRow:             { flexDirection: "row", gap: 16, marginTop: 10 },
  dateItem:             { flexDirection: "row", alignItems: "center", gap: 4 },
  dateText:             { fontSize: 12 },

  // Tabs
  tabBar:               { flexDirection: "row", borderBottomWidth: 1, marginTop: 8 },
  tabItem:              { flex: 1, alignItems: "center", paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabLabel:             { fontSize: 12, marginTop: 2 },

  // Shared card
  cardBase:             { borderRadius: 16, padding: 14 },

  // Gallery
  galleryScroll:        { paddingBottom: 32 },
  tagScroll:            { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  tag:                  { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  tagText:              { fontSize: 12, fontWeight: "600" },
  photoCountRow:        { paddingHorizontal: 16, marginBottom: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  photoCountText:       { fontSize: 13 },
  addPhotoBtn:          { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  addPhotoBtnText:      { fontSize: 13, fontWeight: "700" },
  gridWrapper:          { paddingHorizontal: 16 },
  grid:                 { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  gridItem:             { borderRadius: 16, overflow: "hidden" },
  gridItemImg:          { width: "100%", height: 150 },
  gridItemOverlay:      { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.55)", padding: 8 },
  gridItemCaption:      { color: "#FFF", fontSize: 12, fontWeight: "600" },
  gridItemDate:         { color: "rgba(255,255,255,0.7)", fontSize: 10, marginTop: 2 },
  gridItemEditBtn:      { position: "absolute", top: 8, right: 8, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 20, padding: 6 },
  emptyState:           { alignItems: "center", paddingVertical: 48 },
  emptyStateText:       { marginTop: 12, fontSize: 15 },

  // Timeline
  timelineScroll:       { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 8 },
  timelineRow:          { flexDirection: "row", gap: 12 },
  timelineIconCol:      { alignItems: "center", width: 36 },
  timelineIconBg:       { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", zIndex: 1 },
  timelineLine:         { width: 2, flex: 1, marginTop: 4 },
  timelineContent:      { flex: 1, paddingBottom: 20 },
  timelineContentLast:  { paddingBottom: 0 },
  timelineDate:         { fontSize: 11, marginBottom: 4 },
  timelineTitle:        { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  timelineDesc:         { fontSize: 13, lineHeight: 18 },
  timelinePhoto:        { width: "100%", height: 120, borderRadius: 10, marginTop: 10 },

  // Team
  teamScroll:           { paddingHorizontal: 16, paddingBottom: 100, paddingTop: 8 },
  statsRow:             { flexDirection: "row", gap: 12, marginBottom: 20 },
  statCard:             { borderRadius: 16, padding: 14, alignItems: "center" },
  statValue:            { fontSize: 22, fontWeight: "800", marginTop: 6 },
  statLabel:            { fontSize: 12 },
  memberCard:           { marginBottom: 12, flexDirection: "row", alignItems: "center" },
  memberAvatar:         { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", marginRight: 14 },
  memberInitials:       { fontSize: 16, fontWeight: "800" },
  memberNameRow:        { flexDirection: "row", alignItems: "center", gap: 6 },
  memberName:           { fontSize: 15, fontWeight: "700" },
  onlineDot:            { width: 8, height: 8, borderRadius: 4 },
  memberRole:           { fontSize: 12, fontWeight: "600", marginTop: 2 },
  memberActivity:       { fontSize: 11, marginTop: 2 },
  chatBtn:              { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },

  // Notes
  notesScroll:          { paddingHorizontal: 16, paddingBottom: 100, paddingTop: 8 },
  noteCard:             { marginBottom: 12 },
  pinnedRow:            { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 },
  pinnedText:           { fontSize: 11, fontWeight: "700" },
  noteAuthorRow:        { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  noteAuthorAvatar:     { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", marginRight: 10 },
  noteAuthorInitials:   { fontSize: 12, fontWeight: "800" },
  noteAuthorName:       { fontSize: 13, fontWeight: "700" },
  noteDate:             { fontSize: 11 },
  noteAction:           { padding: 6 },
  noteContent:          { fontSize: 14, lineHeight: 20 },

  // FAB
  fab: {
    position: "absolute", bottom: 24, right: 20,
    width: 56, height: 56, borderRadius: 28,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 8,
  },
});
