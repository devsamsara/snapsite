/**
 * components/ui/app-header.tsx
 *
 * Cabecera compartida para las pantallas "hub" (Home, Proyectos, Ajustes):
 * misma estructura exacta que app/(tabs)/index.tsx — la referencia de diseño
 * "Immersive & Modern":
 *
 *   - Vive en el flujo normal (NO absoluto/flotante, NO blur-on-scroll).
 *   - `HeroBackdrop` como velo de gradiente decorativo, position:absolute
 *     dentro de un contenedor `position:relative` (el propio header), detrás
 *     del título.
 *   - `insets.top` se aplica *dentro* del header (paddingTop interno) — la
 *     pantalla que lo usa es `edgeToEdge` (sin SafeAreaView propia), así que
 *     el header es quien evita que el título quede bajo el notch/Dynamic
 *     Island, igual que en Home.
 *
 * No es para pantallas push con botón atrás (usa ScreenHeader para eso).
 *
 * Uso:
 *   <ScreenContainer edgeToEdge className="p-0">
 *     <ScrollView>
 *       <AppHeader eyebrow="TU EMPRESA" title="Proyectos" right={<Btn/>}>
 *         <SearchInput ... />
 *       </AppHeader>
 *       {...resto del contenido...}
 *     </ScrollView>
 *   </ScreenContainer>
 */

import React from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HeroBackdrop } from "./hero-backdrop";
import { useColors } from "@/hooks/use-colors";

export interface AppHeaderProps {
  /** Etiqueta pequeña en mayúsculas sobre el título (ej. nombre del workspace). */
  eyebrow?: string;
  title: string;
  /** Acción alineada a la derecha del título (botón, avatares, etc.). */
  right?: React.ReactNode;
  /** Contenido adicional bajo el título (buscador, filtros) — hereda el backdrop. */
  children?: React.ReactNode;
  /** Alto del velo de gradiente decorativo (sin contar insets.top). Default 200. */
  backdropHeight?: number;
  style?: StyleProp<ViewStyle>;
}

export function AppHeader({
  eyebrow,
  title,
  right,
  children,
  backdropHeight = 200,
  style,
}: AppHeaderProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[S.container, { paddingTop: insets.top + 20 }, style]}>
      {/* Velo de gradiente decorativo tras el hero — cubre también el inset
          superior porque el contenedor de la pantalla es edge-to-edge. */}
      <HeroBackdrop height={backdropHeight + insets.top} />

      <View style={S.titleRow}>
        <View style={S.flex1}>
          {eyebrow ? (
            <Text style={[S.eyebrow, { color: colors.muted }]} numberOfLines={1}>
              {eyebrow.toUpperCase()}
            </Text>
          ) : null}
          <Text style={[S.title, { color: colors.foreground }]} numberOfLines={1}>
            {title}
          </Text>
        </View>
        {right ? <View style={S.right}>{right}</View> : null}
      </View>

      {children}
    </View>
  );
}

const S = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingBottom: 16 },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  flex1: { flex: 1 },
  right: { marginLeft: 12 },
  eyebrow: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
});
