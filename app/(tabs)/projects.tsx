import { Text, View, TouchableOpacity, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SearchInput } from "@/components/ui/search-input";
import { useColors } from "@/hooks/use-colors";
import { useCardStyle } from "@/hooks/use-card-style";
import { FabOptions } from "@/components/fab-options";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";

// Mock data for all projects
const ALL_PROJECTS = [
  { id: "1", name: "Office Renovation",  location: "Downtown, NYC", progress: 65,  photos: 24, date: "Today",      status: "In Progress" },
  { id: "2", name: "Parking Lot Repair", location: "Queens, NY",    progress: 40,  photos: 12, date: "Yesterday",  status: "In Progress" },
  { id: "3", name: "Roof Installation",  location: "Brooklyn, NY",  progress: 100, photos: 45, date: "3 days ago", status: "Completed"   },
  { id: "4", name: "Foundation Repair",  location: "Bronx, NY",     progress: 25,  photos: 8,  date: "1 week ago", status: "In Progress" },
];

export default function ProjectsScreen() {
  const { t }                             = useTranslation();
  const router                            = useRouter();
  const colors                            = useColors();
  const cardElevation                     = useCardStyle();
  const [searchText, setSearchText]       = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  const filteredProjects = ALL_PROJECTS.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchText.toLowerCase()) ||
      project.location.toLowerCase().includes(searchText.toLowerCase());

    const matchesFilter =
      selectedFilter === "all" ||
      (selectedFilter === "active"    && project.status === "In Progress") ||
      (selectedFilter === "completed" && project.status === "Completed");

    return matchesSearch && matchesFilter;
  });

  const filterLabels: Record<string, string> = {
    all:       t('projects.filterAll'),
    active:    t('projects.filterActive'),
    completed: t('projects.filterCompleted'),
  };

  const renderProjectCard = ({ item }: { item: typeof ALL_PROJECTS[0] }) => {
    const isCompleted = item.status === "Completed";
    return (
      <TouchableOpacity onPress={() => router.push(`/project/${item.id}`)} style={{ marginBottom: 12 }}>
        <View style={[{ borderRadius: 16, padding: 16 }, cardElevation]}>
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-1">
              <Text className="text-lg font-semibold text-foreground" numberOfLines={1}>{item.name}</Text>
              <Text className="text-sm text-muted mt-1">{item.location}</Text>
            </View>
            <View
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: isCompleted ? colors.success + "20" : colors.primary + "20" }}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: isCompleted ? colors.success : colors.primary }}
              >
                {isCompleted ? t('projects.statusCompleted') : t('projects.statusInProgress')}
              </Text>
            </View>
          </View>

          <View className="mb-3">
            <View className="flex-row justify-between mb-2">
              <Text className="text-xs text-muted">{t('projects.progress')}</Text>
              <Text className="text-xs font-semibold text-foreground">{item.progress}%</Text>
            </View>
            <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.border }}>
              <View
                className="h-full rounded-full"
                style={{ width: `${item.progress}%`, backgroundColor: colors.primary }}
              />
            </View>
          </View>

          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center">
              <IconSymbol name="photo.stack.fill" size={14} color={colors.muted} />
              <Text className="text-xs text-muted" style={{ marginLeft: 6 }}>
                {item.photos} {t('projects.photos')}
              </Text>
            </View>
            <Text className="text-xs text-muted">{item.date}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer className="p-0">
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="px-6 pt-6 pb-4 border-b border-border">
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <Text className="text-3xl font-bold text-foreground">{t('projects.title')}</Text>
            <TouchableOpacity
              onPress={() => router.push("/create-project-location")}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}
            >
              <MaterialIcons name="add" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <SearchInput
            placeholder={t('projects.searchPlaceholder')}
            value={searchText}
            onChangeText={setSearchText}
            style={{ marginBottom: 16 }}
          />

          {/* Filter Buttons */}
          <View className="flex-row gap-2">
            {(["all", "active", "completed"] as const).map((filter) => (
              <TouchableOpacity
                key={filter}
                onPress={() => setSelectedFilter(filter)}
                className="px-4 py-2 rounded-full border border-border"
                style={{
                  backgroundColor: selectedFilter === filter ? colors.primary : colors.surface,
                  borderColor:     selectedFilter === filter ? colors.primary : colors.border,
                }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: selectedFilter === filter ? "#FFFFFF" : colors.foreground }}
                >
                  {filterLabels[filter]}
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
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 120 }}
          scrollEnabled={true}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-12">
              <IconSymbol name="photo.stack.fill" size={48} color={colors.border} />
              <Text className="text-lg font-semibold text-foreground mt-4">{t('projects.noProjects')}</Text>
              <Text className="text-sm text-muted text-center mt-2">{t('projects.noProjectsSubtitle')}</Text>
            </View>
          }
        />
        <FabOptions />
      </View>
    </ScreenContainer>
  );
}
