/**
 * components/ui/button.tsx
 *
 * Componente Button adaptado al sistema de temas de snapsite.
 * Basado en el Button de referencia del usuario, integrado con useColors()
 * en lugar de useTheme() externo.
 *
 * Variantes:
 *   - primary   → fondo colors.primary, texto blanco
 *   - secondary → borde colors.primary, texto colors.primary, fondo transparente
 *   - ghost     → sin borde ni fondo, texto colors.primary (para acciones sutiles)
 *   - danger    → fondo colors.error, texto blanco
 *   - link      → solo texto, sin contenedor
 *
 * Tamaños:
 *   - sm  → altura 40, texto 14
 *   - md  → altura 50, texto 15  (default)
 *   - lg  → altura 56, texto 16
 */

import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "link";
export type ButtonSize    = "sm" | "md" | "lg";

export interface ButtonProps {
  /** Texto del botón o nodo React personalizado */
  title: string | React.ReactNode;
  /** Acción al presionar */
  onPress: () => void | Promise<void>;
  /** Variante visual */
  variant?: ButtonVariant;
  /** Tamaño del botón */
  size?: ButtonSize;
  /** Icono de MaterialIcons a la izquierda del texto */
  leftIcon?: React.ComponentProps<typeof MaterialIcons>["name"];
  /** Icono de MaterialIcons a la derecha del texto */
  rightIcon?: React.ComponentProps<typeof MaterialIcons>["name"];
  /** Muestra spinner y deshabilita interacción */
  isLoading?: boolean;
  /** Deshabilita el botón sin spinner */
  disabled?: boolean;
  /** Estilos adicionales para el contenedor */
  style?: StyleProp<ViewStyle>;
  /** Estilos adicionales para el texto */
  textStyle?: StyleProp<TextStyle>;
  /** Ocupa todo el ancho disponible (default: true para non-link) */
  fullWidth?: boolean;
}

// ─── Size tokens ──────────────────────────────────────────────────────────────

const SIZE: Record<ButtonSize, { height: number; fontSize: number; iconSize: number; paddingH: number; borderRadius: number }> = {
  sm: { height: 40, fontSize: 14, iconSize: 16, paddingH: 16, borderRadius: 10 },
  md: { height: 50, fontSize: 15, iconSize: 18, paddingH: 20, borderRadius: 12 },
  lg: { height: 56, fontSize: 16, iconSize: 20, paddingH: 24, borderRadius: 14 },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Button({
  title,
  onPress,
  variant   = "primary",
  size      = "md",
  leftIcon,
  rightIcon,
  isLoading = false,
  disabled  = false,
  style,
  textStyle,
  fullWidth = true,
}: ButtonProps) {
  const colors = useColors();
  const sz     = SIZE[size];
  const isLink = variant === "link";
  const isDisabled = disabled || isLoading;

  // ── Derived colors ──────────────────────────────────────────────────────────
  const bgColor = (): string => {
    if (isDisabled && !isLink) return colors.border;
    switch (variant) {
      case "primary":   return colors.primary;
      case "secondary": return "transparent";
      case "ghost":     return "transparent";
      case "danger":    return colors.error;
      case "link":      return "transparent";
    }
  };

  const textColor = (): string => {
    if (isDisabled) return colors.muted;
    switch (variant) {
      case "primary":   return "#FFFFFF";
      case "secondary": return colors.primary;
      case "ghost":     return colors.primary;
      case "danger":    return "#FFFFFF";
      case "link":      return colors.primary;
    }
  };

  const borderColor = variant === "secondary" ? colors.primary : "transparent";
  const iconColor   = textColor();

  // ── Content ─────────────────────────────────────────────────────────────────
  const renderContent = (pressed: boolean) => {
    if (isLoading) {
      return (
        <ActivityIndicator
          size="small"
          color={variant === "primary" || variant === "danger" ? "#FFF" : colors.primary}
        />
      );
    }

    return (
      <>
        {leftIcon && (
          <MaterialIcons name={leftIcon} size={sz.iconSize} color={iconColor} style={S.iconLeft} />
        )}
        {typeof title === "string" ? (
          <Text
            style={[
              S.text,
              { fontSize: sz.fontSize, color: textColor() },
              isLink && S.linkText,
              textStyle,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
        ) : (
          title
        )}
        {rightIcon && (
          <MaterialIcons name={rightIcon} size={sz.iconSize} color={iconColor} style={S.iconRight} />
        )}
      </>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  if (isLink) {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => [S.link, pressed && S.pressed, style]}
      >
        {({ pressed }) => renderContent(pressed)}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        S.base,
        {
          height:           sz.height,
          borderRadius:     sz.borderRadius,
          paddingHorizontal: sz.paddingH,
          backgroundColor:  bgColor(),
          borderWidth:      variant === "secondary" ? 1.5 : 0,
          borderColor,
          width:            fullWidth ? "100%" : undefined,
          alignSelf:        fullWidth ? "stretch" : "flex-start",
        },
        pressed && !isDisabled && S.pressed,
        isDisabled && S.disabled,
        style,
      ]}
    >
      {({ pressed }) => renderContent(pressed)}
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  base: {
    flexDirection:  "row",
    justifyContent: "center",
    alignItems:     "center",
    overflow:       "hidden",
  },
  link: {
    flexDirection:  "row",
    alignItems:     "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  text: {
    fontWeight: "600",
    textAlign:  "center",
  },
  linkText: {
    fontWeight: "500",
    textDecorationLine: "none",
  },
  iconLeft:  { marginRight: 6 },
  iconRight: { marginLeft:  6 },
  pressed:   { opacity: 0.72 },
  disabled:  { opacity: 0.5 },
});
