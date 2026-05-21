import { Text, View, TouchableOpacity, ScrollView, FlatList, Image } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SearchInput } from "@/components/ui/search-input";
import { useColors } from "@/hooks/use-colors";
import { useCardStyle, useCardStyleSm } from "@/hooks/use-card-style";
import { FabOptions } from "@/components/fab-options";
import { useState, useEffect } from "react";
import Animated,
{
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { useHomeDataQuery } from "@/gql/graphql";

export function HomeContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const cardElevation = useCardStyle();
  const cardSmElevation = useCardStyleSm();
  const [searchQuery, setSearchQuery] = useState("");

  const { data, loading, error } = useHomeDataQuery();

  const projects = data?.me?.projects || [];
  const photos = data?.me?.photos || [];

  // Group projects by status for the status cards
  const projectStatuses = projects.reduce((acc, project) => {
    const status = project.status || 'unknown';
    if (!acc[status]) {
      acc[status] = { id: status, nameKey: `home.status${status.charAt(0).toUpperCase() + status.slice(1)}`, count: 0, color: '#8B5CF6' }; // Default color, can be refined
    }
    acc[status].count++;
    return acc;
  }, {});

  const PROJECT_STATUSES = Object.values(projectStatuses);

  // For recent projects, take the last 4 or 5
  const RECENT_PROJECTS = projects.slice(-5).reverse();

  // For recent images, take the last 6
  const RECENT_IMAGES = photos.slice(-6).reverse().map(photo => ({
    id: photo.id,
    projectName: projects.find(p => p.photos?.some(pp => pp.id === photo.id))?.name || 'Unknown Project',
    url: photo.url,
    date: new Date(photo.createdAt).toLocaleDateString(), // Format date as needed
  }));

  // For recent locations, extract from projects and get unique ones
  const RECENT_LOCATIONS = Array.from(new Set(projects.map(project => project.location)))
    .filter(Boolean)
    .slice(-4).reverse()
    .map((location, index) => ({
      id: `location-${index}`,
      name: location,
      projects: projects.filter(p => p.location === location).length,
      lastVisit: "Today", // This would need actual logic to determine last visit
    }));

  // ── Entrance animation: mirrors onboarding exit (scale-down + fade-in) ──
  const enterOpacity = useSharedValue(0);
  const enterScale = useSharedValue(1.06);

  useEffect(() => {
    enterOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) });
    enterScale.value = withSpring(1, { damping: 22, stiffness: 160, mass: 0.8 });
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
    router.push("/settings");
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
    router.push("/modals/invite-global");
  };
  const handleAvatarsTap = () => {
    router.push("/modals/team-members");
  };

  const renderProjectCard = ({ item }: { item: typeof RECENT_PROJECTS[0] }) => (
    <TouchableOpacity
      onPress={() => handleProjectTap(item.id)}
      style={{ marginRight: 16, width: 300 }}
    >
      <View style={[{ borderRadius: 16, padding: 16 }, cardElevation]}>
        {/* Project Header */}
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-foreground" numberOfLines={1}>
              {item.name}
            </Text>
            <Text className="text-sm text-muted mt-1">{item.location}</Text>
          </View>
          <View
            className="px-3 py-1 rounded-full"
            style={{
              backgroundColor:
                item.status === "Completed"
                  ? colors.success + "20"
                  : colors.primary + "20",
            }}
          >
            <Text
              className="text-xs font-semibold"
              style={{
                color:
                  item.status === "Completed"
                    ? colors.success
                    : colors.primary,
              }}
            >
              {item.status}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View className="mb-3">
          <View className="flex-row justify-between mb-2">
            <Text className="text-xs text-muted">{t("home.progress")}</Text>
            <Text className="text-xs font-semibold text-foreground">
              {item.progress || 0}%
            </Text>
          </View>
          <View
            className="h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: colors.border }}
          >
            <View
              className="h-full rounded-full"
              style={{
                width: `${item.progress || 0}%`,
                backgroundColor: colors.primary,
              }}
            />
          </View>
        </View>

        {/* Documents and Comments (Mocked for now) */}
        <View className="flex-row items-center mb-3" style={{ gap: 12 }}>
          <View className="flex-row items-center">
            <IconSymbol name="doc.fill" size={14} color={colors.muted} />
            <Text className="text-xs text-muted" style={{ marginLeft: 6 }}>
              0 {t("home.documents")}
            </Text>
          </View>
          <View className="flex-row items-center">
            <IconSymbol name="bubble.left.fill" size={14} color={colors.muted} />
            <Text className="text-xs text-muted" style={{ marginLeft: 6 }}>
              0 {t("home.comments")}
            </Text>
          </View>
        </View>

        {/* Footer: Team Members and Date (Mocked for now) */}
        <View className="flex-row justify-between items-center">
          {/* Team Avatars */}
          <View className="flex-row">
            {/* {item.teamMembers.slice(0, 3).map((member, index) => (
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
                <Text style={{ fontSize: 10, fontWeight: '600', color: '#FFFFFF' }}>
                  {member}
                </Text>
              </View>
            ))} */}
          </View>
          {/* Date */}
          <Text className="text-xs text-muted">{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderImageCard = ({ item }: { item: typeof RECENT_IMAGES[0] }) => (
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
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
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

  const renderLocationCard = ({ item }: { item: typeof RECENT_LOCATIONS[0] }) => (
    <TouchableOpacity
      onPress={() => handleLocationTap(item.id)}
      style={{ marginRight: 16, width: 200 }}
    >
      <View style={[{ borderRadius: 16, padding: 16 }, cardElevation]}>
        <View className="flex-row items-center mb-2">
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.primary + "20" }}
          >
            <IconSymbol name="location.fill" size={20} color={colors.primary} />
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
              {item.name}
            </Text>
            <Text className="text-xs text-muted mt-1">{item.lastVisit}</Text>
          </View>
        </View>
        <View className="flex-row items-center mt-2">
          <IconSymbol name="folder.fill" size={12} color={colors.muted} />
          <Text className="text-xs text-muted" style={{ marginLeft: 4 }}>
            {item.projects} {t("home.projects")}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-foreground">Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-red-500">Error: {error.message}</Text>
      </View>
    );
  }

  return (
      <Animated.View style={enterStyle} className="bg-background">


        <ScrollView
          contentContainerStyle={{ paddingBottom: 100, paddingTop: Platform.OS === "ios" ? 90 : 0 }} // Adjust for large title
          showsVerticalScrollIndicator={false}
        >
          {/* Project Statuses Section */}
          <View style={{ paddingHorizontal: 16 }}>
            <Text className="text-lg font-semibold text-foreground mb-3">
              {t("home.projectStatuses")}
            </Text>
            <View className="flex-row flex-wrap justify-between">
              {PROJECT_STATUSES.map((status) => (
                <TouchableOpacity
                  key={status.id}
                  style={[
                    {
                      width: "48%",
                      marginBottom: 16,
                      backgroundColor: colors.surface,
                      borderRadius: 16,
                      padding: 16,
                      justifyContent: "space-between",
                    },
                    cardSmElevation,
                  ]}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
                      {t((status as any).nameKey)}
                    </Text>
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: colors.primary + "20",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconSymbol name="plus" size={14} color={colors.primary} />
                    </View>
                  </View>
                  <Text style={{ fontSize: 24, fontWeight: "700", color: colors.foreground }}>
                    {status.count}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {/* Recent Projects Section */}
          <View style={{ marginTop: 24 }}>
            <View style={{ paddingHorizontal: 16, marginBottom: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text className="text-lg font-semibold text-foreground">
                {t("home.recentProjects")}
              </Text>
              <TouchableOpacity>
                <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
                  {t("home.seeAll")}
                </Text>
              </TouchableOpacity>
            </View>
            {/* Horizontal Projects List */}
            {RECENT_PROJECTS.length > 0 ? (
              <FlatList
                data={RECENT_PROJECTS}
                renderItem={renderProjectCard}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 14 }}
              />
            ) : (
              <View className="flex-1 items-center justify-center py-12 px-6">
                <IconSymbol
                  name="folder.fill"
                  size={48}
                  color={colors.border}
                />
                <Text className="text-lg font-semibold text-foreground mt-4">
                  {t("home.noProjectsYet")}
                </Text>
                <Text className="text-sm text-muted text-center mt-2">
                  {t("home.createFirstProject")}
                </Text>
              </View>
            )}
          </View>
          {/* Recent Locations Section */}
          <View style={{ marginTop: 24 }}>
            <View style={{ paddingHorizontal: 16, marginBottom: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text className="text-lg font-semibold text-foreground">
                {t("home.recentLocations")}
              </Text>
              <TouchableOpacity>
                <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
                  {t("home.seeAll")}
                </Text>
              </TouchableOpacity>
            </View>
            {/* Horizontal Locations List */}
            {RECENT_LOCATIONS.length > 0 ? (
              <FlatList
                data={RECENT_LOCATIONS}
                renderItem={renderLocationCard}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 14 }}
              />
            ) : (
              <View className="flex-1 items-center justify-center py-12 px-6">
                <IconSymbol
                  name="location.fill"
                  size={48}
                  color={colors.border}
                />
                <Text className="text-lg font-semibold text-foreground mt-4">
                  {t("home.noLocationsYet")}
                </Text>
                <Text className="text-sm text-muted text-center mt-2">
                  {t("home.addFirstLocation")}
                </Text>
              </View>
            )}
          </View>
          {/* Recent Images Section */}
          <View style={{ marginTop: 24 }}>
            <View style={{ paddingHorizontal: 16, marginBottom: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text className="text-lg font-semibold text-foreground">
                {t("home.recentImages")}
              </Text>
              <TouchableOpacity>
                <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
                  {t("home.seeAll")}
                </Text>
              </TouchableOpacity>
            </View>
            {/* Horizontal Images List */}
            {RECENT_IMAGES.length > 0 ? (
              <FlatList
                data={RECENT_IMAGES}
                renderItem={renderImageCard}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 14 }}
              />
            ) : (
              <View className="flex-1 items-center justify-center py-12 px-6">
                <IconSymbol
                  name="photo.fill"
                  size={48}
                  color={colors.border}
                />
                <Text className="text-lg font-semibold text-foreground mt-4">
                  {t("home.noImagesYet")}
                </Text>
                <Text className="text-sm text-muted text-center mt-2">
                  {t("home.uploadFirstImage")}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
        {/* Floating Action Button Options */}
        <FabOptions />
      </Animated.View>
  );
}
