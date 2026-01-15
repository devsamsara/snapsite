import { ScrollView, Text, View, TouchableOpacity, FlatList, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useState } from "react";

// Mock data for all projects
const ALL_PROJECTS = [
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
  {
    id: "4",
    name: "Foundation Repair",
    location: "Bronx, NY",
    progress: 25,
    photos: 8,
    date: "1 week ago",
    status: "In Progress",
  },
];

export default function ProjectsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [searchText, setSearchText] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  const filteredProjects = ALL_PROJECTS.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchText.toLowerCase()) ||
      project.location.toLowerCase().includes(searchText.toLowerCase());

    const matchesFilter =
      selectedFilter === "all" ||
      (selectedFilter === "active" && project.status === "In Progress") ||
      (selectedFilter === "completed" && project.status === "Completed");

    return matchesSearch && matchesFilter;
  });

  const handleProjectTap = (projectId: string) => {
    // TODO: Navigate to project detail screen
  };

  const handleCreateProject = () => {
    // TODO: Navigate to create project screen
  };

  const renderProjectCard = ({ item }: { item: typeof ALL_PROJECTS[0] }) => (
    <TouchableOpacity
      onPress={() => handleProjectTap(item.id)}
      style={{ marginBottom: 12 }}
    >
      <View
        className="bg-surface rounded-2xl p-4 border border-border"
        style={{ borderColor: colors.border }}
      >
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
          <Text className="text-3xl font-bold text-foreground mb-6">
            Projects
          </Text>

          {/* Search Bar */}
          <View
            className="flex-row items-center px-4 py-3 rounded-xl border border-border mb-4"
            style={{ backgroundColor: colors.surface }}
          >
            <IconSymbol name="chevron.right" size={16} color={colors.muted} />
            <TextInput
              className="flex-1 ml-2 text-foreground"
              placeholder="Search projects..."
              placeholderTextColor={colors.muted}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          {/* Filter Buttons */}
          <View className="flex-row gap-2">
            {["all", "active", "completed"].map((filter) => (
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
                  className="text-xs font-semibold capitalize"
                  style={{
                    color:
                      selectedFilter === filter
                        ? "#FFFFFF"
                        : colors.foreground,
                  }}
                >
                  {filter === "all" ? "All" : filter === "active" ? "Active" : "Completed"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Projects List */}
        <FlatList
          data={filteredProjects}
          renderItem={renderProjectCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 20 }}
          scrollEnabled={true}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-12">
              <IconSymbol
                name="photo.stack.fill"
                size={48}
                color={colors.border}
              />
              <Text className="text-lg font-semibold text-foreground mt-4">
                No projects found
              </Text>
              <Text className="text-sm text-muted text-center mt-2">
                Try adjusting your search or filters
              </Text>
            </View>
          }
        />
      </View>
    </ScreenContainer>
  );
}
