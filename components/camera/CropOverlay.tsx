import React, { useRef, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  Dimensions,
  TouchableOpacity,
  Text,
  ScrollView,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { CropRect, AspectRatio } from './types';

const HANDLE_SIZE = 24;
const MIN_CROP_SIZE = 0.15;

interface Props {
  containerWidth: number;
  containerHeight: number;
  cropRect: CropRect;
  aspectRatio: AspectRatio;
  onCropChange: (rect: CropRect) => void;
  onAspectRatioChange: (ratio: AspectRatio) => void;
  visible: boolean;
}

const ASPECT_RATIOS: { label: string; value: AspectRatio; icon: string }[] = [
  { label: 'Free', value: 'free', icon: '⊠' },
  { label: '1:1', value: '1:1', icon: '□' },
  { label: '4:3', value: '4:3', icon: '▭' },
  { label: '3:4', value: '3:4', icon: '▯' },
  { label: '16:9', value: '16:9', icon: '▬' },
  { label: '9:16', value: '9:16', icon: '▮' },
];

const getAspectMultiplier = (ratio: AspectRatio): number | null => {
  switch (ratio) {
    case '1:1': return 1;
    case '4:3': return 4 / 3;
    case '3:4': return 3 / 4;
    case '16:9': return 16 / 9;
    case '9:16': return 9 / 16;
    default: return null;
  }
};

type HandlePosition = 'tl' | 'tr' | 'bl' | 'br' | 'top' | 'bottom' | 'left' | 'right';

export const CropOverlay: React.FC<Props> = ({
  containerWidth,
  containerHeight,
  cropRect,
  aspectRatio,
  onCropChange,
  onAspectRatioChange,
  visible,
}) => {
  const rectRef = useRef(cropRect);
  rectRef.current = cropRect;

  const clamp = (val: number, min: number, max: number) =>
    Math.min(Math.max(val, min), max);

  const applyAspectConstraint = useCallback(
    (rect: CropRect, anchor: HandlePosition): CropRect => {
      const mult = getAspectMultiplier(aspectRatio);
      if (!mult) return rect;

      // Compute pixel dimensions
      const pw = rect.width * containerWidth;
      const ph = rect.height * containerHeight;

      // Determine which dimension is driving
      let newPw = pw;
      let newPh = pw / (mult * (containerWidth / containerHeight));

      // Keep within bounds
      if (rect.y + newPh / containerHeight > 1) {
        newPh = (1 - rect.y) * containerHeight;
        newPw = newPh * mult * (containerWidth / containerHeight);
      }

      return {
        ...rect,
        width: clamp(newPw / containerWidth, MIN_CROP_SIZE, 1 - rect.x),
        height: clamp(newPh / containerHeight, MIN_CROP_SIZE, 1 - rect.y),
      };
    },
    [aspectRatio, containerWidth, containerHeight]
  );

  const makePanResponder = (handle: HandlePosition) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => visible,
      onMoveShouldSetPanResponder: () => visible,
      onPanResponderMove: (_, gs) => {
        const dx = gs.dx / containerWidth;
        const dy = gs.dy / containerHeight;
        let r = { ...rectRef.current };

        if (handle === 'tl' || handle === 'left' || handle === 'bl') {
          const newX = clamp(r.x + dx, 0, r.x + r.width - MIN_CROP_SIZE);
          r.width += r.x - newX;
          r.x = newX;
        }
        if (handle === 'tr' || handle === 'right' || handle === 'br') {
          r.width = clamp(r.width + dx, MIN_CROP_SIZE, 1 - r.x);
        }
        if (handle === 'tl' || handle === 'top' || handle === 'tr') {
          const newY = clamp(r.y + dy, 0, r.y + r.height - MIN_CROP_SIZE);
          r.height += r.y - newY;
          r.y = newY;
        }
        if (handle === 'bl' || handle === 'bottom' || handle === 'br') {
          r.height = clamp(r.height + dy, MIN_CROP_SIZE, 1 - r.y);
        }

        onCropChange(applyAspectConstraint(r, handle));
      },
    });

  const tlPan = useRef(makePanResponder('tl')).current;
  const trPan = useRef(makePanResponder('tr')).current;
  const blPan = useRef(makePanResponder('bl')).current;
  const brPan = useRef(makePanResponder('br')).current;
  const topPan = useRef(makePanResponder('top')).current;
  const bottomPan = useRef(makePanResponder('bottom')).current;
  const leftPan = useRef(makePanResponder('left')).current;
  const rightPan = useRef(makePanResponder('right')).current;

  if (!visible) return null;

  const left = cropRect.x * containerWidth;
  const top = cropRect.y * containerHeight;
  const width = cropRect.width * containerWidth;
  const height = cropRect.height * containerHeight;

  // Grid thirds
  const thirdW = width / 3;
  const thirdH = height / 3;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Dark overlay - 4 rectangles around crop area */}
      <View style={[styles.overlay, { height: top }]} />
      <View
        style={[
          styles.overlay,
          { top, height, left: 0, width: left, position: 'absolute' },
        ]}
      />
      <View
        style={[
          styles.overlay,
          {
            top,
            height,
            left: left + width,
            right: 0,
            position: 'absolute',
          },
        ]}
      />
      <View
        style={[
          styles.overlay,
          { top: top + height, bottom: 0 },
        ]}
      />

      {/* Crop rect border */}
      <View
        style={[
          styles.cropBorder,
          { left, top, width, height },
        ]}
      >
        {/* Grid lines */}
        <View style={[styles.gridLineV, { left: thirdW }]} />
        <View style={[styles.gridLineV, { left: thirdW * 2 }]} />
        <View style={[styles.gridLineH, { top: thirdH }]} />
        <View style={[styles.gridLineH, { top: thirdH * 2 }]} />

        {/* Edge handles */}
        <View {...topPan.panHandlers} style={[styles.edgeHandle, styles.edgeTop]} />
        <View {...bottomPan.panHandlers} style={[styles.edgeHandle, styles.edgeBottom]} />
        <View {...leftPan.panHandlers} style={[styles.edgeHandle, styles.edgeLeft]} />
        <View {...rightPan.panHandlers} style={[styles.edgeHandle, styles.edgeRight]} />

        {/* Corner handles */}
        <View {...tlPan.panHandlers} style={[styles.cornerHandle, styles.cornerTL]}>
          <View style={[styles.cornerL]} />
          <View style={[styles.cornerT]} />
        </View>
        <View {...trPan.panHandlers} style={[styles.cornerHandle, styles.cornerTR]}>
          <View style={[styles.cornerR]} />
          <View style={[styles.cornerT]} />
        </View>
        <View {...blPan.panHandlers} style={[styles.cornerHandle, styles.cornerBL]}>
          <View style={[styles.cornerL]} />
          <View style={[styles.cornerB]} />
        </View>
        <View {...brPan.panHandlers} style={[styles.cornerHandle, styles.cornerBR]}>
          <View style={[styles.cornerR]} />
          <View style={[styles.cornerB]} />
        </View>
      </View>

      {/* Aspect ratio picker at bottom */}
      <View style={styles.ratioContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.ratioScroll}
        >
          {ASPECT_RATIOS.map((r) => (
            <TouchableOpacity
              key={r.value}
              style={[
                styles.ratioBtn,
                aspectRatio === r.value && styles.ratioBtnActive,
              ]}
              onPress={() => onAspectRatioChange(r.value)}
            >
              <Text style={[styles.ratioIcon, aspectRatio === r.value && styles.ratioIconActive]}>
                {r.icon}
              </Text>
              <Text style={[styles.ratioLabel, aspectRatio === r.value && styles.ratioLabelActive]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const CORNER_THICKNESS = 3;
const CORNER_LENGTH = 20;

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  cropBorder: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    overflow: 'visible',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  edgeHandle: {
    position: 'absolute',
  },
  edgeTop: {
    top: -10,
    left: HANDLE_SIZE,
    right: HANDLE_SIZE,
    height: 24,
  },
  edgeBottom: {
    bottom: -10,
    left: HANDLE_SIZE,
    right: HANDLE_SIZE,
    height: 24,
  },
  edgeLeft: {
    left: -10,
    top: HANDLE_SIZE,
    bottom: HANDLE_SIZE,
    width: 24,
  },
  edgeRight: {
    right: -10,
    top: HANDLE_SIZE,
    bottom: HANDLE_SIZE,
    width: 24,
  },
  cornerHandle: {
    position: 'absolute',
    width: HANDLE_SIZE + 8,
    height: HANDLE_SIZE + 8,
  },
  cornerTL: { top: -CORNER_THICKNESS, left: -CORNER_THICKNESS },
  cornerTR: { top: -CORNER_THICKNESS, right: -CORNER_THICKNESS },
  cornerBL: { bottom: -CORNER_THICKNESS, left: -CORNER_THICKNESS },
  cornerBR: { bottom: -CORNER_THICKNESS, right: -CORNER_THICKNESS },
  cornerL: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: CORNER_THICKNESS,
    height: CORNER_LENGTH,
    backgroundColor: 'white',
  },
  cornerR: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: CORNER_THICKNESS,
    height: CORNER_LENGTH,
    backgroundColor: 'white',
  },
  cornerT: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: CORNER_LENGTH,
    height: CORNER_THICKNESS,
    backgroundColor: 'white',
  },
  cornerB: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: CORNER_LENGTH,
    height: CORNER_THICKNESS,
    backgroundColor: 'white',
  },
  // Aspect ratio bar
  ratioContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
  },
  ratioScroll: {
    paddingHorizontal: 20,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratioBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    minWidth: 60,
  },
  ratioBtnActive: {
    backgroundColor: '#FFD60A',
    borderColor: '#FFD60A',
  },
  ratioIcon: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 2,
  },
  ratioIconActive: {
    color: '#000',
  },
  ratioLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.3,
  },
  ratioLabelActive: {
    color: '#000',
  },
});
