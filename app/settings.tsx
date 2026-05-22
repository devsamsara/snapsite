import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Switch, Alert } from "react-native";
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
import { useAuth } from "@/lib/auth-context";
import * as Notifications from 'expo-notifications';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const colorScheme = useColorScheme();
  const { setColorScheme, cardStyle, setCardStyle } = useThemeContext();
  const cardElevation = useCardStyle();
  const { expoPushToken } = useNotifications();
  const { signOut } = useAuth();

  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(colorScheme === "dark");
  const [currentLang, setCurrentLang] = useState<'es' | 'en'>(i18n.language === 'en' ? 'en' : 'es');

  useEffect(() => { setDarkMode(colorScheme === "dark"); }, [colorScheme]);

  const handleLanguageToggle = (lang: 'es' | 'en') => { setCurrentLang(lang); changeLanguage(lang); };
  const handleDarkModeToggle = (value: boolean) => { setDarkMode(value); setColorScheme(value ? "dark" : "light"); };
  const handleGoBack = () => router.back();
  const handleEditProfile = () => router.push("/edit-profile");

  const handlePushNotificationsToggle = async (value: boolean) => {
    if (value) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        Alert.alert(t('settings.notifications.permissionRequired'), t('settings.notifications.permissionMessage'), [{ text: t('common.ok') }]);
        return;
      }
      setPushNotifications(true);
      Alert.alert(t('settings.notifications.enabledTitle'), t('settings.notifications.enabledMessage'), [{ text: t('common.ok'), onPress: () => scheduleTestNotification() }]);
    } else {
      setPushNotifications(false);
      Alert.alert(t('settings.notifications.disabledTitle'), t('settings.notifications.disabledMessage'), [{ text: t('common.ok') }]);
    }
  };

  const handleEmailNotificationsToggle = (value: boolean) => {
    setEmailNotifications(value);
    Alert.alert(
      value ? t('settings.notifications.emailEnabledTitle') : t('settings.notifications.emailDisabledTitle'),
      value ? t('settings.notifications.emailEnabledMessage') : t('settings.notifications.emailDisabledMessage'),
      [{ text: t('common.ok') }]
    );
  };

  const handleLogout = () => {
    Alert.alert(t('settings.logoutConfirmTitle'), t('settings.logoutConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.logout'),
        style: 'destructive',
        onPress: async () => {
          try { await signOut(); }
          catch (e: any) { Alert.alert(t('common.error'), e?.message ?? t('common.unknownError')); }
        },
      },
    ]);
  };

  return (
    <ScreenContainer className="p-0">
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="px-6 pt-6 pb-4 border-b border-border">
          <View className="flex-row items-center mb-4">
            <TouchableOpacity
              onPress={handleGoBack}
              style={[S.backBtn, { backgroundColor: colors.surface }]}
            >
              <IconSymbol name="chevron.left" size={20} color={colors.foreground} />
            </TouchableOpacity>
            <Text className="text-3xl font-bold text-foreground">{t('settings.title')}</Text>
          </View>
        </View>

        {/* Content */}
        <ScrollView contentContainerStyle={S.scrollContent} showsVerticalScrollIndicator={false}>

          {/* ── Profile Section ────────────────────────────────────────────── */}
          <View style={S.sectionWrapper}>
            <Text className="text-sm font-semibold text-muted mb-2 uppercase">
              {t('settings.sections.profile')}
            </Text>
            <View style={[S.profileCard, cardElevation]}>
              <View style={[S.avatar, { backgroundColor: colors.primary }]}>
                <IconSymbol name="person.fill" size={40} color="#FFFFFF" />
              </View>
              <Text className="text-2xl font-bold text-foreground">John Doe</Text>
              <Text className="text-sm text-muted mt-1">john@example.com</Text>
              <Text className="text-sm text-muted mt-1">Project Manager</Text>
              <View className="flex-row gap-4 mt-4 pt-4 border-t border-border w-full">
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

            <View style={S.menuGroup}>
              <TouchableOpacity
                onPress={handleEditProfile}
                style={[S.menuRow, cardElevation]}
              >
                <View className="flex-row items-center flex-1">
                  <IconSymbol name="person.fill" size={20} color={colors.primary} />
                  <Text className="font-semibold text-foreground" style={S.menuRowLabel}>
                    {t('settings.profile.editProfile')}
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={16} color={colors.muted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Notifications Section ──────────────────────────────────────── */}
          <View style={S.sectionWrapper}>
            <Text className="text-sm font-semibold text-muted mb-2 uppercase">
              {t('settings.sections.notifications')}
            </Text>
            <View style={[S.card, cardElevation]}>
              {/* Push */}
              <View style={[S.settingRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                <View className="flex-row items-center flex-1">
                  <IconSymbol name="bell.fill" size={20} color={colors.primary} />
                  <View style={S.settingLabelWrapper}>
                    <Text className="font-semibold text-foreground">{t('settings.notifications.push')}</Text>
                    <Text className="text-xs text-muted mt-1">{t('settings.notifications.pushDesc')}</Text>
                  </View>
                </View>
                <Switch value={pushNotifications} onValueChange={handlePushNotificationsToggle} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#FFFFFF" />
              </View>
              {/* Email */}
              <View style={S.settingRow}>
                <View className="flex-row items-center flex-1">
                  <IconSymbol name="envelope.fill" size={20} color={colors.primary} />
                  <View style={S.settingLabelWrapper}>
                    <Text className="font-semibold text-foreground">{t('settings.notifications.email')}</Text>
                    <Text className="text-xs text-muted mt-1">{t('settings.notifications.emailDesc')}</Text>
                  </View>
                </View>
                <Switch value={emailNotifications} onValueChange={handleEmailNotificationsToggle} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#FFFFFF" />
              </View>
            </View>
          </View>

          {/* ── Appearance Section ─────────────────────────────────────────── */}
          <View style={S.sectionWrapper}>
            <Text className="text-sm font-semibold text-muted mb-2 uppercase">
              {t('settings.sections.appearance')}
            </Text>
            <View style={[S.card, cardElevation]}>
              {/* Dark Mode */}
              <View style={[S.settingRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                <View className="flex-row items-center flex-1">
                  <IconSymbol name="moon.fill" size={20} color={colors.primary} />
                  <View style={S.settingLabelWrapper}>
                    <Text className="font-semibold text-foreground">{t('settings.appearance.darkMode')}</Text>
                    <Text className="text-xs text-muted mt-1">{t('settings.appearance.darkModeDesc')}</Text>
                  </View>
                </View>
                <Switch value={darkMode} onValueChange={handleDarkModeToggle} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#FFFFFF" />
              </View>
              {/* Card Style */}
              <View style={S.cardStyleRow}>
                <View className="flex-row items-center flex-1 mb-3">
                  <IconSymbol name="square.stack.3d.up.fill" size={20} color={colors.primary} />
                  <View style={S.settingLabelWrapper}>
                    <Text className="font-semibold text-foreground">{t('settings.appearance.cardStyle')}</Text>
                    <Text className="text-xs text-muted mt-1">
                      {cardStyle === "elevated" ? t('settings.appearance.cardStyleModern') : t('settings.appearance.cardStyleFlat')}
                    </Text>
                  </View>
                </View>
                <View style={S.segmentedControl}>
                  {(["flat", "elevated"] as const).map((mode) => (
                    <TouchableOpacity
                      key={mode}
                      onPress={() => setCardStyle(mode)}
                      style={[
                        S.segmentBtn,
                        {
                          backgroundColor: cardStyle === mode ? colors.primary : colors.background,
                          borderColor: cardStyle === mode ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text style={[S.segmentBtnText, { color: cardStyle === mode ? "#FFF" : colors.muted }]}>
                        {mode === "flat" ? t('settings.appearance.flat') : t('settings.appearance.modern')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* ── General Section ────────────────────────────────────────────── */}
          <View style={S.sectionWrapper}>
            <Text className="text-sm font-semibold text-muted mb-2 uppercase">
              {t('settings.sections.general')}
            </Text>
            <View style={[S.card, cardElevation]}>
              {/* Privacy */}
              <TouchableOpacity style={[S.settingRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                <View className="flex-row items-center flex-1">
                  <IconSymbol name="lock.fill" size={20} color={colors.primary} />
                  <Text className="font-semibold text-foreground" style={S.menuRowLabel}>{t('settings.general.privacy')}</Text>
                </View>
                <IconSymbol name="chevron.right" size={16} color={colors.muted} />
              </TouchableOpacity>
              {/* Storage */}
              <TouchableOpacity style={[S.settingRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                <View className="flex-row items-center flex-1">
                  <IconSymbol name="internaldrive.fill" size={20} color={colors.primary} />
                  <Text className="font-semibold text-foreground" style={S.menuRowLabel}>{t('settings.general.storage')}</Text>
                </View>
                <View style={S.rowRight}>
                  <Text className="text-sm text-muted">{t('settings.general.storageUsed', { amount: '2.4 GB' })}</Text>
                  <IconSymbol name="chevron.right" size={16} color={colors.muted} />
                </View>
              </TouchableOpacity>
              {/* Help & Support */}
              <TouchableOpacity style={[S.settingRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                <View className="flex-row items-center flex-1">
                  <IconSymbol name="questionmark.circle.fill" size={20} color={colors.primary} />
                  <Text className="font-semibold text-foreground" style={S.menuRowLabel}>{t('settings.general.helpSupport')}</Text>
                </View>
                <IconSymbol name="chevron.right" size={16} color={colors.muted} />
              </TouchableOpacity>
              {/* Language */}
              <TouchableOpacity
                style={[S.settingRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
                onPress={() => handleLanguageToggle(currentLang === 'es' ? 'en' : 'es')}
              >
                <View className="flex-row items-center flex-1">
                  <IconSymbol name="globe" size={20} color={colors.primary} />
                  <View style={S.settingLabelWrapper}>
                    <Text className="font-semibold text-foreground">{t('settings.language')}</Text>
                    <Text className="text-xs text-muted" style={S.langDesc}>{t('settings.languageDesc')}</Text>
                  </View>
                </View>
                <View style={[S.langPill, { backgroundColor: colors.border + '60' }]}>
                  {(['es', 'en'] as const).map((lang) => (
                    <TouchableOpacity
                      key={lang}
                      onPress={() => handleLanguageToggle(lang)}
                      style={[S.langBtn, currentLang === lang && { backgroundColor: colors.primary }]}
                    >
                      <Text style={[S.langBtnText, { color: currentLang === lang ? '#fff' : colors.muted }]}>
                        {lang.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableOpacity>
              {/* About */}
              <TouchableOpacity style={S.settingRow}>
                <View className="flex-row items-center flex-1">
                  <IconSymbol name="info.circle.fill" size={20} color={colors.primary} />
                  <Text className="font-semibold text-foreground" style={S.menuRowLabel}>{t('settings.general.about')}</Text>
                </View>
                <View style={S.rowRight}>
                  <Text className="text-sm text-muted">v1.0.0</Text>
                  <IconSymbol name="chevron.right" size={16} color={colors.muted} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            style={[S.logoutBtn, { backgroundColor: colors.error + "15" }]}
          >
            <Text className="font-semibold" style={{ color: colors.error }}>{t('settings.logout')}</Text>
          </TouchableOpacity>

          {/* Footer */}
          <View className="items-center pb-8">
            <Text className="text-xs text-muted">SnapSite v1.0.0</Text>
            <Text className="text-xs text-muted mt-1">{t('settings.footer')}</Text>
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  scrollContent:       { flexGrow: 1, paddingHorizontal: 16, paddingTop: 16 },
  backBtn:             { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  sectionWrapper:      { marginBottom: 16 },
  profileCard:         { borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 12 },
  avatar:              { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  menuGroup:           { gap: 12 },
  menuRow:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, borderRadius: 14 },
  menuRowLabel:        { marginLeft: 16 },
  card:                { borderRadius: 16, overflow: 'hidden' },
  settingRow:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 },
  settingLabelWrapper: { flex: 1, marginLeft: 16 },
  cardStyleRow:        { paddingHorizontal: 16, paddingVertical: 16 },
  segmentedControl:    { flexDirection: 'row', gap: 8 },
  segmentBtn:          { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  segmentBtnText:      { fontSize: 13, fontWeight: '700' },
  rowRight:            { flexDirection: 'row', alignItems: 'center', gap: 8 },
  langDesc:            { marginTop: 1 },
  langPill:            { flexDirection: 'row', borderRadius: 12, padding: 3 },
  langBtn:             { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9 },
  langBtnText:         { fontSize: 12, fontWeight: '600' },
  logoutBtn:           { borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 32 },
});
