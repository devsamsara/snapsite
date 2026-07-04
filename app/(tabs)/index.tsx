import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SearchInput } from '@/components/ui/search-input';
import { useColors } from '@/hooks/use-colors';
import { useCardStyle, useCardStyleSm } from '@/hooks/use-card-style';
import { FabOptions } from '@/components/fab-options';
import { useEffect, useState } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  CurrentCompanyDocument,
  Maybe,
  ProjectStatusData,
  RecentImage,
  RecentLocation,
  RecentProject,
  UserSummary,
} from '@/gql/graphql';
import { useQuery } from '@apollo/client/react';
import { useAuth } from '@/lib/auth-context';
import { HomeSkeleton } from '@/components/home-skeleton';
import { GraphQLError } from '@/components/ui/graphql-error';
import { useRelativeDate } from '@/hooks/use-relative-date';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const cardElevation = useCardStyle();
  const cardSmElevation = useCardStyleSm();
  const [searchQuery, setSearchQuery] = useState('');
  const { isLoading: authLoading } = useAuth();
  const { data, loading, error, refetch } = useQuery(CurrentCompanyDocument, {
    skip: authLoading,
  });

  const enterOpacity = useSharedValue(0);
  const enterScale = useSharedValue(1.06);
  const relativeDate = useRelativeDate()

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

  const handleProfileTap = () => router.push('/settings');
  const handleProjectTap = (projectId: string) =>
    router.push(`/project/${projectId}`);
  const handleImageTap = (_imageId: string) => {

  };
  const handleLocationTap = (item: RecentLocation) => {
    router.push({
      pathname: '/location-map',
      params: {
        id: item.id,
        name: item.name,
        lastVisit: item.lastVisit,
        projectsCount: String(item.projectsCount),
        latitude: item.latitude != null ? String(item.latitude) : '',
        longitude: item.longitude != null ? String(item.longitude) : '',
      },
    });
  };
  const handleInviteTap = () => router.push('/modals/invite-global');
  const handleAvatarsTap = () => router.push('/modals/team-members');

  const EMPTY_ICONS: Record<'projects' | 'images' | 'locations', string> = {
    projects: 'folder.badge.plus',
    images: 'photo.on.rectangle.angled',
    locations: 'map.fill',
  };

  const renderEmptyContent = (id: 'projects' | 'images' | 'locations') => {
    const titleKey =
      `home.empty${id.charAt(0).toUpperCase() + id.slice(1)}` as const;
    const hintKey =
      `home.empty${id.charAt(0).toUpperCase() + id.slice(1)}Hint` as const;
    return (
      <View style={S.emptyContainer}>
        <IconSymbol
          name={EMPTY_ICONS[id] as any}
          size={48}
          color={colors.border}
        />
        <Text className="text-lg font-semibold text-foreground mt-4">
          {t(titleKey)}
        </Text>
        <Text className="text-sm text-muted text-center mt-2">
          {t(hintKey)}
        </Text>
      </View>
    );
  };

  const renderProjectCard = ({ item }: { item: RecentProject }) => (
    <TouchableOpacity
      onPress={() => handleProjectTap(item.id)}
      style={S.projectCardWrapper}
    >
      <View style={[S.projectCard, cardElevation]}>
        {/* Project Header */}
        <View style={S.projectCardHeader}>
          <View style={S.flex1}>
            <Text
              className="text-lg font-semibold text-foreground"
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <Text className="text-sm text-muted mt-1">{item.location}</Text>
          </View>
          <View
            style={[
              S.statusBadge,
              {
                backgroundColor:
                  item.status === 'Completed'
                    ? colors.success + '20'
                    : colors.primary + '20',
              },
            ]}
          >
            <Text
              style={[
                S.statusBadgeText,
                {
                  color:
                    item.status === 'Completed'
                      ? colors.success
                      : colors.primary,
                },
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={S.progressSection}>
          <View style={S.progressLabelRow}>
            <Text className="text-xs text-muted">{t('home.progress')}</Text>
            <Text className="text-xs font-semibold text-foreground">
              {item.progress}%
            </Text>
          </View>
          <View style={[S.progressTrack, { backgroundColor: colors.border }]}>
            <View
              style={[
                S.progressFill,
                { width: `${item.progress}%`, backgroundColor: colors.primary },
              ]}
            />
          </View>
        </View>

        {/* Documents and Comments */}
        <View style={S.metaRow}>
          <View style={S.metaItem}>
            <IconSymbol name="doc.fill" size={14} color={colors.muted} />
            <Text className="text-xs text-muted" style={S.metaText}>
              {item.documentsCount} {t('home.documents')}
            </Text>
          </View>
          <View style={S.metaItem}>
            <IconSymbol
              name="bubble.left.fill"
              size={14}
              color={colors.muted}
            />
            <Text className="text-xs text-muted" style={S.metaText}>
              {item.commentsCount} {t('home.comments')}
            </Text>
          </View>
        </View>

        {/* Footer: Team Members and Date */}
        <View style={S.projectCardFooter}>
          <View style={S.avatarRow}>
            {item.members.slice(0, 3).map(
              (member: Maybe<UserSummary>, index: number) =>
                member && (
                  <View
                    key={index}
                    style={[
                      S.memberAvatar,
                      {
                        backgroundColor: colors.primary,
                        marginLeft: index > 0 ? -6 : 0,
                        borderColor: colors.surface,
                      },
                    ]}
                  >
                    <Text style={S.memberAvatarText}>{member.name.at(0)}</Text>
                  </View>
                )
            )}
          </View>
          <Text className="text-xs text-muted">{item.createdAt}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderImageCard = ({ item }: { item: RecentImage }) => {

    return (
      <TouchableOpacity
        onPress={() => handleImageTap(item.id)}
        style={S.imageCardWrapper}
      >
        <View style={S.imageCardInner}>
          <Image
            source={{ uri: item.url }}
            style={S.imageCardImg}
            resizeMode="cover"
          />
          <View style={S.imageOverlay}>
            <Text
              className="text-white text-xs font-semibold"
              numberOfLines={1}
            >
              {item.projectName}
            </Text>
            <Text className="text-white text-xs opacity-80" numberOfLines={1}>
              {relativeDate(Number.parseInt(item.date))}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderLocationCard = ({ item }: { item: RecentLocation }) => (
    <TouchableOpacity
      onPress={() => handleLocationTap(item)}
      style={S.locationCardWrapper}
    >
      <View style={[S.locationCard, cardElevation]}>
        <View style={S.locationCardHeader}>
          <View
            style={[
              S.locationIconBg,
              { backgroundColor: colors.primary + '20' },
            ]}
          >
            <IconSymbol name="location.fill" size={20} color={colors.primary} />
          </View>
          <View style={S.flex1Ml3}>
            <Text
              className="text-base font-semibold text-foreground"
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <Text className="text-xs text-muted mt-1">{item.lastVisit}</Text>
          </View>
        </View>
        <View style={S.locationFooter}>
          <IconSymbol name="folder.fill" size={12} color={colors.muted} />
          <Text className="text-xs text-muted" style={S.locationProjectsText}>
            {item.projectsCount} {t('home.projects')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (authLoading || loading) {
    return <HomeSkeleton />;
  }

  if (error) {
    return <GraphQLError onRetry={() => refetch()} />;
  }

  return (
    data && (
      <ScreenContainer className="p-0">
        <Animated.View style={enterStyle} className="bg-background">
          {/* Modern Header */}
          <View style={S.header}>
            <View style={S.headerTop}>
              <View style={S.flex1}>
                <Text style={[S.workspaceLabel, { color: colors.muted }]}>
                  {t('home.workspace')}
                </Text>
                <Text style={[S.workspaceName, { color: colors.foreground }]}>
                  {data.getDashboardData.currentCompany.name}
                </Text>
                {/* Team Avatars */}
                <View style={S.teamRow}>
                  <TouchableOpacity
                    onPress={handleAvatarsTap}
                    style={S.avatarsTouchable}
                  >
                    {new Array(
                      data.getDashboardData.currentCompany.users.length
                    )
                      .fill(0)
                      .slice(0, 5)
                      .map((_, i) => (
                        <View
                          key={data.getDashboardData.currentCompany.users[i].id}
                          style={[
                            S.headerAvatar,
                            {
                              backgroundColor: colors.primary,
                              marginLeft: i < 5 ? -8 : 0,
                              borderColor: colors.background,
                            },
                          ]}
                        >
                          <Text style={S.headerAvatarText}>
                            {data.getDashboardData.currentCompany.users
                              .at(i)
                              ?.name.at(0)
                              ?.toUpperCase()}
                          </Text>
                        </View>
                      ))}
                    {data.getDashboardData.currentCompany.users.length > 5 && (
                      <View
                        style={[
                          S.headerAvatarMore,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.background,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            S.headerAvatarMoreText,
                            { color: colors.muted },
                          ]}
                        >
                          +5
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleInviteTap}
                    style={[S.inviteBtn, { backgroundColor: colors.primary }]}
                  >
                    <Text style={S.inviteBtnText}>{t('home.invite')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {/*<TouchableOpacity
                onPress={()=>handleProfileTap()}
                style={[S.settingsBtn, { backgroundColor: colors.surface }]}
              >
                <IconSymbol
                  name="person.fill"
                  size={20}
                  color={colors.foreground}
                />
              </TouchableOpacity>*/}
            </View>

            {/* Search Bar */}
            <SearchInput
              placeholder={t('home.searchPlaceholder')}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Content */}
          <ScrollView
            contentContainerStyle={S.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Project Status Section (Today) */}
            <View style={S.section}>
              <View style={S.sectionTitleWrapper}>
                <Text style={[S.sectionTitle, { color: colors.foreground }]}>
                  {t('home.today')}
                </Text>
              </View>
              <View style={S.statusGrid}>
                {data.getDashboardData.projectStatusData.map(
                  (item: Maybe<ProjectStatusData>, index: number) =>
                    item && (
                      <TouchableOpacity
                        key={`${item.nameKey}_${index}`}
                        style={[S.statusCard, cardSmElevation]}
                      >
                        <View style={S.statusCardTop}>
                          <Text
                            style={[
                              S.statusCardLabel,
                              { color: colors.foreground },
                            ]}
                          >
                            {t(item.nameKey)}
                          </Text>
                          <View
                            style={[
                              S.statusIconBg,
                              { backgroundColor: colors.primary + '20' },
                            ]}
                          >
                            <IconSymbol
                              name="plus"
                              size={14}
                              color={colors.primary}
                            />
                          </View>
                        </View>
                        <Text
                          style={[
                            S.statusCardCount,
                            { color: colors.foreground },
                          ]}
                        >
                          {item.count}
                        </Text>
                      </TouchableOpacity>
                    )
                )}
              </View>
            </View>

            {/* Recent Projects Section */}
            {data.getDashboardData.recentProjects.length === 0 ? (
              renderEmptyContent('projects')
            ) : (
              <View style={S.section}>
                <View style={S.sectionHeader}>
                  <Text className="text-lg font-semibold text-foreground">
                    {t('home.recentProjects')}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: '/(tabs)/projects',
                      })
                    }
                  >
                    <Text style={[S.seeAllText, { color: colors.primary }]}>
                      {t('home.seeAll')}
                    </Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={data.getDashboardData.recentProjects}
                  renderItem={renderProjectCard}
                  keyExtractor={item => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={S.horizontalListContent}
                />
              </View>
            )}

            {/* Recent Locations Section */}
            {data.getDashboardData.recentLocations.length === 0 ? (
              renderEmptyContent('locations')
            ) : (
              <View style={S.section}>
                <View style={S.sectionHeader}>
                  <Text className="text-lg font-semibold text-foreground">
                    {t('home.recentLocations')}
                  </Text>
                  <TouchableOpacity>
                    <Text style={[S.seeAllText, { color: colors.primary }]}>
                      {t('home.seeAll')}
                    </Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={data.getDashboardData.recentLocations}
                  renderItem={renderLocationCard}
                  keyExtractor={item => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={S.horizontalListContent}
                />
              </View>
            )}

            {/* Recent Images Section */}
            {data.getDashboardData.recentImages.length === 0 ? (
              renderEmptyContent('images')
            ) : (
              <View style={S.section}>
                <View style={S.sectionHeader}>
                  <Text className="text-lg font-semibold text-foreground">
                    {t('home.recentImages')}
                  </Text>
                  <TouchableOpacity>
                    <Text style={[S.seeAllText, { color: colors.primary }]}>
                      {t('home.seeAll')}
                    </Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={data.getDashboardData.recentImages}
                  renderItem={renderImageCard}
                  keyExtractor={item => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={S.horizontalListContent}
                />
              </View>
            )}
          </ScrollView>

          <FabOptions />
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

  // Header
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  workspaceLabel: { fontSize: 13, marginBottom: 6 },
  workspaceName: { fontSize: 24, fontWeight: '700', marginBottom: 12 },
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

  // Sections
  section: { marginTop: 24 },
  sectionTitleWrapper: { paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seeAllText: { fontSize: 14, fontWeight: '600' },
  horizontalListContent: { paddingHorizontal: 16, paddingVertical: 14 },

  // Status grid
  statusGrid: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statusCard: {
    width: '48%',
    aspectRatio: 1.5,
    borderRadius: 16,
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
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCardCount: { fontSize: 24, fontWeight: '700' },

  // Project card
  projectCardWrapper: { marginRight: 16, width: 300 },
  projectCard: { borderRadius: 16, padding: 16 },
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
  locationCard: { borderRadius: 16, padding: 16 },
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
});
