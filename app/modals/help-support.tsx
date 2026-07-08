import React, { useState } from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { useCardStyle } from '@/hooks/use-card-style';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type FAQ = { q: string; a: string };

export default function HelpSupportModal() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const cardStyle = useCardStyle();
  const insets = useSafeAreaInsets();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQ[] = t('helpSupport.faqs', { returnObjects: true }) as FAQ[];

  const toggle = (i: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenIndex(prev => (prev === i ? null : i));
  };

  const contactItems = [
    {
      icon: 'envelope.fill' as const,
      label: t('helpSupport.emailSupport'),
      sub: 'support@snapsite.app',
      onPress: () => Linking.openURL('mailto:support@snapiste.app'),
    },
    {
      icon: 'globe' as const,
      label: t('helpSupport.helpCenter'),
      sub: 'fieldcam.app/help',
      onPress: () => Linking.openURL('https://snapsite.app/help'),
    },
    /*{
      icon: 'bubble.left.fill' as const,
      label: t('helpSupport.liveChat'),
      sub: t('helpSupport.liveChatSub'),
      onPress: () => Linking.openURL('https://snapsite.app/chat'),
    },*/
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
          {t('helpSupport.title')}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[S.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Contact */}
        <Text style={[S.sectionLabel, { color: colors.muted }]}>
          {t('helpSupport.contactUs')}
        </Text>
        <View style={[S.card, cardStyle, S.listCard]}>
          {contactItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[
                S.row,
                { borderBottomColor: colors.border },
                index === contactItems.length - 1 && S.rowLast,
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={S.rowLeft}>
                <View style={[S.iconBg, { backgroundColor: colors.primary + '18' }]}>
                  <IconSymbol name={item.icon} size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={[S.rowLabel, { color: colors.foreground }]}>
                    {item.label}
                  </Text>
                  <Text style={[S.rowSub, { color: colors.muted }]}>{item.sub}</Text>
                </View>
              </View>
              <IconSymbol name="arrow.up.right" size={14} color={colors.muted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* FAQ */}
        <Text style={[S.sectionLabel, { color: colors.muted }]}>
          {t('helpSupport.faqTitle')}
        </Text>
        <View style={[S.card, cardStyle, S.listCard]}>
          {faqs.map((faq, i) => (
            <View key={i} style={[i < faqs.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
              <TouchableOpacity
                style={S.faqHeader}
                onPress={() => toggle(i)}
                activeOpacity={0.7}
              >
                <Text style={[S.faqQ, { color: colors.foreground, flex: 1 }]}>
                  {faq.q}
                </Text>
                <IconSymbol
                  name={openIndex === i ? 'chevron.up' : 'chevron.down'}
                  size={14}
                  color={colors.muted}
                />
              </TouchableOpacity>
              {openIndex === i && (
                <Text style={[S.faqA, { color: colors.muted }]}>{faq.a}</Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { paddingHorizontal: 16, paddingTop: 24 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.6,
    marginBottom: 8,
  },
  card: { borderRadius: 16, padding: 16, marginBottom: 16 },
  listCard: { padding: 0, overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconBg: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  rowSub: { fontSize: 12, marginTop: 1 },
  faqHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, gap: 8,
  },
  faqQ: { fontSize: 15, fontWeight: '600' },
  faqA: { fontSize: 14, lineHeight: 20, paddingHorizontal: 16, paddingBottom: 14 },
});
