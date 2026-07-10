import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { GlassView } from '@/components/ui/glass-view';
import { HeroBackdrop } from '@/components/ui/hero-backdrop';
import { useColors } from '@/hooks/use-colors';
import { useCardStyle } from '@/hooks/use-card-style';
import { useEffect, useState } from 'react';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  GetMyProjectsDocument,
  Project,
  ProjectStatus,
} from '@/gql/graphql';
import { useQuery } from '@apollo/client/react';
import { useAuth } from '@/lib/auth-context';
import { HomeSkeleton } from '@/components/home-skeleton';
import { GraphQLError } from '@/components/ui/graphql-error';
import { useRelativeDate } from '@/hooks/use-relative-date';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SearchInput } from '@/components/ui/search-input';

export default function ProjectScreen() {
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const cardElevation = useCardStyle();
  const { isLoading: authLoading } = useAuth();
  const { data, loading, error, refetch } = useQuery(GetMyProjectsDocument, {
    skip: authLoading,
  });

  const enterOpacity = useSharedValue(0);
  const enterScale = useSharedValue(1.06);
  const relativeDate = useRelativeDate();
  const insets = useSafeAreaInsets();

  const filterLabels: Record<string, string> = {
    all: t('projects.filterAll'),
    active: t('projects.filterActive'),
    completed: t('projects.filterCompleted'),
  };

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler(e => {
    scrollY.value = e.contentOffset.y;
  });

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

  const renderProjectCard = ({ item }: { item: Project }) => {
    const isCompleted = item.status === ProjectStatus.Completed;

    const getStatus = (status: ProjectStatus) => {
      switch (status) {
        case ProjectStatus.Completed:
          return t('projects.statusCompleted');
        case ProjectStatus.Active:
          return t('projects.statusActive');
        case ProjectStatus.Ongoing:
          return t('projects.statusOngoing');
        case ProjectStatus.Canceled:
          return t('projects.statusCancelled');
        default:
          return t('projects.statusArchived');
      }
    };
    return (
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: `/project/${item.id}` as any,
            params: { source: 'projects' },
          })
        }
        style={S.cardWrapper}
      >
        <View style={[S.card, cardElevation]}>
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-1">
              <Text
                className="text-lg font-semibold text-foreground"
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <Text className="text-sm text-muted mt-1">{item.location}</Text>
            </View>
            <View
              className="px-3 py-1 rounded-full"
              style={{
                backgroundColor: isCompleted
                  ? colors.success + '20'
                  : colors.primary + '20',
              }}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: isCompleted ? colors.success : colors.primary }}
              >
                {getStatus(item.status)}
              </Text>
            </View>
          </View>

          <View className="mb-3">
            <View className="flex-row justify-between mb-2">
              <Text className="text-xs text-muted">
                {t('projects.progress')}
              </Text>
              <Text className="text-xs font-semibold text-foreground">
                {item.progress}%
              </Text>
            </View>
            <View
              className="h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: colors.border }}
            >
              <View
                className="h-full rounded-full"
                style={{
                  width: `${item.progress}%`,
                  backgroundColor: colors.primary,
                }}
              />
            </View>
          </View>

          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center">
              <IconSymbol
                name="photo.stack.fill"
                size={14}
                color={colors.muted}
              />
              <Text className="text-xs text-muted" style={S.photosLabel}>
                {item.photos.length} {t('projects.photos')}
              </Text>
            </View>
            {/* Fecha relativa calculada desde el timestamp */}
            <Text className="text-xs text-muted">
              {relativeDate(Number.parseInt(item.createdAt))}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const filteredProjects: any[] =
    data?.getMyProjects.filter(project => {
      const matchesSearch =
        project.name.toLowerCase().includes(searchText.toLowerCase()) ||
        project.location.toLowerCase().includes(searchText.toLowerCase());
      const matchesFilter =
        selectedFilter === 'all' ||
        (selectedFilter === 'active' &&
          project.status === ProjectStatus.Active) ||
        (selectedFilter === 'completed' &&
          project.status === ProjectStatus.Completed);
      return matchesSearch && matchesFilter;
    }) || ([] as Project[]);
  if (authLoading || loading) {
    return <HomeSkeleton />;
  }

  if (error) {
    return <GraphQLError onRetry={() => refetch()} />;
  }

  return (
    data && (
      <ScreenContainer edgeToEdge className="p-0">
        <Animated.View style={enterStyle} className="bg-background">
          <HeroBackdrop height={230 + insets.top} />

          <Animated.View
            style={[S.header, heroStyle, { paddingTop: insets.top + 20 }]}
          >
            <View style={S.headerTop}>
              <View style={S.flex1}>
                <Text style={[S.workspaceLabel, { color: colors.muted }]}>
                  {t('home.workspace')}
                </Text>
                <Text style={[S.workspaceName, { color: colors.foreground }]}>
                  {t('home.projects').toString().at(0)?.toUpperCase()}
                  {t('home.projects').toString().substring(1)}
                </Text>
                {/* Team Avatars */}
              </View>
              <TouchableOpacity
                onPress={() => router.push('/create-project-location')}
                style={[S.addBtn, { backgroundColor: colors.primary }]}
              >
                <MaterialIcons name="add" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>

            <SearchInput
              placeholder={t('projects.searchPlaceholder')}
              value={searchText}
              onChangeText={setSearchText}
              style={S.searchBar}
            />
          </Animated.View>

          {/* Project Filters */}
          <View style={S.flex1}>
            <View className="flex-row gap-2" style={S.sectionTitleWrapper}>
              {(['all', 'active', 'completed'] as const).map(filter => (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setSelectedFilter(filter)}
                  className="px-4 py-2 rounded-full border border-border"
                  style={{
                    backgroundColor:
                      selectedFilter === filter
                        ? colors.primary
                        : colors.surface,
                    borderColor:
                      selectedFilter === filter
                        ? colors.primary
                        : colors.border,
                  }}
                >
                  <Text
                    className="text-xs font-semibold"
                    style={{
                      color:
                        selectedFilter === filter
                          ? '#FFFFFF'
                          : colors.foreground,
                    }}
                  >
                    {filterLabels[filter]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {/*Listado de proyectos*/}
            <FlatList
              data={filteredProjects}
              renderItem={renderProjectCard}
              keyExtractor={item => item.id}
              contentContainerStyle={S.listContent}
              scrollEnabled={true}
              ListEmptyComponent={
                <View className="flex-1 items-center justify-center py-12">
                  <IconSymbol
                    name="folder.badge.plus"
                    size={48}
                    color={colors.border}
                  />
                  <Text className="text-lg font-semibold text-foreground mt-4">
                    {t('projects.noProjects')}
                  </Text>
                  <Text className="text-sm text-muted text-center mt-2">
                    {t('projects.noProjectsSubtitle')}
                  </Text>
                </View>
              }
            />
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
                {t('home.projects').toString().at(0)?.toUpperCase()}
                {t('home.projects').toString().substring(1)}
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
  header: { paddingHorizontal: 20, paddingBottom: 16 },
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
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
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
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
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
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: { marginBottom: 12 },
  card: { borderRadius: 16, padding: 16 },
  cardWrapper: { marginBottom: 12 },
  photosLabel: { marginLeft: 6 },
  listContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
});
