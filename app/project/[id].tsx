import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '@/components/screen-container';
import { GlassView } from '@/components/ui/glass-view';
import { HeroBackdrop } from '@/components/ui/hero-backdrop';
import { useColors } from '@/hooks/use-colors';
import { useCardStyle, useCardStyleSm } from '@/hooks/use-card-style';
import { useCallback, useEffect, useRef, useState } from 'react';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  DeleteNoteDocument,
  FindProjectDocument,
  GetMyProjectsDocument,
  Photo,
  Project,
  ProjectStatus,
  TimelineEvent,
  TogglePinNoteDocument,
} from '@/gql/graphql';
import { useMutation, useQuery } from '@apollo/client/react';
import { useRelativeDate } from '@/hooks/use-relative-date';
import { PressableScale } from '@/components/ui/pressable-scale';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppAlert } from '@/components/ui/app-alert';
import { usePhotoPicker } from '@/hooks/use-photo-picker';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { uploadPhoto } from '@/lib/upload-service';
import moment from 'moment';
import { GalleryPhotoSkeleton } from '@/components/gallery-photo-skeleton';

const { width: W } = Dimensions.get('window');

type TabId = 'gallery' | 'timeline' | 'team' | 'notes';

const TABS: { id: TabId; icon: string; labelKey: string }[] = [
  { id: 'gallery', icon: 'photo-library', labelKey: 'project.tabs.gallery' },
  { id: 'timeline', icon: 'timeline', labelKey: 'project.tabs.timeline' },
  { id: 'team', icon: 'group', labelKey: 'project.tabs.team' },
  { id: 'notes', icon: 'notes', labelKey: 'project.tabs.notes' },
];

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

export default function SettingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const cardElevation = useCardStyle();
  const cardSmElevation = useCardStyleSm();
  const { id, source } = useLocalSearchParams<{
    id: string;
    source?: string;
  }>();

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
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const relativeDate = useRelativeDate();

  const isArchived = project?.status === ProjectStatus.Archived;
  const enterOpacity = useSharedValue(0);
  const enterScale = useSharedValue(1.06);
  const insets = useSafeAreaInsets();

  const scrollY = useSharedValue(0);

  useEffect(() => {
    const loadProyect = () => {
      if (data) {
        setProject(data.findProject as Project);
        // Resetear contador de imágenes al recibir nuevas fotos
        loadedCountRef.current = 0;
        setImagesLoaded(0);
        setPhotos(data.findProject.photos);
      }
    };
    loadProyect();
  }, [data, project]);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 130], [1, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, 160],
          [0, -44],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const stickyBarStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [70, 120], [0, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [70, 120],
          [-10, 0],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  useEffect(() => {
    enterOpacity.value = withTiming(1, {
      duration: 400,
      easing: Easing.out(Easing.quad),
    });
    enterScale.value = withSpring(1, {
      damping: 22,
      stiffness: 160,
      mass: 0.8,
    });
  }, []);

  const enterStyle = useAnimatedStyle(() => ({
    flex: 1,
    opacity: enterOpacity.value,
    transform: [{ scale: enterScale.value }],
  }));

  const Sl = ({ label }: { label: string }) => (
    <Text style={[S.sectionLabel, { color: colors.muted }]}>
      {label.toUpperCase()}
    </Text>
  );
  const handleBack = () => {
    router.dismissAll();
    router.push('/(tabs)/projects');
  };

  const handleArchivedBlock = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    AppAlert.alert(
      t('project.archivedBanner'),
      t('project.archivedBlockedMsg')
    );
  };

  const switchTab = (tab: TabId) => {
    Haptics.selectionAsync();
    setActiveTab(tab);
  };

  const pickAndUploadPhoto = useCallback(
    async (source: 'camera' | 'library') => {
      if (!project) return;

      try {
        let result: ImagePicker.ImagePickerResult;

        if (source === 'camera') {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) {
            AppAlert.alert(
              t('common.permissionRequired'),
              t('project.cameraPermissionMsg')
            );
            return;
          }
          result = await ImagePicker.launchCameraAsync({
            quality: 0.9,
            allowsEditing: false,
          });
        } else {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) {
            AppAlert.alert(
              t('common.permissionRequired'),
              t('project.galleryPermissionMsg')
            );
            return;
          }
          result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.9,
            allowsEditing: false,
          });
        }

        if (result.canceled || !result.assets?.[0]) return;

        const localUri = result.assets[0].uri;

        setIsUploadingPhoto(true);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // uploadPhoto ya hace ensureFileUri + presigned PUT a S3 + addPhoto mutation
        await uploadPhoto({
          localUri,
          projectId: project.id,
          caption: `thumbnail_${project.id}`,
          tags: [],
        });

        // uploadPhoto dispara refetchQueries: [FindProjectDocument, GetMyProjectsDocument],
        // así que `photos`/`thumbnail` se actualizan solos vía el useEffect existente.

        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      } catch (err) {
        console.error('[pickAndUploadPhoto] error:', err);
        AppAlert.alert(t('common.error'), t('project.uploadPhotoError'));
      } finally {
        setIsUploadingPhoto(false);
      }
    },
    [project, t]
  );

  const { openCamera: _openCameraForPhoto, openGallery: _openGalleryForPhoto } =
    usePhotoPicker({ projectId: project?.id ?? '', source: 'project' });

  const handleAddPhoto = () => {
    if (!project) return;
    if (isArchived) {
      handleArchivedBlock();
      return;
    }
    Haptics.selectionAsync();
    AppAlert.alert(t('project.addPhotoTitle'), t('project.addPhotoMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('addPhotosPrompt.takePhoto'),
        onPress: () => _openCameraForPhoto(),
      },
      {
        text: t('addPhotosPrompt.selectFromGallery'),
        onPress: () => _openGalleryForPhoto(),
      },
    ]);
  };

  const handleChangeThumbnail = useCallback(() => {
    if (!project) return;
    if (isArchived) {
      handleArchivedBlock();
      return;
    }
    Haptics.selectionAsync();

    AppAlert.alert(t('project.addPhotoTitle'), t('project.addPhotoMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('addPhoto.takePhoto'),
        onPress: () => pickAndUploadPhoto('camera'),
      },
      {
        text: t('addPhoto.selectGallery'),
        onPress: () => pickAndUploadPhoto('library'),
      },
    ]);
  }, [project, t, pickAndUploadPhoto]);

  const openInviteModal = useCallback(() => {
    if (isArchived) {
      handleArchivedBlock();
      return;
    }
    router.push({
      pathname: '/modals/invite-member',
      params: { projectId: project!.id },
    });
  }, [project, router]);

  const openNoteModal = useCallback(() => {
    if (isArchived) {
      handleArchivedBlock();
      return;
    }
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
            projectStatus: project.status,
          },
        });
    },
    [project, router]
  );

  const togglePin = async (noteId: string) => {
    if (isArchived) {
      handleArchivedBlock();
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    await togglePinNote({
      variables: {
        togglePinNoteId: noteId,
      },
      refetchQueries: [FindProjectDocument, GetMyProjectsDocument],
    });
  };

  const deleteNote = (noteId: string) => {
    if (isArchived) {
      handleArchivedBlock();
      return;
    }
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
  const isActive = project?.members.filter(
    m => Number.parseInt(m.lastLoginAt as string) >= Date.now()
  ).length;

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
        <PressableScale
          onPress={() => setFilterTag(null)}
          style={[
            S.tag,
            {
              backgroundColor: filterTag ? colors.surface : colors.primary,
              borderColor: colors.border,
            },
          ]}
        >
          <Text
            style={[S.tagText, { color: filterTag ? colors.muted : '#FFF' }]}
          >
            {t('project.all')}
          </Text>
        </PressableScale>
        {allTags.map(tag => (
          <PressableScale
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
          </PressableScale>
        ))}
      </ScrollView>

      {queryLoading && <GalleryPhotoSkeleton count={photos?.length || 6} />}
      <View
        style={[S.gridWrapper, { display: queryLoading ? 'none' : 'flex' }]}
      >
        <View style={S.grid}>
          {filteredPhotos?.map(photo => (
            <PressableScale
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
              {!isArchived && (
                <PressableScale
                  onPress={() =>
                    router.push({
                      pathname: '/image-editor',
                      params: {
                        imageUri: photo.url,
                        projectId: project!.id,
                        photoId: photo.id,
                        source: 'project',
                      },
                    })
                  }
                  style={S.gridItemEditBtn}
                >
                  <MaterialIcons name="edit" size={14} color="#FFF" />
                </PressableScale>
              )}
            </PressableScale>
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
            {!filterTag && !isArchived && (
              <PressableScale
                onPress={handleAddPhoto}
                style={[S.emptyBtn, { backgroundColor: colors.primary }]}
              >
                <MaterialIcons name="add-a-photo" size={16} color="#FFF" />
                <Text style={S.emptyBtnText}>{t('project.addFirstPhoto')}</Text>
              </PressableScale>
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
            <PressableScale
              onPress={() =>
                AppAlert.alert(
                  t('project.messageTitle'),
                  t('project.messageTo', { name: member.name })
                )
              }
              style={[S.chatBtn, { backgroundColor: colors.primary + '15' }]}
            >
              <MaterialIcons name="chat" size={18} color={colors.primary} />
            </PressableScale>
          </View>
        ))}
      </ScrollView>

      {!isArchived && (
        <PressableScale
          onPress={openInviteModal}
          style={[S.fab, { backgroundColor: colors.primary }]}
        >
          <MaterialIcons name="person-add" size={26} color="#FFF" />
        </PressableScale>
      )}
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
              {!isArchived && (
                <PressableScale
                  onPress={() => openNoteModal()}
                  style={[S.emptyBtn, { backgroundColor: colors.primary }]}
                >
                  <MaterialIcons name="add" size={16} color="#FFF" />
                  <Text style={S.emptyBtnText}>
                    {t('project.addFirstNote')}
                  </Text>
                </PressableScale>
              )}
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
                <PressableScale
                  onPress={() => togglePin(note.id)}
                  style={S.noteAction}
                >
                  <MaterialIcons
                    name="push-pin"
                    size={18}
                    color={note.pinned ? colors.warning : colors.muted}
                  />
                </PressableScale>
                <PressableScale
                  onPress={() => deleteNote(note.id)}
                  style={S.noteAction}
                >
                  <MaterialIcons
                    name="delete-outline"
                    size={18}
                    color={colors.error}
                  />
                </PressableScale>
              </View>
              <Text style={[S.noteContent, { color: colors.foreground }]}>
                {note.content}
              </Text>
            </View>
          ))}
        </ScrollView>

        {!isArchived && (
          <PressableScale
            onPress={() => openNoteModal()}
            style={[S.fab, { backgroundColor: colors.primary }]}
          >
            <MaterialIcons name="add" size={28} color="#FFF" />
          </PressableScale>
        )}
      </View>
    );
  return (
    project && (
      <ScreenContainer edgeToEdge className="p-0">
        <Animated.View style={enterStyle} className="bg-background">
          <HeroBackdrop height={230 + insets.top} />
          <Animated.View
            style={[
              S.header,
              heroStyle,
              {
                paddingHorizontal: isArchived ? 68 : 64,
                paddingTop: insets.top + 20,
                flexDirection: 'row',
              },
            ]}
          >
            <PressableScale onPress={handleBack} style={[S.backBtn]}>
              <MaterialIcons
                name="arrow-back-ios-new"
                size={22}
                color={colors.foreground}
              />
            </PressableScale>
            <View style={S.headerTop}>
              <View style={S.flex1}>
                <Text style={[S.workspaceLabel, { color: colors.muted }]}>
                  {t('home.projects')}
                </Text>
                <Text style={[S.workspaceName, { color: colors.foreground }]}>
                  {project?.name}
                </Text>
              </View>
            </View>
            <View style={S.headerActions}>
              {/* Cámara del header → vuelve a abrir el modal de añadir foto */}
              {!isArchived && (
                <PressableScale
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
                </PressableScale>
              )}
              <PressableScale
                onPress={() => {
                  if (!project) return;

                  router.push({
                    pathname: '/modals/project-settings',
                    params: {
                      projectId: project.id,
                      projectName: project.name,
                      projectLocation: project.location,
                      projectLatitude: String(project.latitude ?? ''),
                      projectLongitude: String(project.longitude ?? ''),
                      projectStatus: project.status,
                      projectStartDate: project.startDate,
                      projectEndDate: project.endDate ?? '',
                      projectDescription: project.description ?? '',
                      projectProgress: project?.progress ?? 0,
                    },
                  });
                }}
                style={[
                  S.headerActionBtn,
                  {
                    backgroundColor: colors.primary + '15',
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
              </PressableScale>
            </View>
          </Animated.View>

          {/* ── Archived banner ── */}
          {isArchived && (
            <View
              style={[
                S.archivedBanner,
                { backgroundColor: '#7C5C1E20', borderColor: '#B8860B' },
              ]}
            >
              <View
                style={[S.archivedBannerIcon, { backgroundColor: '#B8860B22' }]}
              >
                <MaterialIcons name="archive" size={20} color="#B8860B" />
              </View>
              <View style={S.archivedBannerText}>
                <Text style={[S.archivedBannerTitle, { color: '#B8860B' }]}>
                  {t('project.archivedBanner')}
                </Text>
                <Text style={[S.archivedBannerDesc, { color: '#B8860B99' }]}>
                  {t('project.archivedBannerDesc')}
                </Text>
              </View>
            </View>
          )}
          {/*Hero section */}
          <View style={S.heroWrapper}>
            <View style={[S.heroCard, cardElevation]}>
              {/* Imagen + botón flotante para cambiar el thumbnail */}
              <View style={S.heroImgWrapper}>
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
                      style={[
                        S.heroImgPlaceholderText,
                        { color: colors.muted },
                      ]}
                    >
                      {t('project.noThumbnail')}
                    </Text>
                  </View>
                )}

                {/* Botón flotante — solo visible si el proyecto NO está archivado */}
                {!isArchived && (
                  <PressableScale
                    onPress={handleChangeThumbnail}
                    disabled={isUploadingPhoto}
                    style={[
                      S.heroPhotoBtn,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    {isUploadingPhoto ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <MaterialIcons
                        name="add-a-photo"
                        size={16}
                        color="#FFF"
                      />
                    )}
                  </PressableScale>
                )}
              </View>

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

          {/*Tabs section */}
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
                <PressableScale
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
                </PressableScale>
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
          <Animated.View
            style={[
              S.stickyBar,
              stickyBarStyle,
              { paddingTop: insets.top + 6 },
            ]}
            pointerEvents="none"
          >
            <GlassView style={S.stickyGlass} intensity={60}>
              <Text
                numberOfLines={1}
                style={[S.stickyTitle, { color: colors.foreground }]}
              >
                aass
              </Text>
            </GlassView>
          </Animated.View>
        </Animated.View>
      </ScreenContainer>
    )
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  // Layout helpers
  flex1: { flex: 1 },
  flex1Ml3: { flex: 1, marginLeft: 12 },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },

  // Header — jerarquía tipográfica marcada: eyebrow uppercase + nombre grande
  header: {
    paddingBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  workspaceLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  workspaceName: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  teamRow: { flexDirection: 'row', alignItems: 'center' },
  avatarsTouchable: { flexDirection: 'row', marginRight: 12 },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  headerAvatarMore: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: -8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarMoreText: { fontSize: 11, fontWeight: '600' },
  inviteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inviteBtnText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  // Scroll
  scrollContent: { paddingBottom: 120 },

  // Sticky glass bar (aparece al colapsar el hero)
  stickyBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  stickyGlass: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  stickyTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },

  // Sections — breathing room amplio y títulos con más peso
  section: { marginTop: 28 },
  sectionTitleWrapper: { paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seeAllText: { fontSize: 14, fontWeight: '600' },
  horizontalListContent: { paddingHorizontal: 20, paddingVertical: 14 },

  // Status grid
  statusGrid: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statusCard: {
    width: '48%',
    aspectRatio: 1.5,
    borderRadius: 18,
    padding: 16,
    justifyContent: 'space-between',
  },
  statusCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusCardLabel: { fontSize: 16, fontWeight: '600' },
  statusIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCardCount: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },

  // Project card
  projectCardWrapper: { marginRight: 16, width: 300 },
  projectCard: { borderRadius: 18, padding: 16 },
  projectCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  statusBadgeText: { fontSize: 12, fontWeight: '600' },
  progressSection: { marginBottom: 12 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 12, marginLeft: 6 },
  projectCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarRow: { flexDirection: 'row' },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  memberAvatarText: { fontSize: 10, fontWeight: '600', color: '#FFFFFF' },

  // Image card
  imageCardWrapper: { marginRight: 12 },
  imageCardInner: { borderRadius: 12, overflow: 'hidden' },
  imageCardImg: { width: 140, height: 140 },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },

  // Location card
  locationCardWrapper: { marginRight: 16, width: 200 },
  locationCard: { borderRadius: 18, padding: 16 },
  locationCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  locationProjectsText: { fontSize: 12, marginLeft: 4 },
  profileCard: {
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    marginBottom: 4,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 11, marginTop: 2 },

  // Avatar in account row
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700' },
  profileName: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  profileEmail: { fontSize: 13, marginTop: 2 },
  profileRole: { fontSize: 13, marginTop: 2 },
  card: { borderRadius: 18, overflow: 'hidden', marginBottom: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowTextBlock: { flex: 1, marginLeft: 16 },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  rowSublabel: { fontSize: 12, marginTop: 1 },
  cardStyleRow: { paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  segmentedControl: { flexDirection: 'row', gap: 8, marginLeft: 36 },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  segmentBtnText: { fontSize: 13, fontWeight: '700' },
  langPill: { flexDirection: 'row', borderRadius: 12, padding: 3 },
  langBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9 },
  langBtnText: { fontSize: 12, fontWeight: '600' },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footer: { alignItems: 'center', paddingTop: 24, paddingBottom: 8, gap: 4 },
  footerText: { fontSize: 12 },

  backBtn: {
    width: 32,
    height: 32,
  },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginTop: -18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  archivedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 2,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
  },
  archivedBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  archivedBannerText: { flex: 1 },
  archivedBannerTitle: { fontSize: 13, fontWeight: '700' },
  archivedBannerDesc: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  heroWrapper: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  heroCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  heroImgWrapper: { position: 'relative' },
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
  // Botón flotante de cámara sobre la imagen del hero
  heroPhotoBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
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
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, marginTop: 8 },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabLabel: { fontSize: 12, marginTop: 2 },
  galleryScroll: { paddingBottom: 32, flex: 1 },
  tagScroll: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagText: { fontSize: 12, fontWeight: '600' },
  photoCountRow: {
    paddingHorizontal: 20,
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
  gridWrapper: { paddingHorizontal: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timelineScroll: { paddingHorizontal: 20, paddingBottom: 32, paddingTop: 8 },
  timelineRow: { flexDirection: 'row', gap: 12 },
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
  cardBase: { borderRadius: 16, padding: 14 },
  timelineIconCol: { alignItems: 'center', width: 36 },
  teamScroll: { paddingHorizontal: 20, paddingBottom: 100, paddingTop: 8 },
  statCard: { borderRadius: 16, padding: 14, alignItems: 'center' },
  memberCard: { marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
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
  // Notes
  notesScroll: { paddingHorizontal: 20, paddingBottom: 100, paddingTop: 8 },
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
});
