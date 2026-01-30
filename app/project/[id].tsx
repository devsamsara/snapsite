import { Text, View, TouchableOpacity, ScrollView, Image, FlatList } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

// Mock data for project detail
const PROJECT_DETAILS: Record<string, any> = {
  "1": {
    id: "1",
    name: "Office Renovation",
    location: "Downtown, NYC",
    description: "Complete renovation of the main office building including new flooring, painting, electrical work, and furniture installation. The project aims to create a modern and comfortable workspace for employees.",
    progress: 65,
    status: "In Progress",
    startDate: "Jan 15, 2024",
    endDate: "Mar 30, 2024",
    budget: "$125,000",
    team: ["John Doe", "Jane Smith", "Mike Johnson"],
    photos: [
      { id: "1", url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop", date: "2 hours ago" },
      { id: "2", url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400&h=300&fit=crop", date: "5 hours ago" },
      { id: "3", url: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=400&h=300&fit=crop", date: "Yesterday" },
      { id: "4", url: "https://images.unsplash.com/photo-1497366412874-3415097a27e7?w=400&h=300&fit=crop", date: "Yesterday" },
      { id: "5", url: "https://images.unsplash.com/photo-1497366858526-0766cadbe8fa?w=400&h=300&fit=crop", date: "2 days ago" },
      { id: "6", url: "https://images.unsplash.com/photo-1497366672149-e5e4b4d34eb3?w=400&h=300&fit=crop", date: "3 days ago" },
    ],
    milestones: [
      { id: "1", title: "Demolition", completed: true, date: "Jan 20" },
      { id: "2", title: "Electrical Work", completed: true, date: "Feb 5" },
      { id: "3", title: "Flooring Installation", completed: false, date: "Feb 25" },
      { id: "4", title: "Painting", completed: false, date: "Mar 10" },
      { id: "5", title: "Furniture Setup", completed: false, date: "Mar 25" },
    ],
  },
  "2": {
    id: "2",
    name: "Parking Lot Repair",
    location: "Queens, NY",
    description: "Repair and resurfacing of the parking lot including crack filling, sealcoating, and line striping. The project will improve the overall appearance and safety of the parking area.",
    progress: 40,
    status: "In Progress",
    startDate: "Feb 1, 2024",
    endDate: "Mar 15, 2024",
    budget: "$45,000",
    team: ["Sarah Williams", "Tom Brown"],
    photos: [
      { id: "1", url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop", date: "1 day ago" },
      { id: "2", url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop", date: "2 days ago" },
      { id: "3", url: "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=400&h=300&fit=crop", date: "3 days ago" },
    ],
    milestones: [
      { id: "1", title: "Surface Cleaning", completed: true, date: "Feb 5" },
      { id: "2", title: "Crack Repair", completed: true, date: "Feb 12" },
      { id: "3", title: "Sealcoating", completed: false, date: "Feb 28" },
      { id: "4", title: "Line Striping", completed: false, date: "Mar 10" },
    ],
  },
};

export default function ProjectDetailScreen() {
  const router = useRouter();
  const colors = useColors();
  const { id } = useLocalSearchParams();
  
  const project = PROJECT_DETAILS[id as string] || PROJECT_DETAILS["1"];

  const handleGoBack = () => {
    router.back();
  };

  const handleImageTap = (imageId: string) => {
    // TODO: Navigate to image detail/fullscreen view
  };

  const renderPhotoItem = ({ item }: { item: typeof project.photos[0] }) => (
    <TouchableOpacity
      onPress={() => handleImageTap(item.id)}
      style={{ marginRight: 12 }}
    >
      <View className="rounded-xl overflow-hidden">
        <Image
          source={{ uri: item.url }}
          style={{ width: 160, height: 160 }}
          resizeMode="cover"
        />
        {/* Date overlay */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            paddingVertical: 4,
            paddingHorizontal: 8,
          }}
        >
          <Text className="text-white text-xs">{item.date}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderMilestone = (milestone: typeof project.milestones[0]) => (
    <View key={milestone.id} className="flex-row items-center mb-4">
      <View
        className="w-6 h-6 rounded-full items-center justify-center mr-3"
        style={{
          backgroundColor: milestone.completed
            ? colors.success + "20"
            : colors.border,
        }}
      >
        {milestone.completed && (
          <IconSymbol name="checkmark" size={14} color={colors.success} />
        )}
      </View>
      <View className="flex-1">
        <Text
          className="text-sm font-semibold"
          style={{
            color: milestone.completed ? colors.foreground : colors.muted,
            textDecorationLine: milestone.completed ? "line-through" : "none",
          }}
        >
          {milestone.title}
        </Text>
        <Text className="text-xs text-muted mt-1">{milestone.date}</Text>
      </View>
    </View>
  );

  return (
    <ScreenContainer className="p-0">
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="px-6 pt-6 pb-4 border-b border-border">
          <View className="flex-row items-center mb-4">
            <TouchableOpacity
              onPress={handleGoBack}
              className="w-10 h-10 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: colors.surface }}
            >
              <IconSymbol name="chevron.left" size={20} color={colors.foreground} />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground" numberOfLines={1}>
                {project.name}
              </Text>
            </View>
            <TouchableOpacity
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.surface }}
            >
              <IconSymbol name="ellipsis" size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Status Badge */}
          <View className="flex-row items-center">
            <View
              className="px-3 py-1 rounded-full"
              style={{
                backgroundColor:
                  project.status === "Completed"
                    ? colors.success + "20"
                    : colors.primary + "20",
              }}
            >
              <Text
                className="text-xs font-semibold"
                style={{
                  color:
                    project.status === "Completed"
                      ? colors.success
                      : colors.primary,
                }}
              >
                {project.status}
              </Text>
            </View>
            <View className="flex-row items-center ml-3">
              <IconSymbol name="location.fill" size={14} color={colors.muted} />
              <Text className="text-sm text-muted" style={{ marginLeft: 4 }}>
                {project.location}
              </Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Progress Section */}
          <View className="px-6 py-6 border-b border-border">
            <Text className="text-base font-semibold text-foreground mb-3">
              Overall Progress
            </Text>
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-muted">Completion</Text>
              <Text className="text-sm font-semibold text-foreground">
                {project.progress}%
              </Text>
            </View>
            <View
              className="h-3 rounded-full overflow-hidden"
              style={{ backgroundColor: colors.border }}
            >
              <View
                className="h-full rounded-full"
                style={{
                  width: `${project.progress}%`,
                  backgroundColor: colors.primary,
                }}
              />
            </View>
          </View>

          {/* Description Section */}
          <View className="px-6 py-6 border-b border-border">
            <Text className="text-base font-semibold text-foreground mb-3">
              Description
            </Text>
            <Text className="text-sm text-muted leading-6">
              {project.description}
            </Text>
          </View>

          {/* Project Info Grid */}
          <View className="px-6 py-6 border-b border-border">
            <Text className="text-base font-semibold text-foreground mb-4">
              Project Information
            </Text>
            <View className="flex-row flex-wrap">
              {/* Start Date */}
              <View className="w-1/2 mb-4">
                <Text className="text-xs text-muted mb-1">Start Date</Text>
                <Text className="text-sm font-semibold text-foreground">
                  {project.startDate}
                </Text>
              </View>
              {/* End Date */}
              <View className="w-1/2 mb-4">
                <Text className="text-xs text-muted mb-1">End Date</Text>
                <Text className="text-sm font-semibold text-foreground">
                  {project.endDate}
                </Text>
              </View>
              {/* Budget */}
              <View className="w-1/2 mb-4">
                <Text className="text-xs text-muted mb-1">Budget</Text>
                <Text className="text-sm font-semibold text-foreground">
                  {project.budget}
                </Text>
              </View>
              {/* Photos Count */}
              <View className="w-1/2 mb-4">
                <Text className="text-xs text-muted mb-1">Photos</Text>
                <Text className="text-sm font-semibold text-foreground">
                  {project.photos.length} images
                </Text>
              </View>
            </View>
          </View>

          {/* Team Section */}
          <View className="px-6 py-6 border-b border-border">
            <Text className="text-base font-semibold text-foreground mb-4">
              Team Members
            </Text>
            <View className="flex-row flex-wrap">
              {project.team.map((member: string, index: number) => (
                <View
                  key={index}
                  className="flex-row items-center px-3 py-2 rounded-full mr-2 mb-2"
                  style={{ backgroundColor: colors.surface }}
                >
                  <View
                    className="w-6 h-6 rounded-full items-center justify-center mr-2"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Text className="text-white text-xs font-semibold">
                      {member.charAt(0)}
                    </Text>
                  </View>
                  <Text className="text-sm text-foreground">{member}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Milestones Section */}
          <View className="px-6 py-6 border-b border-border">
            <Text className="text-base font-semibold text-foreground mb-4">
              Milestones
            </Text>
            {project.milestones.map(renderMilestone)}
          </View>

          {/* Photos Section */}
          <View className="py-6">
            <View className="px-6 mb-4 flex-row justify-between items-center">
              <Text className="text-base font-semibold text-foreground">
                Photos ({project.photos.length})
              </Text>
              <TouchableOpacity>
                <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
                  View All
                </Text>
              </TouchableOpacity>
            </View>

            {/* Horizontal Photos List */}
            <FlatList
              data={project.photos}
              renderItem={renderPhotoItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24 }}
            />
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
