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

  const renderActionButton = (icon: string, title: string, onPress?: () => void) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        alignItems: 'center',
        gap: 8,
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <IconSymbol name={icon as any} size={24} color={colors.foreground} />
      </View>
      <Text style={{ fontSize: 12, color: colors.foreground }}>
        {title}
      </Text>
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
            {/* Action Buttons Row */}
            <View style={{ paddingHorizontal: 24, marginBottom: 24, flexDirection: 'row', justifyContent: 'space-around' }}>
              {renderActionButton("square.and.arrow.up", "Compartir")}
              {renderActionButton("bubble.left", "Comentar")}
              {renderActionButton("ellipsis", "Menú")}
            </View>

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

                {/* Quick Action Buttons */}
                <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: 10,
                      borderRadius: 12,
                      backgroundColor: colors.background,
                      gap: 6,
                    }}
                  >
                    <IconSymbol name="plus" size={16} color={colors.foreground} />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
                      Etiqueta
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: 10,
                      borderRadius: 12,
                      backgroundColor: colors.background,
                      gap: 6,
                    }}
                  >
                    <IconSymbol name="plus" size={16} color={colors.foreground} />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
                      Descripción
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: 10,
                      borderRadius: 12,
                      backgroundColor: colors.background,
                      gap: 6,
                    }}
                  >
                    <IconSymbol name="plus" size={16} color={colors.foreground} />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
                      Contacto
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Stats Cards */}
            <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {/* Tasks Card */}
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: colors.surface,
                    borderRadius: 20,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: 'center',
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: '#3B82F620',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <IconSymbol name="checkmark.circle.fill" size={28} color="#3B82F6" />
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground, marginBottom: 4 }}>
                    Tareas
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>
                    {project.tasks.remaining} Restante
                  </Text>
                  <TouchableOpacity
                    style={{
                      marginTop: 8,
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: colors.background,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconSymbol name="plus" size={16} color={colors.foreground} />
                  </TouchableOpacity>
                </TouchableOpacity>

                {/* Documents Card */}
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: colors.surface,
                    borderRadius: 20,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: 'center',
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: '#EC489820',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <IconSymbol name="doc.fill" size={28} color="#EC4898" />
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground, marginBottom: 4 }}>
                    Documen...
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>
                    {project.documents.total} Total
                  </Text>
                  <TouchableOpacity
                    style={{
                      marginTop: 8,
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: colors.background,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconSymbol name="plus" size={16} color={colors.foreground} />
                  </TouchableOpacity>
                </TouchableOpacity>

                {/* Payments Card */}
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: colors.surface,
                    borderRadius: 20,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: 'center',
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: '#84CC1620',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <IconSymbol name="dollarsign.circle.fill" size={28} color="#84CC16" />
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground, marginBottom: 4 }}>
                    Pagos
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>
                    {project.payments.amount}
                  </Text>
                  <TouchableOpacity
                    style={{
                      marginTop: 8,
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: colors.background,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconSymbol name="plus" size={16} color={colors.foreground} />
                  </TouchableOpacity>
                </TouchableOpacity>
              </View>
            </View>

            {/* Photos Section */}
            <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
                    Fotos
                  </Text>
                  <View
                    style={{
                      marginLeft: 8,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 8,
                      backgroundColor: colors.success + "20",
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <IconSymbol name="checkmark" size={12} color={colors.success} />
                      <Text style={{ marginLeft: 4, fontSize: 12, fontWeight: '600', color: colors.success }}>
                        Proyecto creado
                      </Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity>
                  <IconSymbol name="plus" size={20} color={colors.foreground} />
                </TouchableOpacity>
              </View>

              {/* Progress Bar */}
              <View
                style={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: colors.border,
                  marginBottom: 16,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    height: '100%',
                    width: '100%',
                    backgroundColor: colors.success,
                    borderRadius: 4,
                  }}
                />
              </View>

              {/* Add Photos Button */}
              <TouchableOpacity
                style={{
                  backgroundColor: colors.success + "20",
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 2,
                  borderColor: colors.success,
                  marginBottom: 16,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: colors.foreground, marginBottom: 4 }}>
                      Agregar fotos
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.muted }}>
                      Monitorea el progreso y mantén a todos informados.
                    </Text>
                  </View>
                  <IconSymbol name="chevron.right" size={20} color={colors.foreground} />
                </View>
              </TouchableOpacity>

              <Text style={{ fontSize: 13, color: colors.muted, textAlign: 'center' }}>
                Captura, sube y comparte fotos de tus proyectos.
              </Text>
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
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconSymbol name="square.and.arrow.up" size={20} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconSymbol name="bubble.left" size={20} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleMenuPress}
                style={{
                  paddingHorizontal: 16,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#000' }}>
                  Menú
                </Text>
              </TouchableOpacity>
            </View>
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
                  {project.users.length}
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
