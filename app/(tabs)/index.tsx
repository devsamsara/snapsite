import {
  FlatList,
  Image,
  ScrollView,
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
import { CurrentCompanyDocument, ProjectStatusData } from '@/gql/graphql';
import { useQuery } from '@apollo/client/react';
import { useAuth } from '@/lib/auth-context';

// Mock data for recent projects
const RECENT_PROJECTS = [
  {
    id: '1',
    name: 'Fintech App UI',
    location: 'Downtown, NYC',
    progress: 67,
    documents: 6,
    comments: 16,
    date: '20 Oct, 2026',
    status: 'Progress',
    color: '#3B82F6',
    teamMembers: ['A', 'B', 'C'],
  },
  {
    id: '2',
    name: 'Edtech App Design',
    location: 'Queens, NY',
    progress: 45,
    documents: 2,
    comments: 8,
    date: '22 Oct, 2026',
    status: 'Progress',
    color: '#10B981',
    teamMembers: ['D', 'E', 'F'],
  },
  {
    id: '3',
    name: 'Roof Installation',
    location: 'Brooklyn, NY',
    progress: 100,
    documents: 12,
    comments: 45,
    date: '15 Oct, 2026',
    status: 'Completed',
    color: '#8B5CF6',
    teamMembers: ['G', 'H'],
  },
  {
    id: '4',
    name: 'Bridge Construction',
    location: 'Manhattan, NY',
    progress: 75,
    documents: 8,
    comments: 24,
    date: '18 Oct, 2026',
    status: 'Progress',
    color: '#F59E0B',
    teamMembers: ['I', 'J', 'K', 'L'],
  },
];
// Mock data for recent images
const RECENT_IMAGES = [
  {
    id: "1",
    projectName: "Office Renovation",
    url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&h=300&fit=crop",
    date: "2 hours ago",
  },
  {
    id: "2",
    projectName: "Parking Lot Repair",
    url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300&h=300&fit=crop",
    date: "5 hours ago",
  },
  {
    id: "3",
    projectName: "Roof Installation",
    url: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=300&h=300&fit=crop",
    date: "Yesterday",
  },
  {
    id: "4",
    projectName: "Bridge Construction",
    url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=300&h=300&fit=crop",
    date: "Yesterday",
  },
  {
    id: "5",
    projectName: "Office Renovation",
    url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=300&h=300&fit=crop",
    date: "2 days ago",
  },
  {
    id: "6",
    projectName: "Parking Lot Repair",
    url: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=300&h=300&fit=crop",
    date: "3 days ago",
  },
];

// Mock data for project statuses (Today)
const PROJECT_STATUSES = [
  { id: '1', nameKey: 'home.statusOngoing', count: 3, color: '#8B5CF6' },
  { id: '2', nameKey: 'home.statusPaused', count: 1, color: '#F59E0B' },
  { id: '3', nameKey: 'home.statusComplete', count: 5, color: '#10B981' },
  { id: '4', nameKey: 'home.statusCancel', count: 2, color: '#EF4444' },
];

// Mock data for recent locations
const RECENT_LOCATIONS = [
  {
    id: '1',
    name: 'Downtown, NYC',
    projects: 5,
    lastVisit: 'Today',
  },
  {
    id: '2',
    name: 'Brooklyn, NY',
    projects: 3,
    lastVisit: 'Yesterday',
  },
  {
    id: '3',
    name: 'Queens, NY',
    projects: 2,
    lastVisit: '3 days ago',
  },
  {
    id: '4',
    name: 'Manhattan, NY',
    projects: 4,
    lastVisit: '1 week ago',
  },
];

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const cardElevation = useCardStyle();
  const cardSmElevation = useCardStyleSm();
  const [searchQuery, setSearchQuery] = useState('');
  const { isLoading: authLoading } = useAuth();
  const {data, loading, error} = useQuery(CurrentCompanyDocument, {
    // Do NOT fire this request until AuthProvider has finished restoring
    // the token from SecureStore. Without this guard the query races against
    // restoreAuthToken() and goes out without the Authorization header.
    skip: authLoading,
  });

  // ── Entrance animation: mirrors onboarding exit (scale-down + fade-in) ──
  const enterOpacity = useSharedValue(0);
  const enterScale = useSharedValue(1.06);

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

  const handleCreateProject = () => {
    // TODO: Navigate to create project screen
  };

  const handleSettingsTap = () => {
    router.push('/settings');
  };

  const handleProjectTap = (projectId: string) => {
    router.push(`/project/${projectId}`);
  };

  const handleImageTap = (imageId: string) => {
    // TODO: Navigate to image detail screen
  };

  const handleLocationTap = (locationId: string) => {
    // TODO: Navigate to location detail screen
  };
  const handleInviteTap = () => {
    router.push('/modals/invite-global');
  };
  const handleAvatarsTap = () => {
    router.push('/modals/team-members');
  };

  const renderEmptyContent = (
    id: 'projects' | 'images' | 'locations'
  ) => {
    const titleKey = `home.empty${id.charAt(0).toUpperCase() + id.slice(1)}` as const;
    const hintKey  = `home.empty${id.charAt(0).toUpperCase() + id.slice(1)}Hint` as const;
    return (
      <View className="flex-1 items-center justify-center py-12 px-6">
        <IconSymbol name="photo.stack.fill" size={48} color={colors.border} />
        <Text className="text-lg font-semibold text-foreground mt-4">
          {t(titleKey)}
        </Text>
        <Text className="text-sm text-muted text-center mt-2">
          {t(hintKey)}
        </Text>
      </View>
    );
  };

  const renderProjectCard = ({
    item,
  }: {
    item: (typeof RECENT_PROJECTS)[0];
  }) => (
    <TouchableOpacity
      onPress={() => handleProjectTap(item.id)}
      style={{ marginRight: 16, width: 300 }}
    >
      <View style={[{ borderRadius: 16, padding: 16 }, cardElevation]}>
        {/* Project Header */}
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
              backgroundColor:
                item.status === 'Completed'
                  ? colors.success + '20'
                  : colors.primary + '20',
            }}
          >
            <Text
              className="text-xs font-semibold"
              style={{
                color:
                  item.status === 'Completed' ? colors.success : colors.primary,
              }}
            >
              {item.status}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View className="mb-3">
          <View className="flex-row justify-between mb-2">
            <Text className="text-xs text-muted">{t('home.progress')}</Text>
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

        {/* Documents and Comments */}
        <View className="flex-row items-center mb-3" style={{ gap: 12 }}>
          <View className="flex-row items-center">
            <IconSymbol name="doc.fill" size={14} color={colors.muted} />
            <Text className="text-xs text-muted" style={{ marginLeft: 6 }}>
              {item.documents} {t('home.documents')}
            </Text>
          </View>
          <View className="flex-row items-center">
            <IconSymbol
              name="bubble.left.fill"
              size={14}
              color={colors.muted}
            />
            <Text className="text-xs text-muted" style={{ marginLeft: 6 }}>
              {item.comments} {t('home.comments')}
            </Text>
          </View>
        </View>

        {/* Footer: Team Members and Date */}
        <View className="flex-row justify-between items-center">
          {/* Team Avatars */}
          <View className="flex-row">
            {item.teamMembers.slice(0, 3).map((member, index) => (
              <View
                key={index}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: colors.primary,
                  marginLeft: index > 0 ? -6 : 0,
                  borderWidth: 2,
                  borderColor: colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{ fontSize: 10, fontWeight: '600', color: '#FFFFFF' }}
                >
                  {member}
                </Text>
              </View>
            ))}
          </View>
          {/* Date */}
          <Text className="text-xs text-muted">{item.date}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderImageCard = ({ item }: { item: (typeof RECENT_IMAGES)[0] }) => (
    <TouchableOpacity
      onPress={() => handleImageTap(item.id)}
      style={{ marginRight: 12 }}
    >
      <View className="rounded-xl overflow-hidden">
        <Image
          source={{ uri: item.url }}
          style={{ width: 140, height: 140 }}
          resizeMode="cover"
        />
        {/* Overlay with project name */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            paddingVertical: 6,
            paddingHorizontal: 8,
          }}
        >
          <Text className="text-white text-xs font-semibold" numberOfLines={1}>
            {item.projectName}
          </Text>
          <Text className="text-white text-xs opacity-80" numberOfLines={1}>
            {item.date}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderLocationCard = ({
    item,
  }: {
    item: (typeof RECENT_LOCATIONS)[0];
  }) => (
    <TouchableOpacity
      onPress={() => handleLocationTap(item.id)}
      style={{ marginRight: 16, width: 200 }}
    >
      <View style={[{ borderRadius: 16, padding: 16 }, cardElevation]}>
        <View className="flex-row items-center mb-2">
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.primary + '20' }}
          >
            <IconSymbol name="location.fill" size={20} color={colors.primary} />
          </View>
          <View className="flex-1 ml-3">
            <Text
              className="text-base font-semibold text-foreground"
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <Text className="text-xs text-muted mt-1">{item.lastVisit}</Text>
          </View>
        </View>
        <View className="flex-row items-center mt-2">
          <IconSymbol name="folder.fill" size={12} color={colors.muted} />
          <Text className="text-xs text-muted" style={{ marginLeft: 4 }}>
            {item.projects} {t('home.projects')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (authLoading || loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-muted">{t('home.loading')}</Text>
      </View>
    );
  }

  if (error) {
    console.log('[HomeScreen] GraphQL error:', error);
  }

  return (
    data && (
      <ScreenContainer className="p-0">
        <Animated.View style={enterStyle} className="bg-background">
          {/* Modern Header */}
          <View
            style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 16,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 13, color: colors.muted, marginBottom: 6 }}
                >
                  {t('home.workspace')}
                </Text>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: '700',
                    color: colors.foreground,
                    marginBottom: 12,
                  }}
                >
                  {t('home.workspaceName')}
                </Text>
                {/* Team Avatars */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity
                    onPress={handleAvatarsTap}
                    style={{ flexDirection: 'row', marginRight: 12 }}
                  >
                    {[1, 2, 3, 4, 5].map(i => (
                      <View
                        key={i}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: colors.primary,
                          marginLeft: i > 1 ? -8 : 0,
                          borderWidth: 2,
                          borderColor: colors.background,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '600',
                            color: '#FFFFFF',
                          }}
                        >
                          {String.fromCharCode(64 + i)}
                        </Text>
                      </View>
                    ))}
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: colors.surface,
                        marginLeft: -8,
                        borderWidth: 2,
                        borderColor: colors.background,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '600',
                          color: colors.muted,
                        }}
                      >
                        +7
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleInviteTap}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: colors.primary,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: '#FFFFFF',
                      }}
                    >
                      {t('home.invite')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleSettingsTap}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: 12,
                }}
              >
                <IconSymbol
                  name="gearshape.fill"
                  size={20}
                  color={colors.foreground}
                />
              </TouchableOpacity>
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
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Project Status Section (Today) */}
            <View style={{ marginTop: 24 }}>
              <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: colors.foreground,
                  }}
                >
                  {t('home.today')}
                </Text>
              </View>
              <View
                style={{
                  paddingHorizontal: 16,
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                {data.getDashboardData.projectStatusData.map(
                  (status: any, index: number) => (
                    <TouchableOpacity
                      key={`${status.keyname}_ ${index}`}
                      style={[
                        {
                          width: '48%',
                          aspectRatio: 1.5,
                          borderRadius: 16,
                          padding: 16,
                          justifyContent: 'space-between',
                        },
                        cardSmElevation,
                      ]}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: '600',
                            color: colors.foreground,
                          }}
                        >
                          {t(status.nameKey)}
                        </Text>
                        <View
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            backgroundColor: colors.primary + '20',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <IconSymbol
                            name="plus"
                            size={14}
                            color={colors.primary}
                          />
                        </View>
                      </View>
                      <Text
                        style={{
                          fontSize: 24,
                          fontWeight: '700',
                          color: colors.foreground,
                        }}
                      >
                        {status.count}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </View>

            {/* Recent Projects Section */}
            {RECENT_PROJECTS.length === 0 ? (
              renderEmptyContent('projects')
            ) : (
              <View style={{ marginTop: 24 }}>
                <View
                  style={{
                    paddingHorizontal: 16,
                    marginBottom: 12,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text className="text-lg font-semibold text-foreground">
                    {t('home.recentProjects')}
                  </Text>
                  <TouchableOpacity>
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: colors.primary }}
                    >
                      {t('home.seeAll')}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Horizontal Projects List */}
                <FlatList
                  data={RECENT_PROJECTS}
                  renderItem={renderProjectCard}
                  keyExtractor={item => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                  }}
                />
              </View>
            )}

            {/* Recent Locations Section */}
            {RECENT_LOCATIONS.length === 0 ? (
              renderEmptyContent('locations')
            ) : (
              <View style={{ marginTop: 24 }}>
                <View
                  style={{
                    paddingHorizontal: 16,
                    marginBottom: 12,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text className="text-lg font-semibold text-foreground">
                    {t('home.recentLocations')}
                  </Text>
                  <TouchableOpacity>
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: colors.primary }}
                    >
                      {t('home.seeAll')}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Horizontal Locations List */}
                <FlatList
                  data={RECENT_LOCATIONS}
                  renderItem={renderLocationCard}
                  keyExtractor={item => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                  }}
                />
              </View>
            )}

            {/* Recent Images Section */}
            {RECENT_IMAGES.length === 0 ? (
              renderEmptyContent('images')
            ) : (
              <View style={{ marginTop: 24 }}>
                <View
                  style={{
                    paddingHorizontal: 16,
                    marginBottom: 12,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text className="text-lg font-semibold text-foreground">
                    {t('home.recentImages')}
                  </Text>
                  <TouchableOpacity>
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: colors.primary }}
                    >
                      {t('home.seeAll')}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Horizontal Images List */}
                <FlatList
                  data={RECENT_IMAGES}
                  renderItem={renderImageCard}
                  keyExtractor={item => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                  }}
                />
              </View>
            )}

            {/* Empty State Hint */}
          </ScrollView>

          {/* Floating Action Button Options */}
          <FabOptions />
        </Animated.View>
      </ScreenContainer>
    )
  );
}
