/**
 * DrawingCanvas.tsx
 *
 * Rewritten using react-native-svg (which you already have installed).
 * No Skia = no touch conflicts. Same pattern that worked in your original code.
 */
import React, { useRef } from 'react';
import { View, PanResponder, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { DrawMode, DrawPath } from './types';

interface Props {
  width: number;
  height: number;
  paths: DrawPath[];
  color: string;
  strokeWidth: number;
  mode: DrawMode;
  onPathsChange: (paths: DrawPath[]) => void;
  enabled: boolean;
}

export const DrawingCanvas: React.FC<Props> = ({
  width,
  height,
  paths,
  color,
  strokeWidth,
  mode,
  onPathsChange,
  enabled,
}) => {
  // Refs so PanResponder (created once) always sees latest values
  const pathsRef      = useRef(paths);
  const colorRef      = useRef(color);
  const strokeRef     = useRef(strokeWidth);
  const modeRef       = useRef(mode);
  const onChangeRef   = useRef(onPathsChange);
  const pointsRef     = useRef<string[]>([]);
  const currentIdRef  = useRef('');

  pathsRef.current    = paths;
  colorRef.current    = color;
  strokeRef.current   = strokeWidth;
  modeRef.current     = mode;
  onChangeRef.current = onPathsChange;

  const resolveWidth  = () =>
    modeRef.current === 'marker' ? strokeRef.current * 2.5 : strokeRef.current;
  const resolveColor  = () =>
    modeRef.current === 'eraser' ? '#000000' : colorRef.current;
  const resolveOpacity = () =>
    modeRef.current === 'marker' ? 0.45 : 1;

  // Created ONCE — same reliable pattern as your original working code
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,

      onPanResponderGrant: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        pointsRef.current = [`M${locationX.toFixed(1)},${locationY.toFixed(1)}`];
        currentIdRef.current = `p_${Date.now()}`;
      },

      onPanResponderMove: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        pointsRef.current.push(`L${locationX.toFixed(1)},${locationY.toFixed(1)}`);

        const newPath: DrawPath = {
          id:          currentIdRef.current,
          path:        pointsRef.current.join(' '),
          color:       resolveColor(),
          strokeWidth: resolveWidth(),
          mode:        modeRef.current,
        };

        const rest = pathsRef.current.filter(p => p.id !== currentIdRef.current);
        onChangeRef.current([...rest, newPath]);
      },

      onPanResponderRelease: () => {
        pointsRef.current = [];
      },
      onPanResponderTerminate: () => {
        pointsRef.current = [];
      },
    })
  ).current;

  return (
    <View
      style={[StyleSheet.absoluteFill, { width, height }]}
      pointerEvents={enabled ? 'auto' : 'none'}
      {...pan.panHandlers}
    >
      <Svg width={width} height={height}>
        {paths.map((p) => (
          <Path
            key={p.id}
            d={p.path}
            stroke={p.color}
            strokeWidth={p.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity={p.mode === 'marker' ? 0.45 : 1}
          />
        ))}
      </Svg>
    </View>
  );
};
