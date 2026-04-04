/**
 * OnboardingSlide
 *
 * A single full-screen onboarding slide with:
 * - Large abstract visual illustration (SVG-like View composition)
 * - Animated tag pill, headline, and subtitle
 * - Entrance animations: fade + translateY via Reanimated
 *
 * Each slide has a unique accent color and illustration shape
 * derived from the app's design system.
 */
import React, { useEffect } from "react";
import { View, Text, Dimensions, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useColors } from "@/hooks/use-colors";

const { width: W, height: H } = Dimensions.get("window");

export interface SlideData {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  /** Icon name from MaterialIcons */
  icon: string;
  /** Accent color (hex) */
  accent: string;
  /** Secondary accent for illustration */
  accentSoft: string;
}

interface OnboardingSlideProp {
  slide: SlideData;
  isActive: boolean;
}

const SPRING = { damping: 22, stiffness: 180, mass: 0.8 };
const FADE_DURATION = 380;

export function OnboardingSlide({ slide, isActive }: OnboardingSlideProp) {
  const colors = useColors();

  // Shared animation values
  const illustrationY  = useSharedValue(isActive ? 0 : 40);
  const illustrationOp = useSharedValue(isActive ? 1 : 0);
  const tagOp          = useSharedValue(isActive ? 1 : 0);
  const tagY           = useSharedValue(isActive ? 0 : 20);
  const titleOp        = useSharedValue(isActive ? 1 : 0);
  const titleY         = useSharedValue(isActive ? 0 : 24);
  const subtitleOp     = useSharedValue(isActive ? 1 : 0);
  const subtitleY      = useSharedValue(isActive ? 0 : 20);

  useEffect(() => {
    if (isActive) {
      // Staggered entrance
      illustrationOp.value = withTiming(1, { duration: FADE_DURATION, easing: Easing.out(Easing.quad) });
      illustrationY.value  = withSpring(0, SPRING);

      tagOp.value   = withDelay(120, withTiming(1, { duration: FADE_DURATION }));
      tagY.value    = withDelay(120, withSpring(0, SPRING));

      titleOp.value = withDelay(200, withTiming(1, { duration: FADE_DURATION }));
      titleY.value  = withDelay(200, withSpring(0, SPRING));

      subtitleOp.value = withDelay(300, withTiming(1, { duration: FADE_DURATION }));
      subtitleY.value  = withDelay(300, withSpring(0, SPRING));
    } else {
      // Reset for next entrance
      illustrationOp.value = withTiming(0, { duration: 200 });
      illustrationY.value  = withTiming(40, { duration: 200 });
      tagOp.value   = 0; tagY.value   = 20;
      titleOp.value = 0; titleY.value = 24;
      subtitleOp.value = 0; subtitleY.value = 20;
    }
  }, [isActive]);

  const illustrationStyle = useAnimatedStyle(() => ({
    opacity: illustrationOp.value,
    transform: [{ translateY: illustrationY.value }],
  }));
  const tagStyle = useAnimatedStyle(() => ({
    opacity: tagOp.value,
    transform: [{ translateY: tagY.value }],
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOp.value,
    transform: [{ translateY: titleY.value }],
  }));
  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOp.value,
    transform: [{ translateY: subtitleY.value }],
  }));

  return (
    <View style={[styles.slide, { width: W }]}>

      {/* ── Illustration area ── */}
      <Animated.View style={[styles.illustrationContainer, illustrationStyle]}>
        <SlideIllustration
          slideId={slide.id}
          accent={slide.accent}
          accentSoft={slide.accentSoft}
          bgColor={colors.surface}
          borderColor={colors.border}
        />
      </Animated.View>

      {/* ── Text content ── */}
      <View style={styles.textContainer}>
        {/* Tag pill */}
        <Animated.View style={tagStyle}>
          <View style={[styles.tagPill, { backgroundColor: slide.accent + "18", borderColor: slide.accent + "30" }]}>
            <Text style={[styles.tagText, { color: slide.accent }]}>{slide.tag}</Text>
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.Text style={[styles.title, { color: colors.foreground }, titleStyle]}>
          {slide.title}
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text style={[styles.subtitle, { color: colors.muted }, subtitleStyle]}>
          {slide.subtitle}
        </Animated.Text>
      </View>
    </View>
  );
}

// ─── Abstract Illustrations ────────────────────────────────────────────────

interface IllustrationProps {
  slideId: string;
  accent: string;
  accentSoft: string;
  bgColor: string;
  borderColor: string;
}

function SlideIllustration({ slideId, accent, accentSoft, bgColor, borderColor }: IllustrationProps) {
  switch (slideId) {
    case "slide1": return <IllustrationWelcome accent={accent} accentSoft={accentSoft} bgColor={bgColor} borderColor={borderColor} />;
    case "slide2": return <IllustrationCapture accent={accent} accentSoft={accentSoft} bgColor={bgColor} borderColor={borderColor} />;
    case "slide3": return <IllustrationTeam    accent={accent} accentSoft={accentSoft} bgColor={bgColor} borderColor={borderColor} />;
    case "slide4": return <IllustrationStart   accent={accent} accentSoft={accentSoft} bgColor={bgColor} borderColor={borderColor} />;
    default:       return null;
  }
}

/** Slide 1 — Welcome: SnapSite logo-like concentric rings with center icon */
function IllustrationWelcome({ accent, accentSoft, bgColor, borderColor }: Omit<IllustrationProps, "slideId">) {
  return (
    <View style={styles.illBase}>
      {/* Outer ring */}
      <View style={[styles.ring, styles.ring3, { borderColor: accent + "14", backgroundColor: accent + "06" }]} />
      <View style={[styles.ring, styles.ring2, { borderColor: accent + "22", backgroundColor: accent + "0A" }]} />
      <View style={[styles.ring, styles.ring1, { borderColor: accent + "40", backgroundColor: accent + "12" }]} />
      {/* Center card */}
      <View style={[styles.centerCard, { backgroundColor: bgColor, borderColor, shadowColor: accent }]}>
        {/* App icon shape */}
        <View style={[styles.appIconOuter, { backgroundColor: accent }]}>
          <View style={styles.appIconInner}>
            {/* Camera lens */}
            <View style={[styles.lens, { borderColor: "#fff" }]} />
            <View style={[styles.lensInner, { backgroundColor: "#fff" }]} />
          </View>
        </View>
        <Text style={[styles.centerCardLabel, { color: accent }]}>SnapSite</Text>
      </View>
      {/* Floating badges */}
      <View style={[styles.badge, styles.badgeTL, { backgroundColor: bgColor, borderColor, shadowColor: accent }]}>
        <View style={[styles.badgeDot, { backgroundColor: "#10B981" }]} />
        <Text style={[styles.badgeText, { color: "#10B981" }]}>Activo</Text>
      </View>
      <View style={[styles.badge, styles.badgeBR, { backgroundColor: bgColor, borderColor, shadowColor: accent }]}>
        <Text style={[styles.badgeText, { color: accentSoft }]}>67%</Text>
        <View style={[styles.miniBar, { backgroundColor: borderColor }]}>
          <View style={[styles.miniBarFill, { backgroundColor: accent, width: "67%" }]} />
        </View>
      </View>
    </View>
  );
}

/** Slide 2 — Capture: Photo grid with annotation overlays */
function IllustrationCapture({ accent, accentSoft, bgColor, borderColor }: Omit<IllustrationProps, "slideId">) {
  const photos = [
    { top: 0, left: 0, w: 110, h: 90 },
    { top: 0, left: 118, w: 90, h: 90 },
    { top: 98, left: 0, w: 90, h: 80 },
    { top: 98, left: 98, w: 110, h: 80 },
  ];
  return (
    <View style={styles.illBase}>
      {/* Photo grid */}
      <View style={{ width: 220, height: 190, position: "relative" }}>
        {photos.map((p, i) => (
          <View
            key={i}
            style={{
              position: "absolute",
              top: p.top, left: p.left,
              width: p.w, height: p.h,
              borderRadius: 14,
              backgroundColor: accent + (["18", "22", "14", "1C"][i]),
              borderWidth: 1.5,
              borderColor: accent + "30",
              overflow: "hidden",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Simulated image content */}
            <View style={{ width: "60%", height: 4, backgroundColor: accent + "50", borderRadius: 2, marginBottom: 6 }} />
            <View style={{ width: "40%", height: 4, backgroundColor: accent + "30", borderRadius: 2 }} />
          </View>
        ))}
        {/* Annotation pin */}
        <View style={[styles.annotationPin, { backgroundColor: accent, top: 55, left: 90 }]}>
          <View style={[styles.annotationPinTip, { borderTopColor: accent }]} />
        </View>
        {/* Measure line */}
        <View style={[styles.measureLine, { backgroundColor: "#F59E0B", top: 140, left: 20, width: 80 }]}>
          <View style={[styles.measureEndCap, { backgroundColor: "#F59E0B", left: 0 }]} />
          <View style={[styles.measureEndCap, { backgroundColor: "#F59E0B", right: 0 }]} />
        </View>
        <Text style={[styles.measureLabel, { color: "#F59E0B", top: 128, left: 42 }]}>3.2 m</Text>
      </View>
    </View>
  );
}

/** Slide 3 — Team: Avatar cluster with connection lines */
function IllustrationTeam({ accent, accentSoft, bgColor, borderColor }: Omit<IllustrationProps, "slideId">) {
  const members = [
    { initials: "JP", color: "#2563EB", top: 20,  left: 80  },
    { initials: "MG", color: "#FF2D55", top: 80,  left: 20  },
    { initials: "CL", color: "#FF9500", top: 80,  left: 140 },
    { initials: "AM", color: "#10B981", top: 140, left: 80  },
  ];
  return (
    <View style={styles.illBase}>
      <View style={{ width: 220, height: 210, position: "relative" }}>
        {/* Connection lines */}
        <View style={[styles.connLine, { top: 56, left: 106, width: 2, height: 60, backgroundColor: accent + "30" }]} />
        <View style={[styles.connLine, { top: 56, left: 56, width: 60, height: 2, backgroundColor: accent + "30", transform: [{ rotate: "35deg" }] }]} />
        <View style={[styles.connLine, { top: 56, left: 106, width: 60, height: 2, backgroundColor: accent + "30", transform: [{ rotate: "-35deg" }] }]} />

        {/* Center hub */}
        <View style={[styles.hubCircle, { backgroundColor: accent + "18", borderColor: accent + "30", top: 80, left: 80 }]}>
          <View style={[styles.hubInner, { backgroundColor: accent }]} />
        </View>

        {/* Member avatars */}
        {members.map((m) => (
          <View
            key={m.initials}
            style={[
              styles.avatar,
              {
                backgroundColor: m.color + "20",
                borderColor: m.color + "50",
                top: m.top,
                left: m.left,
              },
            ]}
          >
            <Text style={[styles.avatarText, { color: m.color }]}>{m.initials}</Text>
          </View>
        ))}

        {/* Online indicator */}
        <View style={[styles.onlineDot, { backgroundColor: "#10B981", top: 24, left: 108 }]} />

        {/* Notification badge */}
        <View style={[styles.notifBadge, { backgroundColor: accent, top: 16, left: 140 }]}>
          <Text style={styles.notifText}>+2</Text>
        </View>
      </View>
    </View>
  );
}

/** Slide 4 — Start: Rocket / launch metaphor with progress ring */
function IllustrationStart({ accent, accentSoft, bgColor, borderColor }: Omit<IllustrationProps, "slideId">) {
  return (
    <View style={styles.illBase}>
      {/* Outer glow ring */}
      <View style={[styles.ring, styles.ring3, { borderColor: accent + "18", backgroundColor: accent + "06" }]} />
      <View style={[styles.ring, styles.ring2, { borderColor: accent + "28", backgroundColor: accent + "0C" }]} />

      {/* Center card — project card mockup */}
      <View style={[styles.projectCard, { backgroundColor: bgColor, borderColor, shadowColor: accent }]}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <View style={[styles.projectThumb, { backgroundColor: accent + "20" }]} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <View style={{ height: 8, width: "70%", backgroundColor: accent + "40", borderRadius: 4, marginBottom: 5 }} />
            <View style={{ height: 6, width: "45%", backgroundColor: accent + "20", borderRadius: 3 }} />
          </View>
          <View style={[styles.statusBadge, { backgroundColor: "#10B981" + "20" }]}>
            <Text style={{ color: "#10B981", fontSize: 9, fontWeight: "700" }}>ACTIVO</Text>
          </View>
        </View>
        {/* Progress bar */}
        <View style={{ height: 6, backgroundColor: borderColor, borderRadius: 3, overflow: "hidden", marginBottom: 8 }}>
          <View style={{ height: "100%", width: "72%", backgroundColor: accent, borderRadius: 3 }} />
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 10, color: accentSoft }}>Progreso</Text>
          <Text style={{ fontSize: 10, fontWeight: "700", color: accent }}>72%</Text>
        </View>
      </View>

      {/* Floating checkmarks */}
      <View style={[styles.checkBadge, styles.checkTL, { backgroundColor: "#10B981", shadowColor: "#10B981" }]}>
        <Text style={styles.checkText}>✓</Text>
      </View>
      <View style={[styles.checkBadge, styles.checkBR, { backgroundColor: accent, shadowColor: accent }]}>
        <Text style={styles.checkText}>✓</Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: H * 0.06,
  },

  // Illustration
  illustrationContainer: {
    width: W,
    height: H * 0.42,
    alignItems: "center",
    justifyContent: "center",
  },
  illBase: {
    width: 260,
    height: 240,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  // Rings
  ring: { position: "absolute", borderRadius: 999, borderWidth: 1.5 },
  ring1: { width: 160, height: 160 },
  ring2: { width: 210, height: 210 },
  ring3: { width: 260, height: 260 },

  // Center card (slide 1)
  centerCard: {
    width: 100, height: 100, borderRadius: 28,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18, shadowRadius: 20, elevation: 10,
    gap: 8,
  },
  appIconOuter: {
    width: 52, height: 52, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  appIconInner: { alignItems: "center", justifyContent: "center" },
  lens: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2.5, position: "absolute",
  },
  lensInner: { width: 10, height: 10, borderRadius: 5 },
  centerCardLabel: { fontSize: 11, fontWeight: "700" },

  // Badges (slide 1)
  badge: {
    position: "absolute",
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 10, elevation: 6,
  },
  badgeTL: { top: 10, left: -10 },
  badgeBR: { bottom: 10, right: -10, flexDirection: "column", alignItems: "flex-start", gap: 4 },
  badgeDot: { width: 7, height: 7, borderRadius: 4 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  miniBar: { width: 60, height: 4, borderRadius: 2, overflow: "hidden" },
  miniBarFill: { height: "100%", borderRadius: 2 },

  // Annotation (slide 2)
  annotationPin: {
    position: "absolute",
    width: 18, height: 18, borderRadius: 9,
    alignItems: "center", justifyContent: "center",
  },
  annotationPinTip: {
    position: "absolute", bottom: -6,
    width: 0, height: 0,
    borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 7,
    borderLeftColor: "transparent", borderRightColor: "transparent",
  },
  measureLine: {
    position: "absolute", height: 2, borderRadius: 1,
  },
  measureEndCap: {
    position: "absolute", width: 2, height: 8, top: -3, borderRadius: 1,
  },
  measureLabel: { position: "absolute", fontSize: 10, fontWeight: "700" },

  // Team (slide 3)
  connLine: { position: "absolute" },
  hubCircle: {
    position: "absolute",
    width: 60, height: 60, borderRadius: 30,
    borderWidth: 1.5,
    alignItems: "center", justifyContent: "center",
  },
  hubInner: { width: 20, height: 20, borderRadius: 10 },
  avatar: {
    position: "absolute",
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 13, fontWeight: "800" },
  onlineDot: {
    position: "absolute",
    width: 10, height: 10, borderRadius: 5,
    borderWidth: 2, borderColor: "#fff",
  },
  notifBadge: {
    position: "absolute",
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 10,
  },
  notifText: { color: "#fff", fontSize: 10, fontWeight: "700" },

  // Project card (slide 4)
  projectCard: {
    width: 200, borderRadius: 20, padding: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 12,
  },
  projectThumb: { width: 36, height: 36, borderRadius: 10 },
  statusBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  checkBadge: {
    position: "absolute",
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  checkTL: { top: 10, left: 10 },
  checkBR: { bottom: 10, right: 10 },
  checkText: { color: "#fff", fontSize: 14, fontWeight: "800" },

  // Text content
  textContainer: {
    paddingHorizontal: 32,
    paddingTop: 8,
    width: "100%",
  },
  tagPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
    marginBottom: 16,
  },
  tagText: { fontSize: 12, fontWeight: "700", letterSpacing: 0.3 },
  title: {
    fontSize: 36,
    fontWeight: "800",
    lineHeight: 42,
    letterSpacing: -0.8,
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
    letterSpacing: 0.1,
  },
});
