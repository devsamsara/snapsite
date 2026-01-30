import { Text, View, TouchableOpacity, Modal } from "react-native";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function AddPhotoModal() {
  const router = useRouter();
  const colors = useColors();

  const handleClose = () => {
    router.back();
  };

  const handleCamera = () => {
    router.push("/camera-capture");
  };

  const handleGallery = () => {
    router.push("/gallery-picker");
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
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
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foreground }}>
          Agregar Foto
        </Text>
        <TouchableOpacity
          onPress={handleClose}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconSymbol name="xmark" size={16} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Options */}
      <View style={{ paddingHorizontal: 24, paddingTop: 40 }}>
        {/* Camera Option */}
        <TouchableOpacity
          onPress={handleCamera}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 20,
            padding: 24,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.primary + "20",
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16,
            }}
          >
            <IconSymbol name="camera.fill" size={28} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '600', color: colors.foreground, marginBottom: 4 }}>
              Tomar Foto
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted }}>
              Usa la cámara para capturar una nueva foto
            </Text>
          </View>
          <IconSymbol name="chevron.right" size={20} color={colors.muted} />
        </TouchableOpacity>

        {/* Gallery Option */}
        <TouchableOpacity
          onPress={handleGallery}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 20,
            padding: 24,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.success + "20",
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16,
            }}
          >
            <IconSymbol name="photo.on.rectangle" size={28} color={colors.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '600', color: colors.foreground, marginBottom: 4 }}>
              Seleccionar de Galería
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted }}>
              Elige una foto de tu biblioteca
            </Text>
          </View>
          <IconSymbol name="chevron.right" size={20} color={colors.muted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
