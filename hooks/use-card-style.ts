/**
 * hooks/use-card-style.ts
 *
 * Devuelve un objeto de estilo React Native para cards según el modo activo:
 *   - "flat"     → solo borde, sin sombra (diseño plano actual)
 *   - "elevated" → sombra multicapa que simula elevación y volumen
 *
 * Uso:
 *   const cardElevation = useCardStyle();
 *   <View style={[styles.card, cardElevation]} />
 *
 * En modo "elevated" se aplican dos capas de sombra en iOS (umbra + penumbra)
 * y elevation en Android para el efecto Material Design equivalente.
 */

import { Platform } from "react-native";
import { useThemeContext } from "@/lib/theme-provider";
import { useColors } from "@/hooks/use-colors";

export function useCardStyle() {
  const { cardStyle } = useThemeContext();
  const colors = useColors();
  const isDark = colors.background === "#0F172A"; // dark scheme

  if (cardStyle === "flat") {
    // Diseño plano: solo borde, sin sombra
    return {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    };
  }

  // Diseño elevado: sombra + borde sutil del mismo tono que la sombra
  // El borde delimita el card sin ser obvio (mismo color que la sombra, bajo alpha)
  const shadowColor = isDark ? "#000000" : "#1E293B";
  const borderColor = isDark ? "rgba(0,0,0,0.32)" : "rgba(30,41,59,0.11)";

  if (Platform.OS === "ios") {
    return {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor,
      shadowColor,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDark ? 0.35 : 0.09,
      shadowRadius: 8,
    };
  }

  // Android: elevation + borde sutil
  return {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor,
    elevation: isDark ? 3 : 5,
  };
}

/**
 * Variante de menor elevación para cards secundarios (chips, badges, etc.)
 */
export function useCardStyleSm() {
  const { cardStyle } = useThemeContext();
  const colors = useColors();
  const isDark = colors.background === "#0F172A";

  if (cardStyle === "flat") {
    return {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    };
  }

  const shadowColorSm = isDark ? "#000000" : "#1E293B";
  const borderColorSm = isDark ? "rgba(0,0,0,0.28)" : "rgba(30,41,59,0.09)";

  if (Platform.OS === "ios") {
    return {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: borderColorSm,
      shadowColor: shadowColorSm,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.30 : 0.07,
      shadowRadius: 6,
    };
  }

  return {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: borderColorSm,
    elevation: isDark ? 2 : 3,
  };
}
