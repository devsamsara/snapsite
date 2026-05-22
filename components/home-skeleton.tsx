/**
 * components/home-skeleton.tsx
 *
 * Skeleton de carga para el HomeScreen.
 * Replica pixel-perfect la estructura del index.tsx:
 *   Header (workspace label + name + avatars + invite btn + settings btn + search)
 *   → Sección "Hoy" (4 status cards en grid 2×2)
 *   → Sección "Proyectos recientes" (2 project cards horizontales)
 *   → Sección "Ubicaciones recientes" (2 location cards horizontales)
 *   → Sección "Imágenes recientes" (3 image cards horizontales)
 *
 * El efecto shimmer se implementa con react-native-reanimated:
 * una animación de opacidad cíclica 0.4 → 1 → 0.4 sobre cada bloque.
 */

import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useColors } from '@/hooks/use-colors';
import { ScreenContainer } from '@/components/screen-container';

// ─── Shimmer atom ─────────────────────────────────────────────────────────────

interface ShimmerBoxProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
  shimmerValue: Animated.SharedValue<number>;
}

function ShimmerBox({ width, height, borderRadius = 8, style, shimmerValue }: ShimmerBoxProps) {
  const colors = useColors();
  const animStyle = useAnimatedStyle(() => ({ opacity: shimmerValue.value }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.border,
        },
        animStyle,
        style,
      ]}
    />
  );
}

// ─── Main skeleton ─────────────────────────────────────────────────────────────

export function HomeSkeleton() {
  const colors = useColors();

  // Single shared shimmer value — all boxes pulse in sync
  const shimmer = useSharedValue(0.35);

  useEffect(() => {
    shimmer.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 750, easing: Easing.inOut(Easing.sine) }),
        withTiming(0.35, { duration: 750, easing: Easing.inOut(Easing.sine) }),
      ),
      -1, // infinite
      false,
    );
  }, []);

  const B = (props: Omit<ShimmerBoxProps, 'shimmerValue'>) => (
    <ShimmerBox {...props} shimmerValue={shimmer} />
  );

  return (
    <ScreenContainer className="p-0">
      <View style={[SK.root, { backgroundColor: colors.background }]}>

        {/* ── Header ── */}
        <View style={SK.header}>
          <View style={SK.headerTop}>
            <View style={SK.flex1}>
              {/* Workspace label */}
              <B width={80} height={12} borderRadius={6} style={SK.mb6} />
              {/* Workspace name */}
              <B width={180} height={22} borderRadius={8} style={SK.mb12} />
              {/* Avatars row */}
              <View style={SK.teamRow}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <B
                    key={i}
                    width={32}
                    height={32}
                    borderRadius={16}
                    style={{ marginLeft: i > 0 ? -8 : 0 }}
                  />
                ))}
                {/* +N bubble */}
                <B width={32} height={32} borderRadius={16} style={SK.ml_8} />
                {/* Invite button */}
                <B width={72} height={30} borderRadius={8} style={SK.ml12} />
              </View>
            </View>
            {/* Settings button */}
            <B width={40} height={40} borderRadius={20} style={SK.ml12} />
          </View>

          {/* Search bar */}
          <B width="100%" height={44} borderRadius={12} />
        </View>

        {/* ── Content ── */}
        <ScrollView
          contentContainerStyle={SK.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        >

          {/* ── "Hoy" section — 2×2 status grid ── */}
          <View style={SK.section}>
            {/* Section title */}
            <View style={SK.sectionTitleWrapper}>
              <B width={60} height={18} borderRadius={6} />
            </View>
            <View style={SK.statusGrid}>
              {[0, 1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={[
                    SK.statusCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  {/* Label + icon row */}
                  <View style={SK.statusCardTop}>
                    <B width={70} height={14} borderRadius={6} />
                    <B width={24} height={24} borderRadius={12} />
                  </View>
                  {/* Count */}
                  <B width={40} height={28} borderRadius={8} />
                </View>
              ))}
            </View>
          </View>

          {/* ── Recent Projects section ── */}
          <View style={SK.section}>
            <View style={SK.sectionHeader}>
              <B width={140} height={18} borderRadius={6} />
              <B width={50} height={14} borderRadius={6} />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={SK.horizontalListContent}
              scrollEnabled={false}
            >
              {[0, 1].map((i) => (
                <View
                  key={i}
                  style={[
                    SK.projectCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  {/* Header row: name + badge */}
                  <View style={SK.projectCardHeader}>
                    <View style={SK.flex1}>
                      <B width={160} height={16} borderRadius={6} style={SK.mb6} />
                      <B width={100} height={12} borderRadius={5} />
                    </View>
                    <B width={64} height={24} borderRadius={999} style={SK.ml12} />
                  </View>
                  {/* Progress label row */}
                  <View style={SK.progressLabelRow}>
                    <B width={50} height={11} borderRadius={5} />
                    <B width={30} height={11} borderRadius={5} />
                  </View>
                  {/* Progress track */}
                  <View style={[SK.progressTrack, { backgroundColor: colors.border }]}>
                    <B width="60%" height={8} borderRadius={4} />
                  </View>
                  {/* Meta row */}
                  <View style={SK.metaRow}>
                    <B width={80} height={12} borderRadius={5} />
                    <B width={80} height={12} borderRadius={5} />
                  </View>
                  {/* Footer: avatars + date */}
                  <View style={SK.projectCardFooter}>
                    <View style={SK.avatarRow}>
                      {[0, 1, 2].map((j) => (
                        <B
                          key={j}
                          width={24}
                          height={24}
                          borderRadius={12}
                          style={{ marginLeft: j > 0 ? -6 : 0 }}
                        />
                      ))}
                    </View>
                    <B width={50} height={11} borderRadius={5} />
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* ── Recent Locations section ── */}
          <View style={SK.section}>
            <View style={SK.sectionHeader}>
              <B width={160} height={18} borderRadius={6} />
              <B width={50} height={14} borderRadius={6} />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={SK.horizontalListContent}
              scrollEnabled={false}
            >
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  style={[
                    SK.locationCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  {/* Icon + name */}
                  <View style={SK.locationCardHeader}>
                    <B width={40} height={40} borderRadius={20} />
                    <View style={SK.flex1Ml12}>
                      <B width={100} height={14} borderRadius={6} style={SK.mb6} />
                      <B width={70} height={11} borderRadius={5} />
                    </View>
                  </View>
                  {/* Projects count */}
                  <B width={90} height={11} borderRadius={5} style={SK.mt8} />
                </View>
              ))}
            </ScrollView>
          </View>

          {/* ── Recent Images section ── */}
          <View style={SK.section}>
            <View style={SK.sectionHeader}>
              <B width={140} height={18} borderRadius={6} />
              <B width={50} height={14} borderRadius={6} />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={SK.horizontalListContent}
              scrollEnabled={false}
            >
              {[0, 1, 2, 3].map((i) => (
                <B
                  key={i}
                  width={140}
                  height={140}
                  borderRadius={12}
                  style={{ marginRight: 12 }}
                />
              ))}
            </ScrollView>
          </View>

        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const SK = StyleSheet.create({
  root:               { flex: 1 },
  flex1:              { flex: 1 },
  flex1Ml12:          { flex: 1, marginLeft: 12 },

  // Spacing helpers
  mb6:                { marginBottom: 6 },
  mb12:               { marginBottom: 12 },
  ml12:               { marginLeft: 12 },
  ml_8:               { marginLeft: -8 },
  mt8:                { marginTop: 8 },

  // Header
  header:             { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  headerTop:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  teamRow:            { flexDirection: 'row', alignItems: 'center' },

  // Scroll
  scrollContent:      { paddingBottom: 120 },

  // Sections
  section:            { marginTop: 24 },
  sectionTitleWrapper:{ paddingHorizontal: 16, marginBottom: 12 },
  sectionHeader:      { paddingHorizontal: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  horizontalListContent: { paddingHorizontal: 16, paddingVertical: 14 },

  // Status grid — mirrors S.statusGrid / S.statusCard
  statusGrid:         { paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statusCard:         { width: '48%', aspectRatio: 1.5, borderRadius: 16, padding: 16, justifyContent: 'space-between', borderWidth: 1 },
  statusCardTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },

  // Project card — mirrors S.projectCard (width: 300)
  projectCard:        { width: 300, borderRadius: 16, padding: 16, marginRight: 16, borderWidth: 1 },
  projectCardHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  progressLabelRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressTrack:      { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  metaRow:            { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  projectCardFooter:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  avatarRow:          { flexDirection: 'row' },

  // Location card — mirrors S.locationCard (width: 200)
  locationCard:       { width: 200, borderRadius: 16, padding: 16, marginRight: 16, borderWidth: 1 },
  locationCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
});
