import { Text, View, TouchableOpacity, ScrollView, FlatList, Image } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

// Mock data for recent projects
const RECENT_PROJECTS = [
  {
    id: "1",
    name: "Office Renovation",
    location: "Downtown, NYC",
    progress: 65,
    photos: 24,
    date: "Today",
    status: "In Progress",
    thumbnail: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop",
  },
  {
    id: "2",
    name: "Parking Lot Repair",
    location: "Queens, NY",
    progress: 40,
    photos: 12,
    date: "Yesterday",
    status: "In Progress",
    thumbnail: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop",
  },
  {
    id: "3",
    name: "Roof Installation",
    location: "Brooklyn, NY",
    progress: 100,
    photos: 45,
    date: "3 days ago",
    status: "Completed",
    thumbnail: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&h=300&fit=crop",
  },
  {
    id: "4",
    name: "Bridge Construction",
    location: "Manhattan, NY",
    progress: 75,
    photos: 38,
    date: "1 week ago",
    status: "In Progress",
    thumbnail: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=300&fit=crop",
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

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();

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

  const renderProjectCard = ({ item }: { item: typeof RECENT_PROJECTS[0] }) => (
    <TouchableOpacity
      onPress={() => handleProjectTap(item.id)}
      style={{ marginRight: 16, width: 280 }}
    >
      <View
        className="bg-surface rounded-2xl overflow-hidden border border-border"
        style={{ borderColor: colors.border }}
      >
        {/* Project Thumbnail */}
        <Image
          source={{ uri: item.thumbnail }}
          style={{ width: '100%', height: 160 }}
          resizeMode="cover"
        />
        
        {/* Project Info */}
        <View className="p-4">
          {/* Header */}
          <View className="flex-row justify-between items-start mb-2">
            <View className="flex-1">
              <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
                {item.name}
              </Text>
              <Text className="text-xs text-muted mt-1">{item.location}</Text>
            </View>
            <View
              className="px-2 py-1 rounded-full ml-2"
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
            <View className="flex-row justify-between mb-1">
              <Text className="text-xs text-muted">Progress</Text>
              <Text className="text-xs font-semibold text-foreground">
                {item.progress}%
              </Text>
            </View>
            <View
              className="h-1.5 rounded-full overflow-hidden"
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

          {/* Footer Info */}
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center">
              <IconSymbol name="photo.stack.fill" size={12} color={colors.muted} />
              <Text className="text-xs text-muted" style={{ marginLeft: 4 }}>{item.photos} photos</Text>
            </View>
            <Text className="text-xs text-muted">{item.date}</Text>
          </View>
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

  return (
    <ScreenContainer className="p-0">
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="px-6 pt-6 pb-4 border-b border-border">
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-3xl font-bold text-foreground">FieldCam</Text>
              <Text className="text-sm text-muted mt-1">
                Document your projects
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleSettingsTap}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.surface }}
            >
              <IconSymbol name="person.fill" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View
            className="flex-row items-center px-4 py-2 rounded-xl border border-border"
            style={{ backgroundColor: colors.surface }}
          >
            <IconSymbol name="magnifyingglass" size={16} color={colors.muted} />
            <Text className="flex-1 text-muted" style={{ marginLeft: 12 }}>Search projects...</Text>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Recent Projects Section */}
          <View className="mt-6">
            <View className="px-6 mb-4 flex-row justify-between items-center">
              <Text className="text-lg font-semibold text-foreground">
                Recent Projects
              </Text>
              <TouchableOpacity>
                <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
                  See All
                </Text>
              </TouchableOpacity>
            </View>

            {/* Horizontal Projects List */}
            <FlatList
              data={RECENT_PROJECTS}
              renderItem={renderProjectCard}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24 }}
            />
          </View>

          {/* Recent Images Section */}
          <View className="mt-8">
            <View className="px-6 mb-4 flex-row justify-between items-center">
              <Text className="text-lg font-semibold text-foreground">
                Recent Images
              </Text>
              <TouchableOpacity>
                <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
                  See All
                </Text>
              </TouchableOpacity>
            </View>

            {/* Horizontal Images List */}
            <FlatList
              data={RECENT_IMAGES}
              renderItem={renderImageCard}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24 }}
            />
          </View>

          {/* Empty State Hint */}
          {RECENT_PROJECTS.length === 0 && (
            <View className="flex-1 items-center justify-center py-12 px-6">
              <IconSymbol
                name="photo.stack.fill"
                size={48}
                color={colors.border}
              />
              <Text className="text-lg font-semibold text-foreground mt-4">
                No projects yet
              </Text>
              <Text className="text-sm text-muted text-center mt-2">
                Create your first project to get started
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Floating Action Button */}
        <View style={{ position: 'absolute', bottom: 100, right: 24 }}>
          <TouchableOpacity
            onPress={handleCreateProject}
            className="w-14 h-14 rounded-full items-center justify-center shadow-lg"
            style={{ backgroundColor: colors.primary }}
          >
            <IconSymbol name="plus.circle.fill" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
