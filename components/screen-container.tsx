import { View, type ViewProps } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { cn } from "@/lib/utils";

export interface ScreenContainerProps extends ViewProps {
  /**
   * SafeArea edges to apply. Defaults to ["top", "left", "right"].
   * Bottom is typically handled by Tab Bar.
   * Ignored when `edgeToEdge` is true.
   */
  edges?: Edge[];
  /**
   * Edge-to-edge mode: skips the SafeAreaView entirely and renders a plain
   * full-bleed View instead. Use this when the screen has its own floating
   * header (e.g. `AppHeader`) that applies `insets.top` itself as padding —
   * that's what lets the header's gradient/blur start at pixel 0 while its
   * *content* still clears the notch/Dynamic Island, and lets the
   * ScrollView/FlatList scroll *behind* the header instead of stopping
   * short of it. Default: false (preserves prior SafeAreaView behavior for
   * every existing screen that doesn't manage its own insets).
   */
  edgeToEdge?: boolean;
  /**
   * Tailwind className for the content area.
   */
  className?: string;
  /**
   * Additional className for the outer container (background layer).
   */
  containerClassName?: string;
  /**
   * Additional className for the SafeAreaView (content layer).
   */
  safeAreaClassName?: string;
}

/**
 * A container component that properly handles SafeArea and background colors.
 *
 * The outer View extends to full screen (including status bar area) with the background color,
 * while the inner SafeAreaView ensures content is within safe bounds — unless
 * `edgeToEdge` is set, in which case no inset is applied here at all and the
 * screen's own header component is responsible for `insets.top`.
 *
 * Usage:
 * ```tsx
 * <ScreenContainer className="p-4">
 *   <Text className="text-2xl font-bold text-foreground">
 *     Welcome
 *   </Text>
 * </ScreenContainer>
 * ```
 */
export function ScreenContainer({
  children,
  edges = ["top", "left", "right"],
  edgeToEdge = false,
  className,
  containerClassName,
  safeAreaClassName,
  style,
  ...props
}: ScreenContainerProps) {
  return (
    <View
      className={cn(
        "flex-1",
        "bg-background",
        containerClassName
      )}
      {...props}
    >
      {edgeToEdge ? (
        <View className={cn("flex-1", className)} style={style}>
          {children}
        </View>
      ) : (
        <SafeAreaView
          edges={edges}
          className={cn("flex-1", safeAreaClassName)}
          style={style}
        >
          <View className={cn("flex-1", className)}>{children}</View>
        </SafeAreaView>
      )}
    </View>
  );
}
