/**
 * components/ui/pressable-scale.tsx
 *
 * Pressable con feedback táctil moderno: escala 0.97 con física de spring
 * al presionar y haptic opcional. Sustituye a TouchableOpacity en cards y
 * botones prominentes para dar sensación de profundidad ("no plano").
 *
 * El transform no altera el layout circundante (sin jitter) y la animación
 * es interrumpible (spring), siguiendo las HIG de fluidez.
 *
 * Uso:
 *   <PressableScale onPress={...} haptic style={S.card}>...</PressableScale>
 */

import React from "react";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING = { damping: 20, stiffness: 350, mass: 0.6 };

export interface PressableScaleProps extends Omit<PressableProps, "style"> {
  /** Escala al presionar (default 0.97; usar 0.95 en elementos pequeños). */
  pressedScale?: number;
  /** Dispara un haptic ligero al presionar. */
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function PressableScale({
  pressedScale = 0.97,
  haptic = false,
  onPress,
  onPressIn,
  onPressOut,
  style,
  children,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[animStyle, style]}
      onPressIn={(e) => {
        scale.value = withSpring(pressedScale, SPRING);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, SPRING);
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
        onPress?.(e);
      }}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
