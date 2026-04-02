/**
 * CropOverlay.tsx
 *
 * Simplified crop overlay. The Skia Canvas underneath MUST have
 * pointerEvents="none" on its wrapper for these handles to receive touches.
 */
import React, { useRef } from 'react';
import {
  View, StyleSheet, PanResponder, TouchableOpacity, Text, ScrollView,
} from 'react-native';
import { CropRect, AspectRatio } from './types';

const MIN = 0.12;
const CORNER = 20;
const CORNER_T = 3;

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

const RATIOS: { label: string; value: AspectRatio }[] = [
  { label: 'Free',  value: 'free'  },
  { label: '1:1',   value: '1:1'   },
  { label: '4:3',   value: '4:3'   },
  { label: '3:4',   value: '3:4'   },
  { label: '16:9',  value: '16:9'  },
  { label: '9:16',  value: '9:16'  },
];

const getRatioMult = (r: AspectRatio): number | null => {
  const map: Record<string, number> = { '1:1': 1, '4:3': 4/3, '3:4': 3/4, '16:9': 16/9, '9:16': 9/16 };
  return map[r] ?? null;
};

type Handle = 'tl' | 'tr' | 'bl' | 'br';

interface Props {
  containerWidth: number;
  containerHeight: number;
  cropRect: CropRect;
  aspectRatio: AspectRatio;
  onCropChange: (r: CropRect) => void;
  onAspectRatioChange: (r: AspectRatio) => void;
  visible: boolean;
}

export const CropOverlay: React.FC<Props> = ({
  containerWidth: cW,
  containerHeight: cH,
  cropRect,
  aspectRatio,
  onCropChange,
  onAspectRatioChange,
  visible,
}) => {
  const rectRef = useRef(cropRect);
  rectRef.current = cropRect;

  const applyRatio = (r: CropRect): CropRect => {
    const mult = getRatioMult(aspectRatio);
    if (!mult) return r;
    // Fix width, derive height using pixel ratio
    const pixelRatio = cW / cH;
    const newH = r.width / (mult * pixelRatio);
    return { ...r, height: clamp(newH, MIN, 1 - r.y) };
  };

  const makePan = (handle: Handle) =>
    useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => visible,
        onStartShouldSetPanResponderCapture: () => visible,
        onMoveShouldSetPanResponder: () => visible,
        onMoveShouldSetPanResponderCapture: () => visible,
        onPanResponderMove: (_, gs) => {
          const dx = gs.dx / cW;
          const dy = gs.dy / cH;
          let r = { ...rectRef.current };

          if (handle === 'tl' || handle === 'bl') {
            const nx = clamp(r.x + dx, 0, r.x + r.width - MIN);
            r.width += r.x - nx;
            r.x = nx;
          }
          if (handle === 'tr' || handle === 'br') {
            r.width = clamp(r.width + dx, MIN, 1 - r.x);
          }
          if (handle === 'tl' || handle === 'tr') {
            const ny = clamp(r.y + dy, 0, r.y + r.height - MIN);
            r.height += r.y - ny;
            r.y = ny;
          }
          if (handle === 'bl' || handle === 'br') {
            r.height = clamp(r.height + dy, MIN, 1 - r.y);
          }

          onCropChange(applyRatio(r));
        },
      })
    ).current;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const tlPan = makePan('tl');
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const trPan = makePan('tr');
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const blPan = makePan('bl');
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const brPan = makePan('br');

  if (!visible) return null;

  const left   = cropRect.x * cW;
  const top    = cropRect.y * cH;
  const width  = cropRect.width * cW;
  const height = cropRect.height * cH;
  const t3W    = width / 3;
  const t3H    = height / 3;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Dark mask — 4 pieces around the crop window */}
      <View style={[styles.mask, { height: top }]} />
      <View style={[styles.mask, { top, height, left: 0,       width: left,         position: 'absolute' }]} />
      <View style={[styles.mask, { top, height, left: left + width, right: 0,       position: 'absolute' }]} />
      <View style={[styles.mask, { top: top + height, bottom: 0 }]} />

      {/* Crop rectangle */}
      <View style={[styles.cropRect, { left, top, width, height }]}>
        {/* Rule-of-thirds grid */}
        <View style={[styles.gridV, { left: t3W }]} />
        <View style={[styles.gridV, { left: t3W * 2 }]} />
        <View style={[styles.gridH, { top: t3H }]} />
        <View style={[styles.gridH, { top: t3H * 2 }]} />

        {/* Corner handles */}
        <View {...tlPan.panHandlers} style={[styles.handle, styles.handleTL]}>
          <View style={[styles.cornerH, { top: 0, left: 0 }]} />
          <View style={[styles.cornerV, { top: 0, left: 0 }]} />
        </View>
        <View {...trPan.panHandlers} style={[styles.handle, styles.handleTR]}>
          <View style={[styles.cornerH, { top: 0, right: 0 }]} />
          <View style={[styles.cornerV, { top: 0, right: 0 }]} />
        </View>
        <View {...blPan.panHandlers} style={[styles.handle, styles.handleBL]}>
          <View style={[styles.cornerH, { bottom: 0, left: 0 }]} />
          <View style={[styles.cornerV, { bottom: 0, left: 0 }]} />
        </View>
        <View {...brPan.panHandlers} style={[styles.handle, styles.handleBR]}>
          <View style={[styles.cornerH, { bottom: 0, right: 0 }]} />
          <View style={[styles.cornerV, { bottom: 0, right: 0 }]} />
        </View>
      </View>

      {/* Aspect ratio strip */}
      <View style={styles.ratioBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.ratioScroll}
        >
          {RATIOS.map(r => {
            const active = r.value === aspectRatio;
            return (
              <TouchableOpacity
                key={r.value}
                style={[styles.ratioBtn, active && styles.ratioBtnActive]}
                onPress={() => onAspectRatioChange(r.value)}
              >
                <Text style={[styles.ratioTxt, active && styles.ratioTxtActive]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mask: {
    position: 'absolute', left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  cropRect: {
    position: 'absolute',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  gridV: {
    position: 'absolute', top: 0, bottom: 0,
    width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.3)',
  },
  gridH: {
    position: 'absolute', left: 0, right: 0,
    height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.3)',
  },
  handle: {
    position: 'absolute', width: 36, height: 36,
  },
  handleTL: { top: -CORNER_T, left: -CORNER_T },
  handleTR: { top: -CORNER_T, right: -CORNER_T },
  handleBL: { bottom: -CORNER_T, left: -CORNER_T },
  handleBR: { bottom: -CORNER_T, right: -CORNER_T },
  cornerH: {
    position: 'absolute', height: CORNER_T, width: CORNER, backgroundColor: '#fff',
  },
  cornerV: {
    position: 'absolute', width: CORNER_T, height: CORNER, backgroundColor: '#fff',
  },
  // Aspect ratio bar
  ratioBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingVertical: 10, backgroundColor: 'rgba(0,0,0,0.4)',
  },
  ratioScroll: {
    paddingHorizontal: 16, gap: 8, flexDirection: 'row',
  },
  ratioBtn: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  ratioBtnActive: {
    backgroundColor: '#FFD60A', borderColor: '#FFD60A',
  },
  ratioTxt: {
    fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.75)',
  },
  ratioTxtActive: { color: '#000' },
});
