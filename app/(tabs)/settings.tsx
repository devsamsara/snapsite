import { Image, Platform, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { HeroBackdrop } from '@/components/ui/hero-backdrop';
import { useColors } from '@/hooks/use-colors';
import { useCardStyle } from '@/hooks/use-card-style';
import { useCallback, useEffect, useRef, useState } from 'react';
import i18n, { changeLanguage } from '@/lib/i18n';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  GetMyProjectsDocument,
  RegisterPushTokenDocument,
  TogglePushTokenDocument,
  UserRole,
} from '@/gql/graphql';
import { useMutation, useQuery } from '@apollo/client/react';
import { useAuth } from '@/lib/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeContext } from '@/lib/theme-provider';
import {
  getExpoPushToken,
  requestPushPermission,
  setNotificationsDisabledByUser,
} from '@/hooks/use-notifications';
import { PressableScale } from '@/components/ui/pressable-scale';
import { AppAlert } from '@/components/ui/app-alert';
import { BlurView } from 'expo-blur';

function useNavLock(delay = 600) {
  const locked = useRef(false);
  const navigate = useCallback(
    (fn: () => void) => {
      if (locked.current) return;
      locked.current = true;
      fn();
      setTimeout(() => {
        locked.current = false;
      }, delay);
    },
    [delay]
  );
  return navigate;
}

export default function SettingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const colorScheme = useColorScheme();
  const { setColorScheme, cardStyle, setCardStyle } = useThemeContext();
  const cardElevation = useCardStyle();
  const { signOut, user, isLoading: authLoading } = useAuth();
  const nav = useNavLock();

  const isOwner = user?.role === UserRole.Admin || user?.role === UserRole.Root;
  const userName = user?.name ?? user?.nickname ?? null;
  const companyName = user?.company?.name ?? null;

  // El toggle refleja: permiso del sistema concedido Y no desactivado manualmente por el usuario
  const [pushNotifications, setPushNotifications] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(colorScheme === 'dark');
  const [registerPushToken] = useMutation(RegisterPushTokenDocument);
  const [togglePushToken] = useMutation(TogglePushTokenDocument);
  const [currentLang, setCurrentLang] = useState<'es' | 'en'>(
    i18n.language === 'en' ? 'en' : 'es'
  );

  const { data: userProjects } = useQuery(GetMyProjectsDocument, {
    skip: authLoading,
  });

  const enterOpacity = useSharedValue(0);
  const enterScale = useSharedValue(1.06);
  const insets = useSafeAreaInsets();

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler(e => {
    scrollY.value = e.contentOffset.y;
  });

  const heroStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 130], [1, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, 160],
          [0, -44],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  // Arranca después de que el hero ya casi desapareció (a partir de 110, no
  // 70) para que no se vean los dos textos superpuestos a la vez — eso es lo
  // que se sentía "difuminado".
  const stickyBarStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [110, 150], [0, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [110, 150],
          [-10, 0],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const handleLanguageToggle = (lang: 'es' | 'en') => {
    setCurrentLang(lang);
    changeLanguage(lang);
  };
  const handleDarkModeToggle = (v: boolean) => {
    setDarkMode(v);
    setColorScheme(v ? 'dark' : 'light');
  };

  const handlePushNotificationsToggle = async (value: boolean) => {
    if (value) {
      // Obtener el token (solicita permiso si no estaba concedido)
      const token = await requestPushPermission();

      if (!token) {
        AppAlert.alert(
          t('settings.notifications.permissionRequired'),
          t('settings.notifications.permissionMessage'),
          [{ text: t('common.ok') }]
        );
        setPushNotifications(false);
        return;
      }

      // Quitar la bandera de desactivado por el usuario
      await setNotificationsDisabledByUser(false);
      setPushNotifications(true);

      try {
        await registerPushToken({
          variables: { token, platform: Platform.OS },
        });
        await togglePushToken({ variables: { token, enabled: true } });
      } catch {
        // No bloquear la UX si el backend falla
      }
    } else {
      // Obtener el token actual para poder desactivarlo en el backend
      const token = await getExpoPushToken();

      // Persistir la preferencia del usuario
      await setNotificationsDisabledByUser(true);
      setPushNotifications(false);

      // Desactivar el token en el bakend (el token sigue registrado, solo cambia enabled)
      if (token) {
        togglePushToken({ variables: { token, enabled: false } }).catch(
          () => {}
        );
      }

      AppAlert.alert(
        t('settings.notifications.disabledTitle'),
        t('settings.notifications.disabledMessage'),
        [{ text: t('common.ok') }]
      );
    }
  };

  const handleEmailNotificationsToggle = (value: boolean) => {
    setEmailNotifications(value);
    AppAlert.alert(
      value
        ? t('settings.notifications.emailEnabledTitle')
        : t('settings.notifications.emailDisabledTitle'),
      value
        ? t('settings.notifications.emailEnabledMessage')
        : t('settings.notifications.emailDisabledMessage'),
      [{ text: t('common.ok') }]
    );
  };

  useEffect(() => {
    enterOpacity.value = withTiming(1, {
      duration: 400,
      easing: Easing.out(Easing.quad),
    });
    enterScale.value = withSpring(1, {
      damping: 22,
      stiffness: 160,
      mass: 0.8,
    });
  }, []);

  const enterStyle = useAnimatedStyle(() => ({
    flex: 1,
    opacity: enterOpacity.value,
    transform: [{ scale: enterScale.value }],
  }));

  const Sl = ({ label }: { label: string }) => (
    <Text style={[S.sectionLabel, { color: colors.muted }]}>
      {label.toUpperCase()}
    </Text>
  );

  const getUserPhotos = () => {
    let cont = 0;

    userProjects?.getMyProjects.forEach(project => {
      cont += project.photos.length;
    });

    return cont;
  };

  const getUserMembers = () => {
    let cont = 0;

    userProjects?.getMyProjects.forEach(project => {
      cont += project.members.length;
    });

    return cont;
  };

  const handleLogout = () => {
    AppAlert.alert(
      t('settings.logoutConfirmTitle'),
      t('settings.logoutConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (e: any) {
              AppAlert.alert(
                t('common.error'),
                e?.message ?? t('common.unknownError')
              );
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer edgeToEdge className="p-0">
      <Animated.View style={enterStyle} className="bg-background">
        <HeroBackdrop height={230 + insets.top} />

        <BlurView
          intensity={30}
          tint={colorScheme}
          style={[
            S.header,
            StyleSheet.absoluteFill,
            { paddingTop: insets.top + 20, zIndex: 1, height: 150 },
          ]}
        >
          <Animated.View style={[S.headerTop, heroStyle]}>
            <View style={S.flex1}>
              <Text style={[S.workspaceLabel, { color: colors.muted }]}>
                {t('home.workspace')}
              </Text>
              <Text style={[S.workspaceName, { color: colors.foreground }]}>
                {t('settings.title')}
              </Text>
            </View>
          </Animated.View>
        </BlurView>

        <Animated.ScrollView
          // onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={S.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Avar section */}
          <View style={S.sectionTitleWrapper}>
            <Sl label={t('settings.sections.profile')} />
            <View style={[S.profileCard, cardElevation]}>
              <View
                style={[S.profileAvatar, { backgroundColor: colors.primary }]}
              >
                {user?.avatarUrl ? (
                  <View
                    style={{
                      borderRadius: 48,
                      borderWidth: 2,
                      borderColor: colors.primary,
                    }}
                  >
                    <Image
                      src={user.avatarUrl}
                      width={80}
                      height={80}
                      style={{ borderRadius: 48 }}
                    />
                  </View>
                ) : (
                  <IconSymbol name="person.fill" size={40} color="#FFFFFF" />
                )}
              </View>
              {/* User Info */}
              <Text style={[S.profileName, { color: colors.foreground }]}>
                {userName ?? '—'}
              </Text>
              <Text style={[S.profileEmail, { color: colors.muted }]}>
                {user?.email ?? ''}
              </Text>
              <Text style={[S.profileRole, { color: colors.muted }]}>
                {isOwner ? t('roles.root') : t('roles.admin')}
              </Text>
              {/* Stats */}
              <View style={[S.statsRow, { borderTopColor: colors.border }]}>
                <View style={S.statItem}>
                  <Text style={[S.statValue, { color: colors.primary }]}>
                    {userProjects?.getMyProjects.length ?? 0}
                  </Text>
                  <Text style={[S.statLabel, { color: colors.muted }]}>
                    {t('settings.profile.projects')}
                  </Text>
                </View>
                <View
                  style={[S.statDivider, { backgroundColor: colors.border }]}
                />
                <View style={S.statItem}>
                  <Text style={[S.statValue, { color: colors.primary }]}>
                    {getUserPhotos()}
                  </Text>
                  <Text style={[S.statLabel, { color: colors.muted }]}>
                    {t('settings.profile.photos')}
                  </Text>
                </View>
                <View
                  style={[S.statDivider, { backgroundColor: colors.border }]}
                />
                <View style={S.statItem}>
                  <Text style={[S.statValue, { color: colors.primary }]}>
                    {getUserMembers()}
                  </Text>
                  <Text style={[S.statLabel, { color: colors.muted }]}>
                    {t('settings.profile.teamMembers')}
                  </Text>
                </View>
              </View>
            </View>
            {/* Edit Profile row */}
            <View style={[S.card, cardElevation]}>
              <PressableScale
                onPress={() => nav(() => router.push('/edit-profile'))}
                style={S.row}
                pressedScale={0.98}
                haptic
              >
                <View style={S.rowLeft}>
                  <IconSymbol
                    name="person.crop.circle"
                    size={20}
                    color={colors.primary}
                  />
                  <Text
                    style={[
                      S.rowLabel,
                      { color: colors.foreground, marginLeft: 16 },
                    ]}
                  >
                    {t('profile.editProfile')}
                  </Text>
                </View>
                <IconSymbol
                  name="chevron.right"
                  size={16}
                  color={colors.muted}
                />
              </PressableScale>
            </View>
          </View>

          {/* Company Section */}
          <View style={S.sectionTitleWrapper}>
            <Sl label={t('settings.sections.company') ?? 'Empresa'} />
            <View style={[S.card, cardElevation]}>
              <View
                style={[
                  S.row,
                  {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <View style={S.rowLeft}>
                  <IconSymbol
                    name="building.2.fill"
                    size={20}
                    color={colors.primary}
                  />
                  <View style={S.rowTextBlock}>
                    <Text style={[S.rowLabel, { color: colors.foreground }]}>
                      {companyName ?? '—'}
                    </Text>
                    <Text style={[S.rowSublabel, { color: colors.muted }]}>
                      {isOwner ? t('roles.root') : t('roles.admin')}
                    </Text>
                  </View>
                </View>
              </View>
              <PressableScale
                onPress={() =>
                  nav(() => router.push('/modals/team-members' as any))
                }
                style={S.row}
                pressedScale={0.98}
                haptic
              >
                <View style={S.rowLeft}>
                  <IconSymbol
                    name="person.2.fill"
                    size={20}
                    color={colors.primary}
                  />
                  <Text
                    style={[
                      S.rowLabel,
                      { color: colors.foreground, marginLeft: 16 },
                    ]}
                  >
                    {t('teamMembers.title')}
                  </Text>
                </View>
                <IconSymbol
                  name="chevron.right"
                  size={16}
                  color={colors.muted}
                />
              </PressableScale>
            </View>
          </View>

          {/* Apariencia Section */}
          <View style={S.sectionTitleWrapper}>
            <Sl label={t('settings.sections.appearance')} />
            <View style={[S.card, cardElevation]}>
              <View
                style={[
                  S.row,
                  {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <View style={S.rowLeft}>
                  <IconSymbol
                    name="moon.fill"
                    size={20}
                    color={colors.primary}
                  />
                  <View style={S.rowTextBlock}>
                    <Text style={[S.rowLabel, { color: colors.foreground }]}>
                      {t('settings.appearance.darkMode')}
                    </Text>
                    <Text style={[S.rowSublabel, { color: colors.muted }]}>
                      {t('settings.appearance.darkModeDesc')}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={darkMode}
                  onValueChange={handleDarkModeToggle}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFF"
                />
              </View>
              <View style={S.cardStyleRow}>
                <View style={S.rowLeft}>
                  <IconSymbol
                    name="rectangle.stack.fill"
                    size={20}
                    color={colors.primary}
                  />
                  <Text
                    style={[
                      S.rowLabel,
                      { color: colors.foreground, marginLeft: 16 },
                    ]}
                  >
                    {t('settings.appearance.cardStyle')}
                  </Text>
                </View>
                <View style={S.segmentedControl}>
                  {(['flat', 'modern'] as const).map(mode => (
                    <PressableScale
                      key={mode}
                      onPress={() => setCardStyle((mode as 'flat') || 'modern')}
                      pressedScale={0.94}
                      style={[
                        S.segmentBtn,
                        {
                          backgroundColor:
                            cardStyle === mode
                              ? colors.primary
                              : colors.surface,
                          borderColor:
                            cardStyle === mode ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          S.segmentBtnText,
                          { color: cardStyle === mode ? '#FFF' : colors.muted },
                        ]}
                      >
                        {mode === 'flat'
                          ? t('settings.appearance.flat')
                          : t('settings.appearance.modern')}
                      </Text>
                    </PressableScale>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* Apariencia Section */}
          <View style={S.sectionTitleWrapper}>
            <Sl label={t('settings.sections.notifications')} />
            <View style={[S.card, cardElevation]}>
              <View
                style={[
                  S.row,
                  {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <View style={S.rowLeft}>
                  <IconSymbol
                    name="bell.fill"
                    size={20}
                    color={colors.primary}
                  />
                  <View style={S.rowTextBlock}>
                    <Text style={[S.rowLabel, { color: colors.foreground }]}>
                      {t('settings.notifications.push')}
                    </Text>
                    <Text style={[S.rowSublabel, { color: colors.muted }]}>
                      {t('settings.notifications.pushDesc')}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={pushNotifications}
                  onValueChange={handlePushNotificationsToggle}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFF"
                />
              </View>
              <View style={S.row}>
                <View style={S.rowLeft}>
                  <IconSymbol
                    name="envelope.fill"
                    size={20}
                    color={colors.primary}
                  />
                  <View style={S.rowTextBlock}>
                    <Text style={[S.rowLabel, { color: colors.foreground }]}>
                      {t('settings.notifications.email')}
                    </Text>
                    <Text style={[S.rowSublabel, { color: colors.muted }]}>
                      {t('settings.notifications.emailDesc')}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={emailNotifications}
                  onValueChange={handleEmailNotificationsToggle}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFF"
                />
              </View>
            </View>
          </View>

          {/* Account Section */}
          <View style={S.sectionTitleWrapper}>
            <Sl label={t('settings.sections.account') ?? 'Cuenta'} />
            <View style={[S.card, cardElevation]}>
              <PressableScale
                onPress={() =>
                  nav(() => router.push('/account-details' as any))
                }
                style={S.row}
                pressedScale={0.98}
                haptic
              >
                <View style={S.rowLeft}>
                  <IconSymbol
                    name="person.text.rectangle.fill"
                    size={20}
                    color={colors.primary}
                  />
                  <View style={S.rowTextBlock}>
                    <Text style={[S.rowLabel, { color: colors.foreground }]}>
                      {t('accountDetails.title')}
                    </Text>
                    <Text style={[S.rowSublabel, { color: colors.muted }]}>
                      {t('accountDetails.subtitle')}
                    </Text>
                  </View>
                </View>
                <IconSymbol
                  name="chevron.right"
                  size={16}
                  color={colors.muted}
                />
              </PressableScale>
            </View>
          </View>

          {/* General Section */}
          <View style={S.sectionTitleWrapper}>
            <Sl label={t('settings.sections.general')} />
            <View style={[S.card, cardElevation]}>
              <PressableScale
                onPress={() =>
                  nav(() => router.push('/modals/help-support' as any))
                }
                style={[
                  S.row,
                  {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                  },
                ]}
                pressedScale={0.98}
                haptic
              >
                <View style={S.rowLeft}>
                  <IconSymbol
                    name="questionmark.circle.fill"
                    size={20}
                    color={colors.primary}
                  />
                  <Text
                    style={[
                      S.rowLabel,
                      { color: colors.foreground, marginLeft: 16 },
                    ]}
                  >
                    {t('settings.general.helpSupport')}
                  </Text>
                </View>
                <IconSymbol
                  name="chevron.right"
                  size={16}
                  color={colors.muted}
                />
              </PressableScale>
              {/* Language */}
              <View
                style={[
                  S.row,
                  {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <View style={S.rowLeft}>
                  <IconSymbol name="globe" size={20} color={colors.primary} />
                  <View style={S.rowTextBlock}>
                    <Text style={[S.rowLabel, { color: colors.foreground }]}>
                      {t('settings.language')}
                    </Text>
                    <Text style={[S.rowSublabel, { color: colors.muted }]}>
                      {t('settings.languageDesc')}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    S.langPill,
                    { backgroundColor: colors.border + '60' },
                  ]}
                >
                  {(['es', 'en'] as const).map(lang => (
                    <PressableScale
                      key={lang}
                      onPress={() => handleLanguageToggle(lang)}
                      pressedScale={0.9}
                      style={[
                        S.langBtn,
                        currentLang === lang && {
                          backgroundColor: colors.primary,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          S.langBtnText,
                          {
                            color: currentLang === lang ? '#fff' : colors.muted,
                          },
                        ]}
                      >
                        {lang.toUpperCase()}
                      </Text>
                    </PressableScale>
                  ))}
                </View>
              </View>
              <PressableScale
                onPress={() => nav(() => router.push('/modals/about' as any))}
                style={S.row}
                pressedScale={0.98}
                haptic
              >
                <View style={S.rowLeft}>
                  <IconSymbol
                    name="info.circle.fill"
                    size={20}
                    color={colors.primary}
                  />
                  <Text
                    style={[
                      S.rowLabel,
                      { color: colors.foreground, marginLeft: 16 },
                    ]}
                  >
                    {t('settings.general.about')}
                  </Text>
                </View>
                <View style={S.rowRight}>
                  <Text style={[S.rowSublabel, { color: colors.muted }]}>
                    v1.0.0
                  </Text>
                  <IconSymbol
                    name="chevron.right"
                    size={16}
                    color={colors.muted}
                  />
                </View>
              </PressableScale>
            </View>
          </View>

          {/* ── SESIÓN ─────────────────────────────────────────────────────── */}
          <View style={S.sectionTitleWrapper}>
            <Sl label={t('settings.sections.session') ?? 'Sesión'} />
            <View style={[S.card, cardElevation]}>
              <PressableScale
                onPress={handleLogout}
                style={S.row}
                pressedScale={0.98}
                haptic
              >
                <View style={S.rowLeft}>
                  <IconSymbol
                    name="rectangle.portrait.and.arrow.right"
                    size={20}
                    color={colors.error}
                  />
                  <Text
                    style={[
                      S.rowLabel,
                      { color: colors.error, marginLeft: 16 },
                    ]}
                  >
                    {t('settings.logout')}
                  </Text>
                </View>
              </PressableScale>
            </View>
          </View>

          {/* Footer */}
          <View style={S.footer}>
            <Text style={[S.footerText, { color: colors.muted }]}>
              SnapSite v1.0.0
            </Text>
            <Text style={[S.footerText, { color: colors.muted }]}>
              {t('settings.footer')}
            </Text>
          </View>
        </Animated.ScrollView>
        <Animated.View
          style={[S.stickyBar, stickyBarStyle, { paddingTop: insets.top + 6 }]}
          pointerEvents="none"
        >
          {/* Fondo sólido (no blur): el texto tiene que leerse nítido, no
              difuminado contra un cristal esmerilado. */}
          <View style={[S.stickyGlass, { backgroundColor: colors.background }]}>
            <Text
              numberOfLines={1}
              style={[S.stickyTitle, { color: colors.foreground }]}
            >
              {t('settings.title')}
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  // Layout helpers
  flex1: { flex: 1 },
  flex1Ml3: { flex: 1, marginLeft: 12 },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },

  // Header — jerarquía tipográfica marcada: eyebrow uppercase + nombre grande
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  workspaceLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  workspaceName: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  teamRow: { flexDirection: 'row', alignItems: 'center' },
  avatarsTouchable: { flexDirection: 'row', marginRight: 12 },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  headerAvatarMore: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: -8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarMoreText: { fontSize: 11, fontWeight: '600' },
  inviteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inviteBtnText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  // Scroll
  scrollContent: { paddingBottom: 120, paddingTop: 150 },

  // Sticky glass bar (aparece al colapsar el hero)
  stickyBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  stickyGlass: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  stickyTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },

  // Sections — breathing room amplio y títulos con más peso
  section: { marginTop: 28 },
  sectionTitleWrapper: { paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seeAllText: { fontSize: 14, fontWeight: '600' },
  horizontalListContent: { paddingHorizontal: 20, paddingVertical: 14 },

  // Status grid
  statusGrid: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statusCard: {
    width: '48%',
    aspectRatio: 1.5,
    borderRadius: 18,
    padding: 16,
    justifyContent: 'space-between',
  },
  statusCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusCardLabel: { fontSize: 16, fontWeight: '600' },
  statusIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCardCount: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },

  // Project card
  projectCardWrapper: { marginRight: 16, width: 300 },
  projectCard: { borderRadius: 18, padding: 16 },
  projectCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  statusBadgeText: { fontSize: 12, fontWeight: '600' },
  progressSection: { marginBottom: 12 },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 12, marginLeft: 6 },
  projectCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarRow: { flexDirection: 'row' },
  memberAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: { fontSize: 10, fontWeight: '600', color: '#FFFFFF' },

  // Image card
  imageCardWrapper: { marginRight: 12 },
  imageCardInner: { borderRadius: 12, overflow: 'hidden' },
  imageCardImg: { width: 140, height: 140 },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },

  // Location card
  locationCardWrapper: { marginRight: 16, width: 200 },
  locationCard: { borderRadius: 18, padding: 16 },
  locationCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  locationProjectsText: { fontSize: 12, marginLeft: 4 },
  profileCard: {
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    marginBottom: 4,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 11, marginTop: 2 },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 36,
    alignSelf: 'center',
  },
  // Avatar in account row
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700' },
  profileName: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  profileEmail: { fontSize: 13, marginTop: 2 },
  profileRole: { fontSize: 13, marginTop: 2 },
  card: { borderRadius: 18, overflow: 'hidden', marginBottom: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowTextBlock: { flex: 1, marginLeft: 16 },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  rowSublabel: { fontSize: 12, marginTop: 1 },
  cardStyleRow: { paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  segmentedControl: { flexDirection: 'row', gap: 8, marginLeft: 36 },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  segmentBtnText: { fontSize: 13, fontWeight: '700' },
  langPill: { flexDirection: 'row', borderRadius: 12, padding: 3 },
  langBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9 },
  langBtnText: { fontSize: 12, fontWeight: '600' },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footer: { alignItems: 'center', paddingTop: 24, paddingBottom: 8, gap: 4 },
  footerText: { fontSize: 12 },
});
