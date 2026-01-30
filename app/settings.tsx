import { ScrollView, Text, View, TouchableOpacity, Switch } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  
  // State for toggles
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const handleGoBack = () => {
    router.back();
  };

  const handleLogout = () => {
    // TODO: Implement logout logic
    console.log("Logout pressed");
  };

  return (
    <ScreenContainer className="p-0">
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="px-6 pt-6 pb-4 border-b border-border">
          <View className="flex-row items-center mb-6">
            <TouchableOpacity
              onPress={handleGoBack}
              className="w-10 h-10 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: colors.surface }}
            >
              <IconSymbol name="chevron.left" size={20} color={colors.foreground} />
            </TouchableOpacity>
            <Text className="text-3xl font-bold text-foreground">Settings</Text>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Section */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-muted mb-3 uppercase">
              Profile
            </Text>
            <View
              className="bg-surface rounded-2xl p-4 border border-border mb-3"
              style={{ borderColor: colors.border }}
            >
              <View className="flex-row items-center">
                <View
                  className="w-16 h-16 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.primary }}
                >
                  <IconSymbol name="person.fill" size={32} color="#FFFFFF" />
                </View>
                <View className="flex-1 ml-4">
                  <Text className="text-lg font-semibold text-foreground">
                    John Doe
                  </Text>
                  <Text className="text-sm text-muted mt-1">
                    john@example.com
                  </Text>
                </View>
                <TouchableOpacity>
                  <IconSymbol name="chevron.right" size={20} color={colors.muted} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Notifications Section */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-muted mb-3 uppercase">
              Notifications
            </Text>
            
            <View
              className="bg-surface rounded-2xl border border-border overflow-hidden"
              style={{ borderColor: colors.border }}
            >
              {/* Push Notifications */}
              <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
                <View className="flex-row items-center flex-1">
                  <IconSymbol name="bell.fill" size={20} color={colors.primary} />
                  <View className="ml-3 flex-1">
                    <Text className="font-semibold text-foreground">
                      Push Notifications
                    </Text>
                    <Text className="text-xs text-muted mt-1">
                      Receive notifications about project updates
                    </Text>
                  </View>
                </View>
                <Switch
                  value={pushNotifications}
                  onValueChange={setPushNotifications}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* Email Notifications */}
              <View className="flex-row items-center justify-between px-4 py-4">
                <View className="flex-row items-center flex-1">
                  <IconSymbol name="envelope.fill" size={20} color={colors.primary} />
                  <View className="ml-3 flex-1">
                    <Text className="font-semibold text-foreground">
                      Email Notifications
                    </Text>
                    <Text className="text-xs text-muted mt-1">
                      Get email updates about your projects
                    </Text>
                  </View>
                </View>
                <Switch
                  value={emailNotifications}
                  onValueChange={setEmailNotifications}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          </View>

          {/* Appearance Section */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-muted mb-3 uppercase">
              Appearance
            </Text>
            
            <View
              className="bg-surface rounded-2xl border border-border"
              style={{ borderColor: colors.border }}
            >
              <View className="flex-row items-center justify-between px-4 py-4">
                <View className="flex-row items-center flex-1">
                  <IconSymbol name="moon.fill" size={20} color={colors.primary} />
                  <View className="ml-3 flex-1">
                    <Text className="font-semibold text-foreground">
                      Dark Mode
                    </Text>
                    <Text className="text-xs text-muted mt-1">
                      Switch to dark theme
                    </Text>
                  </View>
                </View>
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          </View>

          {/* General Section */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-muted mb-3 uppercase">
              General
            </Text>
            
            <View
              className="bg-surface rounded-2xl border border-border"
              style={{ borderColor: colors.border }}
            >
              {/* Privacy */}
              <TouchableOpacity className="flex-row items-center justify-between px-4 py-4 border-b border-border">
                <View className="flex-row items-center flex-1">
                  <IconSymbol name="lock.fill" size={20} color={colors.primary} />
                  <Text className="ml-3 font-semibold text-foreground">
                    Privacy
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={16} color={colors.muted} />
              </TouchableOpacity>

              {/* Storage */}
              <TouchableOpacity className="flex-row items-center justify-between px-4 py-4 border-b border-border">
                <View className="flex-row items-center flex-1">
                  <IconSymbol name="internaldrive.fill" size={20} color={colors.primary} />
                  <Text className="ml-3 font-semibold text-foreground">
                    Storage
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm text-muted">2.4 GB used</Text>
                  <IconSymbol name="chevron.right" size={16} color={colors.muted} />
                </View>
              </TouchableOpacity>

              {/* Help & Support */}
              <TouchableOpacity className="flex-row items-center justify-between px-4 py-4 border-b border-border">
                <View className="flex-row items-center flex-1">
                  <IconSymbol name="questionmark.circle.fill" size={20} color={colors.primary} />
                  <Text className="ml-3 font-semibold text-foreground">
                    Help & Support
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={16} color={colors.muted} />
              </TouchableOpacity>

              {/* About */}
              <TouchableOpacity className="flex-row items-center justify-between px-4 py-4">
                <View className="flex-row items-center flex-1">
                  <IconSymbol name="info.circle.fill" size={20} color={colors.primary} />
                  <Text className="ml-3 font-semibold text-foreground">
                    About
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm text-muted">v1.0.0</Text>
                  <IconSymbol name="chevron.right" size={16} color={colors.muted} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            className="rounded-2xl py-4 items-center mb-8"
            style={{ backgroundColor: colors.error + "15" }}
          >
            <Text className="font-semibold" style={{ color: colors.error }}>
              Log Out
            </Text>
          </TouchableOpacity>

          {/* Footer */}
          <View className="items-center pb-8">
            <Text className="text-xs text-muted">FieldCam v1.0.0</Text>
            <Text className="text-xs text-muted mt-1">
              © 2024 FieldCam. All rights reserved.
            </Text>
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
