import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function AddPhotoModal() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();

  const handleClose = () => router.back();
  const handleCamera = () => router.push("/camera-capture");
  const handleGallery = () => router.push("/gallery-picker");

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View style={S.header}>
        <Text style={[S.title, { color: colors.foreground }]}>{t('addPhoto.title')}</Text>
        <TouchableOpacity
          onPress={handleClose}
          style={[S.closeBtn, { backgroundColor: colors.surface }]}
        >
          <IconSymbol name="xmark" size={16} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Options */}
      <View style={S.optionsWrapper}>
        {/* Camera Option */}
        <TouchableOpacity
          onPress={handleCamera}
          style={[S.optionCard, S.optionCardMargin, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={[S.optionIcon, { backgroundColor: colors.primary + "20" }]}>
            <IconSymbol name="camera.fill" size={28} color={colors.primary} />
          </View>
          <View style={S.flex1}>
            <Text style={[S.optionTitle, { color: colors.foreground }]}>{t('addPhoto.takePhoto')}</Text>
            <Text style={[S.optionDesc, { color: colors.muted }]}>{t('addPhoto.takePhotoDesc')}</Text>
          </View>
          <IconSymbol name="chevron.right" size={20} color={colors.muted} />
        </TouchableOpacity>

        {/* Gallery Option */}
        <TouchableOpacity
          onPress={handleGallery}
          style={[S.optionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={[S.optionIcon, { backgroundColor: colors.success + "20" }]}>
            <IconSymbol name="photo.on.rectangle" size={28} color={colors.success} />
          </View>
          <View style={S.flex1}>
            <Text style={[S.optionTitle, { color: colors.foreground }]}>{t('addPhoto.selectGallery')}</Text>
            <Text style={[S.optionDesc, { color: colors.muted }]}>{t('addPhoto.selectGalleryDesc')}</Text>
          </View>
          <IconSymbol name="chevron.right" size={20} color={colors.muted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsWrapper: {
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  optionCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionCardMargin: {
    marginBottom: 16,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  flex1: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 14,
  },
});
