/**
 * AdjustPanel.tsx
 *
 * Fixed sliders:
 * - PanResponder created ONCE (useRef) → no interruption on re-renders
 * - valueRef / onChangeRef → no stale closures
 * - NO ScrollView → no gesture competition
 * - touch capture so parent ScrollViews can't steal the gesture
 */
import React, { useRef } from 'react';
import { View, StyleSheet, Text, PanResponder, Dimensions } from 'react-native';
import { Adjustments } from './types';

const { width: SCREEN_W } = Dimensions.get('window');
const TRACK_W   = SCREEN_W - 64;   // horizontal padding × 2
const THUMB_SZ  = 22;

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
const toPos  = (v: number) => ((v + 1) / 2) * TRACK_W;
const toVal  = (px: number) => clamp((px / TRACK_W) * 2 - 1, -1, 1);

// ─── Single slider ──────────────────────────────────────────────────────────

interface SliderProps {
  label: string;
  icon: string;
  value: number;       // -1 … 1
  onChange: (v: number) => void;
  color: string;
}

const AdjustSlider: React.FC<SliderProps> = ({ label, icon, value, onChange, color }) => {
  const valueRef    = useRef(value);
  const onChangeRef = useRef(onChange);
  const startPxRef  = useRef(0);
  valueRef.current    = value;
  onChangeRef.current = onChange;

  const pan = useRef(
    PanResponder.create({
      // Capture prevents any parent ScrollView from stealing the horizontal gesture
      onStartShouldSetPanResponder:        () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder:         () => true,
      onMoveShouldSetPanResponderCapture:  () => true,

      onPanResponderGrant: () => {
        startPxRef.current = toPos(valueRef.current);
      },
      onPanResponderMove: (_, gs) => {
        const newPx = clamp(startPxRef.current + gs.dx, 0, TRACK_W);
        onChangeRef.current(toVal(newPx));
      },
    })
  ).current;

  const fillPx    = toPos(value);
  const thumbLeft = clamp(fillPx - THUMB_SZ / 2, 0, TRACK_W - THUMB_SZ);
  const isPos     = value > 0.01;
  const isNeg     = value < -0.01;
  const active    = isPos || isNeg;

  return (
    <View style={styles.row}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, { color: active ? color : 'rgba(255,255,255,0.3)' }]}>
          {value > 0 ? '+' : ''}{Math.round(value * 100)}
        </Text>
      </View>

      {/* Slider touch area */}
      <View style={styles.touchArea} {...pan.panHandlers}>
        {/* Track */}
        <View style={styles.track}>
          <View style={styles.centerTick} />
          {isNeg && (
            <View style={[styles.fill, {
              backgroundColor: color,
              right: TRACK_W / 2,
              width: TRACK_W / 2 - fillPx,
              left: undefined,
            }]} />
          )}
          {isPos && (
            <View style={[styles.fill, {
              backgroundColor: color,
              left: TRACK_W / 2,
              width: fillPx - TRACK_W / 2,
            }]} />
          )}
        </View>
        {/* Thumb */}
        <View style={[styles.thumb, {
          left: thumbLeft,
          borderColor: active ? color : 'rgba(255,255,255,0.8)',
          shadowColor: color,
        }]} />
      </View>
    </View>
  );
};

// ─── Panel ──────────────────────────────────────────────────────────────────

const SLIDERS: {
  key: keyof Adjustments;
  label: string;
  icon: string;
  color: string;
}[] = [
  { key: 'brightness', label: 'Brightness', icon: '☀️', color: '#FFD60A' },
  { key: 'contrast',   label: 'Contrast',   icon: '◑',  color: '#64D2FF' },
  { key: 'saturation', label: 'Saturation', icon: '🎨', color: '#32D74B' },
  { key: 'warmth',     label: 'Warmth',     icon: '🌅', color: '#FF9F0A' },
  { key: 'sharpness',  label: 'Sharpness',  icon: '◈',  color: '#BF5AF2' },
];

interface Props {
  adjustments: Adjustments;
  onChange: (key: keyof Adjustments, value: number) => void;
  visible: boolean;
}

export const AdjustPanel: React.FC<Props> = ({ adjustments, onChange, visible }) => {
  if (!visible) return null;
  return (
    <View style={styles.panel}>
      {SLIDERS.map(s => (
        <AdjustSlider
          key={s.key}
          label={s.label}
          icon={s.icon}
          color={s.color}
          value={adjustments[s.key]}
          onChange={v => onChange(s.key, v)}
        />
      ))}
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    paddingHorizontal: 32,
    paddingVertical: 10,
    justifyContent: 'space-evenly',
  },
  row: {
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  icon: {
    fontSize: 13,
    marginRight: 8,
    width: 20,
    textAlign: 'center',
  },
  label: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.2,
  },
  value: {
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    minWidth: 32,
    textAlign: 'right',
  },
  // Tall touch zone makes the slider easy to hit
  touchArea: {
    height: THUMB_SZ + 12,
    width: TRACK_W,
    justifyContent: 'center',
  },
  track: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    width: TRACK_W,
    overflow: 'hidden',
    position: 'relative',
  },
  centerTick: {
    position: 'absolute',
    width: 1.5,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
    left: TRACK_W / 2 - 0.75,
  },
  fill: {
    position: 'absolute',
    height: '100%',
    opacity: 0.85,
  },
  thumb: {
    position: 'absolute',
    top: 0,
    width: THUMB_SZ,
    height: THUMB_SZ,
    borderRadius: THUMB_SZ / 2,
    backgroundColor: '#1C1C1E',
    borderWidth: 2,
    shadowOpacity: 0.5,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
});
