import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  PanResponder,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Adjustments } from './types';

interface SliderProps {
  label: string;
  icon: string;
  value: number; // -1 to 1
  onChange: (v: number) => void;
  accentColor?: string;
}

const TRACK_WIDTH = Dimensions.get('window').width - 48;
const THUMB_SIZE = 26;

const AdjustSlider: React.FC<SliderProps> = ({
  label,
  icon,
  value,
  onChange,
  accentColor = '#FFD60A',
}) => {
  const clamp = (v: number, min: number, max: number) =>
    Math.min(Math.max(v, min), max);

  // value -1..1 → position 0..TRACK_WIDTH
  const toPos = (v: number) => ((v + 1) / 2) * TRACK_WIDTH;
  const toValue = (pos: number) => clamp((pos / TRACK_WIDTH) * 2 - 1, -1, 1);

  const startX = useRef(toPos(value));

  const pan = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      startX.current = toPos(value);
    },
    onPanResponderMove: (_, gs) => {
      const newPos = clamp(startX.current + gs.dx, 0, TRACK_WIDTH);
      onChange(toValue(newPos));
    },
  });

  const fillWidth = toPos(value);
  const thumbLeft = fillWidth - THUMB_SIZE / 2;
  const isNegative = value < -0.01;
  const isPositive = value > 0.01;

  return (
    <View style={styles.sliderRow}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderIcon}>{icon}</Text>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={[styles.sliderValue, { color: isPositive || isNegative ? accentColor : 'rgba(255,255,255,0.4)' }]}>
          {value > 0 ? '+' : ''}{Math.round(value * 100)}
        </Text>
      </View>

      <View style={styles.trackContainer} {...pan.panHandlers}>
        {/* Track background */}
        <View style={styles.track}>
          {/* Center marker */}
          <View style={styles.centerMark} />
          {/* Fill: left of center for negative, right for positive */}
          {isNegative && (
            <View
              style={[
                styles.fill,
                {
                  right: TRACK_WIDTH / 2,
                  width: (TRACK_WIDTH / 2) - fillWidth,
                  backgroundColor: accentColor,
                  left: undefined,
                },
              ]}
            />
          )}
          {isPositive && (
            <View
              style={[
                styles.fill,
                {
                  left: TRACK_WIDTH / 2,
                  width: fillWidth - TRACK_WIDTH / 2,
                  backgroundColor: accentColor,
                },
              ]}
            />
          )}
        </View>

        {/* Thumb */}
        <View
          style={[
            styles.thumb,
            {
              left: Math.max(0, Math.min(thumbLeft, TRACK_WIDTH - THUMB_SIZE)),
              borderColor: isNegative || isPositive ? accentColor : 'rgba(255,255,255,0.9)',
              shadowColor: accentColor,
            },
          ]}
        />
      </View>
    </View>
  );
};

interface Props {
  adjustments: Adjustments;
  onChange: (key: keyof Adjustments, value: number) => void;
  visible: boolean;
}

export const AdjustPanel: React.FC<Props> = ({ adjustments, onChange, visible }) => {
  if (!visible) return null;

  const sliders: { key: keyof Adjustments; label: string; icon: string; color: string }[] = [
    { key: 'brightness', label: 'Brightness', icon: '☀️', color: '#FFD60A' },
    { key: 'contrast', label: 'Contrast', icon: '◑', color: '#64D2FF' },
    { key: 'saturation', label: 'Saturation', icon: '🎨', color: '#32D74B' },
    { key: 'warmth', label: 'Warmth', icon: '🌅', color: '#FF9F0A' },
    { key: 'sharpness', label: 'Sharpness', icon: '◈', color: '#BF5AF2' },
  ];

  return (
    <View style={styles.container}>
      {sliders.map((s) => (
        <AdjustSlider
          key={s.key}
          label={s.label}
          icon={s.icon}
          value={adjustments[s.key]}
          onChange={(v) => onChange(s.key, v)}
          accentColor={s.color}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 4,
  },
  sliderRow: {
    marginBottom: 12,
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderIcon: {
    fontSize: 14,
    marginRight: 8,
    width: 20,
    textAlign: 'center',
  },
  sliderLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.2,
  },
  sliderValue: {
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    minWidth: 32,
    textAlign: 'right',
  },
  trackContainer: {
    height: THUMB_SIZE,
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  track: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    width: TRACK_WIDTH,
    overflow: 'hidden',
    position: 'relative',
  },
  centerMark: {
    position: 'absolute',
    width: 2,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    left: TRACK_WIDTH / 2 - 1,
  },
  fill: {
    position: 'absolute',
    height: '100%',
    opacity: 0.85,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#1C1C1E',
    borderWidth: 2,
    shadowOpacity: 0.6,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
});
