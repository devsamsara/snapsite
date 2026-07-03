/**
 * (tabs)/settings.tsx — Ajustes + Perfil unificados
 * Secciones: PERFIL · EMPRESA · APARIENCIA · NOTIFICACIONES · GENERAL · SESIÓN · ZONA PELIGROSA
 */
import {
  ScrollView, StyleSheet, Text, View, TouchableOpacity, Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import i18n, { changeLanguage } from "@/lib/i18n";
import { useState, useEffect, useRef, useCallback } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeContext } from "@/lib/theme-provider";
import { useNotifications, scheduleTestNotification } from "@/hooks/use-notifications";
import { useCardStyle } from "@/hooks/use-card-style";
import { useAuth } from "@/lib/auth-context";
import * as Notifications from "expo-notifications";
import { AppAlert } from "@/components/ui/app-alert";
import { UserRole, DeleteUserDocument, DeleteCompanyDocument } from "@/gql/graphql";
import { apolloClient } from "@/lib/graphql-client";

function initials(name?: string | null): string {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

/** Hook para evitar doble tap en botones de navegación */
function useNavLock(delay = 600) {
  const locked = useRef(false);
  const navigate = useCallback((fn: () => void) => {
    if (locked.current) return;
    locked.current = true;
    fn();
    setTimeout(() => { locked.current = false; }, delay);
  }, [delay]);
  return navigate;
}

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const colorScheme = useColorScheme();
  const { setColorScheme, cardStyle, setCardStyle } = useThemeContext();
  const cardElevation = useCardStyle();
  const { expoPushToken } = useNotifications();
  const { signOut, user } = useAuth();
  const nav = useNavLock();

  const isOwner = user?.role === UserRole.Root;
  const userName = user?.name ?? user?.nickname ?? null;
  const companyName = user?.company?.name ?? null;

  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(colorScheme === "dark");
  const [currentLang, setCurrentLang] = useState<"es" | "en">(i18n.language === "en" ? "en" : "es");

  useEffect(() => { setDarkMode(colorScheme === "dark"); }, [colorScheme]);

  const handleLanguageToggle = (lang: "es" | "en") => { setCurrentLang(lang); changeLanguage(lang); };
  const handleDarkModeToggle = (v: boolean) => { setDarkMode(v); setColorScheme(v ? "dark" : "light"); };

  const handlePushNotificationsToggle = async (value: boolean) => {
    if (value) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") { const { status } = await Notifications.requestPermissionsAsync(); finalStatus = status; }
      if (finalStatus !== "granted") { AppAlert.alert(t("settings.notifications.permissionRequired"), t("settings.notifications.permissionMessage"), [{ text: t("common.ok") }]); return; }
      setPushNotifications(true);
      AppAlert.alert(t("settings.notifications.enabledTitle"), t("settings.notifications.enabledMessage"), [{ text: t("common.ok"), onPress: () => scheduleTestNotification() }]);
    } else {
      setPushNotifications(false);
      AppAlert.alert(t("settings.notifications.disabledTitle"), t("settings.notifications.disabledMessage"), [{ text: t("common.ok") }]);
    }
  };

  const handleEmailNotificationsToggle = (value: boolean) => {
    setEmailNotifications(value);
    AppAlert.alert(
      value ? t("settings.notifications.emailEnabledTitle") : t("settings.notifications.emailDisabledTitle"),
      value ? t("settings.notifications.emailEnabledMessage") : t("settings.notifications.emailDisabledMessage"),
      [{ text: t("common.ok") }],
    );
  };

  const handleLogout = () => {
    AppAlert.alert(t("settings.logoutConfirmTitle"), t("settings.logoutConfirmMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("settings.logout"), style: "destructive", onPress: async () => { try { await signOut(); } catch (e: any) { AppAlert.alert(t("common.error"), e?.message ?? t("common.unknownError")); } } },
    ]);
  };

  const handleDeleteAccount = () => {
    AppAlert.alert(t("profile.deleteAccountTitle"), t("profile.deleteAccountMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("profile.deleteAccountButton"), style: "destructive", onPress: async () => {
          try { const userId = user?.id; if (!userId) throw new Error("No user id"); await apolloClient.mutate({ mutation: DeleteUserDocument, variables: { id: userId } }); await signOut(); }
          catch { AppAlert.alert(t("common.error"), t("profile.deleteAccountError")); }
        },
      },
    ]);
  };

  const handleLeaveCompany = () => {
    AppAlert.alert(t("profile.leaveCompanyTitle"), t("profile.leaveCompanyMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("profile.leaveCompanyButton"), style: "destructive", onPress: async () => {
          try { const userId = user?.id; if (!userId) throw new Error("No user id"); await apolloClient.mutate({ mutation: DeleteUserDocument, variables: { id: userId } }); await signOut(); }
          catch { AppAlert.alert(t("common.error"), t("profile.leaveCompanyError")); }
        },
      },
    ]);
  };

  const handleDeleteCompany = () => {
    AppAlert.alert(t("profile.deleteCompanyTitle"), t("profile.deleteCompanyMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("profile.deleteCompanyButton"), style: "destructive", onPress: async () => {
          try { const companyId = user?.company?.id; if (!companyId) throw new Error("No company id"); await apolloClient.mutate({ mutation: DeleteCompanyDocument, variables: { id: companyId } }); await signOut(); }
          catch { AppAlert.alert(t("common.error"), t("profile.deleteCompanyError")); }
        },
      },
    ]);
  };

  const SL = ({ label }: { label: string }) => (
    <Text style={[S.sectionLabel, { color: colors.muted }]}>{label.toUpperCase()}</Text>
  );

  return (
    <ScreenContainer className="p-0">
      <View style={{ flex: 1, backgroundColor: colors.background }}>

        {/* Header — mismo estilo que projects.tsx */}
        <View style={[S.header, { borderBottomColor: colors.border }]}>
          <Text style={[S.headerTitle, { color: colors.foreground }]}>{t("settings.title")}</Text>
        </View>

        <ScrollView contentContainerStyle={S.scrollContent} showsVerticalScrollIndicator={false}>

          {/* ── PERFIL ─────────────────────────────────────────────────────── */}
          <SL label={t("settings.sections.profile")} />
          <View style={[S.profileCard, cardElevation]}>
            {/* Avatar */}
            <View style={[S.profileAvatar, { backgroundColor: colors.primary }]}>
              <IconSymbol name="person.fill" size={40} color="#FFFFFF" />
            </View>
            {/* User Info */}
            <Text style={[S.profileName, { color: colors.foreground }]}>{userName ?? "—"}</Text>
            <Text style={[S.profileEmail, { color: colors.muted }]}>{user?.email ?? ""}</Text>
            <Text style={[S.profileRole, { color: colors.muted }]}>{isOwner ? t("roles.root") : t("roles.admin")}</Text>
            {/* Stats */}
            <View style={[S.statsRow, { borderTopColor: colors.border }]}>
              <View style={S.statItem}>
                <Text style={[S.statValue, { color: colors.primary }]}>—</Text>
                <Text style={[S.statLabel, { color: colors.muted }]}>{t("settings.profile.projects")}</Text>
              </View>
              <View style={[S.statDivider, { backgroundColor: colors.border }]} />
              <View style={S.statItem}>
                <Text style={[S.statValue, { color: colors.primary }]}>—</Text>
                <Text style={[S.statLabel, { color: colors.muted }]}>{t("settings.profile.photos")}</Text>
              </View>
              <View style={[S.statDivider, { backgroundColor: colors.border }]} />
              <View style={S.statItem}>
                <Text style={[S.statValue, { color: colors.primary }]}>—</Text>
                <Text style={[S.statLabel, { color: colors.muted }]}>{t("settings.profile.teamMembers")}</Text>
              </View>
            </View>
          </View>
          {/* Edit Profile row */}
          <View style={[S.card, cardElevation]}>
            <TouchableOpacity onPress={() => nav(() => router.push("/edit-profile"))} style={S.row} activeOpacity={0.7}>
              <View style={S.rowLeft}>
                <IconSymbol name="person.crop.circle" size={20} color={colors.primary} />
                <Text style={[S.rowLabel, { color: colors.foreground, marginLeft: 16 }]}>{t("profile.editProfile")}</Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.muted} />
            </TouchableOpacity>
          </View>

          {/* ── EMPRESA ────────────────────────────────────────────────────── */}
          <SL label={t("settings.sections.company") ?? "Empresa"} />
          <View style={[S.card, cardElevation]}>
            <View style={[S.row, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
              <View style={S.rowLeft}>
                <IconSymbol name="building.2.fill" size={20} color={colors.primary} />
                <View style={S.rowTextBlock}>
                  <Text style={[S.rowLabel, { color: colors.foreground }]}>{companyName ?? "—"}</Text>
                  <Text style={S.rowSublabel}>{isOwner ? t("roles.root") : t("roles.admin")}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={() => nav(() => router.push("/modals/team-members" as any))} style={S.row} activeOpacity={0.7}>
              <View style={S.rowLeft}>
                <IconSymbol name="person.2.fill" size={20} color={colors.primary} />
                <Text style={[S.rowLabel, { color: colors.foreground, marginLeft: 16 }]}>{t("teamMembers.title")}</Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.muted} />
            </TouchableOpacity>
          </View>

          {/* ── APARIENCIA ─────────────────────────────────────────────────── */}
          <SL label={t("settings.sections.appearance")} />
          <View style={[S.card, cardElevation]}>
            <View style={[S.row, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
              <View style={S.rowLeft}>
                <IconSymbol name="moon.fill" size={20} color={colors.primary} />
                <View style={S.rowTextBlock}>
                  <Text style={[S.rowLabel, { color: colors.foreground }]}>{t("settings.appearance.darkMode")}</Text>
                  <Text style={S.rowSublabel}>{t("settings.appearance.darkModeDesc")}</Text>
                </View>
              </View>
              <Switch value={darkMode} onValueChange={handleDarkModeToggle} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#FFF" />
            </View>
            <View style={S.cardStyleRow}>
              <View style={S.rowLeft}>
                <IconSymbol name="rectangle.stack.fill" size={20} color={colors.primary} />
                <Text style={[S.rowLabel, { color: colors.foreground, marginLeft: 16 }]}>{t("settings.appearance.cardStyle")}</Text>
              </View>
              <View style={S.segmentedControl}>
                {(["flat", "modern"] as const).map((mode) => (
                  <TouchableOpacity key={mode} onPress={() => setCardStyle(mode)} style={[S.segmentBtn, { backgroundColor: cardStyle === mode ? colors.primary : colors.surface, borderColor: cardStyle === mode ? colors.primary : colors.border }]}>
                    <Text style={[S.segmentBtnText, { color: cardStyle === mode ? "#FFF" : colors.muted }]}>{mode === "flat" ? t("settings.appearance.flat") : t("settings.appearance.modern")}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* ── NOTIFICACIONES ─────────────────────────────────────────────── */}
          <SL label={t("settings.sections.notifications")} />
          <View style={[S.card, cardElevation]}>
            <View style={[S.row, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
              <View style={S.rowLeft}>
                <IconSymbol name="bell.fill" size={20} color={colors.primary} />
                <View style={S.rowTextBlock}>
                  <Text style={[S.rowLabel, { color: colors.foreground }]}>{t("settings.notifications.push")}</Text>
                  <Text style={S.rowSublabel}>{t("settings.notifications.pushDesc")}</Text>
                </View>
              </View>
              <Switch value={pushNotifications} onValueChange={handlePushNotificationsToggle} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#FFF" />
            </View>
            <View style={S.row}>
              <View style={S.rowLeft}>
                <IconSymbol name="envelope.fill" size={20} color={colors.primary} />
                <View style={S.rowTextBlock}>
                  <Text style={[S.rowLabel, { color: colors.foreground }]}>{t("settings.notifications.email")}</Text>
                  <Text style={S.rowSublabel}>{t("settings.notifications.emailDesc")}</Text>
                </View>
              </View>
              <Switch value={emailNotifications} onValueChange={handleEmailNotificationsToggle} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#FFF" />
            </View>
          </View>

          {/* ── CUENTA ─────────────────────────────────────────────────────── */}
          <SL label={t("settings.sections.account") ?? "Cuenta"} />
          <View style={[S.card, cardElevation]}>
            <TouchableOpacity onPress={() => nav(() => router.push("/account-details" as any))} style={S.row} activeOpacity={0.7}>
              <View style={S.rowLeft}>
                <IconSymbol name="person.text.rectangle.fill" size={20} color={colors.primary} />
                <View style={S.rowTextBlock}>
                  <Text style={[S.rowLabel, { color: colors.foreground }]}>{t("accountDetails.title")}</Text>
                  <Text style={S.rowSublabel}>{t("accountDetails.subtitle")}</Text>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.muted} />
            </TouchableOpacity>
          </View>

          {/* ── GENERAL ────────────────────────────────────────────────────── */}
          <SL label={t("settings.sections.general")} />
          <View style={[S.card, cardElevation]}>
            <TouchableOpacity onPress={() => nav(() => router.push("/modals/help-support" as any))} style={[S.row, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]} activeOpacity={0.7}>
              <View style={S.rowLeft}><IconSymbol name="questionmark.circle.fill" size={20} color={colors.primary} /><Text style={[S.rowLabel, { color: colors.foreground, marginLeft: 16 }]}>{t("settings.general.helpSupport")}</Text></View>
              <IconSymbol name="chevron.right" size={16} color={colors.muted} />
            </TouchableOpacity>
            {/* Language */}
            <View style={[S.row, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
              <View style={S.rowLeft}>
                <IconSymbol name="globe" size={20} color={colors.primary} />
                <View style={S.rowTextBlock}>
                  <Text style={[S.rowLabel, { color: colors.foreground }]}>{t("settings.language")}</Text>
                  <Text style={S.rowSublabel}>{t("settings.languageDesc")}</Text>
                </View>
              </View>
              <View style={[S.langPill, { backgroundColor: colors.border + "60" }]}>
                {(["es", "en"] as const).map((lang) => (
                  <TouchableOpacity key={lang} onPress={() => handleLanguageToggle(lang)} style={[S.langBtn, currentLang === lang && { backgroundColor: colors.primary }]}>
                    <Text style={[S.langBtnText, { color: currentLang === lang ? "#fff" : colors.muted }]}>{lang.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity onPress={() => nav(() => router.push("/modals/about" as any))} style={S.row} activeOpacity={0.7}>
              <View style={S.rowLeft}><IconSymbol name="info.circle.fill" size={20} color={colors.primary} /><Text style={[S.rowLabel, { color: colors.foreground, marginLeft: 16 }]}>{t("settings.general.about")}</Text></View>
              <View style={S.rowRight}><Text style={S.rowSublabel}>v1.0.0</Text><IconSymbol name="chevron.right" size={16} color={colors.muted} /></View>
            </TouchableOpacity>
          </View>

          {/* ── SESIÓN ─────────────────────────────────────────────────────── */}
          <SL label={t("settings.sections.session") ?? "Sesión"} />
          <View style={[S.card, cardElevation]}>
            <TouchableOpacity onPress={handleLogout} style={S.row} activeOpacity={0.7}>
              <View style={S.rowLeft}>
                <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color={colors.error} />
                <Text style={[S.rowLabel, { color: colors.error, marginLeft: 16 }]}>{t("settings.logout")}</Text>
              </View>
            </TouchableOpacity>
          </View>



          {/* Footer */}
          <View style={S.footer}>
            <Text style={[S.footerText, { color: colors.muted }]}>SnapSite v1.0.0</Text>
            <Text style={[S.footerText, { color: colors.muted }]}>{t("settings.footer")}</Text>
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

const S = StyleSheet.create({
  header:           { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle:      { fontSize: 30, fontWeight: "700", letterSpacing: -0.5 },
  scrollContent:    { flexGrow: 1, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40, gap: 4 },
  sectionLabel:     { fontSize: 11, fontWeight: "600", letterSpacing: 1, marginTop: 16, marginBottom: 6, paddingHorizontal: 4 },
  card:             { borderRadius: 16, overflow: "hidden", marginBottom: 4 },
  row:              { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
  rowLeft:          { flexDirection: "row", alignItems: "center", flex: 1 },
  rowTextBlock:     { flex: 1, marginLeft: 16 },
  rowLabel:         { fontSize: 15, fontWeight: "600" },
  rowSublabel:      { fontSize: 12, color: "#8E8E93", marginTop: 1 },
  rowRight:         { flexDirection: "row", alignItems: "center", gap: 6 },
  // Profile card
  profileCard:      { borderRadius: 16, padding: 16, alignItems: "center", marginBottom: 4 },
  profileAvatar:    { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  profileName:      { fontSize: 22, fontWeight: "700", letterSpacing: -0.3 },
  profileEmail:     { fontSize: 13, marginTop: 2 },
  profileRole:      { fontSize: 13, marginTop: 2 },
  statsRow:         { flexDirection: "row", width: "100%", marginTop: 16, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth },
  statItem:         { flex: 1, alignItems: "center" },
  statValue:        { fontSize: 22, fontWeight: "700" },
  statLabel:        { fontSize: 11, marginTop: 2 },
  statDivider:      { width: StyleSheet.hairlineWidth, height: 36, alignSelf: "center" },
  // Avatar in account row
  avatar:           { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarText:       { fontSize: 16, fontWeight: "700" },
  cardStyleRow:     { paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  segmentedControl: { flexDirection: "row", gap: 8, marginLeft: 36 },
  segmentBtn:       { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center", borderWidth: 1 },
  segmentBtnText:   { fontSize: 13, fontWeight: "700" },
  langPill:         { flexDirection: "row", borderRadius: 12, padding: 3 },
  langBtn:          { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9 },
  langBtnText:      { fontSize: 12, fontWeight: "600" },
  dangerRow:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  footer:           { alignItems: "center", paddingTop: 24, paddingBottom: 8, gap: 4 },
  footerText:       { fontSize: 12 },
});
