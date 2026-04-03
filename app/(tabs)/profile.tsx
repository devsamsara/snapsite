import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function ProfileScreen() {
  const { t }  = useTranslation();
  const colors = useColors();
  const router = useRouter();

  const menuItems = [
    { icon: "person.fill",                          label: t('profile.editProfile'), action: "edit",     route: "/edit-profile" },
    { icon: "bubble.left.and.bubble.right.fill",    label: t('profile.messages'),    action: "messages", route: null },
    { icon: "gear",                                 label: t('profile.settings'),    action: "settings", route: "/settings" },
    { icon: "trash.fill",                           label: t('profile.logout'),      action: "logout",   route: null, color: "error" },
  ];

  const handlePress = (item: typeof menuItems[0]) => {
    if (item.route) router.push(item.route as any);
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header */}
        <View className="px-6 pt-6 pb-6 border-b border-border">
          <Text className="text-3xl font-bold text-foreground mb-6">{t('profile.title')}</Text>

          {/* Profile Card */}
          <View
            className="bg-surface rounded-2xl p-6 items-center border border-border"
            style={{ borderColor: colors.border }}
          >
            {/* Avatar */}
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: colors.primary }}
            >
              <IconSymbol name="person.fill" size={40} color="#FFFFFF" />
            </View>

            {/* User Info */}
            <Text className="text-2xl font-bold text-foreground">John Doe</Text>
            <Text className="text-sm text-muted mt-1">john@example.com</Text>
            <Text className="text-sm text-muted mt-1">Project Manager</Text>

            {/* Stats */}
            <View className="flex-row gap-6 mt-6 pt-6 border-t border-border w-full">
              <View className="flex-1 items-center">
                <Text className="text-2xl font-bold text-primary">12</Text>
                <Text className="text-xs text-muted mt-1">{t('profile.projects')}</Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-2xl font-bold text-primary">245</Text>
                <Text className="text-xs text-muted mt-1">{t('profile.photos')}</Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-2xl font-bold text-primary">8</Text>
                <Text className="text-xs text-muted mt-1">{t('profile.teamMembers')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View className="px-6 py-6 gap-3">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handlePress(item)}
              className="flex-row items-center justify-between px-4 py-4 rounded-xl border border-border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <View className="flex-row items-center flex-1">
                <IconSymbol
                  name={item.icon as any}
                  size={20}
                  color={item.color === "error" ? colors.error : colors.primary}
                />
                <Text
                  className="font-semibold"
                  style={{
                    color: item.color === "error" ? colors.error : colors.foreground,
                    marginLeft: 16,
                  }}
                >
                  {item.label}
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.muted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Version Info */}
        <View className="px-6 py-6 items-center">
          <Text className="text-xs text-muted">{t('profile.version')}</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
