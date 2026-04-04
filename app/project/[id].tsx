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

// ─── Types ────────────────────────────────────────────────────────────────────

interface Photo {
  id: string;
  url: string;
  date: string;
  caption: string;
  tags: string[];
}

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  type: "photo" | "note" | "milestone" | "team";
  photoUrl?: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
  lastActivity: string;
  online: boolean;
}

interface Note {
  id: string;
  author: string;
  initials: string;
  authorColor: string;
  content: string;
  date: string;
  pinned: boolean;
}

interface Project {
  id: string;
  name: string;
  location: string;
  thumbnail: string;
  description: string;
  status: string;
  progress: number;
  startDate: string;
  endDate: string;
  photos: Photo[];
  timeline: TimelineEvent[];
  team: TeamMember[];
  notes: Note[];
}

type TabId = "gallery" | "timeline" | "team" | "notes";

const TABS: { id: TabId; icon: string; labelKey: string }[] = [
  { id: "gallery",  icon: "photo-library", labelKey: "project.tabs.gallery"  },
  { id: "timeline", icon: "timeline",       labelKey: "project.tabs.timeline" },
  { id: "team",     icon: "group",          labelKey: "project.tabs.team"     },
  { id: "notes",    icon: "notes",          labelKey: "project.tabs.notes"    },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

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

  const project: Project = MOCK_PROJECTS[id] ?? MOCK_PROJECTS["1"];

  const [activeTab, setActiveTab] = useState<TabId>("gallery");
  const [notes, setNotes] = useState<Note[]>(project.notes);
  const [photos, setPhotos] = useState<Photo[]>(project.photos);
  const [team, setTeam] = useState<TeamMember[]>(project.team);
  const [filterTag, setFilterTag] = useState<string | null>(null);

  const tabAnim = useRef(new RNAnimated.Value(0)).current;

  const switchTab = (tab: TabId) => {
    Haptics.selectionAsync();
    setActiveTab(tab);
  };

  const handleAddPhoto = () => {
    router.push({ pathname: "/add-photo-modal", params: { projectId: project.id } });
  };

  const openInviteModal = useCallback(() => {
    const promise = inviteMemberStore.open();
    router.push({ pathname: "/modals/invite-member", params: { projectId: project.id } });
    promise.then((result) => {
      if (!result) return;
      const initials = result.name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("");
      const palette = ["#007AFF", "#FF2D55", "#FF9500", "#4CD964", "#5856D6", "#FF3B30", "#34C759"];
      const color = palette[Math.floor(Math.random() * palette.length)];
      const newMember: TeamMember = {
        id: uid(),
        name: result.name,
        role: result.role,
        initials,
        color,
        lastActivity: "Ahora",
        online: false,
      };
      setTeam((p) => [...p, newMember]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });
  }, [project.id, router]);

  const openNoteModal = useCallback(() => {
    const promise = addNoteStore.open();
    router.push({ pathname: "/modals/add-note", params: { projectId: project.id } });
    promise.then((result) => {
      if (!result) return;
      const newNote: Note = {
        id: uid(),
        author: "Tú",
        initials: "TU",
        authorColor: colors.primary,
        content: result.text,
        date: "Ahora",
        pinned: false,
      };
      setNotes((p) => [newNote, ...p]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });
  }, [project.id, colors.primary, router]);

  const openLightbox = useCallback((photo: Photo) => {
    router.push({
      pathname: "/modals/photo-lightbox",
      params: {
        url: photo.url,
        caption: photo.caption,
        date: photo.date,
        tags: JSON.stringify(photo.tags),
        projectId: project.id,
      },
    });
  }, [project.id, router]);

  const togglePin = (noteId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotes((p) => p.map((n) => n.id === noteId ? { ...n, pinned: !n.pinned } : n));
  };

  const deleteNote = (noteId: string) => {
    Alert.alert(t("project.deleteNoteTitle"), t("project.deleteNoteConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => setNotes((p) => p.filter((n) => n.id !== noteId)),
      },
    ]);
  };

  const allTags = Array.from(new Set(photos.flatMap((p) => p.tags)));
  const filteredPhotos = filterTag
    ? photos.filter((p) => p.tags.includes(filterTag))
    : photos;

  // ─── Tab: Gallery ─────────────────────────────────────────────────────────

  const renderGallery = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Tag filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
      >
        <TouchableOpacity
          onPress={() => setFilterTag(null)}
          style={[
            styles.tag,
            { backgroundColor: !filterTag ? colors.primary : colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={{ color: !filterTag ? "#FFF" : colors.muted, fontSize: 12, fontWeight: "600" }}>
            {t("project.all")}
          </Text>
        </TouchableOpacity>
        {allTags.map((tag) => (
          <TouchableOpacity
            key={tag}
            onPress={() => setFilterTag(filterTag === tag ? null : tag)}
            style={[
              styles.tag,
              { backgroundColor: filterTag === tag ? colors.primary : colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={{ color: filterTag === tag ? "#FFF" : colors.muted, fontSize: 12, fontWeight: "600" }}>
              #{tag}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Photo count */}
      <View style={{ paddingHorizontal: 16, marginBottom: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: colors.muted, fontSize: 13 }}>
          {filteredPhotos.length} {filteredPhotos.length === 1 ? t("project.photo") : t("project.photos")}
        </Text>
        <TouchableOpacity
          onPress={handleAddPhoto}
          style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.primary + "20", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}
        >
          <MaterialIcons name="add-a-photo" size={16} color={colors.primary} />
          <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "700" }}>{t("project.add")}</Text>
        </TouchableOpacity>
      </View>

      {/* Grid */}
      <View style={{ paddingHorizontal: 16 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {filteredPhotos.map((photo) => (
            <TouchableOpacity
              key={photo.id}
              onPress={() => openLightbox(photo)}
              style={{ width: (W - 40) / 2, borderRadius: 16, overflow: "hidden" }}
            >
              <Image source={{ uri: photo.url }} style={{ width: "100%", height: 150 }} resizeMode="cover" />
              <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.55)", padding: 8 }}>
                <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "600" }} numberOfLines={1}>
                  {photo.caption}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, marginTop: 2 }}>
                  {photo.date}
                </Text>
              </View>
              {/* Annotate shortcut */}
              <TouchableOpacity
                onPress={() => router.push({ pathname: "/image-editor", params: { imageUri: photo.url, projectId: project.id } })}
                style={{ position: "absolute", top: 8, right: 8, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 20, padding: 6 }}
              >
                <MaterialIcons name="edit" size={14} color="#FFF" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {filteredPhotos.length === 0 && (
          <View style={{ alignItems: "center", paddingVertical: 48 }}>
            <MaterialIcons name="photo-library" size={48} color={colors.border} />
            <Text style={{ color: colors.muted, marginTop: 12, fontSize: 15 }}>
              {t("project.noPhotos")}{filterTag ? ` #${filterTag}` : ""}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  // ─── Tab: Timeline ────────────────────────────────────────────────────────

  const renderTimeline = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, paddingTop: 8 }}>
      {project.timeline.map((event, idx) => {
        const iconName = timelineIcon(event.type);
        const iconColor = timelineColor(event.type, colors);
        const isLast = idx === project.timeline.length - 1;
        return (
          <View key={event.id} style={{ flexDirection: "row", gap: 12 }}>
            {/* Line + icon */}
            <View style={{ alignItems: "center", width: 36 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: iconColor + "20", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
                <MaterialIcons name={iconName as any} size={18} color={iconColor} />
              </View>
              {!isLast && <View style={{ width: 2, flex: 1, backgroundColor: colors.border, marginTop: 4 }} />}
            </View>

            {/* Content */}
            <View style={{ flex: 1, paddingBottom: isLast ? 0 : 20 }}>
              <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 4 }}>{event.date}</Text>
              <View style={[styles.cardBase, cardElevation]}>
                <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "700", marginBottom: 4 }}>
                  {event.title}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 18 }}>
                  {event.description}
                </Text>
                {event.photoUrl && (
                  <Image
                    source={{ uri: event.photoUrl }}
                    style={{ width: "100%", height: 120, borderRadius: 10, marginTop: 10 }}
                    resizeMode="cover"
                  />
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
    <View style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 8 }}>
        {/* Stats row */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
          {[
            { label: t("project.members"),    value: team.length,                          icon: "group",               color: colors.primary },
            { label: t("project.activeToday"), value: team.filter((m) => m.online).length, icon: "fiber-manual-record", color: colors.success },
          ].map((stat) => (
            <View key={stat.label} style={[styles.statCard, cardSmElevation, { flex: 1 }]}>
              <MaterialIcons name={stat.icon as any} size={22} color={stat.color} />
              <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: "800", marginTop: 6 }}>{stat.value}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Members list */}
        {team.map((member) => (
          <View key={member.id} style={[styles.cardBase, cardElevation, { marginBottom: 12, flexDirection: "row", alignItems: "center" }]}>
            {/* Avatar */}
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: member.color + "25", alignItems: "center", justifyContent: "center", marginRight: 14 }}>
              <Text style={{ color: member.color, fontSize: 16, fontWeight: "800" }}>{member.initials}</Text>
            </View>
            {/* Info */}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: "700" }}>{member.name}</Text>
                {member.online && (
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success }} />
                )}
              </View>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "600", marginTop: 2 }}>{member.role}</Text>
              <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>
                {t("project.active")}: {member.lastActivity}
              </Text>
            </View>
            {/* Actions */}
            <TouchableOpacity
              onPress={() => Alert.alert(t("project.messageTitle"), t("project.messageTo", { name: member.name }))}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary + "15", alignItems: "center", justifyContent: "center" }}
            >
              <MaterialIcons name="chat" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        onPress={openInviteModal}
        style={[styles.fab, { backgroundColor: colors.primary }]}
      >
        <MaterialIcons name="person-add" size={26} color="#FFF" />
      </TouchableOpacity>
    </View>
  );

  // ─── Tab: Notes ───────────────────────────────────────────────────────────

  const sortedNotes = [...notes].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  const renderNotes = () => (
    <View style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 8 }}>
        {sortedNotes.length === 0 && (
          <View style={{ alignItems: "center", paddingVertical: 48 }}>
            <MaterialIcons name="notes" size={48} color={colors.border} />
            <Text style={{ color: colors.muted, marginTop: 12, fontSize: 15 }}>{t("project.noNotes")}</Text>
          </View>
        )}
        {sortedNotes.map((note) => (
          <View
            key={note.id}
            style={[
              styles.cardBase,
              cardElevation,
              {
                borderColor: note.pinned ? colors.warning : (cardElevation as any).borderColor,
                borderWidth: note.pinned ? 1.5 : (cardElevation as any).borderWidth ?? 0,
                marginBottom: 12,
              },
            ]}
          >
            {note.pinned && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 }}>
                <MaterialIcons name="push-pin" size={12} color={colors.warning} />
                <Text style={{ color: colors.warning, fontSize: 11, fontWeight: "700" }}>{t("project.pinned")}</Text>
              </View>
            )}
            {/* Author row */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: note.authorColor + "25", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
                <Text style={{ color: note.authorColor, fontSize: 12, fontWeight: "800" }}>{note.initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "700" }}>{note.author}</Text>
                <Text style={{ color: colors.muted, fontSize: 11 }}>{note.date}</Text>
              </View>
              {/* Actions */}
              <TouchableOpacity onPress={() => togglePin(note.id)} style={{ padding: 6 }}>
                <MaterialIcons name="push-pin" size={18} color={note.pinned ? colors.warning : colors.muted} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteNote(note.id)} style={{ padding: 6 }}>
                <MaterialIcons name="delete-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
            <Text style={{ color: colors.foreground, fontSize: 14, lineHeight: 20 }}>{note.content}</Text>
          </View>
        ))}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => openNoteModal()}
        style={[styles.fab, { backgroundColor: colors.primary }]}
      >
        <MaterialIcons name="add" size={28} color="#FFF" />
      </TouchableOpacity>
    </View>
  );

  // ─── Main Render ──────────────────────────────────────────────────────────

  return (
    <ScreenContainer className="p-0">
      <View style={{ flex: 1, backgroundColor: colors.background }}>

        {/* ── Header ── */}
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: "700" }} numberOfLines={1}>
              {project.name}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
              <MaterialIcons name="location-on" size={12} color={colors.muted} />
              <Text style={{ color: colors.muted, fontSize: 12 }} numberOfLines={1}>{project.location}</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={handleAddPhoto}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary + "15", alignItems: "center", justifyContent: "center" }}
            >
              <MaterialIcons name="add-a-photo" size={18} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push({
                pathname: "/modals/project-settings",
                params: { projectId: project.id, projectName: project.name, projectLocation: project.location },
              })}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}
            >
              <MaterialIcons name="more-vert" size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Hero card ── */}
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
          <View style={[styles.heroCard, cardElevation]}>
            <Image source={{ uri: project.thumbnail }} style={styles.heroImg} resizeMode="cover" />
            <View style={{ padding: 14 }}>
              {/* Progress */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "600" }}>
                  {t("project.projectProgress")}
                </Text>
                <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "800" }}>{project.progress}%</Text>
              </View>
              <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: "hidden" }}>
                <View style={{ height: "100%", width: `${project.progress}%`, backgroundColor: colors.primary, borderRadius: 3 }} />
              </View>
              {/* Dates */}
              <View style={{ flexDirection: "row", gap: 16, marginTop: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <MaterialIcons name="event" size={13} color={colors.muted} />
                  <Text style={{ color: colors.muted, fontSize: 12 }}>
                    {t("project.start")}: {project.startDate}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <MaterialIcons name="event-available" size={13} color={colors.muted} />
                  <Text style={{ color: colors.muted, fontSize: 12 }}>
                    {t("project.end")}: {project.endDate}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ── Tabs ── */}
        <View style={[styles.tabBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => switchTab(tab.id)}
                style={[styles.tabItem, active && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              >
                <MaterialIcons name={tab.icon as any} size={20} color={active ? colors.primary : colors.muted} />
                <Text style={{ color: active ? colors.primary : colors.muted, fontSize: 12, fontWeight: active ? "700" : "500", marginTop: 2 }}>
                  {t(tab.labelKey)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Tab content ── */}
        <View style={{ flex: 1 }}>
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

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },
  heroCard: {
    borderRadius: 20, borderWidth: 1, overflow: "hidden",
  },
  heroImg: { width: "100%", height: 140 },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    marginTop: 8,
  },
  tabItem: {
    flex: 1, alignItems: "center", paddingVertical: 10,
    borderBottomWidth: 2, borderBottomColor: "transparent",
  },
  cardBase: {
    borderRadius: 16, padding: 14,
  },
  statCard: {
    borderRadius: 16, padding: 14,
    alignItems: "center",
  },
  tag: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
  },
  fab: {
    position: "absolute", bottom: 24, right: 20,
    width: 56, height: 56, borderRadius: 28,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 8,
  },
});
