/**
 * ProjectsListSkeleton
 * Replica la estructura de app/(tabs)/projects.tsx:
 *   Header (título + botón +) → SearchBar → Filter chips (3) → Lista de project cards (N)
 * Cada project card replica: nombre + ubicación + badge estado + barra progreso + fotos + fecha.
 */
import { View, StyleSheet } from "react-native";
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

// ─── Bloque base ──────────────────────────────────────────────────────────────

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

// ─── Tarjeta de proyecto skeleton ────────────────────────────────────────────

function ProjectCardSkeleton() {
  const colors        = useColors();
  const cardElevation = useCardStyle();

  const D = useMemo(() => ({
    card: { borderRadius: 16, padding: 16, marginBottom: 12 },
  }), []);

  return (
    <View style={[D.card, cardElevation]}>
      {/* Fila 1: nombre + badge estado */}
      <View style={S.row}>
        <View style={S.flex1}>
          <B w="75%" h={14} r={7} />
          <B w="50%" h={10} r={5} style={S.mt6} />
        </View>
        <B w={72} h={24} r={12} />
      </View>

      {/* Fila 2: label progreso + % */}
      <View style={[S.row, S.mt12]}>
        <B w={70}  h={10} r={5} />
        <B w={30}  h={10} r={5} />
      </View>

      {/* Barra de progreso */}
      <B w="100%" h={8} r={4} style={S.mt6} />

      {/* Fila 3: fotos + fecha */}
      <View style={[S.row, S.mt12]}>
        <B w={90} h={10} r={5} />
        <B w={60} h={10} r={5} />
      </View>
    </View>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface Props {
  /** Número de tarjetas skeleton a mostrar. Por defecto 4. */
  count?: number;
}

export function ProjectsListSkeleton({ count = 4 }: Props) {
  const colors = useColors();

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
    container:   { flex: 1, backgroundColor: colors.background },
    header:      { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
    list:        { paddingHorizontal: 16, paddingTop: 16 },
  }), [colors]);

  return (
    <Animated.View style={[D.container, shimmer]}>

      {/* ── Header ── */}
      <View style={D.header}>
        {/* Título + botón + */}
        <View style={S.headerRow}>
          <B w={140} h={28} r={8} />
          <B w={36}  h={36} r={18} />
        </View>

        {/* Search bar */}
        <B w="100%" h={44} r={12} style={S.mt12} />

        {/* Filter chips */}
        <View style={S.chipsRow}>
          {[70, 80, 100].map((w, i) => (
            <B key={i} w={w} h={32} r={16} style={S.chipGap} />
          ))}
        </View>
      </View>

      {/* ── Lista de cards ── */}
      <View style={D.list}>
        {Array.from({ length: count }).map((_, i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </View>

    </Animated.View>
  );
}

const S = StyleSheet.create({
  flex1:      { flex: 1 },
  row:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  chipsRow:   { flexDirection: "row", marginTop: 12 },
  chipGap:    { marginRight: 8 },
  mt6:        { marginTop: 6 },
  mt12:       { marginTop: 12 },
});
