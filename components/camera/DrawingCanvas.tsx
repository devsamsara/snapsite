import React, { useRef, useCallback, useMemo } from 'react';
import { StyleSheet, View, PanResponder } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  useCanvasRef,
} from '@shopify/react-native-skia';
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
  const canvasRef = useCanvasRef();
  const currentSkiaPath = useRef<ReturnType<typeof Skia.Path.Make> | null>(null);
  const currentIdRef = useRef<string>('');
  // Keep a ref so PanResponder callbacks always see latest paths without stale closure
  const pathsRef = useRef<DrawPath[]>(paths);
  pathsRef.current = paths;

  const resolvedWidth = mode === 'marker' ? strokeWidth * 2.5 : strokeWidth;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => enabled,
        onMoveShouldSetPanResponder: () => enabled,
        onStartShouldSetPanResponderCapture: () => enabled,
        onMoveShouldSetPanResponderCapture: () => enabled,

        onPanResponderGrant: (e) => {
          const { locationX, locationY } = e.nativeEvent;
          const skPath = Skia.Path.Make();
          skPath.moveTo(locationX, locationY);
          currentSkiaPath.current = skPath;
          currentIdRef.current = `path_${Date.now()}_${Math.random()}`;
        },

        onPanResponderMove: (e) => {
          if (!currentSkiaPath.current) return;
          const { locationX, locationY } = e.nativeEvent;
          currentSkiaPath.current.lineTo(locationX, locationY);

          const newPath: DrawPath = {
            id: currentIdRef.current,
            path: currentSkiaPath.current.toSVGString(),
            color: mode === 'eraser' ? '#000000' : color,
            strokeWidth: resolvedWidth,
            mode,
          };

          const existing = pathsRef.current.filter(
            (p) => p.id !== currentIdRef.current
          );
          onPathsChange([...existing, newPath]);
        },

        onPanResponderRelease: () => {
          currentSkiaPath.current = null;
        },

        onPanResponderTerminate: () => {
          currentSkiaPath.current = null;
        },
      }),
    // Recreate when drawing params change (new tool/color/size selected)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enabled, color, resolvedWidth, mode]
  );

  const renderPath = useCallback((drawPath: DrawPath) => {
    const skPath = Skia.Path.MakeFromSVGString(drawPath.path);
    if (!skPath) return null;

    const isEraser = drawPath.mode === 'eraser';
    const isMarker = drawPath.mode === 'marker';

    return (
      <Path
        key={drawPath.id}
        path={skPath}
        color={isEraser ? '#000000' : drawPath.color}
        style="stroke"
        strokeWidth={drawPath.strokeWidth}
        strokeCap="round"
        strokeJoin="round"
        opacity={isMarker ? 0.45 : 1}
        blendMode={isEraser ? 'clear' : 'srcOver'}
      />
    );
  }, []);

  return (
    <View
      style={[styles.container, { width, height }]}
      pointerEvents={enabled ? 'auto' : 'none'}
      {...panResponder.panHandlers}
    >
      <Canvas ref={canvasRef} style={{ width, height }}>
        {paths.map(renderPath)}
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
