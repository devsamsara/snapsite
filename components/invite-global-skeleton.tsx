/**
 * components/invite-global-skeleton.tsx
 *
 * Skeleton de carga para InviteGlobalModal.
 * Replica la estructura visual del modal:
 *   ModalHeader (título + subtítulo + botón cerrar)
 *   → Label "PROYECTO" + SearchInput placeholder
 *   → Lista de proyectos (4 filas con dot + nombre + barra progreso)
 *   → Label "DATOS DEL INVITADO" + 2 inputs
 *   → Label "ROL" + 6 chips
 *   ModalFooter (2 botones)
 *
 * Animación shimmer idéntica a HomeSkeleton: Easing.sin (Reanimated 4.x).
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
  type SharedValue,
} from 'react-native-reanimated';
import { useColors } from '@/hooks/use-colors';

// ─── Átomo shimmer ─────────────────────────────────────────────────────────────

interface ShimmerBoxProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
  sv: SharedValue<number>;
}

function ShimmerBox({ width, height, borderRadius = 8, style, sv }: ShimmerBoxProps) {
  const colors = useColors();
  const animStyle = useAnimatedStyle(() => ({ opacity: sv.value }));

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

// ─── Skeleton principal ────────────────────────────────────────────────────────

export function InviteGlobalSkeleton() {
  const colors = useColors();

  const shimmer = useSharedValue(0.35);

  useEffect(() => {
    shimmer.value = withRepeat(
      withSequence(
        withTiming(1,    { duration: 750, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.35, { duration: 750, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, []);

  // Alias corto para no repetir sv={shimmer} en cada caja
  const B = (props: Omit<ShimmerBoxProps, 'sv'>) => (
    <ShimmerBox {...props} sv={shimmer} />
  );

  return (
    <View style={[SK.root, { backgroundColor: colors.background }]}>

      {/* ── ModalHeader skeleton ── */}
      <View style={SK.header}>
        <View style={SK.headerContent}>
          {/* Título */}
          <B width={180} height={20} borderRadius={8} style={SK.mb6} />
          {/* Subtítulo */}
          <B width={240} height={14} borderRadius={6} />
        </View>
        {/* Botón cerrar */}
        <B width={32} height={32} borderRadius={16} />
      </View>

      {/* ── ModalBody skeleton ── */}
      <ScrollView
        contentContainerStyle={SK.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      >
        {/* Label PROYECTO */}
        <B width={80} height={12} borderRadius={5} style={SK.labelSpacing} />

        {/* SearchInput placeholder */}
        <B width="100%" height={44} borderRadius={12} style={SK.mb16} />

        {/* Lista de proyectos — 4 filas */}
        <View style={[SK.projectList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {[0, 1, 2, 3].map((i) => {
            const isLast = i === 3;
            return (
              <View
                key={i}
                style={[
                  SK.projectRow,
                  !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                ]}
              >
                {/* Dot de color */}
                <B width={10} height={10} borderRadius={5} />
                {/* Nombre + ubicación */}
                <View style={SK.projectInfo}>
                  <B width={140} height={14} borderRadius={6} style={SK.mb4} />
                  <B width={90} height={11} borderRadius={5} />
                </View>
                {/* Barra de progreso + % */}
                <View style={SK.progressWrap}>
                  <B width={56} height={4} borderRadius={2} style={SK.mb4} />
                  <B width={28} height={11} borderRadius={5} />
                </View>
              </View>
            );
          })}
        </View>

        {/* Label DATOS DEL INVITADO */}
        <B width={140} height={12} borderRadius={5} style={SK.sectionLabel} />

        {/* Input nombre */}
        <View style={[SK.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <B width={20} height={20} borderRadius={10} style={SK.inputIcon} />
          <View style={SK.flex1}>
            <B width={60} height={11} borderRadius={5} style={SK.mb6} />
            <B width="80%" height={16} borderRadius={6} />
          </View>
        </View>

        {/* Input email */}
        <View style={[SK.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <B width={20} height={20} borderRadius={10} style={SK.inputIcon} />
          <View style={SK.flex1}>
            <B width={50} height={11} borderRadius={5} style={SK.mb6} />
            <B width="70%" height={16} borderRadius={6} />
          </View>
        </View>

        {/* Label ROL */}
        <B width={40} height={12} borderRadius={5} style={SK.sectionLabel} />

        {/* 6 chips de rol */}
        <View style={SK.roles}>
          {[100, 90, 70, 60, 80, 75].map((w, i) => (
            <B key={i} width={w} height={36} borderRadius={20} />
          ))}
        </View>
      </ScrollView>

      {/* ── ModalFooter skeleton ── */}
      <View style={[SK.footer, { borderTopColor: colors.border }]}>
        <B width="47%" height={44} borderRadius={12} />
        <B width="47%" height={44} borderRadius={12} />
      </View>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const SK = StyleSheet.create({
  root:          { flex: 1 },
  flex1:         { flex: 1 },

  // Header
  header:        { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  headerContent: { flex: 1, marginRight: 12 },

  // Scroll
  scrollContent: { paddingHorizontal: 20, paddingBottom: 24 },

  // Spacing helpers
  mb4:           { marginBottom: 4 },
  mb6:           { marginBottom: 6 },
  mb16:          { marginBottom: 16 },
  labelSpacing:  { marginBottom: 10 },
  sectionLabel:  { marginTop: 24, marginBottom: 10 },

  // Lista proyectos
  projectList:   { borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 4 },
  projectRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, gap: 12 },
  projectInfo:   { flex: 1 },
  progressWrap:  { alignItems: 'flex-end', gap: 3 },

  // Inputs
  inputWrap:     { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12, gap: 10 },
  inputIcon:     { marginRight: 2 },

  // Roles
  roles:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },

  // Footer
  footer:        { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: StyleSheet.hairlineWidth },
});
