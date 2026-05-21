import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { useAuth } from '@/lib/auth-context';
import { Project } from '@/gql/graphql';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const menuItems = [
    {
      icon: 'person.fill',
      label: t('profile.editProfile'),
      action: 'edit',
      route: '/edit-profile',
    },
    {
      icon: 'bubble.left.and.bubble.right.fill',
      label: t('profile.messages'),
      action: 'messages',
      route: null,
    },
    {
      icon: 'gear',
      label: t('profile.settings'),
      action: 'settings',
      route: '/settings',
    },
    {
      icon: 'trash.fill',
      label: t('profile.logout'),
      action: 'logout',
      route: null,
      color: 'error',
    },
  ];

  const handleLogout = () => {
    Alert.alert(
      t('profile.logoutConfirmTitle'),
      t('profile.logoutConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              // router.replace('/auth/login') is handled by AuthProvider's route guard
            } catch (error) {
              Alert.alert(t('common.error'), t('profile.logoutError'));
            }
          },
        },
      ]
    );
  };

  const handlePress = (item: (typeof menuItems)[0]) => {
    if (item.action === 'logout') {
      handleLogout();
    } else if (item.route) {
      router.push(item.route as any);
    }
  };

  const getPictures = () => {
    let picturesCount: number = 0;
    if (user) {
      user.projects?.forEach(project => {
        if (project) {
          picturesCount += project.photos?.length ?? 0;
        }
      });
    }

    return picturesCount;
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="px-4 pt-4 pb-4 border-b border-border">
          <Text className="text-3xl font-bold text-foreground mb-4">
            {t('profile.title')}
          </Text>

          {/* Profile Card */}
          <View
            className="bg-surface rounded-2xl p-4 items-center border border-border"
            style={{ borderColor: colors.border }}
          >
            {/* Avatar */}
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-3"
              style={{ backgroundColor: colors.primary }}
            >
              <IconSymbol name="person.fill" size={40} color="#FFFFFF" />
            </View>

            {/* User Info */}
            <Text className="text-2xl font-bold text-foreground">
              {user?.name || 'User'}
            </Text>
            <Text className="text-sm text-muted mt-1">{user?.email || ''}</Text>
            <Text className="text-sm text-muted mt-1">{user?.role || ''}</Text>

            {/* Stats */}
            <View className="flex-row gap-4 mt-4 pt-4 border-t border-border w-full">
              <View className="flex-1 items-center">
                <Text className="text-2xl font-bold text-primary">
                  {/*{user?.projects?.length}*/}
                </Text>
                <Text className="text-xs text-muted mt-1">
                  {t('profile.projects')}
                </Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-2xl font-bold text-primary">
                  {/*{getPictures()}*/}
                </Text>
                <Text className="text-xs text-muted mt-1">
                  {t('profile.photos')}
                </Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-2xl font-bold text-primary">
                  {/*{user?.company?.users.length}*/}
                </Text>
                <Text className="text-xs text-muted mt-1">
                  {t('profile.teamMembers')}
                </Text>
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
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <View className="flex-row items-center flex-1">
                <IconSymbol
                  name={item.icon as any}
                  size={20}
                  color={item.color === 'error' ? colors.error : colors.primary}
                />
                <Text
                  className="font-semibold"
                  style={{
                    color:
                      item.color === 'error' ? colors.error : colors.foreground,
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
        <View className="px-4 py-4 items-center">
          <Text className="text-xs text-muted">{t('profile.version')}</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
