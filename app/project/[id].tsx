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
    location: "3 C. Ponce de León, Huelva, AN 21004",
    thumbnail: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop",
    description: "Complete renovation of the main office building including new flooring, painting, electrical work, and furniture installation.",
    tasks: {
      total: 12,
      completed: 8,
      remaining: 3,
    },
    documents: {
      total: 24,
    },
    payments: {
      amount: "0,00 €",
    },
    photos: [
      { id: "1", url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop", date: "2 hours ago" },
      { id: "2", url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400&h=300&fit=crop", date: "5 hours ago" },
      { id: "3", url: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=400&h=300&fit=crop", date: "Yesterday" },
      { id: "4", url: "https://images.unsplash.com/photo-1497366412874-3415097a27e7?w=400&h=300&fit=crop", date: "Yesterday" },
      { id: "5", url: "https://images.unsplash.com/photo-1497366858526-0766cadbe8fa?w=400&h=300&fit=crop", date: "2 days ago" },
      { id: "6", url: "https://images.unsplash.com/photo-1497366672149-e5e4b4d34eb3?w=400&h=300&fit=crop", date: "3 days ago" },
    ],
    users: [
      { id: "1", name: "Juan Perez", initials: "JP", lastActivity: "Jan 27, 2026" },
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

  const renderMenuItem = (icon: string, title: string, onPress?: () => void) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: colors.surface,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <IconSymbol name={icon as any} size={20} color={colors.foreground} />
      </View>
      <Text style={{ flex: 1, marginLeft: 16, fontSize: 15, fontWeight: '500', color: colors.foreground }}>
        {title}
      </Text>
      <IconSymbol name="chevron.right" size={16} color={colors.muted} />
    </TouchableOpacity>
  );

  if (showSettings) {
    // Settings/Menu View
    return (
      <ScreenContainer className="p-0">
        <View className="flex-1 bg-background">
          {/* Settings Header */}
          <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 }}>
            <TouchableOpacity
              onPress={handleMenuPress}
              style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -12 }}
            >
              <IconSymbol name="xmark" size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            {/* Project Info Card */}
            <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
              <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}>
                <View
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 24,
                    backgroundColor: colors.border,
                    marginBottom: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconSymbol name="photo" size={40} color={colors.muted} />
                </View>
                <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foreground, marginBottom: 8, textAlign: 'center' }}>
                  {project.name}
                </Text>
                <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center', marginBottom: 20 }}>
                  {project.location}
                </Text>

                {/* Action Buttons: Editar, Favorito, Compartir */}
                <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: 12,
                      borderRadius: 16,
                      backgroundColor: colors.background,
                      gap: 6,
                    }}
                  >
                    <IconSymbol name="pencil" size={16} color={colors.foreground} />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
                      Editar
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: 12,
                      borderRadius: 16,
                      backgroundColor: colors.background,
                      gap: 6,
                    }}
                  >
                    <IconSymbol name="star" size={16} color={colors.foreground} />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
                      Favorito
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: 12,
                      borderRadius: 16,
                      backgroundColor: colors.background,
                      gap: 6,
                    }}
                  >
                    <IconSymbol name="square.and.arrow.up" size={16} color={colors.foreground} />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
                      Compartir
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Menu Items */}
            <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
              {renderMenuItem("photo.on.rectangle", "Crear Nueva Exhibición")}
              {renderMenuItem("star", "Solicitar Reseñas")}
              {renderMenuItem("map", "Obtener Direcciones")}
              {renderMenuItem("rectangle.on.rectangle", "Administrar Grupos de Proyectos")}
            </View>

            {/* Configuration Section */}
            <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 16 }}>
                Configuración del Proyecto
              </Text>

              {/* Users Section */}
              <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>
                  Usuarios
                </Text>
                {project.users.map((user: any) => (
                  <View key={user.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: colors.primary + "20",
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      <Text style={{ fontSize: 16, fontWeight: '600', color: colors.primary }}>
                        {user.initials}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: colors.foreground }}>
                        {user.name}
                      </Text>
                      <Text style={{ fontSize: 13, color: colors.muted }}>
                        Última actividad: {user.lastActivity}
                      </Text>
                    </View>
                  </View>
                ))}
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                  }}
                >
                  <IconSymbol name="plus.circle" size={20} color={colors.foreground} />
                  <Text style={{ marginLeft: 8, fontSize: 15, fontWeight: '500', color: colors.foreground }}>
                    Asignar
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Quick Actions */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    gap: 6,
                  }}
                >
                  <IconSymbol name="plus" size={16} color={colors.foreground} />
                  <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground }}>
                    Contacto
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    gap: 6,
                  }}
                >
                  <IconSymbol name="plus" size={16} color={colors.foreground} />
                  <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground }}>
                    Etiquetas
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    gap: 6,
                  }}
                >
                  <IconSymbol name="plus" size={16} color={colors.foreground} />
                  <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground }}>
                    Descripción
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    gap: 6,
                  }}
                >
                  <IconSymbol name="plus" size={16} color={colors.foreground} />
                  <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground }}>
                    Colaboradores
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Danger Zone */}
            <View style={{ paddingHorizontal: 24 }}>
              <TouchableOpacity
                style={{
                  paddingVertical: 16,
                  borderRadius: 16,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.foreground }}>
                  Archivar proyecto
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  paddingVertical: 16,
                  borderRadius: 16,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.foreground }}>
                  Borrar Proyecto
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </ScreenContainer>
    );
  }

  // Main Detail View
  return (
    <ScreenContainer className="p-0">
      <View className="flex-1 bg-background">
        {/* Header with Back Button and Menu */}
        <View
          style={{
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: 16,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <TouchableOpacity
            onPress={handleGoBack}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <IconSymbol name="chevron.left" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleMenuPress}
            style={{
              paddingHorizontal: 16,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.foreground }}>
              Menú
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Project Info Card */}
          <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
            <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}>
              <View
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 24,
                  backgroundColor: colors.border,
                  marginBottom: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconSymbol name="photo" size={40} color={colors.muted} />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foreground, marginBottom: 8, textAlign: 'center' }}>
                {project.name}
              </Text>
              <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center', marginBottom: 20 }}>
                {project.location}
              </Text>

              {/* Action Buttons: Editar, Favorito, Compartir */}
              <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 12,
                    borderRadius: 16,
                    backgroundColor: colors.background,
                    gap: 6,
                  }}
                >
                  <IconSymbol name="pencil" size={16} color={colors.foreground} />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
                    Editar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 12,
                    borderRadius: 16,
                    backgroundColor: colors.background,
                    gap: 6,
                  }}
                >
                  <IconSymbol name="star" size={16} color={colors.foreground} />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
                    Favorito
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 12,
                    borderRadius: 16,
                    backgroundColor: colors.background,
                    gap: 6,
                  }}
                >
                  <IconSymbol name="square.and.arrow.up" size={16} color={colors.foreground} />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
                    Compartir
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Photos Section */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ paddingHorizontal: 24, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground }}>
                Fotos ({project.photos.length})
              </Text>
              <TouchableOpacity>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>
                  Ver Todas
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

          {/* Menu Items */}
          <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
            {renderMenuItem("photo.on.rectangle", "Crear Nueva Exhibición")}
            {renderMenuItem("star", "Solicitar Reseñas")}
            {renderMenuItem("map", "Obtener Direcciones")}
            {renderMenuItem("rectangle.on.rectangle", "Administrar Grupos de Proyectos")}
          </View>

          {/* Configuration Section */}
          <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 16 }}>
              Configuración del Proyecto
            </Text>

            {/* Users Section */}
            <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>
                Usuarios
              </Text>
              {project.users.map((user: any) => (
                <View key={user.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: colors.primary + "20",
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '600', color: colors.primary }}>
                      {user.initials}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: colors.foreground }}>
                      {user.name}
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.muted }}>
                      Última actividad: {user.lastActivity}
                    </Text>
                  </View>
                </View>
              ))}
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                }}
              >
                <IconSymbol name="plus.circle" size={20} color={colors.foreground} />
                <Text style={{ marginLeft: 8, fontSize: 15, fontWeight: '500', color: colors.foreground }}>
                  Asignar
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quick Actions */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  gap: 6,
                }}
              >
                <IconSymbol name="plus" size={16} color={colors.foreground} />
                <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground }}>
                  Contacto
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  gap: 6,
                }}
              >
                <IconSymbol name="plus" size={16} color={colors.foreground} />
                <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground }}>
                  Etiquetas
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  gap: 6,
                }}
              >
                <IconSymbol name="plus" size={16} color={colors.foreground} />
                <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground }}>
                  Descripción
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  gap: 6,
                }}
              >
                <IconSymbol name="plus" size={16} color={colors.foreground} />
                <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground }}>
                  Colaboradores
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Danger Zone */}
          <View style={{ paddingHorizontal: 24 }}>
            <TouchableOpacity
              style={{
                paddingVertical: 16,
                borderRadius: 16,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.foreground }}>
                Archivar proyecto
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                paddingVertical: 16,
                borderRadius: 16,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.foreground }}>
                Borrar Proyecto
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
