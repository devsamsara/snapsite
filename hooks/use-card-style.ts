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

  // Diseño elevado: sombra multicapa
  if (Platform.OS === "ios") {
    return {
      backgroundColor: colors.surface,
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? colors.border : "transparent",
      // Sombra principal (umbra)
      shadowColor: isDark ? "#000" : "#1E293B",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.45 : 0.10,
      shadowRadius: 12,
    };
  }

  // Android: elevation + borde sutil
  return {
    backgroundColor: colors.surface,
    borderWidth: isDark ? 1 : 0,
    borderColor: isDark ? colors.border : "transparent",
    elevation: isDark ? 4 : 6,
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

  if (Platform.OS === "ios") {
    return {
      backgroundColor: colors.surface,
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? colors.border : "transparent",
      shadowColor: isDark ? "#000" : "#1E293B",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.35 : 0.07,
      shadowRadius: 6,
    };
  }

  return {
    backgroundColor: colors.surface,
    borderWidth: isDark ? 1 : 0,
    borderColor: isDark ? colors.border : "transparent",
    elevation: isDark ? 2 : 3,
  };
}
