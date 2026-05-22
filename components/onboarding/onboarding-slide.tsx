/**
 * OnboardingSlide v2
 *
 * Improvements:
 * - Idle animations on illustration elements (float, pulse, slow rotate)
 *   using withRepeat + withSequence — start when slide becomes active
 * - Entrance animations unchanged (staggered fade + translateY)
 */
import React, { useEffect } from "react";
import { View, Text, Dimensions, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { useColors } from "@/hooks/use-colors";

const { width: W, height: H } = Dimensions.get("window");

export interface SlideData {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  icon: string;
  accent: string;
  accentSoft: string;
}

interface OnboardingSlideProp {
  slide: SlideData;
  isActive: boolean;
}

const SPRING_IN  = { damping: 22, stiffness: 180, mass: 0.8 };
const FADE_DUR   = 380;
const FLOAT_DUR  = 2600; // ms for one float cycle
const PULSE_DUR  = 1800;

export function OnboardingSlide({ slide, isActive }: OnboardingSlideProp) {
  const colors = useColors();

  // ── Entrance animations ──────────────────────────────────────────────────
  const illOp = useSharedValue(isActive ? 1 : 0);
  const illY  = useSharedValue(isActive ? 0 : 40);
  const tagOp = useSharedValue(isActive ? 1 : 0);
  const tagY  = useSharedValue(isActive ? 0 : 20);
  const titOp = useSharedValue(isActive ? 1 : 0);
  const titY  = useSharedValue(isActive ? 0 : 24);
  const subOp = useSharedValue(isActive ? 1 : 0);
  const subY  = useSharedValue(isActive ? 0 : 20);

  useEffect(() => {
    if (isActive) {
      illOp.value = withTiming(1, { duration: FADE_DUR, easing: Easing.out(Easing.quad) });
      illY.value  = withSpring(0, SPRING_IN);
      tagOp.value = withDelay(120, withTiming(1, { duration: FADE_DUR }));
      tagY.value  = withDelay(120, withSpring(0, SPRING_IN));
      titOp.value = withDelay(200, withTiming(1, { duration: FADE_DUR }));
      titY.value  = withDelay(200, withSpring(0, SPRING_IN));
      subOp.value = withDelay(300, withTiming(1, { duration: FADE_DUR }));
      subY.value  = withDelay(300, withSpring(0, SPRING_IN));
    } else {
      illOp.value = withTiming(0, { duration: 200 });
      illY.value  = withTiming(40, { duration: 200 });
      tagOp.value = 0; tagY.value = 20;
      titOp.value = 0; titY.value = 24;
      subOp.value = 0; subY.value = 20;
    }
  }, [isActive]);

  const illStyle = useAnimatedStyle(() => ({
    opacity: illOp.value,
    transform: [{ translateY: illY.value }],
  }));
  const tagStyle = useAnimatedStyle(() => ({
    opacity: tagOp.value,
    transform: [{ translateY: tagY.value }],
  }));
  const titStyle = useAnimatedStyle(() => ({
    opacity: titOp.value,
    transform: [{ translateY: titY.value }],
  }));
  const subStyle = useAnimatedStyle(() => ({
    opacity: subOp.value,
    transform: [{ translateY: subY.value }],
  }));

  return (
    <View style={[styles.slide, { width: W }]}>
      {/* Illustration */}
      <Animated.View style={[styles.illContainer, illStyle]}>
        <SlideIllustration
          slideId={slide.id}
          accent={slide.accent}
          accentSoft={slide.accentSoft}
          bgColor={colors.surface}
          borderColor={colors.border}
          isActive={isActive}
        />
      </Animated.View>

      {/* Text */}
      <View style={styles.textContainer}>
        <Animated.View style={tagStyle}>
          <View style={[styles.tagPill, { backgroundColor: slide.accent + "18", borderColor: slide.accent + "30" }]}>
            <Text style={[styles.tagText, { color: slide.accent }]}>{slide.tag}</Text>
          </View>
        </Animated.View>

        <Animated.Text style={[styles.title, { color: colors.foreground }, titStyle]}>
          {slide.title}
        </Animated.Text>

        <Animated.Text style={[styles.subtitle, { color: colors.muted }, subStyle]}>
          {slide.subtitle}
        </Animated.Text>
      </View>
    </View>
  );
}

// ─── Illustration dispatcher ──────────────────────────────────────────────────

interface IllProps {
  slideId: string;
  accent: string;
  accentSoft: string;
  bgColor: string;
  borderColor: string;
  isActive: boolean;
}

function SlideIllustration(p: IllProps) {
  switch (p.slideId) {
    case "slide1": return <IllustrationWelcome {...p} />;
    case "slide2": return <IllustrationCapture {...p} />;
    case "slide3": return <IllustrationTeam    {...p} />;
    case "slide4": return <IllustrationStart   {...p} />;
    default:       return null;
  }
}

// ─── Shared idle hook ─────────────────────────────────────────────────────────

/**
 * Returns a shared value that floats up/down continuously while active.
 * @param amplitude  px to float (default 6)
 * @param duration   ms per half-cycle (default 1300)
 * @param delay      ms before starting (default 0)
 */
function useFloat(isActive: boolean, amplitude = 6, duration = 1300, delay = 0) {
  const y = useSharedValue(0);
  useEffect(() => {
    if (isActive) {
      y.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(-amplitude, { duration, easing: Easing.inOut(Easing.sin) }),
            withTiming( amplitude, { duration, easing: Easing.inOut(Easing.sin) })
          ),
          -1,
          true
        )
      );
    } else {
      y.value = withTiming(0, { duration: 300 });
    }
  }, [isActive]);
  return y;
}

/** Returns a shared value that pulses scale 1 → target → 1 */
function usePulse(isActive: boolean, target = 1.08, duration = 900, delay = 0) {
  const s = useSharedValue(1);
  useEffect(() => {
    if (isActive) {
      s.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(target, { duration, easing: Easing.inOut(Easing.quad) }),
            withTiming(1,      { duration, easing: Easing.inOut(Easing.quad) })
          ),
          -1,
          true
        )
      );
    } else {
      s.value = withTiming(1, { duration: 300 });
    }
  }, [isActive]);
  return s;
}

// ─── Slide 1 — Welcome ────────────────────────────────────────────────────────

function IllustrationWelcome({ accent, accentSoft, bgColor, borderColor, isActive }: Omit<IllProps, "slideId">) {
  // Center card floats gently
  const cardY  = useFloat(isActive, 5, 1400);
  const cardS  = usePulse(isActive, 1.03, 1600, 200);
  // Badge TL floats with a slight offset
  const badgeTLY = useFloat(isActive, 4, 1700, 300);
  // Badge BR floats opposite phase
  const badgeBRY = useFloat(isActive, 4, 1600, 600);

  const cardStyle    = useAnimatedStyle(() => ({ transform: [{ translateY: cardY.value }, { scale: cardS.value }] }));
  const badgeTLStyle = useAnimatedStyle(() => ({ transform: [{ translateY: badgeTLY.value }] }));
  const badgeBRStyle = useAnimatedStyle(() => ({ transform: [{ translateY: badgeBRY.value }] }));

  return (
    <View style={styles.illBase}>
      <View style={[styles.ring, styles.ring3, { borderColor: accent + "14", backgroundColor: accent + "06" }]} />
      <View style={[styles.ring, styles.ring2, { borderColor: accent + "22", backgroundColor: accent + "0A" }]} />
      <View style={[styles.ring, styles.ring1, { borderColor: accent + "40", backgroundColor: accent + "12" }]} />

      <Animated.View style={[styles.centerCard, { backgroundColor: bgColor, borderColor, shadowColor: accent }, cardStyle]}>
        <View style={[styles.appIconOuter, { backgroundColor: accent }]}>
          <View style={styles.appIconInner}>
            <View style={[styles.lens, { borderColor: "#fff" }]} />
            <View style={[styles.lensInner, { backgroundColor: "#fff" }]} />
          </View>
        </View>
        <Text style={[styles.centerCardLabel, { color: accent }]}>SnapSite</Text>
      </Animated.View>

      <Animated.View style={[styles.badge, styles.badgeTL, { backgroundColor: bgColor, borderColor, shadowColor: accent }, badgeTLStyle]}>
        <View style={[styles.badgeDot, { backgroundColor: "#10B981" }]} />
        <Text style={[styles.badgeText, { color: "#10B981" }]}>Activo</Text>
      </Animated.View>

      <Animated.View style={[styles.badge, styles.badgeBR, { backgroundColor: bgColor, borderColor, shadowColor: accent }, badgeBRStyle]}>
        <Text style={[styles.badgeText, { color: accentSoft }]}>67%</Text>
        <View style={[styles.miniBar, { backgroundColor: borderColor }]}>
          <View style={[styles.miniBarFill, { backgroundColor: accent, width: "67%" }]} />
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Slide 2 — Capture ───────────────────────────────────────────────────────

function IllustrationCapture({ accent, accentSoft, bgColor, borderColor, isActive }: Omit<IllProps, "slideId">) {
  const photos = [
    { top: 0,  left: 0,   w: 110, h: 90 },
    { top: 0,  left: 118, w: 90,  h: 90 },
    { top: 98, left: 0,   w: 90,  h: 80 },
    { top: 98, left: 98,  w: 110, h: 80 },
  ];

  // Each photo card floats at a slightly different speed/phase
  const y0 = useFloat(isActive, 5, 1500, 0);
  const y1 = useFloat(isActive, 4, 1700, 200);
  const y2 = useFloat(isActive, 6, 1400, 400);
  const y3 = useFloat(isActive, 4, 1600, 100);
  const photoYs = [y0, y1, y2, y3];

  // Annotation pin pulses
  const pinS = usePulse(isActive, 1.18, 800, 500);
  const pinStyle = useAnimatedStyle(() => ({ transform: [{ scale: pinS.value }] }));

  const photoStyles = photoYs.map((y) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }))
  );

  return (
    <View style={styles.illBase}>
      <View style={styles.illInner190}>
        {photos.map((p, i) => (
          <Animated.View
            key={i}
            style={[
              {
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
              },
              photoStyles[i],
            ]}
          >
            <View style={[styles.photoBar, styles.photoBarWide, { backgroundColor: accent + "50" }]} />
            <View style={[styles.photoBar, styles.photoBarNarrow, { backgroundColor: accent + "30" }]} />
          </Animated.View>
        ))}

        {/* Annotation pin */}
        <Animated.View style={[styles.annotationPin, { backgroundColor: accent, top: 55, left: 90 }, pinStyle]}>
          <View style={[styles.annotationPinTip, { borderTopColor: accent }]} />
        </Animated.View>

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

// ─── Slide 3 — Team ──────────────────────────────────────────────────────────

function IllustrationTeam({ accent, accentSoft, bgColor, borderColor, isActive }: Omit<IllProps, "slideId">) {
  const members = [
    { initials: "JP", color: "#2563EB", top: 20,  left: 80  },
    { initials: "MG", color: "#FF2D55", top: 80,  left: 20  },
    { initials: "CL", color: "#FF9500", top: 80,  left: 140 },
    { initials: "AM", color: "#10B981", top: 140, left: 80  },
  ];

  // Each avatar floats independently
  const y0 = useFloat(isActive, 5, 1600, 0);
  const y1 = useFloat(isActive, 4, 1400, 300);
  const y2 = useFloat(isActive, 6, 1700, 150);
  const y3 = useFloat(isActive, 4, 1500, 450);
  const avatarYs = [y0, y1, y2, y3];

  // Hub pulses
  const hubS = usePulse(isActive, 1.12, 1200, 400);
  const hubStyle = useAnimatedStyle(() => ({ transform: [{ scale: hubS.value }] }));

  const avatarStyles = avatarYs.map((y) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }))
  );

  return (
    <View style={styles.illBase}>
      <View style={styles.illInner210}>
        <View style={[styles.connLine, { top: 56, left: 106, width: 2, height: 60, backgroundColor: accent + "30" }]} />
        <View style={[styles.connLine, { top: 56, left: 56, width: 60, height: 2, backgroundColor: accent + "30", transform: [{ rotate: "35deg" }] }]} />
        <View style={[styles.connLine, { top: 56, left: 106, width: 60, height: 2, backgroundColor: accent + "30", transform: [{ rotate: "-35deg" }] }]} />

        <Animated.View style={[styles.hubCircle, { backgroundColor: accent + "18", borderColor: accent + "30", top: 80, left: 80 }, hubStyle]}>
          <View style={[styles.hubInner, { backgroundColor: accent }]} />
        </Animated.View>

        {members.map((m, i) => (
          <Animated.View
            key={m.initials}
            style={[
              styles.avatar,
              { backgroundColor: m.color + "20", borderColor: m.color + "50", top: m.top, left: m.left },
              avatarStyles[i],
            ]}
          >
            <Text style={[styles.avatarText, { color: m.color }]}>{m.initials}</Text>
          </Animated.View>
        ))}

        <View style={[styles.onlineDot, { backgroundColor: "#10B981", top: 24, left: 108 }]} />
        <View style={[styles.notifBadge, { backgroundColor: accent, top: 16, left: 140 }]}>
          <Text style={styles.notifText}>+2</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Slide 4 — Start ─────────────────────────────────────────────────────────

function IllustrationStart({ accent, accentSoft, bgColor, borderColor, isActive }: Omit<IllProps, "slideId">) {
  // Project card floats
  const cardY = useFloat(isActive, 6, 1500, 0);
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ translateY: cardY.value }] }));

  // Checkmarks pulse at different phases
  const ck1S = usePulse(isActive, 1.2, 900, 200);
  const ck2S = usePulse(isActive, 1.2, 900, 700);
  const ck1Style = useAnimatedStyle(() => ({ transform: [{ scale: ck1S.value }] }));
  const ck2Style = useAnimatedStyle(() => ({ transform: [{ scale: ck2S.value }] }));

  return (
    <View style={styles.illBase}>
      <View style={[styles.ring, styles.ring3, { borderColor: accent + "18", backgroundColor: accent + "06" }]} />
      <View style={[styles.ring, styles.ring2, { borderColor: accent + "28", backgroundColor: accent + "0C" }]} />

      <Animated.View style={[styles.projectCard, { backgroundColor: bgColor, borderColor, shadowColor: accent }, cardStyle]}>
        <View style={styles.projectCardHeader}>
          <View style={[styles.projectThumb, { backgroundColor: accent + "20" }]} />
          <View style={styles.projectCardInfo}>
            <View style={[styles.cardBarLg, { backgroundColor: accent + "40" }]} />
            <View style={[styles.cardBarSm, { backgroundColor: accent + "20" }]} />
          </View>
          <View style={[styles.statusBadge, { backgroundColor: "#10B981" + "20" }]}>
            <Text style={styles.statusText}>ACTIVO</Text>
          </View>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: borderColor }]}>
          <View style={[styles.progressFill, { backgroundColor: accent }]} />
        </View>
        <View style={styles.progressFooter}>
          <Text style={[styles.progressLabel, { color: accentSoft }]}>Progreso</Text>
          <Text style={[styles.progressValue, { color: accent }]}>72%</Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.checkBadge, styles.checkTL, { backgroundColor: "#10B981", shadowColor: "#10B981" }, ck1Style]}>
        <Text style={styles.checkText}>✓</Text>
      </Animated.View>
      <Animated.View style={[styles.checkBadge, styles.checkBR, { backgroundColor: accent, shadowColor: accent }, ck2Style]}>
        <Text style={styles.checkText}>✓</Text>
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: H * 0.03,
  },
  illContainer: {
    width: W,
    height: H * 0.36,
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
  ring:  { position: "absolute", borderRadius: 999, borderWidth: 1.5 },
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
  measureLine: { position: "absolute", height: 2, borderRadius: 1 },
  measureEndCap: { position: "absolute", width: 2, height: 8, top: -3, borderRadius: 1 },
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

  // Inline helpers
  illInner190:      { width: 220, height: 190, position: "relative" },
  illInner210:      { width: 220, height: 210, position: "relative" },
  photoBar:         { borderRadius: 2 },
  photoBarWide:     { width: "60%", height: 4, marginBottom: 6 },
  photoBarNarrow:   { width: "40%", height: 4 },
  projectCardHeader:{ flexDirection: "row", alignItems: "center", marginBottom: 12 },
  projectCardInfo:  { flex: 1, marginLeft: 10 },
  cardBarLg:        { height: 8, width: "70%", borderRadius: 4, marginBottom: 5 },
  cardBarSm:        { height: 6, width: "45%", borderRadius: 3 },
  statusText:       { color: "#10B981", fontSize: 9, fontWeight: "700" },
  progressTrack:    { height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 8 },
  progressFill:     { height: "100%", width: "72%", borderRadius: 3 },
  progressFooter:   { flexDirection: "row", justifyContent: "space-between" },
  progressLabel:    { fontSize: 10 },
  progressValue:    { fontSize: 10, fontWeight: "700" },

  // Text content
  textContainer: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 8,
    paddingBottom: 16,
    width: "100%",
  },
  tagPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
    marginBottom: 12,
  },
  tagText: { fontSize: 12, fontWeight: "700", letterSpacing: 0.3 },
  title: {
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 38,
    letterSpacing: -0.6,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
    letterSpacing: 0.1,
    flexShrink: 1,
  },
});
