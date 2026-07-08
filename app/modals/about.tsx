import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { useCardStyle } from '@/hooks/use-card-style';

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
      <View style={[S.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[S.backBtn, { backgroundColor: colors.surface }]}
        >
          <IconSymbol name="chevron.left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[S.headerTitle, { color: colors.foreground }]}>
          {t('about.title')}
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
            <TouchableOpacity
              key={item.label}
              style={[
                S.row,
                { borderBottomColor: colors.border },
                index === links.length - 1 && S.rowLast,
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={S.rowLeft}>
                <IconSymbol name={item.icon} size={20} color={colors.primary} />
                <Text style={[S.rowLabel, { color: colors.foreground }]}>
                  {item.label}
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.muted} />
            </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { paddingHorizontal: 16, paddingTop: 24 },
  logoSection: { alignItems: 'center', marginBottom: 28 },
  logoContainer: {
    width: 88, height: 88, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  appName: { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  version: { fontSize: 14 },
  card: { borderRadius: 16, padding: 16, marginBottom: 16 },
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
