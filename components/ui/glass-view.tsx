/**
 * components/ui/glass-view.tsx
 *
 * Superficie glassmorphism reutilizable: BlurView + velo translúcido del tema
 * (tokens `glass` / `glassBorder` de la paleta) + borde sutil.
 *
 * Componente presentacional puro (dumb): no conoce datos ni navegación.
 * Pensado para tarjetas flotantes, menús y overlays que se superponen a
 * contenido real (el blur solo aporta cuando hay algo detrás).
 *
 * Uso:
 *   <GlassView style={{ borderRadius: 20 }}>
 *     {...contenido...}
 *   </GlassView>
 */

import React from "react";
import { Platform, StyleSheet, View, type ViewProps } from "react-native";
import { BlurView } from "expo-blur";
import { useColors } from "@/hooks/use-colors";
import { useColorScheme } from "@/hooks/use-color-scheme";

export interface GlassViewProps extends ViewProps {
  /** Intensidad del blur (0-100). Default: 50. */
  intensity?: number;
  /**
   * Variante visual. "auto" sigue el tema del sistema; "light"/"dark" la
   * fijan (útil en pantallas siempre oscuras como el lightbox de fotos).
   * Default: "auto".
   */
  appearance?: "auto" | "light" | "dark";
  children?: React.ReactNode;
}

export function GlassView({
  intensity = 50,
  appearance = "auto",
  style,
  children,
  ...props
}: GlassViewProps) {
  const scheme = useColorScheme();
  const isDark =
    appearance === "auto" ? scheme === "dark" : appearance === "dark";
  const colors = useColors(isDark ? "dark" : "light");

  // En Android el blur nativo es costoso/inconsistente; el velo translúcido
  // algo más opaco mantiene la legibilidad sin depender del blur.
  const androidFallbackBg = isDark
    ? "rgba(21,21,28,0.92)"
    : "rgba(255,255,255,0.94)";

  return (
    <View
      style={[S.container, { borderColor: colors.glassBorder }, style]}
      {...props}
    >
      {Platform.OS === "ios" ? (
        <BlurView
          intensity={intensity}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor:
              Platform.OS === "ios" ? colors.glass : androidFallbackBg,
          },
        ]}
      />
      <View style={S.content}>{children}</View>
    </View>
  );
}

const S = StyleSheet.create({
  container: {
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
  },
  content: {
    // El contenido va por encima del blur y del velo.
    position: "relative",
  },
});
