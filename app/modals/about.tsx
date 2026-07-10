import React from 'react';
import { PressableScale } from '@/components/ui/pressable-scale';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Linking,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useColors } from '@/hooks/use-colors';
import { useCardStyle } from '@/hooks/use-card-style';
import { spacing } from '@/constants/spacing';

const APP_VERSION = '1.0.0';
const BUILD_NUMBER = '100';

export default function AboutModal() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const cardStyle = useCardStyle();
  const insets = useSafeAreaInsets();

  const links = [
    {
      icon: 'doc.text.fill' as const,
      label: t('about.termsOfService'),
      onPress: () => router.push('/modals/terms-modal'),
    },
    {
      icon: 'lock.shield.fill' as const,
      label: t('about.privacyPolicy'),
      onPress: () => router.push('/modals/privacy-modal'),
    },
    {
      icon: 'globe' as const,
      label: t('about.website'),
      onPress: () => Linking.openURL('https://snapiste.app'),
    },
  ];

  return (
    <View style={[S.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <ScreenHeader
        title={t('about.title')}
        onBack={() => router.back()}
        withSafeArea={false}
      />

      <ScrollView
        contentContainerStyle={[
          S.content,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* App logo & version */}
        <View style={S.logoSection}>
          <View style={[S.logoContainer, { backgroundColor: colors.primary }]}>
            {/*<IconSymbol name="camera.fill" size={40} color="#FFFFFF" />*/}
            <Image
              resizeMode="contain"
              source={require('@/assets/images/icon.png')}
              borderRadius={12}
              style={{ width: 120, height: 120, borderRadius: 8 }}
            />
          </View>
          <Text style={[S.appName, { color: colors.foreground }]}>
            Snapsite
          </Text>
          <Text style={[S.version, { color: colors.muted }]}>
            {t('about.version', { version: APP_VERSION, build: BUILD_NUMBER })}
          </Text>
        </View>

        {/* Description */}
        <View style={[S.card, cardStyle]}>
          <Text style={[S.description, { color: colors.foreground }]}>
            {t('about.description')}
          </Text>
        </View>

        {/* Links */}
        <Text style={[S.sectionLabel, { color: colors.muted }]}>
          {t('about.legal')}
        </Text>
        <View style={[S.card, cardStyle, S.listCard]}>
          {links.map((item, index) => (
            <PressableScale
              key={item.label}
              style={[
                S.row,
                { borderBottomColor: colors.border },
                index === links.length - 1 && S.rowLast,
              ]}
              onPress={item.onPress}
            >
              <View style={S.rowLeft}>
                <IconSymbol name={item.icon} size={20} color={colors.primary} />
                <Text style={[S.rowLabel, { color: colors.foreground }]}>
                  {item.label}
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.muted} />
            </PressableScale>
          ))}
        </View>

        {/* Footer */}
        <Text style={[S.footer, { color: colors.muted }]}>
          {t('settings.footer')}
        </Text>
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  logoSection: { alignItems: 'center', marginBottom: 28 },
  logoContainer: {
    width: 88, height: 88, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  appName: { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  version: { fontSize: 14 },
  card: { borderRadius: 18, padding: 16, marginBottom: 16 },
  listCard: { padding: 0, overflow: 'hidden' },
  description: { fontSize: 15, lineHeight: 22 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.6,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLabel: { fontSize: 15, fontWeight: '500' },
  footer: { fontSize: 12, textAlign: 'center', marginTop: 8 },
});
