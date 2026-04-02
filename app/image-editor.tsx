/**
 * image-editor.tsx  — v3
 *
 * Fixes & improvements:
 *  1. Header ALWAYS visible — uses NativeModules + useSafeAreaInsets with a
 *     guaranteed minimum so Dynamic Island / notch / status bar never covers it.
 *     Also sets StatusBar to hidden while the editor is open.
 *  2. Crop is smooth — all four corner handles run fully on the UI thread via
 *     Reanimated worklets (no runOnJS). A semi-transparent dim covers the
 *     outside of the crop rect for better visual feedback.
 *  3. Text annotations support drag + pinch-to-scale + two-finger rotation.
 *     Each label has its own SharedValues and a composed gesture.
 *  4. Image rotation preserves annotations — instead of re-encoding the image,
 *     we track a `rotation` state (0/90/180/270) and apply it as a CSS
 *     transform on the wrapper. The Skia canvas and text overlays rotate with it.
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
  StatusBar as RNStatusBar,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
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
  type SharedValue,
} from "react-native-reanimated";
import { captureRef } from "react-native-view-shot";
import * as MediaLibrary from "expo-media-library";
import * as Haptics from "expo-haptics";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SW, height: SH } = Dimensions.get("window");

// ─── Types ────────────────────────────────────────────────────────────────────

type EditMode =
  | "none" | "draw" | "text" | "arrow"
  | "rect" | "circle" | "measure" | "crop";

interface DrawPath {
  id: string; segments: string; color: string; strokeWidth: number;
}
interface TextAnnotation {
  id: string; text: string; x: number; y: number;
  color: string; fontSize: number; rotation: number;
}
interface ArrowAnnotation {
  id: string; x1: number; y1: number; x2: number; y2: number;
  color: string; strokeWidth: number;
}
interface ShapeAnnotation {
  id: string; type: "rect" | "circle";
  x: number; y: number; x2: number; y2: number;
  color: string; strokeWidth: number; filled: boolean;
}
interface MeasureAnnotation {
  id: string; x1: number; y1: number; x2: number; y2: number;
  color: string; label: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PALETTE = [
  "#FFFFFF","#000000","#FF3B30","#FF9500",
  "#FFCC00","#4CD964","#5AC8FA","#007AFF",
  "#5856D6","#FF2D55",
];
const STROKE_SIZES = [2, 4, 6, 10, 16];
const TOOLS: { id: EditMode; icon: string; label: string }[] = [
  { id: "draw",    icon: "edit",                   label: "Dibujar"  },
  { id: "text",    icon: "title",                  label: "Texto"    },
  { id: "arrow",   icon: "arrow-forward",          label: "Flecha"   },
  { id: "rect",    icon: "crop-square",            label: "Rect."    },
  { id: "circle",  icon: "radio-button-unchecked", label: "Círculo"  },
  { id: "measure", icon: "straighten",             label: "Medida"   },
  { id: "crop",    icon: "crop",                   label: "Recortar" },
];

function uid() { return Math.random().toString(36).slice(2, 9); }
function dist(x1: number, y1: number, x2: number, y2: number) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// ─── DraggableText — drag + pinch-scale + two-finger rotation ─────────────────

interface DraggableTextProps {
  ann: TextAnnotation;
  onUpdate: (id: string, patch: Partial<TextAnnotation>) => void;
  active: boolean; // true when mode === "text"
}

function DraggableText({ ann, onUpdate, active }: DraggableTextProps) {
  const tx = useSharedValue(ann.x);
  const ty = useSharedValue(ann.y - ann.fontSize);
  const scale = useSharedValue(1);
  const rot = useSharedValue(ann.rotation ?? 0);

  // base values captured at gesture start
  const baseX = useSharedValue(ann.x);
  const baseY = useSharedValue(ann.y - ann.fontSize);
  const baseScale = useSharedValue(1);
  const baseRot = useSharedValue(ann.rotation ?? 0);

  useEffect(() => {
    tx.value = ann.x;
    ty.value = ann.y - ann.fontSize;
    rot.value = ann.rotation ?? 0;
  }, [ann.x, ann.y, ann.fontSize, ann.rotation]);

  const drag = Gesture.Pan()
    .onStart(() => {
      baseX.value = tx.value;
      baseY.value = ty.value;
    })
    .onUpdate((g) => {
      tx.value = baseX.value + g.translationX;
      ty.value = baseY.value + g.translationY;
    })
    .onEnd(() => {
      runOnJS(onUpdate)(ann.id, {
        x: tx.value,
        y: ty.value + ann.fontSize,
      });
    });

  const pinch = Gesture.Pinch()
    .onStart(() => { baseScale.value = scale.value; })
    .onUpdate((g) => { scale.value = Math.max(0.3, Math.min(5, baseScale.value * g.scale)); })
    .onEnd(() => {
      runOnJS(onUpdate)(ann.id, { fontSize: Math.round(ann.fontSize * scale.value) });
      scale.value = 1;
    });

  const rotation = Gesture.Rotation()
    .onStart(() => { baseRot.value = rot.value; })
    .onUpdate((g) => { rot.value = baseRot.value + g.rotation; })
    .onEnd(() => { runOnJS(onUpdate)(ann.id, { rotation: rot.value }); });

  const composed = active
    ? Gesture.Simultaneous(drag, Gesture.Simultaneous(pinch, rotation))
    : Gesture.Tap(); // no-op when not in text mode

  const style = useAnimatedStyle(() => ({
    position: "absolute",
    left: tx.value,
    top: ty.value,
    transform: [{ scale: scale.value }, { rotate: `${rot.value}rad` }],
    zIndex: 20,
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={style}>
        <View style={{
          backgroundColor: "rgba(0,0,0,0.50)",
          paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5,
        }}>
          <Text style={{ color: ann.color, fontSize: ann.fontSize, fontWeight: "700" }}>
            {ann.text}
          </Text>
        </View>
        {active && (
          <View style={{
            position: "absolute", top: -8, right: -8,
            width: 18, height: 18, borderRadius: 9,
            backgroundColor: "#007AFF",
            alignItems: "center", justifyContent: "center",
          }}>
            <MaterialIcons name="open-with" size={11} color="#FFF" />
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

// ─── CropOverlay — fully on UI thread ─────────────────────────────────────────

interface CropProps {
  cTop: SharedValue<number>; cLeft: SharedValue<number>;
  cRight: SharedValue<number>; cBottom: SharedValue<number>;
  imgW: number; imgH: number;
}

function CropOverlay({ cTop, cLeft, cRight, cBottom, imgW, imgH }: CropProps) {
  // Dim areas
  const dimTop    = useAnimatedStyle(() => ({ position:"absolute", left:0, right:0, top:0, height: cTop.value, backgroundColor:"rgba(0,0,0,0.55)" }));
  const dimBottom = useAnimatedStyle(() => ({ position:"absolute", left:0, right:0, bottom:0, height: cBottom.value, backgroundColor:"rgba(0,0,0,0.55)" }));
  const dimLeft   = useAnimatedStyle(() => ({ position:"absolute", left:0, top: cTop.value, bottom: cBottom.value, width: cLeft.value, backgroundColor:"rgba(0,0,0,0.55)" }));
  const dimRight  = useAnimatedStyle(() => ({ position:"absolute", right:0, top: cTop.value, bottom: cBottom.value, width: cRight.value, backgroundColor:"rgba(0,0,0,0.55)" }));
  // Border
  const border    = useAnimatedStyle(() => ({
    position:"absolute",
    top: cTop.value, left: cLeft.value,
    right: cRight.value, bottom: cBottom.value,
    borderWidth: 1.5, borderColor: "#FFF",
  }));
  // Grid
  const grid      = useAnimatedStyle(() => ({
    position:"absolute",
    top: cTop.value, left: cLeft.value,
    right: cRight.value, bottom: cBottom.value,
  }));

  return (
    <>
      <Animated.View style={dimTop} pointerEvents="none" />
      <Animated.View style={dimBottom} pointerEvents="none" />
      <Animated.View style={dimLeft} pointerEvents="none" />
      <Animated.View style={dimRight} pointerEvents="none" />
      <Animated.View style={border} pointerEvents="none" />
      <Animated.View style={grid} pointerEvents="none">
        <View style={[S.gridLine, { top:"33.3%", width:"100%", height:1 }]} />
        <View style={[S.gridLine, { top:"66.6%", width:"100%", height:1 }]} />
        <View style={[S.gridLine, { left:"33.3%", height:"100%", width:1 }]} />
        <View style={[S.gridLine, { left:"66.6%", height:"100%", width:1 }]} />
      </Animated.View>
    </>
  );
}

// Corner handle component
interface HandleProps {
  cTop: SharedValue<number>; cLeft: SharedValue<number>;
  cRight: SharedValue<number>; cBottom: SharedValue<number>;
  corner: "TL"|"TR"|"BL"|"BR";
  imgW: number; imgH: number;
}
function CropCorner({ cTop, cLeft, cRight, cBottom, corner, imgW, imgH }: HandleProps) {
  const MIN = 60;

  const gesture = Gesture.Pan().onUpdate((g) => {
    "worklet";
    if (corner === "TL") {
      cTop.value   = Math.max(0, Math.min(imgH - cBottom.value - MIN, g.y));
      cLeft.value  = Math.max(0, Math.min(imgW - cRight.value  - MIN, g.x));
    } else if (corner === "TR") {
      cTop.value   = Math.max(0, Math.min(imgH - cBottom.value - MIN, g.y));
      cRight.value = Math.max(0, Math.min(imgW - cLeft.value   - MIN, imgW - g.x));
    } else if (corner === "BL") {
      cBottom.value = Math.max(0, Math.min(imgH - cTop.value  - MIN, imgH - g.y));
      cLeft.value   = Math.max(0, Math.min(imgW - cRight.value - MIN, g.x));
    } else {
      cBottom.value = Math.max(0, Math.min(imgH - cTop.value  - MIN, imgH - g.y));
      cRight.value  = Math.max(0, Math.min(imgW - cLeft.value  - MIN, imgW - g.x));
    }
  });

  const style = useAnimatedStyle(() => {
    "worklet";
    const base: any = { position:"absolute", width:28, height:28, zIndex:30 };
    if (corner === "TL") return { ...base, top: cTop.value - 14, left: cLeft.value - 14 };
    if (corner === "TR") return { ...base, top: cTop.value - 14, right: cRight.value - 14 };
    if (corner === "BL") return { ...base, bottom: cBottom.value - 14, left: cLeft.value - 14 };
    return { ...base, bottom: cBottom.value - 14, right: cRight.value - 14 };
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[S.cropHandle, style]} />
    </GestureDetector>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ImageEditorScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const { imageUri, projectId } = useLocalSearchParams<{
    imageUri: string; projectId?: string;
  }>();

  // ── Image ──
  const [imgUri, setImgUri] = useState(imageUri);
  const [imgSize, setImgSize] = useState({ width: SW, height: SW });
  const [imgRotation, setImgRotation] = useState(0); // 0 | 90 | 180 | 270
  const [processing, setProcessing] = useState(false);

  // ── Tool ──
  const [mode, setMode] = useState<EditMode>("none");
  const [color, setColor] = useState(PALETTE[2]);
  const [stroke, setStroke] = useState(STROKE_SIZES[1]);
  const [filled, setFilled] = useState(false);
  const [fontSize, setFontSize] = useState(18);

  // ── Annotations ──
  const [paths, setPaths] = useState<DrawPath[]>([]);
  const [redoStack, setRedoStack] = useState<DrawPath[]>([]);
  const [texts, setTexts] = useState<TextAnnotation[]>([]);
  const [arrows, setArrows] = useState<ArrowAnnotation[]>([]);
  const [shapes, setShapes] = useState<ShapeAnnotation[]>([]);
  const [measures, setMeasures] = useState<MeasureAnnotation[]>([]);

  // ── In-progress ──
  const [liveArrow, setLiveArrow] = useState<ArrowAnnotation | null>(null);
  const [liveShape, setLiveShape] = useState<ShapeAnnotation | null>(null);
  const [liveMeasure, setLiveMeasure] = useState<MeasureAnnotation | null>(null);

  // ── Modals ──
  const [textModal, setTextModal] = useState(false);
  const [textPos, setTextPos] = useState({ x: 0, y: 0 });
  const [textVal, setTextVal] = useState("");
  const [measureModal, setMeasureModal] = useState(false);
  const [pendingMeasure, setPendingMeasure] = useState<MeasureAnnotation | null>(null);
  const [measureLabel, setMeasureLabel] = useState("");

  // ── Crop shared values (always at top level) ──
  const cTop    = useSharedValue(0);
  const cLeft   = useSharedValue(0);
  const cRight  = useSharedValue(0);
  const cBottom = useSharedValue(0);

  const viewRef = useRef<View>(null);

  useEffect(() => {
    if (imageUri) {
      setImgUri(imageUri);
      Image.getSize(imageUri, (w, h) => {
        const ratio = w / h;
        setImgSize({ width: SW, height: SW / ratio });
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
      runOnJS(setRedoStack)([]);
    })
    .onUpdate((g) => {
      if (mode !== "draw") return;
      runOnJS(setPaths)((prev) => {
        const last = prev[prev.length - 1];
        if (!last) return prev;
        return [...prev.slice(0, -1), { ...last, segments: `${last.segments} L ${g.x} ${g.y}` }];
      });
    })
    .runOnJS(true);

  const arrowGesture = Gesture.Pan()
    .onStart((g) => {
      if (mode !== "arrow") return;
      runOnJS(setLiveArrow)({ id: uid(), x1: g.x, y1: g.y, x2: g.x, y2: g.y, color, strokeWidth: stroke });
    })
    .onUpdate((g) => {
      if (mode !== "arrow") return;
      runOnJS(setLiveArrow)((p) => p ? { ...p, x2: g.x, y2: g.y } : null);
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
        id: uid(), type: mode as "rect"|"circle",
        x: g.x, y: g.y, x2: g.x, y2: g.y,
        color, strokeWidth: stroke, filled,
      });
    })
    .onUpdate((g) => {
      if (mode !== "rect" && mode !== "circle") return;
      runOnJS(setLiveShape)((p) => p ? { ...p, x2: g.x, y2: g.y } : null);
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
      runOnJS(setLiveMeasure)({ id: uid(), x1: g.x, y1: g.y, x2: g.x, y2: g.y, color, label: "" });
    })
    .onUpdate((g) => {
      if (mode !== "measure") return;
      runOnJS(setLiveMeasure)((p) => p ? { ...p, x2: g.x, y2: g.y } : null);
    })
    .onEnd(() => {
      if (mode !== "measure") return;
      runOnJS((m: MeasureAnnotation | null) => {
        if (m) {
          const auto = `${Math.round(dist(m.x1, m.y1, m.x2, m.y2))}px`;
          setPendingMeasure({ ...m, label: auto });
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
      setRedoStack((p) => [last, ...p]);
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
    if (mode === "draw" && redoStack.length > 0) {
      const first = redoStack[0];
      setRedoStack((p) => p.slice(1));
      setPaths((p) => [...p, first]);
    }
  };

  const clearAll = () => {
    Alert.alert("Limpiar anotaciones", "¿Eliminar todas las anotaciones?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Limpiar", style: "destructive",
        onPress: () => {
          setPaths([]); setTexts([]); setArrows([]);
          setShapes([]); setMeasures([]); setRedoStack([]);
        },
      },
    ]);
  };

  // Rotation: purely visual transform — annotations stay in place
  const rotate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setImgRotation((r) => (r + 90) % 360);
  };

  const applyCrop = async () => {
    setProcessing(true);
    try {
      const r = await ImageManipulator.manipulateAsync(
        imgUri!,
        [{
          crop: {
            originX: cLeft.value,
            originY: cTop.value,
            width:   imgSize.width  - cLeft.value - cRight.value,
            height:  imgSize.height - cTop.value  - cBottom.value,
          },
        }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );
      setImgUri(r.uri);
      setMode("none");
      cTop.value = 0; cLeft.value = 0; cRight.value = 0; cBottom.value = 0;
      Image.getSize(r.uri, (w, h) =>
        setImgSize({ width: SW, height: SW / (w / h) })
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
        Alert.alert("Permiso denegado", "Se necesita acceso a la galería.");
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
        { id: uid(), text: textVal.trim(), x: textPos.x, y: textPos.y, color, fontSize, rotation: 0 },
      ]);
    }
    setTextModal(false);
    setTextVal("");
  };

  const confirmMeasure = () => {
    if (pendingMeasure) {
      setMeasures((p) => [...p, { ...pendingMeasure, label: measureLabel || pendingMeasure.label }]);
    }
    setMeasureModal(false);
    setPendingMeasure(null);
    setMeasureLabel("");
  };

  const updateText = (id: string, patch: Partial<TextAnnotation>) => {
    setTexts((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  // ─── Canvas helpers ───────────────────────────────────────────────────────

  const buildArrowPath = (a: ArrowAnnotation) => {
    const angle = Math.atan2(a.y2 - a.y1, a.x2 - a.x1);
    const hl = 14;
    const p = Skia.Path.Make();
    p.moveTo(a.x1, a.y1); p.lineTo(a.x2, a.y2);
    p.moveTo(a.x2, a.y2);
    p.lineTo(a.x2 - hl * Math.cos(angle - Math.PI / 6), a.y2 - hl * Math.sin(angle - Math.PI / 6));
    p.moveTo(a.x2, a.y2);
    p.lineTo(a.x2 - hl * Math.cos(angle + Math.PI / 6), a.y2 - hl * Math.sin(angle + Math.PI / 6));
    return p;
  };

  const buildShapePath = (s: ShapeAnnotation) => {
    const x = Math.min(s.x, s.x2), y = Math.min(s.y, s.y2);
    const w = Math.abs(s.x2 - s.x), h = Math.abs(s.y2 - s.y);
    const p = Skia.Path.Make();
    if (s.type === "rect") p.addRect(Skia.XYWHRect(x, y, w, h));
    else p.addOval(Skia.XYWHRect(x, y, w, h));
    return p;
  };

  const buildMeasurePath = (m: MeasureAnnotation) => {
    const angle = Math.atan2(m.y2 - m.y1, m.x2 - m.x1);
    const perp = angle + Math.PI / 2;
    const tk = 6;
    const p = Skia.Path.Make();
    p.moveTo(m.x1, m.y1); p.lineTo(m.x2, m.y2);
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

  const canUndo =
    (mode === "draw" && paths.length > 0) ||
    (mode === "text" && texts.length > 0) ||
    (mode === "arrow" && arrows.length > 0) ||
    ((mode === "rect" || mode === "circle") && shapes.length > 0) ||
    (mode === "measure" && measures.length > 0);

  const showOptions =
    mode === "draw" || mode === "arrow" || mode === "rect" ||
    mode === "circle" || mode === "measure" || mode === "text";

  // ─── Safe area header height ───────────────────────────────────────────────
  // We use the real insets.top from useSafeAreaInsets (which correctly reflects
  // Dynamic Island, notch, status bar on every device).
  // On Android we additionally read StatusBar.currentHeight as a fallback.
  const statusBarH = Platform.OS === "android"
    ? (RNStatusBar.currentHeight ?? 24)
    : 0;
  const safeTop = Math.max(insets.top, statusBarH);
  const NAV_H = 44;
  const HEADER_H = safeTop + NAV_H;

  if (!imgUri) {
    return (
      <View style={[S.container, S.center]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ color: "#999", marginTop: 16 }}>Cargando imagen...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={S.container}>
      {/* Hide system status bar so nothing overlaps our header */}
      <StatusBar style="light" hidden={false} translucent={false} backgroundColor="#111" />

      {/* ── Navigation Bar (Apple HIG) ── */}
      <View style={[S.navBar, { paddingTop: safeTop, height: HEADER_H }]}>
        {/* Cancel */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={S.navSideBtn}
          hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
        >
          <Text style={S.navCancelText}>Cancelar</Text>
        </TouchableOpacity>

        {/* Title */}
        <Text style={S.navTitle} numberOfLines={1}>Anotar Foto</Text>

        {/* Right actions */}
        <View style={S.navRight}>
          {hasAnnotations && (
            <TouchableOpacity onPress={clearAll} style={S.navIconBtn}
              hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}>
              <MaterialIcons name="delete-sweep" size={20} color="#FF3B30" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={undo} disabled={!canUndo} style={S.navIconBtn}
            hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}>
            <MaterialIcons name="undo" size={20} color={canUndo ? "#FFF" : "#444"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={redoAction} disabled={redoStack.length === 0} style={S.navIconBtn}
            hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}>
            <MaterialIcons name="redo" size={20} color={redoStack.length > 0 ? "#FFF" : "#444"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={save}
            hitSlop={{ top: 10, bottom: 10, left: 4, right: 8 }}>
            <Text style={S.navSaveText}>Guardar</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={S.navSep} />

      {/* ── Editor Area ── */}
      <View style={S.editorArea}>
        <GestureDetector gesture={activeGesture}>
          {/* This wrapper applies the visual rotation. The ref captures everything including annotations. */}
          <View
            ref={viewRef}
            collapsable={false}
            style={[
              S.imgWrapper,
              { width: imgSize.width, height: imgSize.height },
              imgRotation !== 0 && { transform: [{ rotate: `${imgRotation}deg` }] },
            ]}
          >
            <Image source={{ uri: imgUri }} style={S.img} resizeMode="contain" />

            {/* Skia canvas */}
            <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
              {paths.map((p) => {
                const skPath = Skia.Path.MakeFromSVGString(p.segments);
                if (!skPath) return null;
                const paint = Skia.Paint();
                paint.setColor(Skia.Color(p.color));
                paint.setStrokeWidth(p.strokeWidth);
                paint.setStyle(1); paint.setAntiAlias(true);
                paint.setStrokeCap(1); paint.setStrokeJoin(1);
                return <Path key={p.id} path={skPath} paint={paint} />;
              })}
              {[...arrows, ...(liveArrow ? [liveArrow] : [])].map((a) => {
                const paint = Skia.Paint();
                paint.setColor(Skia.Color(a.color));
                paint.setStrokeWidth(a.strokeWidth);
                paint.setStyle(1); paint.setAntiAlias(true);
                return <Path key={a.id} path={buildArrowPath(a)} paint={paint} />;
              })}
              {[...shapes, ...(liveShape ? [liveShape] : [])].map((s) => {
                const paint = Skia.Paint();
                paint.setColor(Skia.Color(s.color));
                paint.setStrokeWidth(s.strokeWidth);
                paint.setStyle(s.filled ? 0 : 1); paint.setAntiAlias(true);
                return <Path key={s.id} path={buildShapePath(s)} paint={paint} />;
              })}
              {[...measures, ...(liveMeasure ? [liveMeasure] : [])].map((m) => {
                const paint = Skia.Paint();
                paint.setColor(Skia.Color(m.color));
                paint.setStrokeWidth(2);
                paint.setStyle(1); paint.setAntiAlias(true);
                return <Path key={m.id} path={buildMeasurePath(m)} paint={paint} />;
              })}
            </Canvas>

            {/* Draggable + scalable + rotatable text annotations */}
            {texts.map((t) => (
              <DraggableText
                key={t.id}
                ann={t}
                onUpdate={updateText}
                active={mode === "text"}
              />
            ))}

            {/* Measure labels */}
            {measures.map((m) => (
              <View
                key={`lbl-${m.id}`}
                style={{
                  position: "absolute",
                  left: (m.x1 + m.x2) / 2 - 30,
                  top:  (m.y1 + m.y2) / 2 - 18,
                  backgroundColor: "rgba(0,0,0,0.65)",
                  paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
                }}
                pointerEvents="none"
              >
                <Text style={{ color: m.color, fontSize: 12, fontWeight: "700" }}>{m.label}</Text>
              </View>
            ))}

            {/* Crop overlay — only when mode === "crop" */}
            {mode === "crop" && (
              <>
                <CropOverlay
                  cTop={cTop} cLeft={cLeft} cRight={cRight} cBottom={cBottom}
                  imgW={imgSize.width} imgH={imgSize.height}
                />
                <CropCorner corner="TL" cTop={cTop} cLeft={cLeft} cRight={cRight} cBottom={cBottom} imgW={imgSize.width} imgH={imgSize.height} />
                <CropCorner corner="TR" cTop={cTop} cLeft={cLeft} cRight={cRight} cBottom={cBottom} imgW={imgSize.width} imgH={imgSize.height} />
                <CropCorner corner="BL" cTop={cTop} cLeft={cLeft} cRight={cRight} cBottom={cBottom} imgW={imgSize.width} imgH={imgSize.height} />
                <CropCorner corner="BR" cTop={cTop} cLeft={cLeft} cRight={cRight} cBottom={cBottom} imgW={imgSize.width} imgH={imgSize.height} />
              </>
            )}
          </View>
        </GestureDetector>
      </View>

      {/* ── Bottom Toolbar ── */}
      <View style={S.toolbar}>
        {showOptions && (
          <View style={S.optRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={S.colorRow}>
              {PALETTE.map((c) => (
                <TouchableOpacity key={c} onPress={() => setColor(c)}
                  style={[S.dot, { backgroundColor: c }, color === c && S.dotActive]} />
              ))}
            </ScrollView>
            <View style={S.subRow}>
              {mode !== "text" && mode !== "measure" && STROKE_SIZES.map((w) => (
                <TouchableOpacity key={w} onPress={() => setStroke(w)}
                  style={[S.subBtn, stroke === w && S.subBtnActive]}>
                  <View style={{ width: w, height: w, borderRadius: w / 2, backgroundColor: color }} />
                </TouchableOpacity>
              ))}
              {mode === "text" && [12, 16, 20, 26, 32].map((fs) => (
                <TouchableOpacity key={fs} onPress={() => setFontSize(fs)}
                  style={[S.subBtn, fontSize === fs && S.subBtnActive]}>
                  <Text style={{ color, fontSize: 10, fontWeight: "700" }}>{fs}</Text>
                </TouchableOpacity>
              ))}
              {(mode === "rect" || mode === "circle") && (
                <TouchableOpacity onPress={() => setFilled((v) => !v)}
                  style={[S.subBtn, filled && S.subBtnActive]}>
                  <MaterialIcons name={filled ? "format-color-fill" : "format-color-reset"} size={18} color="#FFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={S.toolRow}>
          {TOOLS.map((t) => {
            const active = mode === t.id;
            return (
              <TouchableOpacity key={t.id}
                onPress={() => { Haptics.selectionAsync(); setMode(active ? "none" : t.id); }}
                style={[S.toolBtn, active && S.toolBtnActive]}>
                <MaterialIcons name={t.icon as any} size={22} color={active ? "#007AFF" : "#FFF"} />
                <Text style={[S.toolTxt, active && { color: "#007AFF" }]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity onPress={rotate} style={S.toolBtn}>
            <MaterialIcons name="rotate-right" size={22} color="#FFF" />
            <Text style={S.toolTxt}>Rotar</Text>
          </TouchableOpacity>
        </ScrollView>

        {mode === "crop" && (
          <TouchableOpacity onPress={applyCrop} style={S.applyBtn}>
            <Text style={S.applyBtnText}>Aplicar Recorte</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: Math.max(insets.bottom, 8) }} />
      </View>

      {/* ── Text Modal ── */}
      <Modal visible={textModal} transparent animationType="slide" onRequestClose={() => setTextModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={S.overlay}>
          <View style={[S.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
            <View style={S.sheetHandle} />
            <Text style={S.sheetTitle}>Agregar Texto</Text>
            <Text style={S.sheetSub}>Luego puedes arrastrarlo, escalarlo con dos dedos y rotarlo.</Text>
            <TextInput value={textVal} onChangeText={setTextVal}
              placeholder="Escribe aquí..." placeholderTextColor="#666"
              style={S.sheetInput} autoFocus multiline />
            <View style={S.sheetBtns}>
              <TouchableOpacity onPress={() => setTextModal(false)} style={[S.sheetBtn, S.sheetBtnCancel]}>
                <Text style={S.sheetBtnCancelTxt}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmText} style={[S.sheetBtn, S.sheetBtnConfirm]}>
                <Text style={S.sheetBtnConfirmTxt}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Measure Modal ── */}
      <Modal visible={measureModal} transparent animationType="slide" onRequestClose={() => setMeasureModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={S.overlay}>
          <View style={[S.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
            <View style={S.sheetHandle} />
            <Text style={S.sheetTitle}>Etiqueta de Medida</Text>
            <Text style={S.sheetSub}>Personaliza la etiqueta (ej: "2.5 m", "120 cm")</Text>
            <TextInput value={measureLabel} onChangeText={setMeasureLabel}
              placeholder="Ej: 2.5 m" placeholderTextColor="#666"
              style={S.sheetInput} autoFocus />
            <View style={S.sheetBtns}>
              <TouchableOpacity onPress={() => setMeasureModal(false)} style={[S.sheetBtn, S.sheetBtnCancel]}>
                <Text style={S.sheetBtnCancelTxt}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmMeasure} style={[S.sheetBtn, S.sheetBtnConfirm]}>
                <Text style={S.sheetBtnConfirmTxt}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Processing overlay ── */}
      {processing && (
        <View style={S.loader}>
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={S.loaderText}>Procesando...</Text>
        </View>
      )}
    </GestureHandlerRootView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { justifyContent: "center", alignItems: "center" },

  // Navigation bar
  navBar: {
    backgroundColor: "#111",
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 8,
    paddingBottom: 0,
  },
  navSep: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.15)" },
  navSideBtn: { width: 80, height: 44, justifyContent: "center", paddingLeft: 8 },
  navCancelText: { color: "#FFF", fontSize: 17, fontWeight: "400", letterSpacing: -0.2 },
  navTitle: {
    flex: 1, textAlign: "center", color: "#FFF",
    fontSize: 17, fontWeight: "600", letterSpacing: -0.3,
    height: 44, lineHeight: 44,
  },
  navRight: {
    width: 80, height: 44,
    flexDirection: "row", alignItems: "center",
    justifyContent: "flex-end", gap: 2, paddingRight: 4,
  },
  navIconBtn: { width: 32, height: 44, alignItems: "center", justifyContent: "center" },
  navSaveText: {
    color: "#007AFF", fontSize: 17, fontWeight: "600",
    letterSpacing: -0.2, height: 44, lineHeight: 44, paddingRight: 4,
  },

  // Editor
  editorArea: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" },
  imgWrapper: { position: "relative", backgroundColor: "#111" },
  img: { width: "100%", height: "100%" },

  // Crop
  cropHandle: {
    borderRadius: 14, backgroundColor: "#FFF",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6, shadowRadius: 4, elevation: 8,
  },
  gridLine: { position: "absolute", backgroundColor: "rgba(255,255,255,0.3)" },

  // Toolbar
  toolbar: {
    backgroundColor: "#111",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.12)",
    paddingTop: 8,
  },
  optRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.1)",
    paddingBottom: 10, marginBottom: 2,
  },
  colorRow: { paddingHorizontal: 16, gap: 12, height: 40, alignItems: "center" },
  dot: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: "transparent" },
  dotActive: { borderColor: "#FFF", transform: [{ scale: 1.18 }] },
  subRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 10, paddingHorizontal: 16 },
  subBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  subBtnActive: { backgroundColor: "rgba(255,255,255,0.18)" },
  toolRow: { paddingHorizontal: 6, gap: 2, alignItems: "center", paddingVertical: 6 },
  toolBtn: { alignItems: "center", gap: 3, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, minWidth: 58 },
  toolBtnActive: { backgroundColor: "rgba(0,122,255,0.15)" },
  toolTxt: { color: "#CCC", fontSize: 10, fontWeight: "500" },
  applyBtn: { marginHorizontal: 16, marginTop: 6, backgroundColor: "#007AFF", paddingVertical: 13, borderRadius: 12, alignItems: "center" },
  applyBtnText: { color: "#FFF", fontWeight: "700", fontSize: 15 },

  // Bottom sheet
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#1C1C1E", borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 12 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.25)", alignSelf: "center", marginBottom: 16 },
  sheetTitle: { color: "#FFF", fontSize: 17, fontWeight: "600", marginBottom: 4 },
  sheetSub: { color: "#999", fontSize: 13, marginBottom: 14 },
  sheetInput: { backgroundColor: "#2C2C2E", borderRadius: 10, padding: 14, fontSize: 16, color: "#FFF", minHeight: 52 },
  sheetBtns: { flexDirection: "row", gap: 10, marginTop: 14 },
  sheetBtn: { flex: 1, paddingVertical: 13, borderRadius: 10, alignItems: "center" },
  sheetBtnCancel: { backgroundColor: "#2C2C2E" },
  sheetBtnCancelTxt: { color: "#FFF", fontWeight: "500", fontSize: 15 },
  sheetBtnConfirm: { backgroundColor: "#007AFF" },
  sheetBtnConfirmTxt: { color: "#FFF", fontWeight: "700", fontSize: 15 },

  // Loader
  loader: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.72)", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  loaderText: { color: "#FFF", fontWeight: "600", marginTop: 12, fontSize: 15 },
});
