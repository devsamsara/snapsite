import { ScrollView, Text, View, TouchableOpacity, FlatList } from "react-native";
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
  },
  {
    id: "2",
    name: "Parking Lot Repair",
    location: "Queens, NY",
    progress: 40,
    photos: 12,
    date: "Yesterday",
    status: "In Progress",
  },
  {
    id: "3",
    name: "Roof Installation",
    location: "Brooklyn, NY",
    progress: 100,
    photos: 45,
    date: "3 days ago",
    status: "Completed",
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
    // TODO: Navigate to project detail screen
  };

  const renderProjectCard = ({ item }: { item: typeof RECENT_PROJECTS[0] }) => (
    <TouchableOpacity
      onPress={() => handleProjectTap(item.id)}
      style={{ marginBottom: 12 }}
    >
      <View
        className="bg-surface rounded-2xl p-4 border border-border"
        style={{ borderColor: colors.border }}
      >
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
            <Text className="text-xs text-muted">Progress</Text>
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

        {/* Footer Info */}
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center gap-1">
            <IconSymbol name="photo.stack.fill" size={14} color={colors.muted} />
            <Text className="text-xs text-muted">{item.photos} photos</Text>
          </View>
          <Text className="text-xs text-muted">{item.date}</Text>
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
            <IconSymbol name="chevron.right" size={16} color={colors.muted} />
            <Text className="flex-1 ml-2 text-muted">Search projects...</Text>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Section Title */}
          <View className="mt-6 mb-4">
            <Text className="text-lg font-semibold text-foreground">
              Recent Projects
            </Text>
          </View>

          {/* Projects List */}
          <FlatList
            data={RECENT_PROJECTS}
            renderItem={renderProjectCard}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />

          {/* Empty State Hint */}
          {RECENT_PROJECTS.length === 0 && (
            <View className="flex-1 items-center justify-center py-12">
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
        <View className="absolute bottom-24 right-6">
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
