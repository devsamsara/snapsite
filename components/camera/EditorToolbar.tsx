import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { EditorTool, DrawMode, DRAW_COLORS, STROKE_WIDTHS } from './types';

interface Props {
  activeTool: EditorTool;
  onToolChange: (tool: EditorTool) => void;
  // Draw sub-tools
  drawMode: DrawMode;
  drawColor: string;
  strokeWidth: number;
  onDrawModeChange: (mode: DrawMode) => void;
  onColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onUndo: () => void;
  canUndo: boolean;
  // Rotate sub-tools
  onRotate: () => void;
  onFlip: () => void;
  onReset: () => void;
}

const TOOL_TABS: { id: EditorTool; label: string; icon: string }[] = [
  { id: 'adjust', label: 'Adjust', icon: '◐' },
  { id: 'draw', label: 'Markup', icon: '✎' },
  { id: 'crop', label: 'Crop', icon: '⊡' },
  { id: 'rotate', label: 'Rotate', icon: '↺' },
];

const DRAW_MODES: { id: DrawMode; label: string; icon: string }[] = [
  { id: 'pen', label: 'Pen', icon: '✒' },
  { id: 'marker', label: 'Marker', icon: '〃' },
  { id: 'eraser', label: 'Erase', icon: '⌫' },
];

export const EditorToolbar: React.FC<Props> = ({
  activeTool,
  onToolChange,
  drawMode,
  drawColor,
  strokeWidth,
  onDrawModeChange,
  onColorChange,
  onStrokeWidthChange,
  onUndo,
  canUndo,
  onRotate,
  onFlip,
  onReset,
}) => {
  return (
    <View style={styles.container}>
      {/* Sub-tool panels */}
      {activeTool === 'draw' && (
        <View style={styles.subPanel}>
          {/* Draw modes */}
          <View style={styles.drawModeRow}>
            {DRAW_MODES.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[styles.modeBtn, drawMode === m.id && styles.modeBtnActive]}
                onPress={() => onDrawModeChange(m.id)}
              >
                <Text style={[styles.modeIcon, drawMode === m.id && styles.modeIconActive]}>
                  {m.icon}
                </Text>
                <Text style={[styles.modeLabel, drawMode === m.id && styles.modeLabelActive]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.modeBtn, !canUndo && styles.modeBtnDisabled]}
              onPress={onUndo}
              disabled={!canUndo}
            >
              <Text style={[styles.modeIcon, !canUndo && styles.modeIconDisabled]}>⤺</Text>
              <Text style={[styles.modeLabel, !canUndo && styles.modeLabelDisabled]}>Undo</Text>
            </TouchableOpacity>
          </View>

          {/* Color picker */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.colorRow}
          >
            {DRAW_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => onColorChange(c)}
                style={[
                  styles.colorDot,
                  { backgroundColor: c },
                  c === drawColor && styles.colorDotActive,
                  c === '#FFFFFF' && styles.colorDotWhite,
                ]}
              >
                {c === drawColor && <View style={styles.colorDotCheck} />}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Stroke width */}
          <View style={styles.strokeRow}>
            <Text style={styles.strokeLabel}>Size</Text>
            {STROKE_WIDTHS.map((w) => (
              <TouchableOpacity
                key={w}
                style={[styles.strokeBtn, strokeWidth === w && styles.strokeBtnActive]}
                onPress={() => onStrokeWidthChange(w)}
              >
                <View
                  style={[
                    styles.strokeDot,
                    {
                      width: w * 1.5,
                      height: w * 1.5,
                      backgroundColor:
                        strokeWidth === w ? '#FFD60A' : 'rgba(255,255,255,0.6)',
                    },
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {activeTool === 'rotate' && (
        <View style={styles.subPanel}>
          <View style={styles.rotateRow}>
            <TouchableOpacity style={styles.rotateBtn} onPress={onRotate}>
              <Text style={styles.rotateIcon}>↺</Text>
              <Text style={styles.rotateLabel}>Rotate 90°</Text>
            </TouchableOpacity>
            <View style={styles.rotateDivider} />
            <TouchableOpacity style={styles.rotateBtn} onPress={onFlip}>
              <Text style={styles.rotateIcon}>⇔</Text>
              <Text style={styles.rotateLabel}>Flip</Text>
            </TouchableOpacity>
            <View style={styles.rotateDivider} />
            <TouchableOpacity style={styles.rotateBtn} onPress={onReset}>
              <Text style={[styles.rotateIcon, { color: '#FF453A' }]}>↺↺</Text>
              <Text style={[styles.rotateLabel, { color: '#FF453A' }]}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Main tab bar */}
      <BlurView intensity={80} tint="dark" style={styles.tabBar}>
        {TOOL_TABS.map((tab) => {
          const isActive = activeTool === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tab}
              onPress={() => onToolChange(tab.id)}
            >
              <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>
                {tab.icon}
              </Text>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  subPanel: {
    backgroundColor: 'rgba(28,28,30,0.95)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
    gap: 12,
  },
  // Draw tools
  drawModeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  modeBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    minWidth: 68,
  },
  modeBtnActive: {
    backgroundColor: '#FFD60A',
  },
  modeBtnDisabled: {
    opacity: 0.35,
  },
  modeIcon: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 2,
  },
  modeIconActive: {
    color: '#000',
  },
  modeIconDisabled: {
    color: 'rgba(255,255,255,0.3)',
  },
  modeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.3,
  },
  modeLabelActive: {
    color: '#000',
  },
  modeLabelDisabled: {
    color: 'rgba(255,255,255,0.25)',
  },
  colorRow: {
    paddingHorizontal: 4,
    gap: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorDotWhite: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  colorDotActive: {
    transform: [{ scale: 1.25 }],
    shadowColor: '#fff',
    shadowOpacity: 0.5,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  colorDotCheck: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  strokeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 4,
  },
  strokeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  strokeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  strokeBtnActive: {
    backgroundColor: 'rgba(255,214,10,0.18)',
  },
  strokeDot: {
    borderRadius: 20,
  },
  // Rotate tools
  rotateRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  rotateBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  rotateIcon: {
    fontSize: 28,
    color: '#FFD60A',
    marginBottom: 4,
  },
  rotateLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.3,
  },
  rotateDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  // Tab bar
  tabBar: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingBottom: 24,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  tabIcon: {
    fontSize: 22,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 3,
  },
  tabIconActive: {
    color: '#FFD60A',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.4,
  },
  tabLabelActive: {
    color: '#FFD60A',
  },
  tabIndicator: {
    position: 'absolute',
    top: 0,
    width: 28,
    height: 2,
    backgroundColor: '#FFD60A',
    borderRadius: 1,
  },
});
