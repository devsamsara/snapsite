/**
 * image-editor.tsx
 *
 * Fixes applied:
 *  1. useAnimatedStyle for crop handles moved to top-level (no more conditional hooks)
 *  2. Header uses useSafeAreaInsets so it is always visible regardless of how the
 *     screen is presented (camera → push, gallery → push, etc.)
 *  3. Header redesigned following Apple HIG:
 *       - SF-style "Cancelar" (left) / "Guardar" (right) text buttons
 *       - Centered title
 *       - Thin separator line
 *       - Blur-style dark background (solid #111 with opacity)
 *  4. Text annotations are draggable after placement.
 */

import {
  Text,
  View,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  StyleSheet,
  Platform,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { useState, useRef, useEffect } from "react";
import * as ImageManipulator from "expo-image-manipulator";
import { Canvas, Path, Skia } from "@shopify/react-native-skia";
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";
import { captureRef } from "react-native-view-shot";
import * as MediaLibrary from "expo-media-library";
import * as Haptics from "expo-haptics";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Types ────────────────────────────────────────────────────────────────────

type EditMode =
  | "none"
  | "draw"
  | "text"
  | "arrow"
  | "rect"
  | "circle"
  | "measure"
  | "crop";

interface DrawPath {
  id: string;
  segments: string;
  color: string;
  strokeWidth: number;
}

interface TextAnnotation {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
}

interface ArrowAnnotation {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  strokeWidth: number;
}

interface ShapeAnnotation {
  id: string;
  type: "rect" | "circle";
  x: number;
  y: number;
  x2: number;
  y2: number;
  color: string;
  strokeWidth: number;
  filled: boolean;
}

interface MeasureAnnotation {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  label: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PALETTE = [
  "#FFFFFF", "#000000", "#FF3B30", "#FF9500",
  "#FFCC00", "#4CD964", "#5AC8FA", "#007AFF",
  "#5856D6", "#FF2D55",
];

const STROKE_SIZES = [2, 4, 6, 10, 16];

const TOOLS: { id: EditMode; icon: string; label: string }[] = [
  { id: "draw",    icon: "edit",                   label: "Dibujar"    },
  { id: "text",    icon: "title",                  label: "Texto"      },
  { id: "arrow",   icon: "arrow-forward",          label: "Flecha"     },
  { id: "rect",    icon: "crop-square",            label: "Rect."      },
  { id: "circle",  icon: "radio-button-unchecked", label: "Círculo"    },
  { id: "measure", icon: "straighten",             label: "Medida"     },
  { id: "crop",    icon: "crop",                   label: "Recortar"   },
];

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function dist(x1: number, y1: number, x2: number, y2: number) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// ─── Draggable Text Label ─────────────────────────────────────────────────────
// Extracted as its own component so each label has its own shared values
// (avoids calling hooks inside loops).

interface DraggableTextProps {
  annotation: TextAnnotation;
  onDragEnd: (id: string, x: number, y: number) => void;
  isTextMode: boolean;
}

function DraggableText({ annotation, onDragEnd, isTextMode }: DraggableTextProps) {
  const tx = useSharedValue(annotation.x);
  const ty = useSharedValue(annotation.y);

  // Keep in sync when annotation position changes externally
  useEffect(() => {
    tx.value = annotation.x;
    ty.value = annotation.y;
  }, [annotation.x, annotation.y]);

  const dragGesture = Gesture.Pan()
    .onUpdate((g) => {
      tx.value = g.absoluteX - g.translationX + g.translationX;
      // simpler: just track absolute position relative to the image view
      tx.value = annotation.x + g.translationX;
      ty.value = annotation.y + g.translationY;
    })
    .onEnd((g) => {
      const newX = annotation.x + g.translationX;
      const newY = annotation.y + g.translationY;
      runOnJS(onDragEnd)(annotation.id, newX, newY);
    })
    .runOnJS(true);

  const animStyle = useAnimatedStyle(() => ({
    position: "absolute",
    left: tx.value,
    top: ty.value - annotation.fontSize,
    zIndex: 20,
  }));

  return (
    <GestureDetector gesture={isTextMode ? dragGesture : Gesture.Tap()}>
      <Animated.View style={animStyle}>
        <View
          style={{
            backgroundColor: "rgba(0,0,0,0.50)",
            paddingHorizontal: 7,
            paddingVertical: 3,
            borderRadius: 5,
          }}
        >
          <Text
            style={{
              color: annotation.color,
              fontSize: annotation.fontSize,
              fontWeight: "700",
            }}
          >
            {annotation.text}
          </Text>
        </View>
        {/* Drag handle indicator (only visible in text mode) */}
        {isTextMode && (
          <View
            style={{
              position: "absolute",
              top: -8,
              right: -8,
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: "#007AFF",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIcons name="open-with" size={10} color="#FFF" />
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

// ─── Crop Handle ─────────────────────────────────────────────────────────────
// Extracted so useAnimatedStyle is always called unconditionally.

interface CropHandleProps {
  gesture: ReturnType<typeof Gesture.Pan>;
  position: "TL" | "BR";
  cTop: SharedValue<number>;
  cLeft: SharedValue<number>;
  cBottom: SharedValue<number>;
  cRight: SharedValue<number>;
}

function CropHandle({ gesture, position, cTop, cLeft, cBottom, cRight }: CropHandleProps) {
  const animStyle = useAnimatedStyle(() => {
    if (position === "TL") {
      return { top: cTop.value - 15, left: cLeft.value - 15 };
    }
    return { bottom: cBottom.value - 15, right: cRight.value - 15 };
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.cropHandle, animStyle]} />
    </GestureDetector>
  );
}

// ─── Crop Overlay ─────────────────────────────────────────────────────────────

interface CropOverlayProps {
  cTop: SharedValue<number>;
  cLeft: SharedValue<number>;
  cBottom: SharedValue<number>;
  cRight: SharedValue<number>;
}

function CropOverlay({ cTop, cLeft, cBottom, cRight }: CropOverlayProps) {
  const overlayStyle = useAnimatedStyle(() => ({
    top: cTop.value,
    left: cLeft.value,
    right: cRight.value,
    bottom: cBottom.value,
    borderColor: "#FFF",
    borderWidth: 2,
    position: "absolute",
  }));

  const gridStyle = useAnimatedStyle(() => ({
    top: cTop.value,
    left: cLeft.value,
    right: cRight.value,
    bottom: cBottom.value,
    position: "absolute",
  }));

  return (
    <>
      {/* Dim outside crop area */}
      <Animated.View style={[overlayStyle, { borderColor: "#FFF", borderWidth: 2 }]} />
      {/* Grid lines */}
      <Animated.View style={gridStyle} pointerEvents="none">
        <View style={[styles.gridLine, { top: "33.3%", width: "100%", height: 1 }]} />
        <View style={[styles.gridLine, { top: "66.6%", width: "100%", height: 1 }]} />
        <View style={[styles.gridLine, { left: "33.3%", height: "100%", width: 1 }]} />
        <View style={[styles.gridLine, { left: "66.6%", height: "100%", width: 1 }]} />
      </Animated.View>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ImageEditorScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const { imageUri, projectId } = useLocalSearchParams<{
    imageUri: string;
    projectId?: string;
  }>();

  // ── Image state ──
  const [imgUri, setImgUri] = useState(imageUri);
  const [imgSize, setImgSize] = useState({ width: SCREEN_WIDTH, height: SCREEN_WIDTH });
  const [processing, setProcessing] = useState(false);

  // ── Tool state ──
  const [mode, setMode] = useState<EditMode>("none");
  const [color, setColor] = useState(PALETTE[2]);
  const [stroke, setStroke] = useState(STROKE_SIZES[1]);
  const [filled, setFilled] = useState(false);
  const [fontSize, setFontSize] = useState(18);

  // ── Annotation layers ──
  const [paths, setPaths] = useState<DrawPath[]>([]);
  const [redo, setRedo] = useState<DrawPath[]>([]);
  const [texts, setTexts] = useState<TextAnnotation[]>([]);
  const [arrows, setArrows] = useState<ArrowAnnotation[]>([]);
  const [shapes, setShapes] = useState<ShapeAnnotation[]>([]);
  const [measures, setMeasures] = useState<MeasureAnnotation[]>([]);

  // ── In-progress drawing ──
  const [liveArrow, setLiveArrow] = useState<ArrowAnnotation | null>(null);
  const [liveShape, setLiveShape] = useState<ShapeAnnotation | null>(null);
  const [liveMeasure, setLiveMeasure] = useState<MeasureAnnotation | null>(null);

  // ── Text modal ──
  const [textModal, setTextModal] = useState(false);
  const [textPos, setTextPos] = useState({ x: 0, y: 0 });
  const [textVal, setTextVal] = useState("");

  // ── Measure label modal ──
  const [measureModal, setMeasureModal] = useState(false);
  const [pendingMeasure, setPendingMeasure] = useState<MeasureAnnotation | null>(null);
  const [measureLabel, setMeasureLabel] = useState("");

  // ── Crop shared values (always at top level — no conditional hooks) ──
  const cTop = useSharedValue(0);
  const cLeft = useSharedValue(0);
  const cRight = useSharedValue(0);
  const cBottom = useSharedValue(0);

  const viewRef = useRef<View>(null);

  // ── Load image ──
  useEffect(() => {
    if (imageUri) {
      setImgUri(imageUri);
      Image.getSize(imageUri, (w, h) => {
        setImgSize({ width: SCREEN_WIDTH, height: SCREEN_WIDTH / (w / h) });
      });
    }
  }, [imageUri]);

  // ─── Gestures ─────────────────────────────────────────────────────────────

  const drawGesture = Gesture.Pan()
    .onStart((g) => {
      if (mode !== "draw") return;
      runOnJS(setPaths)((prev) => [
        ...prev,
        { id: uid(), segments: `M ${g.x} ${g.y}`, color, strokeWidth: stroke },
      ]);
      runOnJS(setRedo)([]);
    })
    .onUpdate((g) => {
      if (mode !== "draw") return;
      runOnJS(setPaths)((prev) => {
        const last = prev[prev.length - 1];
        if (!last) return prev;
        return [
          ...prev.slice(0, -1),
          { ...last, segments: `${last.segments} L ${g.x} ${g.y}` },
        ];
      });
    })
    .runOnJS(true);

  const arrowGesture = Gesture.Pan()
    .onStart((g) => {
      if (mode !== "arrow") return;
      runOnJS(setLiveArrow)({
        id: uid(), x1: g.x, y1: g.y, x2: g.x, y2: g.y,
        color, strokeWidth: stroke,
      });
    })
    .onUpdate((g) => {
      if (mode !== "arrow") return;
      runOnJS(setLiveArrow)((prev) => prev ? { ...prev, x2: g.x, y2: g.y } : null);
    })
    .onEnd(() => {
      if (mode !== "arrow") return;
      runOnJS((a: ArrowAnnotation | null) => {
        if (a) { setArrows((p) => [...p, a]); setLiveArrow(null); }
      })(liveArrow);
    })
    .runOnJS(true);

  const shapeGesture = Gesture.Pan()
    .onStart((g) => {
      if (mode !== "rect" && mode !== "circle") return;
      runOnJS(setLiveShape)({
        id: uid(), type: mode as "rect" | "circle",
        x: g.x, y: g.y, x2: g.x, y2: g.y,
        color, strokeWidth: stroke, filled,
      });
    })
    .onUpdate((g) => {
      if (mode !== "rect" && mode !== "circle") return;
      runOnJS(setLiveShape)((prev) => prev ? { ...prev, x2: g.x, y2: g.y } : null);
    })
    .onEnd(() => {
      if (mode !== "rect" && mode !== "circle") return;
      runOnJS((s: ShapeAnnotation | null) => {
        if (s) { setShapes((p) => [...p, s]); setLiveShape(null); }
      })(liveShape);
    })
    .runOnJS(true);

  const measureGesture = Gesture.Pan()
    .onStart((g) => {
      if (mode !== "measure") return;
      runOnJS(setLiveMeasure)({
        id: uid(), x1: g.x, y1: g.y, x2: g.x, y2: g.y, color, label: "",
      });
    })
    .onUpdate((g) => {
      if (mode !== "measure") return;
      runOnJS(setLiveMeasure)((prev) => prev ? { ...prev, x2: g.x, y2: g.y } : null);
    })
    .onEnd(() => {
      if (mode !== "measure") return;
      runOnJS((m: MeasureAnnotation | null) => {
        if (m) {
          const auto = `${Math.round(dist(m.x1, m.y1, m.x2, m.y2))}px`;
          const withLabel = { ...m, label: auto };
          setPendingMeasure(withLabel);
          setMeasureLabel(auto);
          setMeasureModal(true);
          setLiveMeasure(null);
        }
      })(liveMeasure);
    })
    .runOnJS(true);

  const tapGesture = Gesture.Tap()
    .onEnd((g) => {
      if (mode !== "text") return;
      runOnJS(setTextPos)({ x: g.x, y: g.y });
      runOnJS(setTextVal)("");
      runOnJS(setTextModal)(true);
    })
    .runOnJS(true);

  // Crop gestures — these are passed to CropHandle components
  const cropTL = Gesture.Pan().onUpdate((g) => {
    cTop.value = Math.max(0, Math.min(imgSize.height - cBottom.value - 50, g.y));
    cLeft.value = Math.max(0, Math.min(imgSize.width - cRight.value - 50, g.x));
  });

  const cropBR = Gesture.Pan().onUpdate((g) => {
    cBottom.value = Math.max(0, Math.min(imgSize.height - cTop.value - 50, imgSize.height - g.y));
    cRight.value = Math.max(0, Math.min(imgSize.width - cLeft.value - 50, imgSize.width - g.x));
  });

  const activeGesture =
    mode === "draw"    ? drawGesture
    : mode === "arrow" ? arrowGesture
    : mode === "rect" || mode === "circle" ? shapeGesture
    : mode === "measure" ? measureGesture
    : mode === "text"  ? tapGesture
    : Gesture.Tap();

  // ─── Actions ──────────────────────────────────────────────────────────────

  const undo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (mode === "draw" && paths.length > 0) {
      const last = paths[paths.length - 1];
      setRedo((p) => [last, ...p]);
      setPaths((p) => p.slice(0, -1));
    } else if (mode === "text" && texts.length > 0) {
      setTexts((p) => p.slice(0, -1));
    } else if (mode === "arrow" && arrows.length > 0) {
      setArrows((p) => p.slice(0, -1));
    } else if ((mode === "rect" || mode === "circle") && shapes.length > 0) {
      setShapes((p) => p.slice(0, -1));
    } else if (mode === "measure" && measures.length > 0) {
      setMeasures((p) => p.slice(0, -1));
    }
  };

  const redoAction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (mode === "draw" && redo.length > 0) {
      const first = redo[0];
      setRedo((p) => p.slice(1));
      setPaths((p) => [...p, first]);
    }
  };

  const clearAll = () => {
    Alert.alert("Limpiar anotaciones", "¿Eliminar todas las anotaciones?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Limpiar",
        style: "destructive",
        onPress: () => {
          setPaths([]); setTexts([]); setArrows([]);
          setShapes([]); setMeasures([]); setRedo([]);
        },
      },
    ]);
  };

  const rotate = async () => {
    setProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const r = await ImageManipulator.manipulateAsync(
        imgUri!, [{ rotate: 90 }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );
      setImgUri(r.uri);
      Image.getSize(r.uri, (w, h) =>
        setImgSize({ width: SCREEN_WIDTH, height: SCREEN_WIDTH / (w / h) })
      );
    } catch {
      Alert.alert("Error", "No se pudo rotar la imagen");
    } finally {
      setProcessing(false);
    }
  };

  const applyCrop = async () => {
    setProcessing(true);
    try {
      const { width: iw } = await new Promise<{ width: number; height: number }>((res) =>
        Image.getSize(imgUri!, (w, h) => res({ width: w, height: h }))
      );
      const scale = iw / imgSize.width;
      const r = await ImageManipulator.manipulateAsync(
        imgUri!,
        [{
          crop: {
            originX: cLeft.value * scale,
            originY: cTop.value * scale,
            width: (imgSize.width - cLeft.value - cRight.value) * scale,
            height: (imgSize.height - cTop.value - cBottom.value) * scale,
          },
        }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );
      setImgUri(r.uri);
      setMode("none");
      cTop.value = 0; cLeft.value = 0; cRight.value = 0; cBottom.value = 0;
      Image.getSize(r.uri, (w, h) =>
        setImgSize({ width: SCREEN_WIDTH, height: SCREEN_WIDTH / (w / h) })
      );
    } catch {
      Alert.alert("Error", "No se pudo recortar la imagen");
    } finally {
      setProcessing(false);
    }
  };

  const save = async () => {
    setProcessing(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "Se necesita acceso a la galería para guardar.");
        setProcessing(false);
        return;
      }
      const uri = await captureRef(viewRef, { format: "jpg", quality: 0.95 });
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert("¡Guardado!", "La imagen se guardó en tu galería.", [
        {
          text: "OK",
          onPress: () => {
            if (projectId) {
              router.replace({ pathname: "/project/[id]", params: { id: projectId } });
            } else {
              router.back();
            }
          },
        },
      ]);
    } catch {
      Alert.alert("Error", "No se pudo guardar la imagen.");
    } finally {
      setProcessing(false);
    }
  };

  const confirmText = () => {
    if (textVal.trim()) {
      setTexts((p) => [
        ...p,
        { id: uid(), text: textVal.trim(), x: textPos.x, y: textPos.y, color, fontSize },
      ]);
    }
    setTextModal(false);
    setTextVal("");
  };

  const confirmMeasure = () => {
    if (pendingMeasure) {
      setMeasures((p) => [
        ...p,
        { ...pendingMeasure, label: measureLabel || pendingMeasure.label },
      ]);
    }
    setMeasureModal(false);
    setPendingMeasure(null);
    setMeasureLabel("");
  };

  const handleTextDragEnd = (id: string, x: number, y: number) => {
    setTexts((prev) => prev.map((t) => (t.id === id ? { ...t, x, y } : t)));
  };

  // ─── Canvas helpers ───────────────────────────────────────────────────────

  const buildArrowPath = (a: ArrowAnnotation) => {
    const angle = Math.atan2(a.y2 - a.y1, a.x2 - a.x1);
    const hl = 14;
    const p = Skia.Path.Make();
    p.moveTo(a.x1, a.y1);
    p.lineTo(a.x2, a.y2);
    p.moveTo(a.x2, a.y2);
    p.lineTo(a.x2 - hl * Math.cos(angle - Math.PI / 6), a.y2 - hl * Math.sin(angle - Math.PI / 6));
    p.moveTo(a.x2, a.y2);
    p.lineTo(a.x2 - hl * Math.cos(angle + Math.PI / 6), a.y2 - hl * Math.sin(angle + Math.PI / 6));
    return p;
  };

  const buildShapePath = (s: ShapeAnnotation) => {
    const x = Math.min(s.x, s.x2);
    const y = Math.min(s.y, s.y2);
    const w = Math.abs(s.x2 - s.x);
    const h = Math.abs(s.y2 - s.y);
    const p = Skia.Path.Make();
    if (s.type === "rect") {
      p.addRect(Skia.XYWHRect(x, y, w, h));
    } else {
      p.addOval(Skia.XYWHRect(x, y, w, h));
    }
    return p;
  };

  const buildMeasurePath = (m: MeasureAnnotation) => {
    const angle = Math.atan2(m.y2 - m.y1, m.x2 - m.x1);
    const perp = angle + Math.PI / 2;
    const tk = 6;
    const p = Skia.Path.Make();
    p.moveTo(m.x1, m.y1);
    p.lineTo(m.x2, m.y2);
    p.moveTo(m.x1 + tk * Math.cos(perp), m.y1 + tk * Math.sin(perp));
    p.lineTo(m.x1 - tk * Math.cos(perp), m.y1 - tk * Math.sin(perp));
    p.moveTo(m.x2 + tk * Math.cos(perp), m.y2 + tk * Math.sin(perp));
    p.lineTo(m.x2 - tk * Math.cos(perp), m.y2 - tk * Math.sin(perp));
    return p;
  };

  // ─── Derived ──────────────────────────────────────────────────────────────

  const hasAnnotations =
    paths.length > 0 || texts.length > 0 ||
    arrows.length > 0 || shapes.length > 0 || measures.length > 0;

  const showOptions =
    mode === "draw" || mode === "arrow" || mode === "rect" ||
    mode === "circle" || mode === "measure" || mode === "text";

  const canUndo =
    (mode === "draw" && paths.length > 0) ||
    (mode === "text" && texts.length > 0) ||
    (mode === "arrow" && arrows.length > 0) ||
    ((mode === "rect" || mode === "circle") && shapes.length > 0) ||
    (mode === "measure" && measures.length > 0);

  if (!imgUri) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: "#000" }]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ color: "#999", marginTop: 16 }}>Cargando imagen...</Text>
      </View>
    );
  }

  // ─── Header height = safe area top + 44pt (Apple HIG navigation bar height) ──
  const NAV_HEIGHT = 44;
  const headerPaddingTop = insets.top;

  return (
    <GestureHandlerRootView style={styles.container}>

      {/* ── Apple HIG Navigation Bar ── */}
      <View
        style={[
          styles.navBar,
          {
            paddingTop: headerPaddingTop,
            height: headerPaddingTop + NAV_HEIGHT,
          },
        ]}
      >
        {/* Left: Cancelar */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.navSideBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.navCancelText}>Cancelar</Text>
        </TouchableOpacity>

        {/* Center: Title */}
        <Text style={styles.navTitle} numberOfLines={1}>
          Anotar Foto
        </Text>

        {/* Right: actions */}
        <View style={styles.navRight}>
          {hasAnnotations && (
            <TouchableOpacity
              onPress={clearAll}
              style={styles.navIconBtn}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
            >
              <MaterialIcons name="delete-sweep" size={20} color="#FF3B30" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={undo}
            disabled={!canUndo}
            style={styles.navIconBtn}
            hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
          >
            <MaterialIcons name="undo" size={20} color={canUndo ? "#FFF" : "#444"} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={redoAction}
            disabled={redo.length === 0}
            style={styles.navIconBtn}
            hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
          >
            <MaterialIcons name="redo" size={20} color={redo.length > 0 ? "#FFF" : "#444"} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={save}
            hitSlop={{ top: 10, bottom: 10, left: 6, right: 10 }}
          >
            <Text style={styles.navSaveText}>Guardar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Thin separator */}
      <View style={styles.navSeparator} />

      {/* ── Editor Area ── */}
      <View style={styles.editorArea}>
        <GestureDetector gesture={activeGesture}>
          <View
            ref={viewRef}
            collapsable={false}
            style={[styles.imgWrapper, { width: imgSize.width, height: imgSize.height }]}
          >
            <Image source={{ uri: imgUri }} style={styles.img} resizeMode="contain" />

            {/* Skia canvas — draw paths, arrows, shapes, measures */}
            <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
              {paths.map((p) => {
                const skPath = Skia.Path.MakeFromSVGString(p.segments);
                if (!skPath) return null;
                const paint = Skia.Paint();
                paint.setColor(Skia.Color(p.color));
                paint.setStrokeWidth(p.strokeWidth);
                paint.setStyle(1);
                paint.setAntiAlias(true);
                paint.setStrokeCap(1);
                paint.setStrokeJoin(1);
                return <Path key={p.id} path={skPath} paint={paint} />;
              })}

              {[...arrows, ...(liveArrow ? [liveArrow] : [])].map((a) => {
                const paint = Skia.Paint();
                paint.setColor(Skia.Color(a.color));
                paint.setStrokeWidth(a.strokeWidth);
                paint.setStyle(1);
                paint.setAntiAlias(true);
                return <Path key={a.id} path={buildArrowPath(a)} paint={paint} />;
              })}

              {[...shapes, ...(liveShape ? [liveShape] : [])].map((s) => {
                const paint = Skia.Paint();
                paint.setColor(Skia.Color(s.color));
                paint.setStrokeWidth(s.strokeWidth);
                paint.setStyle(s.filled ? 0 : 1);
                paint.setAntiAlias(true);
                return <Path key={s.id} path={buildShapePath(s)} paint={paint} />;
              })}

              {[...measures, ...(liveMeasure ? [liveMeasure] : [])].map((m) => {
                const paint = Skia.Paint();
                paint.setColor(Skia.Color(m.color));
                paint.setStrokeWidth(2);
                paint.setStyle(1);
                paint.setAntiAlias(true);
                return <Path key={m.id} path={buildMeasurePath(m)} paint={paint} />;
              })}
            </Canvas>

            {/* Draggable text annotations */}
            {texts.map((t) => (
              <DraggableText
                key={t.id}
                annotation={t}
                onDragEnd={handleTextDragEnd}
                isTextMode={mode === "text"}
              />
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
                <Text style={{ color: m.color, fontSize: 12, fontWeight: "700" }}>
                  {m.label}
                </Text>
              </View>
            ))}

            {/* Crop overlay — rendered via sub-components to avoid conditional hooks */}
            {mode === "crop" && (
              <>
                <CropOverlay
                  cTop={cTop} cLeft={cLeft}
                  cBottom={cBottom} cRight={cRight}
                />
                <CropHandle
                  gesture={cropTL} position="TL"
                  cTop={cTop} cLeft={cLeft}
                  cBottom={cBottom} cRight={cRight}
                />
                <CropHandle
                  gesture={cropBR} position="BR"
                  cTop={cTop} cLeft={cLeft}
                  cBottom={cBottom} cRight={cRight}
                />
              </>
            )}
          </View>
        </GestureDetector>
      </View>

      {/* ── Bottom Toolbar ── */}
      <View style={styles.toolbar}>
        {/* Color + stroke / font-size / fill options */}
        {showOptions && (
          <View style={styles.optRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.colorRow}
            >
              {PALETTE.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setColor(c)}
                  style={[styles.dot, { backgroundColor: c }, color === c && styles.dotActive]}
                />
              ))}
            </ScrollView>

            <View style={styles.subRow}>
              {/* Stroke sizes (draw, arrow, rect, circle) */}
              {mode !== "text" && mode !== "measure" &&
                STROKE_SIZES.map((w) => (
                  <TouchableOpacity
                    key={w}
                    onPress={() => setStroke(w)}
                    style={[styles.subBtn, stroke === w && styles.subBtnActive]}
                  >
                    <View
                      style={{
                        width: w, height: w, borderRadius: w / 2,
                        backgroundColor: color,
                      }}
                    />
                  </TouchableOpacity>
                ))}

              {/* Font sizes (text) */}
              {mode === "text" &&
                [12, 16, 20, 26, 32].map((fs) => (
                  <TouchableOpacity
                    key={fs}
                    onPress={() => setFontSize(fs)}
                    style={[styles.subBtn, fontSize === fs && styles.subBtnActive]}
                  >
                    <Text style={{ color, fontSize: 10, fontWeight: "700" }}>{fs}</Text>
                  </TouchableOpacity>
                ))}

              {/* Fill toggle (rect, circle) */}
              {(mode === "rect" || mode === "circle") && (
                <TouchableOpacity
                  onPress={() => setFilled((v) => !v)}
                  style={[styles.subBtn, filled && styles.subBtnActive]}
                >
                  <MaterialIcons
                    name={filled ? "format-color-fill" : "format-color-reset"}
                    size={18}
                    color="#FFF"
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Tool tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.toolRow}
        >
          {TOOLS.map((t) => {
            const active = mode === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  setMode(active ? "none" : t.id);
                }}
                style={[styles.toolBtn, active && styles.toolBtnActive]}
              >
                <MaterialIcons
                  name={t.icon as any}
                  size={22}
                  color={active ? "#007AFF" : "#FFF"}
                />
                <Text style={[styles.toolTxt, active && { color: "#007AFF" }]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity onPress={rotate} style={styles.toolBtn}>
            <MaterialIcons name="rotate-right" size={22} color="#FFF" />
            <Text style={styles.toolTxt}>Rotar</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Apply crop CTA */}
        {mode === "crop" && (
          <TouchableOpacity onPress={applyCrop} style={styles.applyBtn}>
            <Text style={styles.applyBtnText}>Aplicar Recorte</Text>
          </TouchableOpacity>
        )}

        {/* Bottom safe area spacer */}
        <View style={{ height: insets.bottom }} />
      </View>

      {/* ── Text Input Modal ── */}
      <Modal
        visible={textModal}
        transparent
        animationType="slide"
        onRequestClose={() => setTextModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.overlay}
        >
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Agregar Texto</Text>
            <TextInput
              value={textVal}
              onChangeText={setTextVal}
              placeholder="Escribe aquí..."
              placeholderTextColor="#666"
              style={styles.sheetInput}
              autoFocus
              multiline
              returnKeyType="done"
            />
            <View style={styles.sheetBtns}>
              <TouchableOpacity
                onPress={() => setTextModal(false)}
                style={[styles.sheetBtn, styles.sheetBtnCancel]}
              >
                <Text style={styles.sheetBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmText}
                style={[styles.sheetBtn, styles.sheetBtnConfirm]}
              >
                <Text style={styles.sheetBtnConfirmText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Measure Label Modal ── */}
      <Modal
        visible={measureModal}
        transparent
        animationType="slide"
        onRequestClose={() => setMeasureModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.overlay}
        >
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Etiqueta de Medida</Text>
            <Text style={styles.sheetSubtitle}>
              Personaliza la etiqueta (ej: "2.5 m", "120 cm")
            </Text>
            <TextInput
              value={measureLabel}
              onChangeText={setMeasureLabel}
              placeholder="Ej: 2.5 m"
              placeholderTextColor="#666"
              style={styles.sheetInput}
              autoFocus
            />
            <View style={styles.sheetBtns}>
              <TouchableOpacity
                onPress={() => setMeasureModal(false)}
                style={[styles.sheetBtn, styles.sheetBtnCancel]}
              >
                <Text style={styles.sheetBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmMeasure}
                style={[styles.sheetBtn, styles.sheetBtnConfirm]}
              >
                <Text style={styles.sheetBtnConfirmText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Processing overlay ── */}
      {processing && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={styles.loaderText}>Procesando...</Text>
        </View>
      )}
    </GestureHandlerRootView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { justifyContent: "center", alignItems: "center" },

  // ── Apple HIG Navigation Bar ──
  navBar: {
    backgroundColor: "rgba(18,18,18,0.97)",
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 8,
    paddingBottom: 0,
  },
  navSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  navSideBtn: {
    width: 80,
    height: 44,
    justifyContent: "center",
    paddingLeft: 8,
  },
  navCancelText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "400",
    letterSpacing: -0.2,
  },
  navTitle: {
    flex: 1,
    textAlign: "center",
    color: "#FFF",
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.3,
    height: 44,
    lineHeight: 44,
  },
  navRight: {
    width: 80,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 2,
    paddingRight: 4,
  },
  navIconBtn: {
    width: 32,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  navSaveText: {
    color: "#007AFF",
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.2,
    height: 44,
    lineHeight: 44,
    paddingRight: 4,
  },

  // ── Editor ──
  editorArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  imgWrapper: { position: "relative", backgroundColor: "#111" },
  img: { width: "100%", height: "100%" },

  // ── Crop ──
  cropHandle: {
    width: 28,
    height: 28,
    backgroundColor: "#FFF",
    borderRadius: 14,
    position: "absolute",
    zIndex: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 6,
  },
  gridLine: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.35)",
  },

  // ── Bottom Toolbar ──
  toolbar: {
    backgroundColor: "rgba(18,18,18,0.97)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.12)",
    paddingTop: 8,
  },
  optRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.1)",
    paddingBottom: 10,
    marginBottom: 2,
  },
  colorRow: {
    paddingHorizontal: 16,
    gap: 12,
    height: 40,
    alignItems: "center",
  },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "transparent",
  },
  dotActive: {
    borderColor: "#FFF",
    transform: [{ scale: 1.18 }],
  },
  subRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 16,
  },
  subBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  subBtnActive: { backgroundColor: "rgba(255,255,255,0.18)" },
  toolRow: {
    paddingHorizontal: 6,
    gap: 2,
    alignItems: "center",
    paddingVertical: 6,
  },
  toolBtn: {
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 58,
  },
  toolBtnActive: { backgroundColor: "rgba(0,122,255,0.15)" },
  toolTxt: { color: "#CCC", fontSize: 10, fontWeight: "500" },
  applyBtn: {
    marginHorizontal: 16,
    marginTop: 6,
    backgroundColor: "#007AFF",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  applyBtnText: { color: "#FFF", fontWeight: "700", fontSize: 15 },

  // ── Bottom Sheet (modals) ──
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#1C1C1E",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 8,
  },
  sheetSubtitle: {
    color: "#999",
    fontSize: 13,
    marginBottom: 14,
  },
  sheetInput: {
    backgroundColor: "#2C2C2E",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: "#FFF",
    minHeight: 52,
  },
  sheetBtns: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  sheetBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
  },
  sheetBtnCancel: { backgroundColor: "#2C2C2E" },
  sheetBtnCancelText: { color: "#FFF", fontWeight: "500", fontSize: 15 },
  sheetBtnConfirm: { backgroundColor: "#007AFF" },
  sheetBtnConfirmText: { color: "#FFF", fontWeight: "700", fontSize: 15 },

  // ── Processing ──
  loader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loaderText: { color: "#FFF", fontWeight: "600", marginTop: 12, fontSize: 15 },
});
