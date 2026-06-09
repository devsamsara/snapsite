import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useCardStyle, useCardStyleSm } from '@/hooks/use-card-style';
import { useCallback, useEffect, useRef, useState } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { AppAlert } from '@/components/ui/app-alert';
import { ProjectDetailSkeleton } from '@/components/project-detail-skeleton';
import { GalleryPhotoSkeleton } from '@/components/gallery-photo-skeleton';
import { useMutation, useQuery } from '@apollo/client/react';
import {
  DeleteNoteDocument,
  FindProjectDocument,
  GetMyProjectsDocument,
  Photo,
  Project,
  TimelineEvent,
  TogglePinNoteDocument,
} from '@/gql/graphql';
import { useRelativeDate } from '@/hooks/use-relative-date';
import moment from 'moment';

const { width: W } = Dimensions.get('window');

type TabId = 'gallery' | 'timeline' | 'team' | 'notes';

const TABS: { id: TabId; icon: string; labelKey: string }[] = [
  { id: 'gallery', icon: 'photo-library', labelKey: 'project.tabs.gallery' },
  { id: 'timeline', icon: 'timeline', labelKey: 'project.tabs.timeline' },
  { id: 'team', icon: 'group', labelKey: 'project.tabs.team' },
  { id: 'notes', icon: 'notes', labelKey: 'project.tabs.notes' },
];

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function timelineIcon(type: TimelineEvent['type']) {
  switch (type) {
    case 'photo':
      return 'photo-camera';
    case 'note':
      return 'notes';
    case 'milestone':
      return 'flag';
    case 'team':
      return 'person-add';
  }
}

function timelineColor(type: TimelineEvent['type'], colors: any) {
  switch (type) {
    case 'photo':
      return colors.primary;
    case 'note':
      return colors.warning;
    case 'milestone':
      return colors.success;
    case 'team':
      return '#FF2D55';
  }
}

export default function ProjectDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const cardElevation = useCardStyle();
  const cardSmElevation = useCardStyleSm();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [removeNote] = useMutation(DeleteNoteDocument);
  const [togglePinNote] = useMutation(TogglePinNoteDocument);
  const { data, loading: queryLoading } = useQuery(FindProjectDocument, {
    variables: {
      findProjectId: id,
    },
  });
  const isLoading = false;
  // Contador de imágenes cargadas para el skeleton de galería
  const [imagesLoaded, setImagesLoaded] = useState(0);
  const loadedCountRef = useRef(0);

  const [activeTab, setActiveTab] = useState<TabId>('gallery');
  const [photos, setPhotos] = useState<Photo[] | undefined>();
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [project, setProject] = useState<Project | undefined>();
  const relativeDate = useRelativeDate();

  useEffect(() => {
    const loadProyect = () => {
      if (data) {
        setProject(data.findProject);
        // Resetear contador de imágenes al recibir nuevas fotos
        loadedCountRef.current = 0;
        setImagesLoaded(0);
        setPhotos(data.findProject.photos);
      }
    };
    loadProyect();
  }, [data, project]);

  const switchTab = (tab: TabId) => {
    Haptics.selectionAsync();
    setActiveTab(tab);
  };

  const handleAddPhoto = () => {
    if (project)
      router.push({
        pathname: '/add-photo-modal',
        params: { projectId: project.id },
      });
  };

  const openInviteModal = useCallback(() => {
    router.push({
      pathname: '/modals/invite-member',
      params: { projectId: project!.id },
    });
  }, [project, router]);

  const openNoteModal = useCallback(() => {
    router.push({
      pathname: '/modals/add-note',
      params: { projectId: project!.id },
    });
  }, [router, project]);

  const openLightbox = useCallback(
    (photo: Photo) => {
      if (project)
        router.push({
          pathname: '/modals/photo-lightbox',
          params: {
            url: photo.url,
            caption: photo.caption,
            date: photo.createdAt,
            tags: JSON.stringify(photo.tags),
            photoId: photo.id,
            projectId: project.id,
          },
        });
    },
    [project, router]
  );

  const togglePin = async (noteId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    await togglePinNote({
      variables: {
        togglePinNoteId: noteId,
      },
      refetchQueries: [FindProjectDocument, GetMyProjectsDocument],
    });
  };

  const deleteNote = (noteId: string) => {
    AppAlert.alert(
      t('project.deleteNoteTitle'),
      t('project.deleteNoteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await removeNote({
              variables: {
                deleteNoteId: noteId,
              },
              refetchQueries: [FindProjectDocument, GetMyProjectsDocument],
            });
          },
        },
      ]
    );
  };

  const allTags = Array.from(new Set(photos?.flatMap(p => p.tags)));
  const filteredPhotos =
    filterTag && photos
      ? photos.filter(p => p!.tags!.includes(filterTag))
      : photos;

  const renderGallery = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={S.galleryScroll}
    >
      {/* Tag filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={S.tagScroll}
      >
        <TouchableOpacity
          onPress={() => setFilterTag(null)}
          style={[
            S.tag,
            {
              backgroundColor: !filterTag ? colors.primary : colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Text
            style={[S.tagText, { color: !filterTag ? '#FFF' : colors.muted }]}
          >
            {t('project.all')}
          </Text>
        </TouchableOpacity>
        {allTags.map(tag => (
          <TouchableOpacity
            key={tag}
            onPress={() => setFilterTag(filterTag === tag ? null : tag!)}
            style={[
              S.tag,
              {
                backgroundColor:
                  filterTag === tag ? colors.primary : colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                S.tagText,
                { color: filterTag === tag ? '#FFF' : colors.muted },
              ]}
            >
              #{tag}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Photo count + add */}
      {/*<View style={S.photoCountRow}>
        <Text style={[S.photoCountText, { color: colors.muted }]}>
          {filteredPhotos?.length}{' '}
          {filteredPhotos?.length === 1
            ? t('project.photo')
            : t('project.photos')}
        </Text>
        <TouchableOpacity
          onPress={handleAddPhoto}
          style={[S.addPhotoBtn, { backgroundColor: colors.primary + '20' }]}
        >
          <MaterialIcons name="add-a-photo" size={16} color={colors.primary} />
          <Text style={[S.addPhotoBtnText, { color: colors.primary }]}>
            {t('project.add')}
          </Text>
        </TouchableOpacity>
      </View>*/}

      {/* Grid — skeleton mientras carga o mientras las imágenes no han terminado de renderizar */}
      {queryLoading && <GalleryPhotoSkeleton count={photos?.length || 6} />}
      <View
        style={[S.gridWrapper, { display: queryLoading ? 'none' : 'flex' }]}
      >
        <View style={S.grid}>
          {filteredPhotos?.map(photo => (
            <TouchableOpacity
              key={photo.id}
              onPress={() => openLightbox(photo)}
              style={[S.gridItem, { width: (W - 40) / 2 }]}
            >
              <Image
                source={{ uri: photo.url }}
                style={S.gridItemImg}
                resizeMode="cover"
                onLoadEnd={() => {
                  loadedCountRef.current += 1;
                  setImagesLoaded(loadedCountRef.current);
                }}
              />
              <View style={S.gridItemOverlay}>
                <Text style={S.gridItemCaption} numberOfLines={1}>
                  {photo.caption}
                </Text>
                <Text style={S.gridItemDate}>
                  {relativeDate(Number.parseInt(photo.createdAt))}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/image-editor',
                    params: {
                      imageUri: photo.url,
                      projectId: project!.id,
                      photoId: photo.id,
                    },
                  })
                }
                style={S.gridItemEditBtn}
              >
                <MaterialIcons name="edit" size={14} color="#FFF" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
        {filteredPhotos?.length === 0 && (
          <View style={S.emptyState}>
            <View
              style={[
                S.emptyIconWrap,
                { backgroundColor: colors.border + '40' },
              ]}
            >
              <MaterialIcons
                name="photo-library"
                size={36}
                color={colors.muted}
              />
            </View>
            <Text style={[S.emptyTitle, { color: colors.foreground }]}>
              {filterTag
                ? `${t('project.noPhotos')} #${filterTag}`
                : t('project.noPhotos')}
            </Text>
            {!filterTag && (
              <Text style={[S.emptyHint, { color: colors.muted }]}>
                {t('project.noPhotosHint')}
              </Text>
            )}
            {!filterTag && (
              <TouchableOpacity
                onPress={handleAddPhoto}
                style={[S.emptyBtn, { backgroundColor: colors.primary }]}
              >
                <MaterialIcons name="add-a-photo" size={16} color="#FFF" />
                <Text style={S.emptyBtnText}>{t('project.addFirstPhoto')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderTimeline = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={S.timelineScroll}
    >
      {(!project?.timeline || project.timeline.length === 0) && (
        <View style={S.emptyState}>
          <View
            style={[S.emptyIconWrap, { backgroundColor: colors.border + '40' }]}
          >
            <MaterialIcons name="timeline" size={36} color={colors.muted} />
          </View>
          <Text style={[S.emptyTitle, { color: colors.foreground }]}>
            {t('project.noTimeline')}
          </Text>
          <Text style={[S.emptyHint, { color: colors.muted }]}>
            {t('project.noTimelineHint')}
          </Text>
        </View>
      )}
      {project?.timeline?.map((event, idx) => {
        const iconName = timelineIcon(event.type);
        const iconColor = timelineColor(event.type, colors);
        const isLast = idx === project!.timeline!.length - 1;
        return (
          <View key={event.id} style={S.timelineRow}>
            <View style={S.timelineIconCol}>
              <View
                style={[
                  S.timelineIconBg,
                  { backgroundColor: iconColor + '20' },
                ]}
              >
                <MaterialIcons
                  name={iconName as any}
                  size={18}
                  color={iconColor}
                />
              </View>
              {!isLast && (
                <View
                  style={[S.timelineLine, { backgroundColor: colors.border }]}
                />
              )}
            </View>
            <View style={[S.timelineContent, isLast && S.timelineContentLast]}>
              <Text style={[S.timelineDate, { color: colors.muted }]}>
                {relativeDate(Number.parseInt(event.createdAt))}
              </Text>
              <View style={[S.cardBase, cardElevation]}>
                <Text style={[S.timelineTitle, { color: colors.foreground }]}>
                  {event.title}
                </Text>
                <Text style={[S.timelineDesc, { color: colors.muted }]}>
                  {event.description}
                </Text>
                {event.photoUrl && (
                  <Image
                    source={{ uri: event.photoUrl }}
                    style={S.timelinePhoto}
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

  const isActive = project?.members.filter(
    m => Number.parseInt(m.lastLoginAt!) >= Date.now()
  ).length;

  const renderTeam = () => (
    <View style={S.flex1}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={S.teamScroll}
      >
        {/* Stats row */}
        <View style={S.statsRow}>
          {[
            {
              label: t('project.members'),
              value: project?.members?.length,
              icon: 'group',
              color: colors.primary,
            },
            {
              label: t('project.activeToday'),
              value: isActive ?? 0,
              icon: 'fiber-manual-record',
              color: isActive ? colors.success : colors.error,
            },
          ].map(stat => (
            <View
              key={stat.label}
              style={[S.statCard, cardSmElevation, S.flex1]}
            >
              <MaterialIcons
                name={stat.icon as any}
                size={22}
                color={stat.color}
              />
              <Text style={[S.statValue, { color: colors.foreground }]}>
                {stat.value}
              </Text>
              <Text style={[S.statLabel, { color: colors.muted }]}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Members list */}
        {project?.members.map(member => (
          <View
            key={member.id}
            style={[S.cardBase, cardElevation, S.memberCard]}
          >
            <View style={[S.memberAvatar, { backgroundColor: 'blue' + '25' }]}>
              <Text style={[S.memberInitials, { color: 'blue' }]}>
                {member.name.at(0)?.toUpperCase()}
              </Text>
            </View>
            <View style={S.flex1}>
              <View style={S.memberNameRow}>
                <Text style={[S.memberName, { color: colors.foreground }]}>
                  {member.name}
                </Text>
                {
                  <View
                    style={[
                      S.onlineDot,
                      {
                        backgroundColor: isActive
                          ? colors.success
                          : colors.error,
                      },
                    ]}
                  />
                }
              </View>
              <Text style={[S.memberRole, { color: colors.primary }]}>
                {member.role}
              </Text>
              <Text style={[S.memberActivity, { color: colors.muted }]}>
                {t('project.active')}: {member.lastLoginAt}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                AppAlert.alert(
                  t('project.messageTitle'),
                  t('project.messageTo', { name: member.name })
                )
              }
              style={[S.chatBtn, { backgroundColor: colors.primary + '15' }]}
            >
              <MaterialIcons name="chat" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        onPress={openInviteModal}
        style={[S.fab, { backgroundColor: colors.primary }]}
      >
        <MaterialIcons name="person-add" size={26} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
  const sortedNotes = [...(project?.notes ?? [])].sort(
    (a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)
  );

  const renderNotes = () =>
    sortedNotes && (
      <View style={S.flex1}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={S.notesScroll}
        >
          {sortedNotes.length === 0 && (
            <View style={S.emptyState}>
              <View
                style={[
                  S.emptyIconWrap,
                  { backgroundColor: colors.border + '40' },
                ]}
              >
                <MaterialIcons name="notes" size={36} color={colors.muted} />
              </View>
              <Text style={[S.emptyTitle, { color: colors.foreground }]}>
                {t('project.noNotes')}
              </Text>
              <Text style={[S.emptyHint, { color: colors.muted }]}>
                {t('project.noNotesHint')}
              </Text>
              <TouchableOpacity
                onPress={() => openNoteModal()}
                style={[S.emptyBtn, { backgroundColor: colors.primary }]}
              >
                <MaterialIcons name="add" size={16} color="#FFF" />
                <Text style={S.emptyBtnText}>{t('project.addFirstNote')}</Text>
              </TouchableOpacity>
            </View>
          )}
          {sortedNotes.map(note => (
            <View
              key={note.id}
              style={[
                S.cardBase,
                cardElevation,
                S.noteCard,
                {
                  borderColor: note.pinned
                    ? colors.warning
                    : (cardElevation as any).borderColor,
                  borderWidth: note.pinned
                    ? 1.5
                    : ((cardElevation as any).borderWidth ?? 0),
                },
              ]}
            >
              {note.pinned && (
                <View style={S.pinnedRow}>
                  <MaterialIcons
                    name="push-pin"
                    size={12}
                    color={colors.warning}
                  />
                  <Text style={[S.pinnedText, { color: colors.warning }]}>
                    {t('project.pinned')}
                  </Text>
                </View>
              )}
              <View style={S.noteAuthorRow}>
                <View
                  style={[
                    S.noteAuthorAvatar,
                    { backgroundColor: colors.success + '25' },
                  ]}
                >
                  <Text style={[S.noteAuthorInitials, { color: colors.text }]}>
                    {note.author.name.at(0)?.toUpperCase()}
                  </Text>
                </View>
                <View style={S.flex1}>
                  <Text
                    style={[S.noteAuthorName, { color: colors.foreground }]}
                  >
                    {note.author.name}
                  </Text>
                  <Text style={[S.noteDate, { color: colors.muted }]}>
                    {relativeDate(Number.parseInt(note.createdAt))}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => togglePin(note.id)}
                  style={S.noteAction}
                >
                  <MaterialIcons
                    name="push-pin"
                    size={18}
                    color={note.pinned ? colors.warning : colors.muted}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => deleteNote(note.id)}
                  style={S.noteAction}
                >
                  <MaterialIcons
                    name="delete-outline"
                    size={18}
                    color={colors.error}
                  />
                </TouchableOpacity>
              </View>
              <Text style={[S.noteContent, { color: colors.foreground }]}>
                {note.content}
              </Text>
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity
          onPress={() => openNoteModal()}
          style={[S.fab, { backgroundColor: colors.primary }]}
        >
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
    project && (
      <ScreenContainer className="p-0">
        <View style={[S.flex1, { backgroundColor: colors.background }]}>
          {/* ── Header ── */}
          <View
            style={[
              S.header,
              {
                backgroundColor: colors.background,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <TouchableOpacity onPress={() => router.back()} style={S.backBtn}>
              <MaterialIcons
                name="arrow-back"
                size={22}
                color={colors.foreground}
              />
            </TouchableOpacity>
            <View style={S.headerTitleWrapper}>
              <Text
                style={[S.headerTitle, { color: colors.foreground }]}
                numberOfLines={1}
              >
                {project.name}
              </Text>
              <View style={S.headerLocationRow}>
                <MaterialIcons
                  name="location-on"
                  size={12}
                  color={colors.muted}
                />
                <Text
                  style={[S.headerLocation, { color: colors.muted }]}
                  numberOfLines={1}
                >
                  {project.location}
                </Text>
              </View>
            </View>
            <View style={S.headerActions}>
              <TouchableOpacity
                onPress={handleAddPhoto}
                style={[
                  S.headerActionBtn,
                  { backgroundColor: colors.primary + '15' },
                ]}
              >
                <MaterialIcons
                  name="add-a-photo"
                  size={18}
                  color={colors.primary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/modals/project-settings',
                    params: {
                      projectId: project.id,
                      projectName: project.name,
                      projectLocation: project.location,
                    },
                  })
                }
                style={[
                  S.headerActionBtn,
                  {
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                  },
                ]}
              >
                <MaterialIcons
                  name="more-vert"
                  size={20}
                  color={colors.foreground}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Hero card ── */}
          <View style={S.heroWrapper}>
            <View style={[S.heroCard, cardElevation]}>
              {project.thumbnail ? (
                <Image
                  source={{ uri: project.thumbnail }}
                  style={S.heroImg}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    S.heroImg,
                    S.heroImgPlaceholder,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <View
                    style={[
                      S.heroImgPlaceholderIcon,
                      { backgroundColor: colors.border + '60' },
                    ]}
                  >
                    <MaterialIcons
                      name="photo-camera"
                      size={36}
                      color={colors.muted}
                    />
                  </View>
                  <Text
                    style={[S.heroImgPlaceholderText, { color: colors.muted }]}
                  >
                    {t('project.noThumbnail')}
                  </Text>
                </View>
              )}
              <View style={S.heroBody}>
                <View style={S.progressLabelRow}>
                  <Text style={[S.progressLabel, { color: colors.foreground }]}>
                    {t('project.projectProgress')}
                  </Text>
                  <Text style={[S.progressValue, { color: colors.primary }]}>
                    {project.progress}%
                  </Text>
                </View>
                <View
                  style={[S.progressTrack, { backgroundColor: colors.border }]}
                >
                  <View
                    style={[
                      S.progressFill,
                      {
                        width: `${project.progress}%`,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>
                <View style={S.datesRow}>
                  <View style={S.dateItem}>
                    <MaterialIcons
                      name="event"
                      size={13}
                      color={colors.muted}
                    />
                    <Text style={[S.dateText, { color: colors.muted }]}>
                      {t('project.start')}:{' '}
                      {moment(Number.parseInt(project.startDate)).format(
                        'MMMM DD, YYYY'
                      )}
                    </Text>
                  </View>
                  <View style={S.dateItem}>
                    <MaterialIcons
                      name="event-available"
                      size={13}
                      color={colors.muted}
                    />
                    <Text style={[S.dateText, { color: colors.muted }]}>
                      {t('project.end')}:{' '}
                      {project.endDate
                        ? moment(Number.parseInt(project.startDate)).format(
                            'MMMM DD, YYYY'
                          )
                        : '...'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* ── Tabs ── */}
          <View
            style={[
              S.tabBar,
              {
                backgroundColor: colors.background,
                borderBottomColor: colors.border,
              },
            ]}
          >
            {TABS.map(tab => {
              const active = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => switchTab(tab.id)}
                  style={[
                    S.tabItem,
                    active && {
                      borderBottomColor: colors.primary,
                      borderBottomWidth: 2,
                    },
                  ]}
                >
                  <MaterialIcons
                    name={tab.icon as any}
                    size={20}
                    color={active ? colors.primary : colors.muted}
                  />
                  <Text
                    style={[
                      S.tabLabel,
                      {
                        color: active ? colors.primary : colors.muted,
                        fontWeight: active ? '700' : '500',
                      },
                    ]}
                  >
                    {t(tab.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Tab content ── */}
          <View style={S.flex1}>
            {activeTab === 'gallery' && renderGallery()}
            {activeTab === 'timeline' && renderTimeline()}
            {activeTab === 'team' && renderTeam()}
            {activeTab === 'notes' && renderNotes()}
          </View>
        </View>
      </ScreenContainer>
    )
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  // Layout
  flex1: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrapper: { flex: 1, marginHorizontal: 12 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  headerLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  headerLocation: { fontSize: 12 },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Hero
  heroWrapper: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  heroCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  heroImg: { width: '100%', height: 140 },
  heroImgPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  heroImgPlaceholderIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImgPlaceholderText: { fontSize: 13, fontWeight: '500' as const },
  heroBody: { padding: 14 },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: { fontSize: 13, fontWeight: '600' },
  progressValue: { fontSize: 13, fontWeight: '800' },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  datesRow: { flexDirection: 'row', gap: 16, marginTop: 10 },
  dateItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 12 },

  // Tabs
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, marginTop: 8 },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabLabel: { fontSize: 12, marginTop: 2 },

  // Shared card
  cardBase: { borderRadius: 16, padding: 14 },

  // Gallery
  galleryScroll: { paddingBottom: 32 },
  tagScroll: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagText: { fontSize: 12, fontWeight: '600' },
  photoCountRow: {
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photoCountText: { fontSize: 13 },
  addPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addPhotoBtnText: { fontSize: 13, fontWeight: '700' },
  gridWrapper: { paddingHorizontal: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridItem: { borderRadius: 16, overflow: 'hidden' },
  gridItemImg: { width: '100%', height: 150 },
  gridItemOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: 8,
  },
  gridItemCaption: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  gridItemDate: { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 2 },
  gridItemEditBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 56,
    paddingHorizontal: 32,
  },
  emptyStateText: { marginTop: 12, fontSize: 15 },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },

  // Timeline
  timelineScroll: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 8 },
  timelineRow: { flexDirection: 'row', gap: 12 },
  timelineIconCol: { alignItems: 'center', width: 36 },
  timelineIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timelineLine: { width: 2, flex: 1, marginTop: 4 },
  timelineContent: { flex: 1, paddingBottom: 20 },
  timelineContentLast: { paddingBottom: 0 },
  timelineDate: { fontSize: 11, marginBottom: 4 },
  timelineTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  timelineDesc: { fontSize: 13, lineHeight: 18 },
  timelinePhoto: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    marginTop: 10,
  },

  // Team
  teamScroll: { paddingHorizontal: 16, paddingBottom: 100, paddingTop: 8 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: { borderRadius: 16, padding: 14, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', marginTop: 6 },
  statLabel: { fontSize: 12 },
  memberCard: { marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  memberInitials: { fontSize: 16, fontWeight: '800' },
  memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  memberName: { fontSize: 15, fontWeight: '700' },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  memberRole: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  memberActivity: { fontSize: 11, marginTop: 2 },
  chatBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Notes
  notesScroll: { paddingHorizontal: 16, paddingBottom: 100, paddingTop: 8 },
  noteCard: { marginBottom: 12 },
  pinnedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  pinnedText: { fontSize: 11, fontWeight: '700' },
  noteAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  noteAuthorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  noteAuthorInitials: { fontSize: 12, fontWeight: '800' },
  noteAuthorName: { fontSize: 13, fontWeight: '700' },
  noteDate: { fontSize: 11 },
  noteAction: { padding: 6 },
  noteContent: { fontSize: 14, lineHeight: 20 },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
});
