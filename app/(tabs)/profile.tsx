import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { useAuth } from '@/lib/auth-context';
import { UserRole, DeleteUserDocument, DeleteCompanyDocument } from '@/gql/graphql';
import { apolloClient } from '@/lib/graphql-client';
import { AppAlert } from '@/components/ui/app-alert';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();
  const { user, signOut } = useAuth();

  // Root = owner who created the company → can delete the whole company
  // Admin / User = member → can only leave (deletes their own account)
  const isOwner = user?.role === UserRole.Root;

  const menuItems = [
    { icon: 'person.fill',                          label: t('profile.editProfile'), action: 'edit',     route: '/edit-profile' },
    { icon: 'bubble.left.and.bubble.right.fill',    label: t('profile.messages'),    action: 'messages', route: null },
    { icon: 'gear',                                 label: t('profile.settings'),    action: 'settings', route: '/settings' },
    { icon: 'rectangle.portrait.and.arrow.right',   label: t('profile.logout'),      action: 'logout',   route: null, color: 'error' },
  ];

  // ─── Logout ──────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    AppAlert.alert(t('profile.logoutConfirmTitle'), t('profile.logoutConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.logout'),
        style: 'destructive',
        onPress: async () => {
          try { await signOut(); }
          catch { AppAlert.alert(t('common.error'), t('profile.logoutError')); }
        },
      },
    ]);
  };

  // ─── Delete company (Root role) ──────────────────────────────────────────────
  const handleDeleteCompany = () => {
    AppAlert.alert(t('profile.deleteAccountConfirmTitle'), t('profile.deleteAccountConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.deleteAccountConfirmButton'),
        style: 'destructive',
        onPress: async () => {
          try {
            const companyId = user?.company?.id;
            if (!companyId) throw new Error('No company id');
            await apolloClient.mutate({ mutation: DeleteCompanyDocument, variables: { id: companyId } });
            await signOut();
          } catch {
            AppAlert.alert(t('common.error'), t('profile.deleteAccountError'));
          }
        },
      },
    ]);
  };

  // ─── Leave company (Admin / User roles) ──────────────────────────────────────
  const handleLeaveCompany = () => {
    AppAlert.alert(t('profile.leaveCompanyConfirmTitle'), t('profile.leaveCompanyConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.leaveCompanyConfirmButton'),
        style: 'destructive',
        onPress: async () => {
          try {
            const userId = user?.id;
            if (!userId) throw new Error('No user id');
            await apolloClient.mutate({ mutation: DeleteUserDocument, variables: { id: userId } });
            await signOut();
          } catch {
            AppAlert.alert(t('common.error'), t('profile.leaveCompanyError'));
          }
        },
      },
    ]);
  };

  const handlePress = (item: (typeof menuItems)[0]) => {
    if (item.action === 'logout') handleLogout();
    else if (item.route) router.push(item.route as any);
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView className="flex-1 bg-background" contentContainerStyle={S.scrollContent}>
        {/* Header */}
        <View className="px-4 pt-4 pb-4 border-b border-border">
          <Text className="text-3xl font-bold text-foreground mb-4">{t('profile.title')}</Text>

          {/* Profile Card */}
          <View
            className="bg-surface rounded-2xl p-4 items-center border border-border"
            style={{ borderColor: colors.border }}
          >
            {/* Avatar */}
            <View style={[S.avatar, { backgroundColor: colors.primary }]}>
              <IconSymbol name="person.fill" size={40} color="#FFFFFF" />
            </View>

            {/* User Info */}
            <Text className="text-2xl font-bold text-foreground">{user?.name || 'User'}</Text>
            <Text className="text-sm text-muted mt-1">{user?.email || ''}</Text>
            <Text className="text-sm text-muted mt-1">{user?.role || ''}</Text>

            {/* Stats */}
            <View className="flex-row gap-4 mt-4 pt-4 border-t border-border w-full">
              <View className="flex-1 items-center">
                <Text className="text-2xl font-bold text-primary" />
                <Text className="text-xs text-muted mt-1">{t('profile.projects')}</Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-2xl font-bold text-primary" />
                <Text className="text-xs text-muted mt-1">{t('profile.photos')}</Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-2xl font-bold text-primary" />
                <Text className="text-xs text-muted mt-1">{t('profile.teamMembers')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View className="px-4 py-4 gap-3">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handlePress(item)}
              className="flex-row items-center justify-between px-4 py-4 rounded-xl border border-border"
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            >
              <View className="flex-row items-center flex-1">
                <IconSymbol
                  name={item.icon as any}
                  size={20}
                  color={item.color === 'error' ? colors.error : colors.primary}
                />
                <Text
                  className="font-semibold"
                  style={[S.menuItemLabel, { color: item.color === 'error' ? colors.error : colors.foreground }]}
                >
                  {item.label}
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.muted} />
            </TouchableOpacity>
          ))}

          {/* Danger zone separator */}
          <View style={S.dangerSeparator}>
            <Text className="text-xs font-semibold uppercase tracking-widest" style={{ color: colors.muted }}>
              {t('projectSettings.sectionDanger')}
            </Text>
          </View>

          {/* Delete / Leave button — role-dependent */}
          <TouchableOpacity
            onPress={isOwner ? handleDeleteCompany : handleLeaveCompany}
            className="flex-row items-center justify-between px-4 py-4 rounded-xl border"
            style={{ backgroundColor: colors.error + '10', borderColor: colors.error + '40' }}
          >
            <View className="flex-row items-center flex-1">
              <IconSymbol
                name={isOwner ? 'building.2.fill' : 'rectangle.portrait.and.arrow.right.fill'}
                size={20}
                color={colors.error}
              />
              <View style={S.dangerTextWrapper}>
                <Text className="font-semibold" style={{ color: colors.error }}>
                  {isOwner ? t('profile.deleteAccountConfirmButton') : t('profile.leaveCompanyConfirmButton')}
                </Text>
                <Text className="text-xs mt-0.5" style={{ color: colors.error + 'CC' }} numberOfLines={2}>
                  {isOwner ? t('profile.deleteAccountConfirmMessage') : t('profile.leaveCompanyConfirmMessage')}
                </Text>
              </View>
            </View>
            <IconSymbol name="chevron.right" size={16} color={colors.error} />
          </TouchableOpacity>
        </View>

        {/* Version Info */}
        <View className="px-4 py-4 items-center">
          <Text className="text-xs text-muted">{t('profile.version')}</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  scrollContent:     { paddingBottom: 100 },
  avatar:            { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  menuItemLabel:     { marginLeft: 16 },
  dangerSeparator:   { marginTop: 8, marginBottom: 4, paddingHorizontal: 4 },
  dangerTextWrapper: { marginLeft: 16, flex: 1 },
});
