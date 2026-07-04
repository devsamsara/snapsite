import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { useCardStyle } from '@/hooks/use-card-style';
import { useAuth } from '@/lib/auth-context';
import { AppAlert } from '@/components/ui/app-alert';
import { apolloClient } from '@/lib/graphql-client';
import {
  DeleteUserDocument,
  DeleteCompanyDocument,
  UserRole,
} from '@/gql/graphql';

export default function AccountDetailsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const cardStyle = useCardStyle();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();

  const isOwner = user?.role === UserRole.Root;
  const isMember =
    user?.role === UserRole.Admin || user?.role === UserRole.User;

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
                t('profile.deleteAccountError'),
              );
            }
          },
        },
      ],
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
              AppAlert.alert(
                t('common.error'),
                t('profile.leaveCompanyError'),
              );
            }
          },
        },
      ],
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
                t('profile.deleteCompanyError'),
              );
            }
          },
        },
      ],
    );
  };

  // ── Info rows ──────────────────────────────────────────────────────────────
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

  return (
    <View style={[S.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[S.header, { borderBottomColor: colors.border, paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[S.backBtn, { backgroundColor: colors.surface }]}
        >
          <IconSymbol name="chevron.left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[S.headerTitle, { color: colors.foreground }]}>
          {t('accountDetails.title')}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          S.content,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Account info */}
        <Text style={[S.sectionLabel, { color: colors.muted }]}>
          {t('accountDetails.sectionInfo')}
        </Text>
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
                <IconSymbol name={row.icon} size={18} color={colors.primary} />
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

        {/* Security */}
        <Text style={[S.sectionLabel, { color: colors.muted }]}>
          {t('accountDetails.sectionSecurity')}
        </Text>
        <View style={[S.card, cardStyle, S.listCard]}>
          <TouchableOpacity
            style={[S.actionRow, { borderBottomColor: colors.border }]}
            activeOpacity={0.7}
          >
            <View style={S.actionLeft}>
              <IconSymbol name="lock.fill" size={20} color={colors.primary} />
              <Text style={[S.actionLabel, { color: colors.foreground }]}>
                {t('editProfile.changePassword')}
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={colors.muted} />
          </TouchableOpacity>
          <TouchableOpacity style={[S.actionRow, S.rowLast]} activeOpacity={0.7}>
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
            <IconSymbol name="chevron.right" size={16} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Danger zone */}
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
              <IconSymbol name="trash.fill" size={20} color={colors.error} />
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
                  name="building.2.crop.circle.badge.minus"
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
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { paddingHorizontal: 16, paddingTop: 24 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  card: { borderRadius: 16, padding: 16, marginBottom: 16 },
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
  infoValue: { fontSize: 14, fontWeight: '600', maxWidth: '55%', textAlign: 'right' },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLast: { borderBottomWidth: 0 },
  actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  actionLabel: { fontSize: 15, fontWeight: '600' },
  actionSub: { fontSize: 12, marginTop: 2, maxWidth: 240 },
});
