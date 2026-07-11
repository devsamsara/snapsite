/**
 * components/ui/hero-backdrop.tsx
 *
 * Fondo decorativo para zonas hero: velo de gradiente del acento que se
 * desvanece hacia el fondo + un glow radial desplazado. Rompe la sensación
 * de "pantalla plana" sin añadir ruido ni coste (SVG estático).
 *
 * Presentacional puro; pointerEvents="none" para no interceptar toques.
 *
 * Uso (colocar como primer hijo de un contenedor position:relative):
 *   <HeroBackdrop height={240} />
 */

import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { useColors } from "@/hooks/use-colors";
import { useColorScheme } from "@/hooks/use-color-scheme";

export interface HeroBackdropProps {
  /** Alto del velo en px (default 260). */
  height?: number;
}

export function HeroBackdrop({ height = 260 }: Readonly<HeroBackdropProps>) {
  const colors = useColors();
  const isDark = useColorScheme() === 'dark';
  // En dark el glow puede ser más presente; en light debe ser un susurro.
  const veilOpacity = isDark ? 0.36 : 0.8;
  const glowOpacity = isDark ? 0.12 : 0.3;

  return (
    <View style={[S.container, { height }]} pointerEvents="none">
      <Svg width="100%" height={height}>
        <Defs>
          <LinearGradient id="heroVeil" x1="0" y1="0" x2="0" y2="1">
            <Stop
              offset="0"
              stopColor={colors.primary}
              stopOpacity={veilOpacity}
            />
            <Stop offset="1" stopColor={colors.primary} stopOpacity="0" />
          </LinearGradient>
          <RadialGradient id="heroGlow" cx="0.5" cy="0.5" r="0.5">
            <Stop
              offset="0"
              stopColor={colors.primary}
              stopOpacity={glowOpacity}
            />
            <Stop offset="1" stopColor={colors.primary} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height={height} fill="url(#heroVeil)" />
        {/* Glow desplazado hacia la esquina superior derecha */}
        <Circle cx="88%" cy="8%" r="140" fill="url(#heroGlow)" />
      </Svg>
    </View>
  );
}

const S = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    bottom: undefined,
    overflow: "hidden",
  },
});
