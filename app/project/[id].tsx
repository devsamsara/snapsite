import { Text, View, TouchableOpacity, ScrollView, Image, FlatList } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useState } from "react";

// Mock data for project detail
const PROJECT_DETAILS: Record<string, any> = {
  "1": {
    id: "1",
    name: "Office Renovation",
    location: "Downtown, NYC",
    thumbnail: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop",
    description: "Complete renovation of the main office building including new flooring, painting, electrical work, and furniture installation.",
    tasks: {
      total: 12,
      completed: 8,
      pending: 4,
    },
    documents: {
      total: 24,
      recent: 5,
    },
    team: {
      total: 8,
      online: 3,
    },
    photos: [
      { id: "1", url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop", date: "2 hours ago" },
      { id: "2", url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400&h=300&fit=crop", date: "5 hours ago" },
      { id: "3", url: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=400&h=300&fit=crop", date: "Yesterday" },
      { id: "4", url: "https://images.unsplash.com/photo-1497366412874-3415097a27e7?w=400&h=300&fit=crop", date: "Yesterday" },
      { id: "5", url: "https://images.unsplash.com/photo-1497366858526-0766cadbe8fa?w=400&h=300&fit=crop", date: "2 days ago" },
      { id: "6", url: "https://images.unsplash.com/photo-1497366672149-e5e4b4d34eb3?w=400&h=300&fit=crop", date: "3 days ago" },
    ],
  },
};

export default function ProjectDetailScreen() {
  const router = useRouter();
  const colors = useColors();
  const { id } = useLocalSearchParams();
  const [showSettings, setShowSettings] = useState(false);
  
  const project = PROJECT_DETAILS[id as string] || PROJECT_DETAILS["1"];

  const handleGoBack = () => {
    router.back();
  };

  const handleMenuPress = () => {
    setShowSettings(!showSettings);
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

  const renderSettingsItem = (icon: string, title: string, onPress?: () => void) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <IconSymbol name={icon as any} size={20} color={colors.foreground} />
      <Text style={{ flex: 1, marginLeft: 16, fontSize: 15, color: colors.foreground }}>
        {title}
      </Text>
      <IconSymbol name="chevron.right" size={16} color={colors.muted} />
    </TouchableOpacity>
  );

  if (showSettings) {
    return (
      <ScreenContainer className="p-0">
        <View className="flex-1 bg-background">
          {/* Settings Header */}
          <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <TouchableOpacity
              onPress={handleMenuPress}
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
            >
              <IconSymbol name="chevron.left" size={20} color={colors.foreground} />
              <Text style={{ marginLeft: 8, fontSize: 16, fontWeight: '600', color: colors.foreground }}>
                Back
              </Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground }}>
              Project Settings
            </Text>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Project Info Card */}
            <View style={{ paddingHorizontal: 24, paddingVertical: 24 }}>
              <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border }}>
                <Image
                  source={{ uri: project.thumbnail }}
                  style={{ width: '100%', height: 160, borderRadius: 12, marginBottom: 12 }}
                  resizeMode="cover"
                />
                <Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground, marginBottom: 4 }}>
                  {project.name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <IconSymbol name="location.fill" size={14} color={colors.muted} />
                  <Text style={{ marginLeft: 4, fontSize: 14, color: colors.muted }}>
                    {project.location}
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={{ flexDirection: 'row', marginTop: 16, gap: 12 }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: 10,
                      borderRadius: 10,
                      backgroundColor: colors.primary,
                    }}
                  >
                    <IconSymbol name="pencil" size={16} color="#FFFFFF" />
                    <Text style={{ marginLeft: 6, fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>
                      Edit
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: 10,
                      borderRadius: 10,
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <IconSymbol name="star" size={16} color={colors.foreground} />
                    <Text style={{ marginLeft: 6, fontSize: 14, fontWeight: '600', color: colors.foreground }}>
                      Favorite
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: 10,
                      borderRadius: 10,
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <IconSymbol name="square.and.arrow.up" size={16} color={colors.foreground} />
                    <Text style={{ marginLeft: 6, fontSize: 14, fontWeight: '600', color: colors.foreground }}>
                      Share
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Settings Items */}
            <View style={{ backgroundColor: colors.surface, marginHorizontal: 24, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
              {renderSettingsItem("star.bubble", "Request Reviews")}
              {renderSettingsItem("gearshape", "Project Configuration")}
              {renderSettingsItem("person.2", "Add Contacts")}
              {renderSettingsItem("tag", "Tags")}
              {renderSettingsItem("doc.text", "Description")}
              {renderSettingsItem("person.3", "Collaborators")}
            </View>

            {/* Danger Zone */}
            <View style={{ paddingHorizontal: 24, marginTop: 32 }}>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginBottom: 12,
                }}
              >
                <IconSymbol name="archivebox" size={18} color={colors.foreground} />
                <Text style={{ marginLeft: 8, fontSize: 15, fontWeight: '600', color: colors.foreground }}>
                  Archive Project
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: '#EF4444',
                }}
              >
                <IconSymbol name="trash" size={18} color="#FFFFFF" />
                <Text style={{ marginLeft: 8, fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>
                  Delete Project
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0">
      <View className="flex-1 bg-background">
        {/* Header with Image */}
        <View style={{ position: 'relative' }}>
          <Image
            source={{ uri: project.thumbnail }}
            style={{ width: '100%', height: 200 }}
            resizeMode="cover"
          />
          {/* Header Overlay */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              paddingHorizontal: 24,
              paddingTop: 16,
              paddingBottom: 16,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
            }}
          >
            <TouchableOpacity
              onPress={handleGoBack}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconSymbol name="chevron.left" size={20} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleMenuPress}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconSymbol name="ellipsis" size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Project Info */}
          <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground, marginBottom: 8 }}>
              {project.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <IconSymbol name="location.fill" size={16} color={colors.muted} />
              <Text style={{ marginLeft: 6, fontSize: 15, color: colors.muted }}>
                {project.location}
              </Text>
            </View>
          </View>

          {/* Stats Cards */}
          <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {/* Tasks Card */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: colors.primary + "20",
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconSymbol name="checkmark.circle.fill" size={20} color={colors.primary} />
                  </View>
                </View>
                <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground, marginBottom: 4 }}>
                  {project.tasks.completed}/{project.tasks.total}
                </Text>
                <Text style={{ fontSize: 13, color: colors.muted }}>
                  Tasks
                </Text>
              </View>

              {/* Documents Card */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: colors.success + "20",
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconSymbol name="doc.fill" size={20} color={colors.success} />
                  </View>
                </View>
                <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground, marginBottom: 4 }}>
                  {project.documents.total}
                </Text>
                <Text style={{ fontSize: 13, color: colors.muted }}>
                  Documents
                </Text>
              </View>

              {/* Team Card */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: '#F59E0B20',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconSymbol name="person.2.fill" size={20} color="#F59E0B" />
                  </View>
                </View>
                <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground, marginBottom: 4 }}>
                  {project.team.total}
                </Text>
                <Text style={{ fontSize: 13, color: colors.muted }}>
                  Team
                </Text>
              </View>
            </View>
          </View>

          {/* Photos Section */}
          <View>
            <View style={{ paddingHorizontal: 24, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground }}>
                Photos ({project.photos.length})
              </Text>
              <TouchableOpacity>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>
                  View All
                </Text>
              </TouchableOpacity>
            </View>

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
