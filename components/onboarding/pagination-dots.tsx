/**
 * PaginationDots
 *
 * Animated pill-shaped pagination indicator.
 * The active dot expands horizontally; inactive dots shrink to circles.
 * Uses react-native-reanimated for 60 fps spring animations.
 */
import React from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  interpolateColor,
  useDerivedValue,
} from "react-native-reanimated";
import { useColors } from "@/hooks/use-colors";

interface PaginationDotsProps {
  count: number;
  activeIndex: number;
}

const DOT_SIZE = 8;
const DOT_ACTIVE_WIDTH = 28;
const DOT_GAP = 6;

const SPRING_CONFIG = {
  damping: 18,
  stiffness: 200,
  mass: 0.6,
};

function Dot({ active, color, mutedColor }: { active: boolean; color: string; mutedColor: string }) {
  const progress = useDerivedValue(() =>
    withSpring(active ? 1 : 0, SPRING_CONFIG)
  );

  const animStyle = useAnimatedStyle(() => ({
    width: withSpring(active ? DOT_ACTIVE_WIDTH : DOT_SIZE, SPRING_CONFIG),
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [mutedColor, color]
    ),
    opacity: withSpring(active ? 1 : 0.35, SPRING_CONFIG),
  }));

  return <Animated.View style={[styles.dot, animStyle]} />;
}

export function PaginationDots({ count, activeIndex }: PaginationDotsProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, i) => (
        <Dot
          key={i}
          active={i === activeIndex}
          color={colors.primary}
          mutedColor={colors.border}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: DOT_GAP,
  },
  dot: {
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
});
