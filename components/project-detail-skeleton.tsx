/**
 * ProjectDetailSkeleton
 * Replica pixel-perfect la estructura de app/project/[id].tsx:
 *   Header → HeroCard (imagen + barra de progreso + fechas) → TabBar (4 tabs) → Gallery grid
 * Usa una animación shimmer compartida (Easing.sin) igual que el resto de skeletons del proyecto.
 */
import { View, StyleSheet, Dimensions } from "react-native";
import { useMemo } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useColors } from "@/hooks/use-colors";
import { useCardStyle } from "@/hooks/use-card-style";

const { width: W } = Dimensions.get("window");
const PHOTO_W = (W - 40) / 2;   // igual que el grid de la galería

// ─── Bloque base animado ──────────────────────────────────────────────────────

function B({ w, h, r = 8, style }: { w: number | string; h: number; r?: number; style?: object }) {
  const colors = useColors();
  return (
    <View
      style={[
        { width: w as any, height: h, borderRadius: r, backgroundColor: colors.border },
        style,
      ]}
    />
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function ProjectDetailSkeleton() {
  const colors       = useColors();
  const cardElevation = useCardStyle();

  // Shimmer compartido
  const opacity = useSharedValue(0.4);
  opacity.value = withRepeat(
    withSequence(
      withTiming(1,   { duration: 750, easing: Easing.inOut(Easing.sin) }),
      withTiming(0.4, { duration: 750, easing: Easing.inOut(Easing.sin) }),
    ),
    -1,
    false,
  );
  const shimmer = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const D = useMemo(() => ({
    container:    { flex: 1, backgroundColor: colors.background },
    header:       { flexDirection: "row" as const, alignItems: "center" as const, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    heroWrapper:  { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
    heroCard:     { borderRadius: 20, overflow: "hidden" as const, borderWidth: 1, borderColor: colors.border },
    heroImg:      { width: "100%" as const, height: 140, backgroundColor: colors.border },
    heroBody:     { padding: 14 },
    tabBar:       { flexDirection: "row" as const, borderBottomWidth: 1, borderBottomColor: colors.border, marginTop: 8 },
    tabItem:      { flex: 1, alignItems: "center" as const, paddingVertical: 12 },
    grid:         { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 8, paddingHorizontal: 16, paddingTop: 16 },
    gridItem:     { width: PHOTO_W, height: 150, borderRadius: 16, backgroundColor: colors.border },
    tagRow:       { flexDirection: "row" as const, gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
    countRow:     { flexDirection: "row" as const, justifyContent: "space-between" as const, alignItems: "center" as const, paddingHorizontal: 16, marginBottom: 12 },
  }), [colors]);

  return (
    <Animated.View style={[D.container, shimmer]}>

      {/* ── Header ── */}
      <View style={D.header}>
        {/* Botón volver */}
        <B w={36} h={36} r={18} />
        {/* Título + ubicación */}
        <View style={S.headerCenter}>
          <B w={160} h={14} r={7} />
          <B w={110} h={10} r={5} style={S.mt4} />
        </View>
        {/* Botones de acción */}
        <View style={S.headerActions}>
          <B w={36} h={36} r={18} />
          <B w={36} h={36} r={18} />
        </View>
      </View>

      {/* ── Hero card ── */}
      <View style={D.heroWrapper}>
        <View style={[D.heroCard, cardElevation]}>
          {/* Imagen */}
          <View style={D.heroImg} />
          {/* Body */}
          <View style={D.heroBody}>
            {/* Label progreso + % */}
            <View style={S.progressLabelRow}>
              <B w={120} h={12} r={6} />
              <B w={36}  h={12} r={6} />
            </View>
            {/* Barra de progreso */}
            <B w="100%" h={6} r={3} style={S.mt8} />
            {/* Fechas */}
            <View style={S.datesRow}>
              <B w={110} h={10} r={5} />
              <B w={110} h={10} r={5} />
            </View>
          </View>
        </View>
      </View>

      {/* ── Tab Bar (4 tabs) ── */}
      <View style={D.tabBar}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={D.tabItem}>
            <B w={20} h={20} r={4} />
            <B w={40} h={9}  r={4} style={S.mt4} />
          </View>
        ))}
      </View>

      {/* ── Gallery skeleton ── */}
      {/* Tag chips */}
      <View style={D.tagRow}>
        {[50, 70, 60, 55].map((w, i) => (
          <B key={i} w={w} h={28} r={14} />
        ))}
      </View>

      {/* Contador + botón añadir */}
      <View style={D.countRow}>
        <B w={80}  h={12} r={6} />
        <B w={100} h={30} r={15} />
      </View>

      {/* Grid de fotos (2 columnas × 3 filas) */}
      <View style={D.grid}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={D.gridItem} />
        ))}
      </View>

    </Animated.View>
  );
}

const S = StyleSheet.create({
  headerCenter:     { flex: 1, marginHorizontal: 12 },
  headerActions:    { flexDirection: "row", gap: 8 },
  progressLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  datesRow:         { flexDirection: "row", gap: 16, marginTop: 12 },
  mt4:              { marginTop: 4 },
  mt8:              { marginTop: 8 },
});
