/**
 * image-editor.tsx — v6  (react-native-svg, sin Skia)
 *
 * Migración: @shopify/react-native-skia → react-native-svg
 * Motivo: Skia + Reanimated + VisionCamera compiten por el mismo recurso JSI,
 * lo que provoca EXC_BAD_ACCESS (SIGSEGV) en producción al inicializar el
 * runtime de Hermes. react-native-svg opera exclusivamente en el hilo de UI
 * mediante el bridge nativo estándar, eliminando el conflicto JSI.
 *
 * Funcionalidades preservadas:
 *   - Dibujo libre (freehand paths en SVG)
 *   - Flechas (línea + cabeza de flecha calculada trigonométricamente)
 *   - Rectángulos y círculos (filled / stroke)
 *   - Anotaciones de medida con etiqueta
 *   - Stickers de texto (drag + pinch con Reanimated/Gesture Handler)
 *   - Recorte interactivo (crop) con 4 esquinas Reanimated
 *   - Rotación de imagen
 *   - Undo / Redo / Clear
 *   - Guardar en galería con react-native-view-shot
 *
 * Layout:
 *   ┌─────────────────────────────┐  ← SafeAreaView top (status bar + notch)
 *   │  [Cancelar]  Anotar  [Guardar] │  ← Stack.Screen header (native nav bar)
 *   ├─────────────────────────────┤
 *   │                             │
 *   │        IMAGE  (contain)     │  ← flex:1, image never overflows
 *   │                             │
 *   ├─────────────────────────────┤
 *   │  [options row if tool active]│  ← color/stroke/size pickers
 *   │  [◉ Draw][T Text][→ Arrow]… │  ← tool strip
 *   └─────────────────────────────┘  ← SafeAreaView bottom (home indicator)
 */

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams, Stack, useFocusEffect } from "expo-router";
import { annotationTextStore, annotationMeasureStore } from "@/lib/modal-stores";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── react-native-svg (reemplaza @shopify/react-native-skia) ──────────────────
import Svg, {
  Path as SvgPath,
  Line as SvgLine,
  Rect as SvgRect,
  Ellipse as SvgEllipse,
  G as SvgG,
  Defs,
  Marker,
} from "react-native-svg";

import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  type SharedValue,
} from "react-native-reanimated";
import { captureRef } from "react-native-view-shot";
import * as MediaLibrary from "expo-media-library";
import * as ImageManipulator from "expo-image-manipulator";
import * as Haptics from "expo-haptics";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppAlert } from '@/components/ui/app-alert';
import { ensureFileUri, uploadPhoto } from '@/lib/upload-service';
import { useColors } from '@/hooks/use-colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useApolloClient } from '@apollo/client';
import { GetMyProjectsDocument } from '@/gql/graphql';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tool = "draw" | "text" | "arrow" | "rect" | "circle" | "measure" | "crop";

interface DrawPath   { id: string; d: string; color: string; sw: number }
interface TextAnn    { id: string; text: string; x: number; y: number; color: string; fontSize: number }
interface ArrowAnn   { id: string; x1: number; y1: number; x2: number; y2: number; color: string; sw: number }
interface ShapeAnn   { id: string; type: "rect" | "circle"; x: number; y: number; x2: number; y2: number; color: string; sw: number; filled: boolean }
interface MeasureAnn { id: string; x1: number; y1: number; x2: number; y2: number; color: string; label: string }

// ─── Constants ────────────────────────────────────────────────────────────────

const PALETTE   = ["#FFFFFF","#000000","#FF3B30","#FF9500","#FFCC00","#34C759","#5AC8FA","#007AFF","#5856D6","#FF2D55"];
const STROKES   = [2, 4, 7, 12, 20];
const FONTSIZES = [14, 18, 22, 28, 36];

const TOOLS_DEF: { id: Tool; icon: string; label: string }[] = [
  { id: "draw",    icon: "edit",                   label: "Dibujar"  },
  { id: "text",    icon: "title",                  label: "Texto"    },
  { id: "arrow",   icon: "arrow-forward",          label: "Flecha"   },
  { id: "rect",    icon: "crop-square",            label: "Rect."    },
  { id: "circle",  icon: "radio-button-unchecked", label: "Círculo"  },
  { id: "measure", icon: "straighten",             label: "Medida"   },
  { id: "crop",    icon: "crop",                   label: "Recortar" },
];

const uid = () => Math.random().toString(36).slice(2, 9);
const pdist = (x1: number, y1: number, x2: number, y2: number) =>
  Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

// ─── SVG helpers ──────────────────────────────────────────────────────────────

/**
 * Construye los datos SVG de una cabeza de flecha.
 * Devuelve dos segmentos de línea como string de path SVG.
 */
function arrowHeadPath(a: ArrowAnn): string {
  const ang = Math.atan2(a.y2 - a.y1, a.x2 - a.x1);
  const hl = 14;
  const lx1 = a.x2 - hl * Math.cos(ang - Math.PI / 6);
  const ly1 = a.y2 - hl * Math.sin(ang - Math.PI / 6);
  const lx2 = a.x2 - hl * Math.cos(ang + Math.PI / 6);
  const ly2 = a.y2 - hl * Math.sin(ang + Math.PI / 6);
  return `M ${a.x2} ${a.y2} L ${lx1} ${ly1} M ${a.x2} ${a.y2} L ${lx2} ${ly2}`;
}

/**
 * Construye el path SVG de las marcas perpendiculares de una anotación de medida.
 */
function measureTickPath(m: MeasureAnn): string {
  const ang = Math.atan2(m.y2 - m.y1, m.x2 - m.x1);
  const perp = ang + Math.PI / 2;
  const tk = 6;
  return [
    `M ${m.x1 + tk * Math.cos(perp)} ${m.y1 + tk * Math.sin(perp)}`,
    `L ${m.x1 - tk * Math.cos(perp)} ${m.y1 - tk * Math.sin(perp)}`,
    `M ${m.x2 + tk * Math.cos(perp)} ${m.y2 + tk * Math.sin(perp)}`,
    `L ${m.x2 - tk * Math.cos(perp)} ${m.y2 - tk * Math.sin(perp)}`,
  ].join(" ");
}

// ─── SVG Overlay ──────────────────────────────────────────────────────────────

interface SvgOverlayProps {
  width: number;
  height: number;
  paths: DrawPath[];
  arrows: ArrowAnn[];
  liveArrow: ArrowAnn | null;
  shapes: ShapeAnn[];
  liveShape: ShapeAnn | null;
  measures: MeasureAnn[];
  liveMeasure: MeasureAnn | null;
}

/**
 * Componente SVG puro que renderiza todas las anotaciones vectoriales.
 * No usa JSI ni worklets — opera en el hilo de UI mediante el bridge estándar.
 */
const SvgOverlay = React.memo(function SvgOverlay({
  width,
  height,
  paths,
  arrows,
  liveArrow,
  shapes,
  liveShape,
  measures,
  liveMeasure,
}: SvgOverlayProps) {
  if (width === 0 || height === 0) return null;

  const allArrows  = liveArrow   ? [...arrows,   liveArrow]   : arrows;
  const allShapes  = liveShape   ? [...shapes,   liveShape]   : shapes;
  const allMeasures = liveMeasure ? [...measures, liveMeasure] : measures;

  return (
    <Svg
      width={width}
      height={height}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      {/* Freehand paths */}
      {paths.map((p) => (
        <SvgPath
          key={p.id}
          d={p.d}
          stroke={p.color}
          strokeWidth={p.sw}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}

      {/* Arrows */}
      {allArrows.map((a) => (
        <SvgG key={a.id}>
          {/* Shaft */}
          <SvgPath
            d={`M ${a.x1} ${a.y1} L ${a.x2} ${a.y2}`}
            stroke={a.color}
            strokeWidth={a.sw}
            fill="none"
            strokeLinecap="round"
          />
          {/* Arrowhead */}
          <SvgPath
            d={arrowHeadPath(a)}
            stroke={a.color}
            strokeWidth={a.sw}
            fill="none"
            strokeLinecap="round"
          />
        </SvgG>
      ))}

      {/* Shapes (rect / circle) */}
      {allShapes.map((s) => {
        const x = Math.min(s.x, s.x2);
        const y = Math.min(s.y, s.y2);
        const w = Math.abs(s.x2 - s.x);
        const h = Math.abs(s.y2 - s.y);
        if (s.type === "rect") {
          return (
            <SvgRect
              key={s.id}
              x={x}
              y={y}
              width={w}
              height={h}
              stroke={s.color}
              strokeWidth={s.sw}
              fill={s.filled ? s.color : "none"}
              fillOpacity={s.filled ? 0.35 : 0}
            />
          );
        }
        // circle → SVG Ellipse
        return (
          <SvgEllipse
            key={s.id}
            cx={x + w / 2}
            cy={y + h / 2}
            rx={w / 2}
            ry={h / 2}
            stroke={s.color}
            strokeWidth={s.sw}
            fill={s.filled ? s.color : "none"}
            fillOpacity={s.filled ? 0.35 : 0}
          />
        );
      })}

      {/* Measure lines */}
      {allMeasures.map((m) => (
        <SvgG key={m.id}>
          {/* Main line */}
          <SvgPath
            d={`M ${m.x1} ${m.y1} L ${m.x2} ${m.y2}`}
            stroke={m.color}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
          />
          {/* Tick marks */}
          <SvgPath
            d={measureTickPath(m)}
            stroke={m.color}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
          />
        </SvgG>
      ))}
    </Svg>
  );
});

// ─── Text Sticker — drag + pinch (WhatsApp style) ─────────────────────────────

function TextSticker({
  ann, onUpdate, active,
}: { ann: TextAnn; onUpdate: (id: string, p: Partial<TextAnn>) => void; active: boolean }) {
  const tx = useSharedValue(ann.x);
  const ty = useSharedValue(ann.y);
  const sc = useSharedValue(1);
  const sc0 = useSharedValue(1);
  const bx = useSharedValue(ann.x);
  const by = useSharedValue(ann.y);

  useEffect(() => { tx.value = ann.x; ty.value = ann.y; }, [ann.x, ann.y]);

  const pan = Gesture.Pan()
    .onStart(() => { bx.value = tx.value; by.value = ty.value; })
    .onUpdate((g) => { tx.value = bx.value + g.translationX; ty.value = by.value + g.translationY; })
    .onEnd(() => { runOnJS(onUpdate)(ann.id, { x: tx.value, y: ty.value }); });

  const pinch = Gesture.Pinch()
    .onStart(() => { sc0.value = sc.value; })
    .onUpdate((g) => { sc.value = Math.max(0.4, Math.min(6, sc0.value * g.scale)); })
    .onEnd(() => {
      const fs = Math.round(ann.fontSize * sc.value);
      runOnJS(onUpdate)(ann.id, { fontSize: Math.max(8, Math.min(120, fs)) });
      sc.value = 1; sc0.value = 1;
    });

  const gesture = active ? Gesture.Simultaneous(pan, pinch) : Gesture.Tap();

  const style = useAnimatedStyle(() => ({
    position: "absolute", left: tx.value, top: ty.value,
    transform: [{ scale: sc.value }], zIndex: 20,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={style}>
        <View style={S.stickerBg}>
          <Text style={[S.stickerTxt, { color: ann.color, fontSize: ann.fontSize }]}>{ann.text}</Text>
        </View>
        {active && (
          <View style={S.stickerDot}>
            <MaterialIcons name="open-with" size={10} color="#FFF" />
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

// ─── Crop Overlay (worklet, 4 corners) ────────────────────────────────────────

function CropOverlay({ cT, cL, cR, cB }: { cT: SharedValue<number>; cL: SharedValue<number>; cR: SharedValue<number>; cB: SharedValue<number> }) {
  const dT = useAnimatedStyle(() => ({ position: "absolute", left: 0, right: 0, top: 0, height: cT.value, backgroundColor: "rgba(0,0,0,0.55)" }));
  const dB = useAnimatedStyle(() => ({ position: "absolute", left: 0, right: 0, bottom: 0, height: cB.value, backgroundColor: "rgba(0,0,0,0.55)" }));
  const dL = useAnimatedStyle(() => ({ position: "absolute", left: 0, top: cT.value, bottom: cB.value, width: cL.value, backgroundColor: "rgba(0,0,0,0.55)" }));
  const dR = useAnimatedStyle(() => ({ position: "absolute", right: 0, top: cT.value, bottom: cB.value, width: cR.value, backgroundColor: "rgba(0,0,0,0.55)" }));
  const br = useAnimatedStyle(() => ({ position: "absolute", top: cT.value, left: cL.value, right: cR.value, bottom: cB.value, borderWidth: 1.5, borderColor: "#FFF" }));
  const gr = useAnimatedStyle(() => ({ position: "absolute", top: cT.value, left: cL.value, right: cR.value, bottom: cB.value }));
  return (
    <>
      <Animated.View style={dT} pointerEvents="none" />
      <Animated.View style={dB} pointerEvents="none" />
      <Animated.View style={dL} pointerEvents="none" />
      <Animated.View style={dR} pointerEvents="none" />
      <Animated.View style={br} pointerEvents="none" />
      <Animated.View style={gr} pointerEvents="none">
        <View style={[S.gridLine, { top: "33%", width: "100%", height: 1 }]} />
        <View style={[S.gridLine, { top: "66%", width: "100%", height: 1 }]} />
        <View style={[S.gridLine, { left: "33%", height: "100%", width: 1 }]} />
        <View style={[S.gridLine, { left: "66%", height: "100%", width: 1 }]} />
      </Animated.View>
    </>
  );
}

function CropCorner({
  corner, cT, cL, cR, cB, imgW, imgH,
}: { corner: "TL" | "TR" | "BL" | "BR"; cT: SharedValue<number>; cL: SharedValue<number>; cR: SharedValue<number>; cB: SharedValue<number>; imgW: number; imgH: number }) {
  const MIN = 60;
  const g = Gesture.Pan().onUpdate((e) => {
    "worklet";
    if (corner === "TL")      { cT.value = Math.max(0, Math.min(imgH - cB.value - MIN, e.y));  cL.value = Math.max(0, Math.min(imgW - cR.value - MIN, e.x)); }
    else if (corner === "TR") { cT.value = Math.max(0, Math.min(imgH - cB.value - MIN, e.y));  cR.value = Math.max(0, Math.min(imgW - cL.value - MIN, imgW - e.x)); }
    else if (corner === "BL") { cB.value = Math.max(0, Math.min(imgH - cT.value - MIN, imgH - e.y)); cL.value = Math.max(0, Math.min(imgW - cR.value - MIN, e.x)); }
    else                      { cB.value = Math.max(0, Math.min(imgH - cT.value - MIN, imgH - e.y)); cR.value = Math.max(0, Math.min(imgW - cL.value - MIN, imgW - e.x)); }
  });
  const style = useAnimatedStyle(() => {
    "worklet";
    const base = { position: "absolute" as const, width: 28, height: 28, zIndex: 30 };
    if (corner === "TL") return { ...base, top: cT.value - 14,    left: cL.value - 14  };
    if (corner === "TR") return { ...base, top: cT.value - 14,    right: cR.value - 14 };
    if (corner === "BL") return { ...base, bottom: cB.value - 14, left: cL.value - 14  };
    return                     { ...base, bottom: cB.value - 14, right: cR.value - 14 };
  });
  return (
    <GestureDetector gesture={g}>
      <Animated.View style={[S.cropHandle, style]} />
    </GestureDetector>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
// El image-editor siempre arranca en modo editor.
// La selección de cámara/galería ocurre en add-photo-modal (ruta anterior).
export default function ImageEditorScreen() {
  const router     = useRouter();
  const insets     = useSafeAreaInsets();
  const colors     = useColors();
  const apolloClient = useApolloClient();
  const { imageUri, projectId, photoId, source } = useLocalSearchParams<{
    imageUri: string;
    projectId?: string;
    photoId?: string;
    source?: string;
  }>();

  // Image state (imageUri viene del add-photo-modal vía router.replace)

  // Image state
  const [imgUri, setImgUri]   = useState(imageUri ?? "");
  const [imgW, setImgW]       = useState(0);
  const [imgH, setImgH]       = useState(0);
  const [imgRot, setImgRot]   = useState(0);
  const [processing, setProc] = useState(false);

  // Tool state
  const [tool, setTool]         = useState<Tool | null>(null);
  const [color, setColor]       = useState(PALETTE[0]);
  const [stroke, setStroke]     = useState(STROKES[1]);
  const [fontSize, setFontSize] = useState(FONTSIZES[2]);
  const [filled, setFilled]     = useState(false);

  // Annotations
  const [paths, setPaths]       = useState<DrawPath[]>([]);
  const [redo, setRedo]         = useState<DrawPath[]>([]);
  const [texts, setTexts]       = useState<TextAnn[]>([]);
  const [arrows, setArrows]     = useState<ArrowAnn[]>([]);
  const [shapes, setShapes]     = useState<ShapeAnn[]>([]);
  const [measures, setMeasures] = useState<MeasureAnn[]>([]);

  // Live (in-progress) annotations
  const [liveArrow,   setLiveArrow]   = useState<ArrowAnn | null>(null);
  const [liveShape,   setLiveShape]   = useState<ShapeAnn | null>(null);
  const [liveMeasure, setLiveMeasure] = useState<MeasureAnn | null>(null);

  // Pending annotation positions (used when returning from modal)
  const [textPos, setTextPos] = useState({ x: 0, y: 0 });
  const pendingMRef = React.useRef<MeasureAnn | null>(null);

  // Crop shared values (always at top level — no conditional hooks)
  const cT = useSharedValue(0);
  const cL = useSharedValue(0);
  const cR = useSharedValue(0);
  const cB = useSharedValue(0);

  // Canvas container measured size (set by onLayout)
  const [canvasW, setCanvasW] = useState(0);
  const [canvasH, setCanvasH] = useState(0);

  const viewRef = useRef<View>(null);

  // ── Load image ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!imageUri) return;
    setImgUri(imageUri);
    Image.getSize(imageUri, (w, h) => { setImgW(w); setImgH(h); });
  }, [imageUri]);

  // ── Derived: image display size (contain within canvas area) ────────────────
  const { dispW, dispH } = React.useMemo(() => {
    if (!canvasW || !canvasH || !imgW || !imgH) return { dispW: 0, dispH: 0 };
    const ratio = imgW / imgH;
    let w = canvasW, h = canvasW / ratio;
    if (h > canvasH) { h = canvasH; w = canvasH * ratio; }
    return { dispW: Math.floor(w), dispH: Math.floor(h) };
  }, [canvasW, canvasH, imgW, imgH]);

  // ── Derived flags ────────────────────────────────────────────────────────────
  const hasAnn = paths.length > 0 || texts.length > 0 || arrows.length > 0 || shapes.length > 0 || measures.length > 0;
  const canUndo =
    (tool === "draw"    && paths.length   > 0) ||
    (tool === "text"    && texts.length   > 0) ||
    (tool === "arrow"   && arrows.length  > 0) ||
    ((tool === "rect" || tool === "circle") && shapes.length > 0) ||
    (tool === "measure" && measures.length > 0);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // 1. Capturar PRIMERO mientras la vista está intacta
      const uri = await captureRef(viewRef, { format: 'jpg', quality: 0.95 });

      // 2. Ahora sí limpiar animaciones y mostrar loader
      setTool(null);
      cT.value = 0;
      cL.value = 0;
      cR.value = 0;
      cB.value = 0;
      setProc(true);

      const safeUri = await ensureFileUri(uri);

      if (projectId) {
        try {
          await uploadPhoto({
            localUri: safeUri,
            projectId,
            photoId,
            caption: `Picture_${Date.now()}.jpg`,
            tags: [],
          });
          // Refetch projects list so the new photo appears immediately
          await apolloClient.refetchQueries({ include: [GetMyProjectsDocument] }).catch(() => {});
          AppAlert.alert(
            '¡Foto guardada!',
            'La foto se guardó correctamente.',
            [
              {
                text: 'OK',
                onPress: () => router.back(),
              },
            ]
          );
        } catch (uploadErr: any) {
          console.warn('[ImageEditor] Upload failed:', uploadErr?.message);
          const { status } = await MediaLibrary.requestPermissionsAsync();
          if (status === 'granted') await MediaLibrary.saveToLibraryAsync(uri);
          AppAlert.alert(
            'Error al subir',
            `${uploadErr?.message ?? ''}\n\nLa imagen se guardó en tu galería.`,
            [
              {
                text: 'OK',
                onPress: () => router.back(),
              },
            ]
          );
        }
      } else {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          AppAlert.alert(
            'Permiso denegado',
            'Se necesita acceso a la galería.'
          );
          return;
        }
        await MediaLibrary.saveToLibraryAsync(uri);
        AppAlert.alert('¡Guardado!', 'La imagen se guardó en tu galería.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (err: any) {
      console.error('[ImageEditor] handleSave error:', err);
      AppAlert.alert('Error', 'No se pudo guardar la imagen.');
    } finally {
      setProc(false);
    }
  }, [projectId, photoId, router, cT, cL, cR, cB]);
  // Al cancelar: si viene desde add-photos-prompt, ir al inicio.
  // En cualquier otro caso, router.back() cierra el editor limpiamente.
  const handleCancel = useCallback(() => {
    if (source === 'add-photos-prompt') {
      router.replace('/(tabs)');
    } else {
      router.back();
    }
  }, [router, source]);



  const undo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (tool === "draw"    && paths.length   > 0) { const l = paths[paths.length - 1]; setRedo((r) => [l, ...r]); setPaths((p) => p.slice(0, -1)); }
    else if (tool === "text"    && texts.length   > 0) setTexts((p) => p.slice(0, -1));
    else if (tool === "arrow"   && arrows.length  > 0) setArrows((p) => p.slice(0, -1));
    else if ((tool === "rect" || tool === "circle") && shapes.length > 0) setShapes((p) => p.slice(0, -1));
    else if (tool === "measure" && measures.length > 0) setMeasures((p) => p.slice(0, -1));
  };

  const redoAction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (tool === "draw" && redo.length > 0) {
      const f = redo[0]; setRedo((r) => r.slice(1)); setPaths((p) => [...p, f]);
    }
  };

  const clearAll = () => AppAlert.alert("Limpiar", "¿Eliminar todas las anotaciones?", [
    { text: "Cancelar", style: "cancel" },
    { text: "Limpiar", style: "destructive", onPress: () => { setPaths([]); setTexts([]); setArrows([]); setShapes([]); setMeasures([]); setRedo([]); } },
  ]);

  const rotate = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setImgRot((r) => (r + 90) % 360); };

  const applyCrop = async () => {
    setProc(true);
    try {
      const r = await ImageManipulator.manipulateAsync(
        imgUri,
        [{ crop: { originX: cL.value, originY: cT.value, width: dispW - cL.value - cR.value, height: dispH - cT.value - cB.value } }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );
      setImgUri(r.uri);
      setTool(null);
      cT.value = 0; cL.value = 0; cR.value = 0; cB.value = 0;
      Image.getSize(r.uri, (w, h) => { setImgW(w); setImgH(h); });
    } catch { AppAlert.alert("Error", "No se pudo recortar"); }
    finally { setProc(false); }
  };

  // ── Open text annotation modal ────────────────────────────────────────────
  const openTextModal = useCallback((x: number, y: number) => {
    setTextPos({ x, y });
    const promise = annotationTextStore.open();
    router.push({
      pathname: "/modals/annotation-text",
      params: { color, fontSize: String(fontSize), x: String(x), y: String(y) },
    });
    promise.then((result) => {
      if (result) {
        setTexts((p) => [...p, { id: uid(), text: result.text, x: result.x, y: result.y, color: result.color, fontSize: result.fontSize }]);
        setColor(result.color);
        setFontSize(result.fontSize);
      }
    });
  }, [color, fontSize, router]);

  // ── Open measure label modal ─────────────────────────────────────────────
  const openMeasureModal = useCallback((m: MeasureAnn) => {
    pendingMRef.current = m;
    const promise = annotationMeasureStore.open();
    router.push({
      pathname: "/modals/annotation-measure",
      params: { label: m.label, color: m.color },
    });
    promise.then((result) => {
      const pending = pendingMRef.current;
      if (result && pending) {
        setMeasures((p) => [...p, { ...pending, label: result.label }]);
      }
      pendingMRef.current = null;
    });
  }, [router]);

  const updateText = (id: string, patch: Partial<TextAnn>) =>
    setTexts((prev) => prev.map((t) => t.id === id ? { ...t, ...patch } : t));

  // ── Gestures ─────────────────────────────────────────────────────────────────

  const drawG = Gesture.Pan()
    .onStart((g) => { if (tool !== "draw") return; runOnJS(setPaths)((p) => [...p, { id: uid(), d: `M ${g.x} ${g.y}`, color, sw: stroke }]); runOnJS(setRedo)([]); })
    .onUpdate((g) => { if (tool !== "draw") return; runOnJS(setPaths)((p) => { const l = p[p.length - 1]; if (!l) return p; return [...p.slice(0, -1), { ...l, d: `${l.d} L ${g.x} ${g.y}` }]; }); })
    .runOnJS(true);

  const arrowG = Gesture.Pan()
    .onStart((g) => { if (tool !== "arrow") return; runOnJS(setLiveArrow)({ id: uid(), x1: g.x, y1: g.y, x2: g.x, y2: g.y, color, sw: stroke }); })
    .onUpdate((g) => { if (tool !== "arrow") return; runOnJS(setLiveArrow)((p) => p ? { ...p, x2: g.x, y2: g.y } : null); })
    .onEnd(() => { if (tool !== "arrow") return; runOnJS((a: ArrowAnn | null) => { if (a) { setArrows((p) => [...p, a]); setLiveArrow(null); } })(liveArrow); })
    .runOnJS(true);

  const shapeG = Gesture.Pan()
    .onStart((g) => { if (tool !== "rect" && tool !== "circle") return; runOnJS(setLiveShape)({ id: uid(), type: tool as "rect" | "circle", x: g.x, y: g.y, x2: g.x, y2: g.y, color, sw: stroke, filled }); })
    .onUpdate((g) => { if (tool !== "rect" && tool !== "circle") return; runOnJS(setLiveShape)((p) => p ? { ...p, x2: g.x, y2: g.y } : null); })
    .onEnd(() => { if (tool !== "rect" && tool !== "circle") return; runOnJS((s: ShapeAnn | null) => { if (s) { setShapes((p) => [...p, s]); setLiveShape(null); } })(liveShape); })
    .runOnJS(true);

  const measureG = Gesture.Pan()
    .onStart((g) => { if (tool !== "measure") return; runOnJS(setLiveMeasure)({ id: uid(), x1: g.x, y1: g.y, x2: g.x, y2: g.y, color, label: "" }); })
    .onUpdate((g) => { if (tool !== "measure") return; runOnJS(setLiveMeasure)((p) => p ? { ...p, x2: g.x, y2: g.y } : null); })
    .onEnd(() => { if (tool !== "measure") return; runOnJS((m: MeasureAnn | null) => { if (m) { const auto = `${Math.round(pdist(m.x1, m.y1, m.x2, m.y2))}px`; setLiveMeasure(null); openMeasureModal({ ...m, label: auto }); } })(liveMeasure); })
    .runOnJS(true);

  const tapG = Gesture.Tap()
    .onEnd((g) => { if (tool !== "text") return; runOnJS(openTextModal)(g.x, g.y); })
    .runOnJS(true);

  const activeGesture =
    tool === "draw"    ? drawG
    : tool === "arrow" ? arrowG
    : tool === "rect" || tool === "circle" ? shapeG
    : tool === "measure" ? measureG
    : tool === "text"  ? tapG
    : Gesture.Tap();

    // ── Camera helpers ────────────────────────────────────────────────────────────
  // ── Render: EDITOR ────────────────────────────────────────────────────────────
  return (
    <GestureHandlerRootView style={S.root}>
      <SafeAreaView style={S.root} edges={["bottom"]}>

        {/* ── Custom header ── */}
        <View style={[S.editorHeader, { paddingTop: insets.top, height: 52 + insets.top }]}>
          <TouchableOpacity
            onPress={handleCancel}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={S.editorHeaderBtn}
          >
            <Text style={S.editorHeaderCancel}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={S.editorHeaderTitle}>Anotar Foto</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={processing}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={S.editorHeaderBtn}
          >
            <Text style={[S.editorHeaderSave, processing && { opacity: 0.4 }]}>Guardar</Text>
          </TouchableOpacity>
        </View>
        {/* ── Image area — flex:1 so it fills all space between header and toolbar ── */}
        <View
          style={S.canvasArea}
          onLayout={(e) => {
            setCanvasW(e.nativeEvent.layout.width);
            setCanvasH(e.nativeEvent.layout.height);
          }}
        >
          {dispW > 0 && dispH > 0 && (
            <GestureDetector gesture={activeGesture}>
              <View
                ref={viewRef}
                collapsable={false}
                style={[
                  S.imgWrapper,
                  { width: dispW, height: dispH },
                  imgRot !== 0 && { transform: [{ rotate: `${imgRot}deg` }] },
                ]}
              >
                <Image source={{ uri: imgUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />

                {/* SVG overlay — reemplaza el Canvas de Skia, sin JSI */}
                <SvgOverlay
                  width={dispW}
                  height={dispH}
                  paths={paths}
                  arrows={arrows}
                  liveArrow={liveArrow}
                  shapes={shapes}
                  liveShape={liveShape}
                  measures={measures}
                  liveMeasure={liveMeasure}
                />

                {/* Text stickers */}
                {texts.map((t) => (
                  <TextSticker key={t.id} ann={t} onUpdate={updateText} active={tool === "text"} />
                ))}

                {/* Measure labels */}
                {measures.map((m) => (
                  <View
                    key={`lbl-${m.id}`}
                    style={{
                      position: "absolute",
                      left: (m.x1 + m.x2) / 2 - 30,
                      top: (m.y1 + m.y2) / 2 - 18,
                      backgroundColor: "rgba(0,0,0,0.65)",
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 4,
                    }}
                    pointerEvents="none"
                  >
                    <Text style={{ color: m.color, fontSize: 12, fontWeight: "700" }}>{m.label}</Text>
                  </View>
                ))}

                {/* Crop overlay */}
                {tool === "crop" && (
                  <>
                    <CropOverlay cT={cT} cL={cL} cR={cR} cB={cB} />
                    <CropCorner corner="TL" cT={cT} cL={cL} cR={cR} cB={cB} imgW={dispW} imgH={dispH} />
                    <CropCorner corner="TR" cT={cT} cL={cL} cR={cR} cB={cB} imgW={dispW} imgH={dispH} />
                    <CropCorner corner="BL" cT={cT} cL={cL} cR={cR} cB={cB} imgW={dispW} imgH={dispH} />
                    <CropCorner corner="BR" cT={cT} cL={cL} cR={cR} cB={cB} imgW={dispW} imgH={dispH} />
                  </>
                )}
              </View>
            </GestureDetector>
          )}
        </View>

        {/* ── Bottom Toolbar (iOS Markup style) ── */}
        <View style={[S.toolbar, { paddingBottom: Math.max(insets.bottom, 8) }]}>

          {/* Options row — only shown when a tool that needs options is active */}
          {tool !== null && tool !== "crop" && (
            <View style={S.optionsRow}>
              {/* Color palette */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.paletteRow}>
                {PALETTE.map((c) => (
                  <TouchableOpacity key={c} onPress={() => setColor(c)}
                    style={[S.colorDot, { backgroundColor: c }, color === c && S.colorDotActive]} />
                ))}
              </ScrollView>

              {/* Stroke / font size / fill options */}
              <View style={S.subOptions}>
                {tool !== "text" && tool !== "measure" && STROKES.map((w) => (
                  <TouchableOpacity key={w} onPress={() => setStroke(w)} style={[S.subBtn, stroke === w && S.subBtnOn]}>
                    <View style={{ width: w, height: w, borderRadius: w / 2, backgroundColor: color }} />
                  </TouchableOpacity>
                ))}
                {tool === "text" && FONTSIZES.map((fs) => (
                  <TouchableOpacity key={fs} onPress={() => setFontSize(fs)} style={[S.subBtn, fontSize === fs && S.subBtnOn]}>
                    <Text style={{ color: "#FFF", fontSize: 10, fontWeight: "700" }}>{fs}</Text>
                  </TouchableOpacity>
                ))}
                {(tool === "rect" || tool === "circle") && (
                  <TouchableOpacity onPress={() => setFilled((v) => !v)} style={[S.subBtn, filled && S.subBtnOn]}>
                    <MaterialIcons name={filled ? "format-color-fill" : "format-color-reset"} size={18} color="#FFF" />
                  </TouchableOpacity>
                )}
                {/* Undo / redo in options row */}
                <View style={S.subDivider} />
                <TouchableOpacity onPress={undo} disabled={!canUndo} style={S.subBtn}>
                  <MaterialIcons name="undo" size={18} color={canUndo ? "#FFF" : "rgba(255,255,255,0.25)"} />
                </TouchableOpacity>
                <TouchableOpacity onPress={redoAction} disabled={redo.length === 0} style={S.subBtn}>
                  <MaterialIcons name="redo" size={18} color={redo.length > 0 ? "#FFF" : "rgba(255,255,255,0.25)"} />
                </TouchableOpacity>
                {hasAnn && (
                  <TouchableOpacity onPress={clearAll} style={S.subBtn}>
                    <MaterialIcons name="delete-sweep" size={18} color="#FF3B30" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Tool strip */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.toolStrip}>
            {TOOLS_DEF.map((t) => {
              const active = tool === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => { Haptics.selectionAsync(); setTool(active ? null : t.id); }}
                  style={[S.toolBtn, active && S.toolBtnOn]}
                >
                  <MaterialIcons name={t.icon as any} size={22} color={active ? "#007AFF" : "#FFF"} />
                  <Text style={[S.toolLabel, active && { color: "#007AFF" }]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
            {/* Rotate — not a drawing tool, always visible */}
            <TouchableOpacity onPress={rotate} style={S.toolBtn}>
              <MaterialIcons name="rotate-right" size={22} color="#FFF" />
              <Text style={S.toolLabel}>Rotar</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Crop apply button */}
          {tool === "crop" && (
            <TouchableOpacity onPress={applyCrop} style={S.applyBtn}>
              <Text style={S.applyBtnTxt}>Aplicar Recorte</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      {processing && (
        <View style={S.loader}>
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={S.loaderTxt}>Procesando...</Text>
        </View>
      )}
    </GestureHandlerRootView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  // Custom header
  editorHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#111",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 8,
    height: 52,
  },
  editorHeaderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 80,
  },
  editorHeaderTitle: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  editorHeaderCancel: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "400",
  },
  editorHeaderSave: {
    color: "#007AFF",
    fontSize: 17,
    fontWeight: "600",
    textAlign: "right",
  },

  canvasArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  imgWrapper: {
    overflow: "hidden",
  },

  // Crop
  cropHandle: {
    borderRadius: 14, backgroundColor: "#FFF",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6, shadowRadius: 4, elevation: 8,
  },
  gridLine: { position: "absolute", backgroundColor: "rgba(255,255,255,0.3)" },

  // Text sticker
  stickerBg: { backgroundColor: "rgba(0,0,0,0.50)", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  stickerTxt: { fontWeight: "700" },
  stickerDot: { position: "absolute", top: -8, right: -8, width: 18, height: 18, borderRadius: 9, backgroundColor: "#007AFF", alignItems: "center", justifyContent: "center" },

  // Bottom toolbar
  toolbar: {
    backgroundColor: "#111",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.12)",
    paddingTop: 6,
  },

  // Options row
  optionsRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.10)",
    paddingBottom: 8,
    marginBottom: 2,
  },
  paletteRow: { paddingHorizontal: 16, gap: 10, height: 38, alignItems: "center" },
  colorDot: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: "transparent" },
  colorDotActive: { borderColor: "#FFF", transform: [{ scale: 1.2 }] },
  subOptions: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 8, paddingHorizontal: 16, flexWrap: "wrap" },
  subBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  subBtnOn: { backgroundColor: "rgba(255,255,255,0.18)" },
  subDivider: { width: 1, height: 24, backgroundColor: "rgba(255,255,255,0.15)", marginHorizontal: 2 },

  // Tool strip
  toolStrip: { paddingHorizontal: 6, gap: 2, alignItems: "center", paddingVertical: 6 },
  toolBtn: { alignItems: "center", gap: 3, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, minWidth: 58 },
  toolBtnOn: { backgroundColor: "rgba(0,122,255,0.15)" },
  toolLabel: { color: "#CCC", fontSize: 10, fontWeight: "500" },

  // Crop apply
  applyBtn: { marginHorizontal: 16, marginTop: 4, marginBottom: 6, backgroundColor: "#007AFF", paddingVertical: 13, borderRadius: 12, alignItems: "center" },
  applyBtnTxt: { color: "#FFF", fontWeight: "700", fontSize: 15 },

  sheetBtnGray: { backgroundColor: "#2C2C2E" },
  sheetBtnGrayTxt: { color: "#FFF", fontWeight: "500", fontSize: 15 },
  sheetBtnBlue: { backgroundColor: "#007AFF" },
  sheetBtnBlueTxt: { color: "#FFF", fontWeight: "700", fontSize: 15 },

  // Loader
  loader: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.72)", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  loaderTxt: { color: "#FFF", fontWeight: "600", marginTop: 12, fontSize: 15 },
});
