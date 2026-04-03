import { ScrollView, Text, View, TouchableOpacity, Switch, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import i18n, { changeLanguage } from "@/lib/i18n";
import { useState, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeContext } from "@/lib/theme-provider";
import { useNotifications, scheduleTestNotification } from "@/hooks/use-notifications";
import { useCardStyle } from "@/hooks/use-card-style";
import * as Notifications from 'expo-notifications';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const colorScheme = useColorScheme();
  const { setColorScheme, cardStyle, setCardStyle } = useThemeContext();
  const cardElevation = useCardStyle();
  const { expoPushToken } = useNotifications();
  
  // State for toggles
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(colorScheme === "dark");
  const [currentLang, setCurrentLang] = useState<'es' | 'en'>(i18n.language === 'en' ? 'en' : 'es');

  const handleLanguageToggle = (lang: 'es' | 'en') => {
    setCurrentLang(lang);
    changeLanguage(lang);
  };

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
          t('settings.notifications.permissionRequired'),
          t('settings.notifications.permissionMessage'),
          [{ text: t('common.ok') }]
        );
        return;
      }
      
      setPushNotifications(true);
      
      // Send a test notification
      Alert.alert(
        t('settings.notifications.enabledTitle'),
        t('settings.notifications.enabledMessage'),
        [
          {
            text: t('common.ok'),
            onPress: () => scheduleTestNotification(),
          },
        ]
      );
    } else {
      setPushNotifications(false);
      Alert.alert(
        t('settings.notifications.disabledTitle'),
        t('settings.notifications.disabledMessage'),
        [{ text: t('common.ok') }]
      );
    }
  };

  const handleEmailNotificationsToggle = (value: boolean) => {
    setEmailNotifications(value);
    // TODO: Save to backend/preferences
    Alert.alert(
      value ? t('settings.notifications.emailEnabledTitle') : t('settings.notifications.emailDisabledTitle'),
      value
        ? t('settings.notifications.emailEnabledMessage')
        : t('settings.notifications.emailDisabledMessage'),
      [{ text: t('common.ok') }]
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
            <Text className="text-3xl font-bold text-foreground">{t('settings.title')}</Text>
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
              {t('settings.sections.profile')}
            </Text>
            <View
              style={[{ borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 12 }, cardElevation]}
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
                  <Text className="text-xs text-muted mt-1">{t('settings.profile.projects')}</Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-2xl font-bold text-primary">245</Text>
                  <Text className="text-xs text-muted mt-1">{t('settings.profile.photos')}</Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-2xl font-bold text-primary">8</Text>
                  <Text className="text-xs text-muted mt-1">{t('settings.profile.teamMembers')}</Text>
                </View>
              </View>
            </View>

            {/* Profile Menu Items */}
            <View className="gap-3">
              <TouchableOpacity
                onPress={handleEditProfile}
                style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, borderRadius: 14 }, cardElevation]}
              >
                <View className="flex-row items-center flex-1">
                  <IconSymbol name="person.fill" size={20} color={colors.primary} />
                  <Text className="font-semibold text-foreground" style={{ marginLeft: 16 }}>
                    {t('settings.profile.editProfile')}
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={16} color={colors.muted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Notifications Section */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-muted mb-3 uppercase">
              {t('settings.sections.notifications')}
            </Text>
            
            <View style={[{ borderRadius: 20, overflow: 'hidden' }, cardElevation]}>
              {/* Push Notifications */}
              <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }}>
                <View className="flex-row items-center flex-1">
                  <IconSymbol name="bell.fill" size={20} color={colors.primary} />
                  <View className="flex-1" style={{ marginLeft: 16 }}>
                    <Text className="font-semibold text-foreground">
                      {t('settings.notifications.push')}
                    </Text>
                    <Text className="text-xs text-muted mt-1">
                      {t('settings.notifications.pushDesc')}
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
              <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:16 }}>
                <View className="flex-row items-center flex-1">
                  <IconSymbol name="envelope.fill" size={20} color={colors.primary} />
                  <View className="flex-1" style={{ marginLeft: 16 }}>
                    <Text className="font-semibold text-foreground">
                      {t('settings.notifications.email')}
                    </Text>
                    <Text className="text-xs text-muted mt-1">
                      {t('settings.notifications.emailDesc')}
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
              {t('settings.sections.appearance')}
            </Text>
            
            <View style={[{ borderRadius: 20, overflow: 'hidden' }, cardElevation]}>
              {/* Dark Mode */}
              <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }}>
                <View className="flex-row items-center flex-1">
                  <IconSymbol name="moon.fill" size={20} color={colors.primary} />
                  <View className="flex-1" style={{ marginLeft: 16 }}>
                    <Text className="font-semibold text-foreground">
                      {t('settings.appearance.darkMode')}
                    </Text>
                    <Text className="text-xs text-muted mt-1">
                      {t('settings.appearance.darkModeDesc')}
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

              {/* Card Style */}
              <View style={{ paddingHorizontal:16, paddingVertical:16 }}>
                <View className="flex-row items-center flex-1 mb-3">
                  <IconSymbol name="square.stack.3d.up.fill" size={20} color={colors.primary} />
                  <View className="flex-1" style={{ marginLeft: 16 }}>
                    <Text className="font-semibold text-foreground">
                      {t('settings.appearance.cardStyle')}
                    </Text>
                    <Text className="text-xs text-muted mt-1">
                      {cardStyle === "elevated" ? t('settings.appearance.cardStyleModern') : t('settings.appearance.cardStyleFlat')}
                    </Text>
                  </View>
                </View>
                {/* Segmented control */}
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {(["flat", "elevated"] as const).map((mode) => (
                    <TouchableOpacity
                      key={mode}
                      onPress={() => setCardStyle(mode)}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 12,
                        alignItems: "center",
                        backgroundColor: cardStyle === mode ? colors.primary : colors.background,
                        borderWidth: 1,
                        borderColor: cardStyle === mode ? colors.primary : colors.border,
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: "700", color: cardStyle === mode ? "#FFF" : colors.muted }}>
                        {mode === "flat" ? t('settings.appearance.flat') : t('settings.appearance.modern')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* General Section */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-muted mb-3 uppercase">
              {t('settings.sections.general')}
            </Text>
            
            <View style={[{ borderRadius: 20, overflow: 'hidden' }, cardElevation]}>
              {/* Privacy */}
              <TouchableOpacity style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }}>
                <View className="flex-row items-center flex-1">
                  <IconSymbol name="lock.fill" size={20} color={colors.primary} />
                  <Text className="font-semibold text-foreground" style={{ marginLeft: 16 }}>
                    {t('settings.general.privacy')}
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={16} color={colors.muted} />
              </TouchableOpacity>

              {/* Storage */}
              <TouchableOpacity style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }}>
                <View className="flex-row items-center flex-1">
                  <IconSymbol name="internaldrive.fill" size={20} color={colors.primary} />
                  <Text className="font-semibold text-foreground" style={{ marginLeft: 16 }}>
                    {t('settings.general.storage')}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm text-muted">{t('settings.general.storageUsed', { amount: '2.4 GB' })}</Text>
                  <IconSymbol name="chevron.right" size={16} color={colors.muted} />
                </View>
              </TouchableOpacity>

              {/* Help & Support */}
              <TouchableOpacity style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }}>
                <View className="flex-row items-center flex-1">
                  <IconSymbol name="questionmark.circle.fill" size={20} color={colors.primary} />
                  <Text className="font-semibold text-foreground" style={{ marginLeft: 16 }}>
                    {t('settings.general.helpSupport')}
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={16} color={colors.muted} />
              </TouchableOpacity>

              {/* Language */}
              <TouchableOpacity
                style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }}
                onPress={() => handleLanguageToggle(currentLang === 'es' ? 'en' : 'es')}
              >
                <View className="flex-row items-center flex-1">
                  <IconSymbol name="globe" size={20} color={colors.primary} />
                  <View style={{ marginLeft: 16 }}>
                    <Text className="font-semibold text-foreground">{t('settings.language')}</Text>
                    <Text className="text-xs text-muted" style={{ marginTop: 1 }}>{t('settings.languageDesc')}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 4, backgroundColor: colors.border + '60', borderRadius: 12, padding: 3 }}>
                  <TouchableOpacity
                    onPress={() => handleLanguageToggle('es')}
                    style={[
                      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9 },
                      currentLang === 'es' && { backgroundColor: colors.primary }
                    ]}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '600', color: currentLang === 'es' ? '#fff' : colors.muted }}>ES</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleLanguageToggle('en')}
                    style={[
                      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9 },
                      currentLang === 'en' && { backgroundColor: colors.primary }
                    ]}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '600', color: currentLang === 'en' ? '#fff' : colors.muted }}>EN</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
              {/* About */}
              <TouchableOpacity style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:16 }}>
                <View className="flex-row items-center flex-1">
                  <IconSymbol name="info.circle.fill" size={20} color={colors.primary} />
                  <Text className="font-semibold text-foreground" style={{ marginLeft: 16 }}>
                    {t('settings.general.about')}
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
              {t('settings.logout')}
            </Text>
          </TouchableOpacity>

          {/* Footer */}
          <View className="items-center pb-8">
            <Text className="text-xs text-muted">FieldCam v1.0.0</Text>
            <Text className="text-xs text-muted mt-1">
              {t('settings.footer')}
            </Text>
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
