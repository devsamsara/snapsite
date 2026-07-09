/**
 * components/ui/hero-header.tsx
 *
 * Cabecera "héroe" centrada para formularios y pantallas de flujo
 * (auth, cambio de contraseña, estados de éxito). Unifica el patrón
 * icono-en-círculo + título + subtítulo que antes se repetía a mano.
 *
 * Componente presentacional puro con animación de entrada (FadeInDown).
 *
 * Uso:
 *   <HeroHeader icon="lock.rotation" title="..." subtitle="..." />
 *   <HeroHeader icon="checkmark.circle.fill" tint={colors.success} ... />
 *   <HeroHeader image={require('.../icon.png')} title="SnapSite" ... />
 */

import React from "react";
import { Image, ImageSourcePropType, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { IconSymbol } from "./icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { spacing } from "@/constants/spacing";
import { type } from "@/constants/typography";

export interface HeroHeaderProps {
  /** SF Symbol a mostrar dentro del círculo. */
  icon?: string;
  /** Imagen (p. ej. logo) en lugar de icono. */
  image?: ImageSourcePropType;
  /** Color de acento del icono y su fondo (default: colors.primary). */
  tint?: string;
  /** Opcional cuando la pantalla ya muestra el título en su barra superior. */
  title?: string;
  subtitle?: string;
  /** Desactiva la animación de entrada (default: animado). */
  animated?: boolean;
}

export function HeroHeader({
  icon,
  image,
  tint,
  title,
  subtitle,
  animated = true,
}: HeroHeaderProps) {
  const colors = useColors();
  const accent = tint ?? colors.primary;

  const content = (
    <>
      {image ? (
        <View style={[S.iconCircle, { backgroundColor: colors.surface }]}>
          <Image source={image} style={S.image} resizeMode="contain" />
        </View>
      ) : icon ? (
        <View style={[S.iconCircle, { backgroundColor: accent + "18" }]}>
          <IconSymbol name={icon as any} size={44} color={accent} />
        </View>
      ) : null}
      {title ? (
        <Text style={[S.title, { color: colors.foreground }]}>{title}</Text>
      ) : null}
      {subtitle ? (
        <Text style={[S.subtitle, { color: colors.muted }]}>{subtitle}</Text>
      ) : null}
    </>
  );

  if (!animated) {
    return <View style={S.container}>{content}</View>;
  }

  return (
    <Animated.View
      style={S.container}
      entering={FadeInDown.duration(450).springify().damping(18)}
    >
      {content}
    </Animated.View>
  );
}

const S = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.base,
    overflow: "hidden",
  },
  image: {
    width: 80,
    height: 80,
  },
  title: {
    ...type.title1,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    ...type.subhead,
    lineHeight: 22,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
});
