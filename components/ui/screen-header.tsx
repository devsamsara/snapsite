/**
 * components/ui/screen-header.tsx
 *
 * Cabecera unificada para pantallas push (no modales, que usan ModalHeader).
 * Sustituye a los headers hechos a mano en cada pantalla, garantizando el
 * mismo alto, espaciado, tamaño de toque (44pt) y jerarquía en toda la app.
 *
 *   ┌──────────────────────────────────────┐
 *   │ [←]        Título            [right] │  ← 44pt de alto útil
 *   └──────────────────────────────────────┘
 *
 * Componente presentacional puro: recibe callbacks, no navega por sí mismo.
 *
 * Uso:
 *   <ScreenHeader title={t('...')} onBack={router.back} />
 *   <ScreenHeader title="Perfil" onBack={router.back} right={<Btn/>} />
 */

import React from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconSymbol } from "./icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { spacing } from "@/constants/spacing";
import { type } from "@/constants/typography";

export interface ScreenHeaderProps {
  title: string;
  /** Callback del botón de retroceso. Si se omite, no se muestra el botón. */
  onBack?: () => void;
  /** Nodo opcional alineado a la derecha (acción contextual). */
  right?: React.ReactNode;
  /** Muestra el borde inferior hairline (default: true). */
  bordered?: boolean;
  /** Aplica el inset superior de safe area (default: true). */
  withSafeArea?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ScreenHeader({
  title,
  onBack,
  right,
  bordered = true,
  withSafeArea = true,
  style,
}: ScreenHeaderProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        S.container,
        {
          paddingTop: (withSafeArea ? insets.top : 0) + spacing.md,
          borderBottomColor: bordered ? colors.border : "transparent",
        },
        style,
      ]}
    >
      {onBack ? (
        <TouchableOpacity
          onPress={onBack}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[
            S.backBtn,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <IconSymbol name="chevron.left" size={20} color={colors.foreground} />
        </TouchableOpacity>
      ) : (
        <View style={S.sideSpacer} />
      )}

      <Text
        style={[S.title, { color: colors.foreground }]}
        numberOfLines={1}
        accessibilityRole="header"
      >
        {title}
      </Text>

      {right ? <View style={S.right}>{right}</View> : <View style={S.sideSpacer} />}
    </View>
  );
}

const S = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  // Mantiene el título centrado cuando falta el botón o la acción derecha
  sideSpacer: { width: 40, height: 40 },
  right: {
    minWidth: 40,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  title: {
    ...type.headline,
    fontSize: 18,
    flex: 1,
    textAlign: "center",
  },
});
