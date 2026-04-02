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
} from "react-native-reanimated";
import { captureRef } from "react-native-view-shot";
import * as MediaLibrary from "expo-media-library";
import * as Haptics from "expo-haptics";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Types ────────────────────────────────────────────────────────────────────

type EditMode = "none" | "draw" | "text" | "arrow" | "rect" | "circle" | "measure" | "crop";

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
  { id: "draw",    icon: "edit",                    label: "Dibujar"     },
  { id: "text",    icon: "title",                   label: "Texto"       },
  { id: "arrow",   icon: "arrow-forward",           label: "Flecha"      },
  { id: "rect",    icon: "crop-square",             label: "Rectángulo"  },
  { id: "circle",  icon: "radio-button-unchecked",  label: "Círculo"     },
  { id: "measure", icon: "straighten",              label: "Medida"      },
  { id: "crop",    icon: "crop",                    label: "Recortar"    },
];

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function dist(x1: number, y1: number, x2: number, y2: number) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ImageEditorScreen() {
  const router = useRouter();
  const colors = useColors();
  const { imageUri, projectId } = useLocalSearchParams<{
    imageUri: string;
    projectId?: string;
  }>();

  // Image
  const [imgUri, setImgUri] = useState(imageUri);
  const [imgSize, setImgSize] = useState({ width: SCREEN_WIDTH, height: SCREEN_WIDTH });
  const [processing, setProcessing] = useState(false);

  // Tool
  const [mode, setMode] = useState<EditMode>("none");
  const [color, setColor] = useState(PALETTE[2]);
  const [stroke, setStroke] = useState(STROKE_SIZES[1]);
  const [filled, setFilled] = useState(false);
  const [fontSize, setFontSize] = useState(18);

  // Annotation layers
  const [paths, setPaths] = useState<DrawPath[]>([]);
  const [redo, setRedo] = useState<DrawPath[]>([]);
  const [texts, setTexts] = useState<TextAnnotation[]>([]);
  const [arrows, setArrows] = useState<ArrowAnnotation[]>([]);
  const [shapes, setShapes] = useState<ShapeAnnotation[]>([]);
  const [measures, setMeasures] = useState<MeasureAnnotation[]>([]);

  // In-progress
  const [liveArrow, setLiveArrow] = useState<ArrowAnnotation | null>(null);
  const [liveShape, setLiveShape] = useState<ShapeAnnotation | null>(null);
  const [liveMeasure, setLiveMeasure] = useState<MeasureAnnotation | null>(null);

  // Text modal
  const [textModal, setTextModal] = useState(false);
  const [textPos, setTextPos] = useState({ x: 0, y: 0 });
  const [textVal, setTextVal] = useState("");

  // Measure label modal
  const [measureModal, setMeasureModal] = useState(false);
  const [pendingMeasure, setPendingMeasure] = useState<MeasureAnnotation | null>(null);
  const [measureLabel, setMeasureLabel] = useState("");

  // Crop
  const cTop = useSharedValue(0);
  const cLeft = useSharedValue(0);
  const cRight = useSharedValue(0);
  const cBottom = useSharedValue(0);

  const viewRef = useRef<View>(null);

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
      runOnJS(setLiveMeasure)({ id: uid(), x1: g.x, y1: g.y, x2: g.x, y2: g.y, color, label: "" });
    })
    .onUpdate((g) => {
      if (mode !== "measure") return;
      runOnJS(setLiveMeasure)((prev) => prev ? { ...prev, x2: g.x, y2: g.y } : null);
    })
    .onEnd(() => {
      if (mode !== "measure") return;
      runOnJS((m: MeasureAnnotation | null) => {
        if (m) {
          const px = dist(m.x1, m.y1, m.x2, m.y2);
          const auto = `${Math.round(px)}px`;
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

  const cropTL = Gesture.Pan().onUpdate((g) => {
    cTop.value = Math.max(0, Math.min(imgSize.height - cBottom.value - 50, g.y));
    cLeft.value = Math.max(0, Math.min(imgSize.width - cRight.value - 50, g.x));
  });

  const cropBR = Gesture.Pan().onUpdate((g) => {
    cBottom.value = Math.max(0, Math.min(imgSize.height - cTop.value - 50, imgSize.height - g.y));
    cRight.value = Math.max(0, Math.min(imgSize.width - cLeft.value - 50, imgSize.width - g.x));
  });

  const activeGesture =
    mode === "draw" ? drawGesture
    : mode === "arrow" ? arrowGesture
    : mode === "rect" || mode === "circle" ? shapeGesture
    : mode === "measure" ? measureGesture
    : mode === "text" ? tapGesture
    : Gesture.Tap();

  const cropOverlayStyle = useAnimatedStyle(() => ({
    top: cTop.value, left: cLeft.value,
    right: cRight.value, bottom: cBottom.value,
    borderColor: "#FFF", borderWidth: 2, position: "absolute",
  }));

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
        text: "Limpiar", style: "destructive",
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
      setMeasures((p) => [...p, { ...pendingMeasure, label: measureLabel || pendingMeasure.label }]);
    }
    setMeasureModal(false);
    setPendingMeasure(null);
    setMeasureLabel("");
  };

  // ─── Canvas draw helpers ──────────────────────────────────────────────────

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

  // ─── Render ───────────────────────────────────────────────────────────────

  const hasAnnotations =
    paths.length > 0 || texts.length > 0 ||
    arrows.length > 0 || shapes.length > 0 || measures.length > 0;

  const showOptions =
    mode === "draw" || mode === "arrow" || mode === "rect" ||
    mode === "circle" || mode === "measure" || mode === "text";

  if (!imgUri) {
    return (
      <View style={[S.container, S.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.muted, marginTop: 16 }}>Cargando imagen...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={S.container}>

      {/* ── Header ── */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => router.back()} style={S.hBtn}>
          <Text style={S.cancelTxt}>Cancelar</Text>
        </TouchableOpacity>
        <Text style={{ color: "#FFF", fontSize: 17, fontWeight: "700" }}>Anotar Foto</Text>
        <View style={S.hActions}>
          {hasAnnotations && (
            <TouchableOpacity onPress={clearAll} style={S.hBtn}>
              <MaterialIcons name="delete-sweep" size={22} color="#FF3B30" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={undo} style={S.hBtn}>
            <MaterialIcons name="undo" size={22} color={hasAnnotations ? "#FFF" : "#444"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={redoAction} style={S.hBtn}>
            <MaterialIcons name="redo" size={22} color={redo.length > 0 ? "#FFF" : "#444"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={save}>
            <Text style={[S.saveTxt, { color: colors.primary }]}>Guardar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Editor ── */}
      <View style={S.editorArea}>
        <GestureDetector gesture={activeGesture}>
          <View
            ref={viewRef}
            collapsable={false}
            style={[S.imgWrapper, { width: imgSize.width, height: imgSize.height }]}
          >
            <Image source={{ uri: imgUri }} style={S.img} resizeMode="contain" />

            {/* Skia canvas */}
            <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
              {/* Draw paths */}
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

              {/* Arrows */}
              {[...arrows, ...(liveArrow ? [liveArrow] : [])].map((a) => {
                const paint = Skia.Paint();
                paint.setColor(Skia.Color(a.color));
                paint.setStrokeWidth(a.strokeWidth);
                paint.setStyle(1);
                paint.setAntiAlias(true);
                return <Path key={a.id} path={buildArrowPath(a)} paint={paint} />;
              })}

              {/* Shapes */}
              {[...shapes, ...(liveShape ? [liveShape] : [])].map((s) => {
                const paint = Skia.Paint();
                paint.setColor(Skia.Color(s.color));
                paint.setStrokeWidth(s.strokeWidth);
                paint.setStyle(s.filled ? 0 : 1);
                paint.setAntiAlias(true);
                return <Path key={s.id} path={buildShapePath(s)} paint={paint} />;
              })}

              {/* Measures */}
              {[...measures, ...(liveMeasure ? [liveMeasure] : [])].map((m) => {
                const paint = Skia.Paint();
                paint.setColor(Skia.Color(m.color));
                paint.setStrokeWidth(2);
                paint.setStyle(1);
                paint.setAntiAlias(true);
                return <Path key={m.id} path={buildMeasurePath(m)} paint={paint} />;
              })}
            </Canvas>

            {/* Text overlays (native) */}
            {texts.map((t) => (
              <View
                key={t.id}
                style={{
                  position: "absolute", left: t.x, top: t.y - t.fontSize,
                  backgroundColor: "rgba(0,0,0,0.45)",
                  paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
                }}
                pointerEvents="none"
              >
                <Text style={{ color: t.color, fontSize: t.fontSize, fontWeight: "700" }}>
                  {t.text}
                </Text>
              </View>
            ))}

            {/* Measure labels */}
            {measures.map((m) => (
              <View
                key={`lbl-${m.id}`}
                style={{
                  position: "absolute",
                  left: (m.x1 + m.x2) / 2 - 30,
                  top: (m.y1 + m.y2) / 2 - 18,
                  backgroundColor: "rgba(0,0,0,0.6)",
                  paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
                }}
                pointerEvents="none"
              >
                <Text style={{ color: m.color, fontSize: 12, fontWeight: "700" }}>
                  {m.label}
                </Text>
              </View>
            ))}

            {/* Crop overlay */}
            {mode === "crop" && (
              <>
                <Animated.View style={cropOverlayStyle} />
                <Animated.View style={[cropOverlayStyle, { borderColor: "transparent" }]}>
                  <View style={[S.gridLine, { top: "33.3%", width: "100%", height: 1 }]} />
                  <View style={[S.gridLine, { top: "66.6%", width: "100%", height: 1 }]} />
                  <View style={[S.gridLine, { left: "33.3%", height: "100%", width: 1 }]} />
                  <View style={[S.gridLine, { left: "66.6%", height: "100%", width: 1 }]} />
                </Animated.View>
                <GestureDetector gesture={cropTL}>
                  <Animated.View
                    style={[S.cropHandle, useAnimatedStyle(() => ({ top: cTop.value - 15, left: cLeft.value - 15 }))]}
                  />
                </GestureDetector>
                <GestureDetector gesture={cropBR}>
                  <Animated.View
                    style={[S.cropHandle, useAnimatedStyle(() => ({ bottom: cBottom.value - 15, right: cRight.value - 15 }))]}
                  />
                </GestureDetector>
              </>
            )}
          </View>
        </GestureDetector>
      </View>

      {/* ── Bottom Toolbar ── */}
      <View style={S.toolbar}>
        {/* Color + options row */}
        {showOptions && (
          <View style={S.optRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.colorRow}>
              {PALETTE.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setColor(c)}
                  style={[S.dot, { backgroundColor: c }, color === c && S.dotActive]}
                />
              ))}
            </ScrollView>

            <View style={S.subRow}>
              {mode !== "text" && mode !== "measure" && STROKE_SIZES.map((w) => (
                <TouchableOpacity
                  key={w}
                  onPress={() => setStroke(w)}
                  style={[S.strokeBtn, stroke === w && S.strokeBtnActive]}
                >
                  <View style={{ width: w, height: w, borderRadius: w / 2, backgroundColor: color }} />
                </TouchableOpacity>
              ))}

              {mode === "text" && [12, 16, 20, 26, 32].map((fs) => (
                <TouchableOpacity
                  key={fs}
                  onPress={() => setFontSize(fs)}
                  style={[S.strokeBtn, fontSize === fs && S.strokeBtnActive]}
                >
                  <Text style={{ color, fontSize: 10, fontWeight: "700" }}>{fs}</Text>
                </TouchableOpacity>
              ))}

              {(mode === "rect" || mode === "circle") && (
                <TouchableOpacity
                  onPress={() => setFilled((v) => !v)}
                  style={[S.strokeBtn, filled && S.strokeBtnActive]}
                >
                  <MaterialIcons
                    name={filled ? "format-color-fill" : "format-color-reset"}
                    size={18} color="#FFF"
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Tool tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.toolRow}>
          {TOOLS.map((t) => {
            const active = mode === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                onPress={() => { Haptics.selectionAsync(); setMode(active ? "none" : t.id); }}
                style={[S.toolBtn, active && S.toolBtnActive]}
              >
                <MaterialIcons name={t.icon as any} size={24} color={active ? colors.primary : "#FFF"} />
                <Text style={[S.toolTxt, active && { color: colors.primary }]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity onPress={rotate} style={S.toolBtn}>
            <MaterialIcons name="rotate-right" size={24} color="#FFF" />
            <Text style={S.toolTxt}>Rotar</Text>
          </TouchableOpacity>
        </ScrollView>

        {mode === "crop" && (
          <TouchableOpacity onPress={applyCrop} style={S.applyBtn}>
            <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 15 }}>Aplicar Recorte</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Text Modal ── */}
      <Modal visible={textModal} transparent animationType="fade" onRequestClose={() => setTextModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={S.overlay}>
          <View style={[S.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: "700", marginBottom: 16 }}>
              Agregar Texto
            </Text>
            <TextInput
              value={textVal}
              onChangeText={setTextVal}
              placeholder="Escribe aquí..."
              placeholderTextColor={colors.muted}
              style={[S.input, { color: colors.foreground, borderColor: colors.border }]}
              autoFocus
              multiline
            />
            <View style={S.modalBtns}>
              <TouchableOpacity onPress={() => setTextModal(false)} style={[S.mBtn, { backgroundColor: colors.border }]}>
                <Text style={{ color: colors.foreground, fontWeight: "600" }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmText} style={[S.mBtn, { backgroundColor: colors.primary }]}>
                <Text style={{ color: "#FFF", fontWeight: "700" }}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Measure Label Modal ── */}
      <Modal visible={measureModal} transparent animationType="fade" onRequestClose={() => setMeasureModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={S.overlay}>
          <View style={[S.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: "700", marginBottom: 6 }}>
              Etiqueta de Medida
            </Text>
            <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 14 }}>
              Personaliza la etiqueta (ej: "2.5 m", "120 cm")
            </Text>
            <TextInput
              value={measureLabel}
              onChangeText={setMeasureLabel}
              placeholder="Ej: 2.5 m"
              placeholderTextColor={colors.muted}
              style={[S.input, { color: colors.foreground, borderColor: colors.border }]}
              autoFocus
            />
            <View style={S.modalBtns}>
              <TouchableOpacity onPress={() => setMeasureModal(false)} style={[S.mBtn, { backgroundColor: colors.border }]}>
                <Text style={{ color: colors.foreground, fontWeight: "600" }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmMeasure} style={[S.mBtn, { backgroundColor: colors.primary }]}>
                <Text style={{ color: "#FFF", fontWeight: "700" }}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Processing overlay ── */}
      {processing && (
        <View style={S.loader}>
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={{ color: "#FFF", fontWeight: "600", marginTop: 12 }}>Procesando...</Text>
        </View>
      )}
    </GestureHandlerRootView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  center: { justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 52 : 20,
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: "#111",
  },
  hActions: { flexDirection: "row", gap: 6, alignItems: "center" },
  hBtn: { padding: 8 },
  cancelTxt: { color: "#FFF", fontSize: 17 },
  saveTxt: { fontSize: 17, fontWeight: "700" },
  editorArea: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" },
  imgWrapper: { position: "relative", backgroundColor: "#111" },
  img: { width: "100%", height: "100%" },
  cropHandle: { width: 30, height: 30, backgroundColor: "#FFF", borderRadius: 15, position: "absolute", zIndex: 10 },
  gridLine: { position: "absolute", backgroundColor: "rgba(255,255,255,0.4)" },
  toolbar: { backgroundColor: "#111", paddingBottom: Platform.OS === "ios" ? 36 : 16, paddingTop: 8 },
  optRow: { borderBottomWidth: 1, borderBottomColor: "#222", paddingBottom: 10, marginBottom: 4 },
  colorRow: { paddingHorizontal: 16, gap: 12, height: 40, alignItems: "center" },
  dot: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: "transparent" },
  dotActive: { borderColor: "#FFF", transform: [{ scale: 1.15 }] },
  subRow: { flexDirection: "row", justifyContent: "center", gap: 10, marginTop: 10, paddingHorizontal: 16 },
  strokeBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  strokeBtnActive: { backgroundColor: "rgba(255,255,255,0.2)" },
  toolRow: { paddingHorizontal: 8, gap: 4, alignItems: "center", paddingVertical: 6 },
  toolBtn: { alignItems: "center", gap: 3, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, minWidth: 64 },
  toolBtnActive: { backgroundColor: "rgba(255,255,255,0.15)" },
  toolTxt: { color: "#FFF", fontSize: 10, fontWeight: "500" },
  applyBtn: {
    marginHorizontal: 16, marginTop: 8,
    backgroundColor: "#007AFF", paddingVertical: 14,
    borderRadius: 14, alignItems: "center",
  },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalCard: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16, minHeight: 52 },
  modalBtns: { flexDirection: "row", gap: 12, marginTop: 16 },
  mBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  loader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center", alignItems: "center", zIndex: 1000,
  },
});
