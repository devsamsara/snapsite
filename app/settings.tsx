import { ScrollView, Text, View, TouchableOpacity, Switch, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeContext } from "@/lib/theme-provider";
import { useNotifications, scheduleTestNotification } from "@/hooks/use-notifications";
import * as Notifications from 'expo-notifications';

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const colorScheme = useColorScheme();
  const { setColorScheme } = useThemeContext();
  const { expoPushToken } = useNotifications();
  
  // State for toggles
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(colorScheme === "dark");

  // Update dark mode state when color scheme changes
  useEffect(() => {
    setDarkMode(colorScheme === "dark");
  }, [colorScheme]);

  const handleDarkModeToggle = (value: boolean) => {
    setDarkMode(value);
    setColorScheme(value ? "dark" : "light");
  };

  const handlePushNotificationsToggle = async (value: boolean) => {
    if (value) {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive push notifications.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      setPushNotifications(true);
      
      // Send a test notification
      Alert.alert(
        'Notifications Enabled',
        'You will now receive push notifications. A test notification will be sent in 2 seconds.',
        [
          {
            text: 'OK',
            onPress: () => scheduleTestNotification(),
          },
        ]
      );
    } else {
      setPushNotifications(false);
      Alert.alert(
        'Notifications Disabled',
        'You will no longer receive push notifications.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleEmailNotificationsToggle = (value: boolean) => {
    setEmailNotifications(value);
    // TODO: Save to backend/preferences
    Alert.alert(
      value ? 'Email Notifications Enabled' : 'Email Notifications Disabled',
      value
        ? 'You will receive email updates about your projects.'
        : 'You will no longer receive email notifications.',
      [{ text: 'OK' }]
    );
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleEditProfile = () => {
    router.push("/edit-profile");
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
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.surface, marginRight: 16 }}
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
              className="bg-surface rounded-2xl p-6 items-center border border-border mb-3"
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
                  <Text className="text-xs text-muted mt-1">Projects</Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-2xl font-bold text-primary">245</Text>
                  <Text className="text-xs text-muted mt-1">Photos</Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-2xl font-bold text-primary">8</Text>
                  <Text className="text-xs text-muted mt-1">Team Members</Text>
                </View>
              </View>
            </View>

            {/* Profile Menu Items */}
            <View className="gap-3">
              <TouchableOpacity
                onPress={handleEditProfile}
                className="flex-row items-center justify-between px-4 py-4 rounded-xl border border-border"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                }}
              >
                <View className="flex-row items-center flex-1">
                  <IconSymbol name="person.fill" size={20} color={colors.primary} />
                  <Text className="font-semibold text-foreground" style={{ marginLeft: 16 }}>
                    Edit Profile
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={16} color={colors.muted} />
              </TouchableOpacity>
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
                  <View className="flex-1" style={{ marginLeft: 16 }}>
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
                  onValueChange={handlePushNotificationsToggle}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* Email Notifications */}
              <View className="flex-row items-center justify-between px-4 py-4">
                <View className="flex-row items-center flex-1">
                  <IconSymbol name="envelope.fill" size={20} color={colors.primary} />
                  <View className="flex-1" style={{ marginLeft: 16 }}>
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
                  onValueChange={handleEmailNotificationsToggle}
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
                  <View className="flex-1" style={{ marginLeft: 16 }}>
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
                  onValueChange={handleDarkModeToggle}
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
                  <Text className="font-semibold text-foreground" style={{ marginLeft: 16 }}>
                    Privacy
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={16} color={colors.muted} />
              </TouchableOpacity>

              {/* Storage */}
              <TouchableOpacity className="flex-row items-center justify-between px-4 py-4 border-b border-border">
                <View className="flex-row items-center flex-1">
                  <IconSymbol name="internaldrive.fill" size={20} color={colors.primary} />
                  <Text className="font-semibold text-foreground" style={{ marginLeft: 16 }}>
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
                  <Text className="font-semibold text-foreground" style={{ marginLeft: 16 }}>
                    Help & Support
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={16} color={colors.muted} />
              </TouchableOpacity>

              {/* About */}
              <TouchableOpacity className="flex-row items-center justify-between px-4 py-4">
                <View className="flex-row items-center flex-1">
                  <IconSymbol name="info.circle.fill" size={20} color={colors.primary} />
                  <Text className="font-semibold text-foreground" style={{ marginLeft: 16 }}>
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
