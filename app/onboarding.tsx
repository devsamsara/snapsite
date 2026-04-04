/**
 * OnboardingScreen
 *
 * Improvements v2:
 * - Button color transitions smoothly between slides (interpolateColor via scrollX)
 * - Last slide: scale-up + fade-out exit transition before navigating to tabs
 * - Illustrations have idle float/pulse animations (handled in OnboardingSlide)
 */
import React, { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StyleSheet,
  StatusBar,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  interpolateColor,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/use-colors";
import { PaginationDots } from "@/components/onboarding/pagination-dots";
import { OnboardingSlide, type SlideData } from "@/components/onboarding/onboarding-slide";
import { ONBOARDING_DONE_KEY } from "@/lib/auth-context";

const { width: W } = Dimensions.get("window");

// ─── Component ────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const { t }    = useTranslation();
  const colors   = useColors();
  const router   = useRouter();
  const insets   = useSafeAreaInsets();

  const SLIDES: SlideData[] = [
    {
      id: "slide1",
      tag:        t("onboarding.slide1.tag"),
      title:      t("onboarding.slide1.title"),
      subtitle:   t("onboarding.slide1.subtitle"),
      icon:       "home-work",
      accent:     colors.primary,
      accentSoft: colors.muted,
    },
    {
      id: "slide2",
      tag:        t("onboarding.slide2.tag"),
      title:      t("onboarding.slide2.title"),
      subtitle:   t("onboarding.slide2.subtitle"),
      icon:       "photo-camera",
      accent:     "#F59E0B",
      accentSoft: "#92400E",
    },
    {
      id: "slide3",
      tag:        t("onboarding.slide3.tag"),
      title:      t("onboarding.slide3.title"),
      subtitle:   t("onboarding.slide3.subtitle"),
      icon:       "group",
      accent:     "#10B981",
      accentSoft: "#065F46",
    },
    {
      id: "slide4",
      tag:        t("onboarding.slide4.tag"),
      title:      t("onboarding.slide4.title"),
      subtitle:   t("onboarding.slide4.subtitle"),
      icon:       "rocket-launch",
      accent:     colors.primary,
      accentSoft: colors.muted,
    },
  ];

  const ACCENT_COLORS = SLIDES.map((s) => s.accent);

  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // ── Scroll-driven color interpolation ────────────────────────────────────
  // scrollX tracks the FlatList's horizontal offset in real time
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  // ── Button animated color ─────────────────────────────────────────────────
  const btnAnimStyle = useAnimatedStyle(() => {
    const inputRange = SLIDES.map((_, i) => i * W);
    const bg = interpolateColor(scrollX.value, inputRange, ACCENT_COLORS);
    return { backgroundColor: bg };
  });

  // ── Button press scale ────────────────────────────────────────────────────
  const btnScale  = useSharedValue(1);
  const skipScale = useSharedValue(1);

  const btnPressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));
  const skipStyle = useAnimatedStyle(() => ({
    transform: [{ scale: skipScale.value }],
  }));

  // ── Exit transition (last slide → tabs) ──────────────────────────────────
  // The whole screen scales up slightly and fades out before navigation
  const exitScale   = useSharedValue(1);
  const exitOpacity = useSharedValue(1);

  const exitStyle = useAnimatedStyle(() => ({
    flex: 1,
    opacity:   exitOpacity.value,
    transform: [{ scale: exitScale.value }],
  }));

  // ── Navigation helpers ────────────────────────────────────────────────────

  const navigateToTabs = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_DONE_KEY, "true");
    } catch { /* ignore */ }
    router.replace("/(tabs)");
  }, [router]);

  const triggerExitTransition = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Scale up gently + fade out, then navigate
    exitScale.value   = withTiming(1.06, { duration: 420, easing: Easing.out(Easing.quad) });
    exitOpacity.value = withDelay(
      180,
      withTiming(0, { duration: 300, easing: Easing.in(Easing.quad) }, (finished) => {
        if (finished) runOnJS(navigateToTabs)();
      })
    );
  }, [exitScale, exitOpacity, navigateToTabs]);

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    btnScale.value = withSequence(
      withSpring(0.93, { damping: 10, stiffness: 320 }),
      withSpring(1,    { damping: 14, stiffness: 260 })
    );

    if (activeIndex < SLIDES.length - 1) {
      const next = activeIndex + 1;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      setActiveIndex(next);
    } else {
      triggerExitTransition();
    }
  }, [activeIndex, SLIDES.length, btnScale, triggerExitTransition]);

  const handleSkip = useCallback(() => {
    Haptics.selectionAsync();
    skipScale.value = withSequence(
      withSpring(0.88, { damping: 10, stiffness: 320 }),
      withSpring(1,    { damping: 14, stiffness: 260 })
    );
    // Skip also fades out, just faster
    exitOpacity.value = withTiming(0, { duration: 260 }, (finished) => {
      if (finished) runOnJS(navigateToTabs)();
    });
  }, [skipScale, exitOpacity, navigateToTabs]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: any) => {
      if (viewableItems.length > 0) {
        setActiveIndex(viewableItems[0].index ?? 0);
      }
    },
    []
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const isLast = activeIndex === SLIDES.length - 1;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Animated.View style={[styles.root, { backgroundColor: colors.background }, exitStyle]}>
      <StatusBar
        barStyle={colors.background === "#0F172A" ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />

      {/* ── Skip button ── */}
      <Animated.View style={[styles.skipContainer, { top: insets.top + 12 }, skipStyle]}>
        <TouchableOpacity
          onPress={handleSkip}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={[styles.skipBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[styles.skipText, { color: colors.muted }]}>
            {t("onboarding.skip")}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Slides pager ── */}
      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        decelerationRate="fast"
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: W,
          offset: W * index,
          index,
        })}
        renderItem={({ item, index }) => (
          <OnboardingSlide
            slide={item}
            isActive={index === activeIndex}
          />
        )}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top + 48 }}
      />

      {/* ── Bottom controls ── */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: insets.bottom + 24, backgroundColor: colors.background },
        ]}
      >
        {/* Pagination dots */}
        <PaginationDots count={SLIDES.length} activeIndex={activeIndex} />

        {/* Primary CTA button — color driven by scrollX */}
        <Animated.View style={[styles.btnWrapper, btnPressStyle]}>
          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={1}
          >
            <Animated.View style={[styles.primaryBtn, btnAnimStyle]}>
              <Text style={styles.primaryBtnText}>
                {isLast ? t("onboarding.getStarted") : t("onboarding.next")}
              </Text>
              {!isLast && (
                <View style={styles.arrowCircle}>
                  <Text style={styles.arrowText}>→</Text>
                </View>
              )}
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>

        {/* Step counter */}
        <Text style={[styles.stepCounter, { color: colors.muted }]}>
          {t("onboarding.stepOf", {
            current: activeIndex + 1,
            total:   SLIDES.length,
          })}
        </Text>
      </View>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  skipContainer: {
    position: "absolute",
    right: 20,
    zIndex: 10,
  },
  skipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  skipText: { fontSize: 13, fontWeight: "600" },

  bottomBar: {
    paddingHorizontal: 28,
    paddingTop: 20,
    gap: 20,
    alignItems: "center",
  },

  btnWrapper: { width: "100%" },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 17,
    borderRadius: 18,
    gap: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },

  stepCounter: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
});
