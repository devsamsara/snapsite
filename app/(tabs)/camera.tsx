import { Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function CameraScreen() {
  const colors = useColors();

  return (
    <ScreenContainer className="p-6">
      <View className="flex-1 items-center justify-center gap-6">
        {/* Camera Icon */}
        <IconSymbol name="camera.fill" size={64} color={colors.primary} />

        {/* Title */}
        <View className="items-center gap-2">
          <Text className="text-3xl font-bold text-foreground">Camera</Text>
          <Text className="text-base text-muted text-center">
            Capture photos and videos of your projects
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="gap-3 w-full mt-6">
          <TouchableOpacity
            className="w-full py-4 rounded-xl items-center justify-center"
            style={{ backgroundColor: colors.primary }}
          >
            <View className="flex-row items-center">
              <IconSymbol name="camera.fill" size={20} color="#FFFFFF" />
              <Text className="text-white font-semibold" style={{ marginLeft: 8 }}>Take Photo</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="w-full py-4 rounded-xl items-center justify-center border border-border"
            style={{ backgroundColor: colors.surface }}
          >
            <View className="flex-row items-center">
              <IconSymbol name="photo.stack.fill" size={20} color={colors.primary} />
              <Text className="text-primary font-semibold" style={{ marginLeft: 8 }}>From Gallery</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Info Text */}
        <Text className="text-sm text-muted text-center mt-6">
          Photos will be automatically tagged with date, time, and location
        </Text>
      </View>
    </ScreenContainer>
  );
}
