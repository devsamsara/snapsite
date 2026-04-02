import React, { useRef, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  useTouchHandler,
  useCanvasRef,
  BlendMode,
  StrokeCap,
  StrokeJoin,
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
  const currentPathRef = useRef<ReturnType<typeof Skia.Path.Make> | null>(null);
  const currentIdRef = useRef<string>('');
  const pathsRef = useRef<DrawPath[]>(paths);
  pathsRef.current = paths;

  const resolvedColor = mode === 'eraser' ? 'transparent' : color;
  const resolvedWidth = mode === 'marker' ? strokeWidth * 3 : strokeWidth;
  const resolvedOpacity = mode === 'marker' ? 0.5 : 1;

  const touchHandler = useTouchHandler(
    {
      onStart: ({ x, y }) => {
        if (!enabled) return;
        const skPath = Skia.Path.Make();
        skPath.moveTo(x, y);
        currentPathRef.current = skPath;
        currentIdRef.current = `path_${Date.now()}`;
      },

      onActive: ({ x, y }) => {
        if (!enabled || !currentPathRef.current) return;
        currentPathRef.current.lineTo(x, y);

        const newPath: DrawPath = {
          id: currentIdRef.current,
          path: currentPathRef.current.toSVGString(),
          color: resolvedColor,
          strokeWidth: resolvedWidth,
          mode,
        };

        const existing = pathsRef.current.filter(
          (p) => p.id !== currentIdRef.current
        );
        onPathsChange([...existing, newPath]);
      },

      onEnd: () => {
        currentPathRef.current = null;
      },
    },
    [enabled, resolvedColor, resolvedWidth, mode]
  );

  const renderPath = useCallback(
    (drawPath: DrawPath) => {
      const skPath = Skia.Path.MakeFromSVGString(drawPath.path);
      if (!skPath) return null;

      const paint = Skia.Paint();
      paint.setAntiAlias(true);
      paint.setStrokeWidth(drawPath.strokeWidth);
      paint.setStrokeCap(StrokeCap.Round);
      paint.setStrokeJoin(StrokeJoin.Round);
      paint.setStyle(1); // Stroke

      if (drawPath.mode === 'eraser') {
        paint.setBlendMode(BlendMode.Clear);
      }

      return (
        <Path
          key={drawPath.id}
          path={skPath}
          color={drawPath.mode === 'eraser' ? 'transparent' : drawPath.color}
          style="stroke"
          strokeWidth={drawPath.strokeWidth}
          strokeCap="round"
          strokeJoin="round"
          opacity={drawPath.mode === 'marker' ? 0.5 : 1}
          blendMode={drawPath.mode === 'eraser' ? 'clear' : 'srcOver'}
        />
      );
    },
    []
  );

  return (
    <View style={[styles.container, { width, height }]} pointerEvents={enabled ? 'auto' : 'none'}>
      <Canvas
        ref={canvasRef}
        style={{ width, height }}
        onTouch={touchHandler}
      >
        {paths.map(renderPath)}
      </Canvas>
    </View>
  );
};

// Expose the canvas ref snapshot capability
export const captureCanvas = (
  canvasRef: React.RefObject<ReturnType<typeof useCanvasRef>>
) => {
  return canvasRef.current?.makeImageSnapshot();
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
