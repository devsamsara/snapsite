/**
 * OnboardingScreen
 *
 * A premium 4-slide onboarding flow with:
 * - FlatList horizontal pager (pagingEnabled, high-perf)
 * - Swipe navigation + Next / Get Started button
 * - Animated background gradient shift per slide
 * - PaginationDots with spring animations
 * - Skip button (top-right)
 * - Entrance animations per slide via OnboardingSlide
 * - i18n support (es / en)
 * - AsyncStorage persistence (won't show again after completion)
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
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/use-colors";
import { PaginationDots } from "@/components/onboarding/pagination-dots";
import { OnboardingSlide, type SlideData } from "@/components/onboarding/onboarding-slide";

const { width: W, height: H } = Dimensions.get("window");

export const ONBOARDING_DONE_KEY = "@snapsite_onboarding_done";

// ─── Slide definitions ────────────────────────────────────────────────────────

const SLIDE_IDS = ["slide1", "slide2", "slide3", "slide4"] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const SLIDES: SlideData[] = [
    {
      id: "slide1",
      tag:      t("onboarding.slide1.tag"),
      title:    t("onboarding.slide1.title"),
      subtitle: t("onboarding.slide1.subtitle"),
      icon:     "home-work",
      accent:      colors.primary,
      accentSoft:  colors.muted,
    },
    {
      id: "slide2",
      tag:      t("onboarding.slide2.tag"),
      title:    t("onboarding.slide2.title"),
      subtitle: t("onboarding.slide2.subtitle"),
      icon:     "photo-camera",
      accent:      "#F59E0B",
      accentSoft:  "#92400E",
    },
    {
      id: "slide3",
      tag:      t("onboarding.slide3.tag"),
      title:    t("onboarding.slide3.title"),
      subtitle: t("onboarding.slide3.subtitle"),
      icon:     "group",
      accent:      "#10B981",
      accentSoft:  "#065F46",
    },
    {
      id: "slide4",
      tag:      t("onboarding.slide4.tag"),
      title:    t("onboarding.slide4.title"),
      subtitle: t("onboarding.slide4.subtitle"),
      icon:     "rocket-launch",
      accent:      colors.primary,
      accentSoft:  colors.muted,
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Button press scale animation
  const btnScale = useSharedValue(1);
  const skipScale = useSharedValue(1);

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));
  const skipStyle = useAnimatedStyle(() => ({
    transform: [{ scale: skipScale.value }],
  }));

  // ── Navigation helpers ─────────────────────────────────────────────────────

  const markDoneAndNavigate = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_DONE_KEY, "true");
    } catch { /* ignore */ }
    router.replace("/(tabs)");
  }, [router]);

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    btnScale.value = withSpring(0.94, { damping: 12, stiffness: 300 }, () => {
      btnScale.value = withSpring(1, { damping: 14, stiffness: 260 });
    });

    if (activeIndex < SLIDES.length - 1) {
      const nextIndex = activeIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setActiveIndex(nextIndex);
    } else {
      markDoneAndNavigate();
    }
  }, [activeIndex, SLIDES.length, markDoneAndNavigate, btnScale]);

  const handleSkip = useCallback(() => {
    Haptics.selectionAsync();
    skipScale.value = withSpring(0.9, { damping: 12, stiffness: 300 }, () => {
      skipScale.value = withSpring(1, { damping: 14, stiffness: 260 });
    });
    markDoneAndNavigate();
  }, [markDoneAndNavigate, skipScale]);

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
  const currentSlide = SLIDES[activeIndex];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={colors.background === "#0F172A" ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />

      {/* ── Skip button ── */}
      <Animated.View
        style={[
          styles.skipContainer,
          { top: insets.top + 12 },
          skipStyle,
        ]}
      >
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
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        decelerationRate="fast"
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
          {
            paddingBottom: insets.bottom + 24,
            backgroundColor: colors.background,
          },
        ]}
      >
        {/* Pagination dots */}
        <PaginationDots count={SLIDES.length} activeIndex={activeIndex} />

        {/* Primary CTA button */}
        <Animated.View style={[styles.btnWrapper, btnStyle]}>
          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.88}
            style={[
              styles.primaryBtn,
              { backgroundColor: currentSlide.accent },
            ]}
          >
            <Text style={styles.primaryBtnText}>
              {isLast ? t("onboarding.getStarted") : t("onboarding.next")}
            </Text>
            {!isLast && (
              <View style={styles.arrowCircle}>
                <Text style={[styles.arrowText, { color: currentSlide.accent }]}>→</Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Step counter */}
        <Text style={[styles.stepCounter, { color: colors.muted }]}>
          {t("onboarding.stepOf", {
            current: activeIndex + 1,
            total: SLIDES.length,
          })}
        </Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  // Skip
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
  skipText: {
    fontSize: 13,
    fontWeight: "600",
  },

  // Bottom bar
  bottomBar: {
    paddingHorizontal: 28,
    paddingTop: 20,
    gap: 20,
    alignItems: "center",
  },

  // Primary button
  btnWrapper: {
    width: "100%",
  },
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

  // Step counter
  stepCounter: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
});
