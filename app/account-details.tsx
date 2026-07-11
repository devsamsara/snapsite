import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { HeroBackdrop } from '@/components/ui/hero-backdrop';
import { useColors } from '@/hooks/use-colors';
import { useCardStyle } from '@/hooks/use-card-style';
import { useEffect } from 'react';

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
  DeleteCompanyDocument,
  DeleteUserDocument,
  UserRole,
} from '@/gql/graphql';
import { useAuth } from '@/lib/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { PressableScale } from '@/components/ui/pressable-scale';
import { AppAlert } from '@/components/ui/app-alert';
import { BlurView } from 'expo-blur';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { apolloClient } from '@/lib/graphql-client';

export default function SettingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const colorScheme = useColorScheme();
  const { signOut, user } = useAuth();

  const cardStyle = useCardStyle();

  const isOwner = user?.role === UserRole.Admin || user?.role === UserRole.Root;
  const isMember =
    user?.role === UserRole.Admin || user?.role === UserRole.User;

  const enterOpacity = useSharedValue(0);
  const enterScale = useSharedValue(1.06);
  const insets = useSafeAreaInsets();

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler(e => {
    scrollY.value = e.contentOffset.y;
  });

  // Arranca después de que el hero ya casi desapareció (a partir de 110, no
  // 70) para que no se vean los dos textos superpuestos a la vez — eso es lo
  // que se sentía "difuminado".
  const stickyBarStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [110, 150],
      [0, 1],
      Extrapolation.CLAMP
    ),
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

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleDeleteAccount = () => {
    AppAlert.alert(
      t('profile.deleteAccountTitle'),
      t('profile.deleteAccountMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.deleteAccountButton'),
          style: 'destructive',
          onPress: async () => {
            try {
              const userId = user?.id;
              if (!userId) throw new Error('No user id');
              await apolloClient.mutate({
                mutation: DeleteUserDocument,
                variables: { id: userId },
              });
              await signOut();
            } catch {
              AppAlert.alert(
                t('common.error'),
                t('profile.deleteAccountError')
              );
            }
          },
        },
      ]
    );
  };

  const handleLeaveCompany = () => {
    AppAlert.alert(
      t('profile.leaveCompanyTitle'),
      t('profile.leaveCompanyMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.leaveCompanyButton'),
          style: 'destructive',
          onPress: async () => {
            try {
              const userId = user?.id;
              if (!userId) throw new Error('No user id');
              await apolloClient.mutate({
                mutation: DeleteUserDocument,
                variables: { id: userId },
              });
              await signOut();
            } catch {
              AppAlert.alert(t('common.error'), t('profile.leaveCompanyError'));
            }
          },
        },
      ]
    );
  };

  const handleDeleteCompany = () => {
    AppAlert.alert(
      t('profile.deleteCompanyTitle'),
      t('profile.deleteCompanyMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.deleteCompanyButton'),
          style: 'destructive',
          onPress: async () => {
            try {
              const companyId = user?.company?.id;
              if (!companyId) throw new Error('No company id');
              await apolloClient.mutate({
                mutation: DeleteCompanyDocument,
                variables: { id: companyId },
              });
              await signOut();
            } catch {
              AppAlert.alert(
                t('common.error'),
                t('profile.deleteCompanyError')
              );
            }
          },
        },
      ]
    );
  };

  const infoRows = [
    {
      icon: 'person.fill' as const,
      label: t('accountDetails.name'),
      value: user?.name ?? '—',
    },
    {
      icon: 'envelope.fill' as const,
      label: t('accountDetails.email'),
      value: user?.email ?? '—',
    },
    {
      icon: 'building.2.fill' as const,
      label: t('accountDetails.company'),
      value: user?.company?.name ?? '—',
    },
    {
      icon: 'shield.fill' as const,
      label: t('accountDetails.role'),
      value: user?.role
        ? t(`roles.${user.role.toLowerCase()}`, user.role)
        : '—',
    },
  ];

  const handleBack = () => {
    if (router.canGoBack()) router.back();
  };

  return (
    <ScreenContainer edgeToEdge className="p-0">
      <Animated.View style={enterStyle} className="bg-background">
        <HeroBackdrop height={230 + insets.top} />
        <BlurView
          intensity={10}
          tint={colorScheme}
          style={[
            S.header,
            StyleSheet.absoluteFill,
            {
              paddingTop: insets.top + 20,
              zIndex: 1,
              height: 150,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
        >
          <PressableScale onPress={handleBack} style={[S.backBtn]}>
            <MaterialIcons
              name="arrow-back-ios-new"
              size={22}
              color={colors.foreground}
            />
          </PressableScale>
          <View style={S.headerTop}>
            <View style={S.flex1}>
              <Text style={[S.workspaceLabel, { color: colors.muted }]}>
                {t('accountDetails.title')}
              </Text>
              <Text style={[S.workspaceName, { color: colors.foreground }]}>
                {user?.name.toString().at(0)?.toUpperCase()}
                {user?.name.toString().substring(1)}
              </Text>
            </View>
          </View>
        </BlurView>

        <Animated.ScrollView
          // onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={S.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Avar section */}
          <View style={S.sectionTitleWrapper}>
            <Sl label={t('accountDetails.sectionInfo')} />
            <View style={[S.card, cardStyle, S.listCard]}>
              {infoRows.map((row, i) => (
                <View
                  key={row.label}
                  style={[
                    S.infoRow,
                    { borderBottomColor: colors.border },
                    i === infoRows.length - 1 && S.rowLast,
                  ]}
                >
                  <View style={S.infoLeft}>
                    <IconSymbol
                      name={row.icon}
                      size={18}
                      color={colors.primary}
                    />
                    <Text style={[S.infoLabel, { color: colors.muted }]}>
                      {row.label}
                    </Text>
                  </View>
                  <Text
                    style={[S.infoValue, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Security section */}
          <View style={S.sectionTitleWrapper}>
            <Sl label={t('accountDetails.sectionInfo')} />
            <View style={[S.card, cardStyle, S.listCard]}>
              <TouchableOpacity
                style={[S.actionRow, { borderBottomColor: colors.border }]}
                activeOpacity={0.7}
                onPress={() => router.push('/modals/change-password')}
              >
                <View style={S.actionLeft}>
                  <IconSymbol
                    name="lock.fill"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={[S.actionLabel, { color: colors.foreground }]}>
                    {t('editProfile.changePassword')}
                  </Text>
                </View>
                <IconSymbol
                  name="chevron.right"
                  size={16}
                  color={colors.muted}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[S.actionRow, S.rowLast]}
                activeOpacity={0.7}
              >
                <View style={S.actionLeft}>
                  <IconSymbol
                    name="key.fill"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={[S.actionLabel, { color: colors.foreground }]}>
                    {t('accountDetails.twoFactor')}
                  </Text>
                </View>
                <IconSymbol
                  name="chevron.right"
                  size={16}
                  color={colors.muted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Danger section */}
          <View style={S.sectionTitleWrapper}>
            <Sl label={t('accountDetails.sectionDanger')} />
            <Text style={[S.sectionLabel, { color: colors.muted }]}>
              {t('accountDetails.sectionDanger')}
            </Text>
            <View
              style={[
                S.card,
                cardStyle,
                S.listCard,
                { borderWidth: 1, borderColor: colors.error + '40' },
              ]}
            >
              {/* Delete account — always visible */}
              <TouchableOpacity
                style={[
                  S.actionRow,
                  { borderBottomColor: colors.border },
                  !isMember && !isOwner && S.rowLast,
                ]}
                onPress={handleDeleteAccount}
                activeOpacity={0.7}
              >
                <View style={S.actionLeft}>
                  <IconSymbol
                    name="trash.fill"
                    size={20}
                    color={colors.error}
                  />
                  <View>
                    <Text style={[S.actionLabel, { color: colors.error }]}>
                      {t('profile.deleteAccountButton')}
                    </Text>
                    <Text
                      style={[S.actionSub, { color: colors.error + 'AA' }]}
                      numberOfLines={2}
                    >
                      {t('accountDetails.deleteAccountHint')}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Leave company — non-owner members */}
              {isMember && (
                <TouchableOpacity
                  style={[S.actionRow, S.rowLast]}
                  onPress={handleLeaveCompany}
                  activeOpacity={0.7}
                >
                  <View style={S.actionLeft}>
                    <IconSymbol
                      name="rectangle.portrait.and.arrow.right.fill"
                      size={20}
                      color={colors.error}
                    />
                    <View>
                      <Text style={[S.actionLabel, { color: colors.error }]}>
                        {t('profile.leaveCompanyButton')}
                      </Text>
                      <Text
                        style={[S.actionSub, { color: colors.error + 'AA' }]}
                        numberOfLines={2}
                      >
                        {t('profile.leaveCompanyHint')}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}

              {/* Delete company — owner only */}
              {isOwner && (
                <TouchableOpacity
                  style={[S.actionRow, S.rowLast]}
                  onPress={handleDeleteCompany}
                  activeOpacity={0.7}
                >
                  <View style={S.actionLeft}>
                    <IconSymbol
                      name="x.circle.fill"
                      size={20}
                      color={colors.error}
                    />
                    <View>
                      <Text style={[S.actionLabel, { color: colors.error }]}>
                        {t('profile.deleteCompanyButton')}
                      </Text>
                      <Text
                        style={[S.actionSub, { color: colors.error + 'AA' }]}
                        numberOfLines={2}
                      >
                        {t('accountDetails.deleteCompanyHint')}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            </View>
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
    paddingHorizontal: 35,
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
  backBtn: {
    width: 32,
    height: 32,
  },
  listCard: { padding: 0, overflow: 'hidden' },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoLabel: { fontSize: 13, fontWeight: '500' },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    maxWidth: '55%',
    textAlign: 'right',
  },
  rowLast: { borderBottomWidth: 0 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  actionLabel: { fontSize: 15, fontWeight: '600' },
  actionSub: { fontSize: 12, marginTop: 2, maxWidth: 240 },
});
