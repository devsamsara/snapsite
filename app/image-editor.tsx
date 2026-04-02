/**
 * image-editor.tsx — v4
 *
 * Layout fix: header is a FIXED overlay with zIndex:999 and solid background.
 * It is rendered LAST in the tree so it always paints on top of everything.
 * The editor area has paddingTop equal to the header height so the image
 * never slides under the header.
 *
 * Text sticker: drag (1 finger) + pinch-to-scale (2 fingers) simultaneously,
 * no rotation (cancelled per user request).
 *
 * Red icon in header fixed: clearAll button only shown when hasAnnotations AND
 * it is placed inside navRight with proper sizing.
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

const { width: SW } = Dimensions.get("window");

// ─── Types ────────────────────────────────────────────────────────────────────

type EditMode =
  | "none" | "draw" | "text" | "arrow"
  | "rect" | "circle" | "measure" | "crop";

interface DrawPath {
  id: string; segments: string; color: string; strokeWidth: number;
}
interface TextAnnotation {
  id: string; text: string; x: number; y: number;
  color: string; fontSize: number;
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

// ─── Text Sticker (drag + pinch, WhatsApp style) ──────────────────────────────

interface StickerProps {
  ann: TextAnnotation;
  onUpdate: (id: string, patch: Partial<TextAnnotation>) => void;
  active: boolean;
}

function TextSticker({ ann, onUpdate, active }: StickerProps) {
  const tx = useSharedValue(ann.x);
  const ty = useSharedValue(ann.y);
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const baseX = useSharedValue(ann.x);
  const baseY = useSharedValue(ann.y);

  useEffect(() => {
    tx.value = ann.x;
    ty.value = ann.y;
  }, [ann.x, ann.y]);

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
      runOnJS(onUpdate)(ann.id, { x: tx.value, y: ty.value });
    });

  const pinch = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((g) => {
      scale.value = Math.max(0.4, Math.min(6, savedScale.value * g.scale));
    })
    .onEnd(() => {
      const newFs = Math.round(ann.fontSize * scale.value);
      runOnJS(onUpdate)(ann.id, { fontSize: Math.max(8, Math.min(120, newFs)) });
      scale.value = 1;
      savedScale.value = 1;
    });

  const composed = active
    ? Gesture.Simultaneous(drag, pinch)
    : Gesture.Tap();

  const animStyle = useAnimatedStyle(() => ({
    position: "absolute",
    left: tx.value,
    top: ty.value,
    transform: [{ scale: scale.value }],
    zIndex: 20,
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={animStyle}>
        <View style={SS.stickerBg}>
          <Text style={[SS.stickerText, { color: ann.color, fontSize: ann.fontSize }]}>
            {ann.text}
          </Text>
        </View>
        {active && (
          <View style={SS.stickerHandle}>
            <MaterialIcons name="open-with" size={11} color="#FFF" />
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

// ─── Crop Overlay + Handles (worklet, 4 corners) ──────────────────────────────

interface CropProps {
  cTop: SharedValue<number>; cLeft: SharedValue<number>;
  cRight: SharedValue<number>; cBottom: SharedValue<number>;
  imgW: number; imgH: number;
}

function CropOverlay({ cTop, cLeft, cRight, cBottom }: CropProps) {
  const dimT = useAnimatedStyle(() => ({ position:"absolute",left:0,right:0,top:0,height:cTop.value,backgroundColor:"rgba(0,0,0,0.55)" }));
  const dimB = useAnimatedStyle(() => ({ position:"absolute",left:0,right:0,bottom:0,height:cBottom.value,backgroundColor:"rgba(0,0,0,0.55)" }));
  const dimL = useAnimatedStyle(() => ({ position:"absolute",left:0,top:cTop.value,bottom:cBottom.value,width:cLeft.value,backgroundColor:"rgba(0,0,0,0.55)" }));
  const dimR = useAnimatedStyle(() => ({ position:"absolute",right:0,top:cTop.value,bottom:cBottom.value,width:cRight.value,backgroundColor:"rgba(0,0,0,0.55)" }));
  const border = useAnimatedStyle(() => ({ position:"absolute",top:cTop.value,left:cLeft.value,right:cRight.value,bottom:cBottom.value,borderWidth:1.5,borderColor:"#FFF" }));
  const grid   = useAnimatedStyle(() => ({ position:"absolute",top:cTop.value,left:cLeft.value,right:cRight.value,bottom:cBottom.value }));
  return (
    <>
      <Animated.View style={dimT} pointerEvents="none" />
      <Animated.View style={dimB} pointerEvents="none" />
      <Animated.View style={dimL} pointerEvents="none" />
      <Animated.View style={dimR} pointerEvents="none" />
      <Animated.View style={border} pointerEvents="none" />
      <Animated.View style={grid} pointerEvents="none">
        <View style={[SS.gridLine,{top:"33.3%",width:"100%",height:1}]} />
        <View style={[SS.gridLine,{top:"66.6%",width:"100%",height:1}]} />
        <View style={[SS.gridLine,{left:"33.3%",height:"100%",width:1}]} />
        <View style={[SS.gridLine,{left:"66.6%",height:"100%",width:1}]} />
      </Animated.View>
    </>
  );
}

interface CornerProps extends CropProps { corner: "TL"|"TR"|"BL"|"BR"; }

function CropCorner({ cTop, cLeft, cRight, cBottom, corner, imgW, imgH }: CornerProps) {
  const MIN = 60;
  const g = Gesture.Pan().onUpdate((e) => {
    "worklet";
    if (corner === "TL") {
      cTop.value   = Math.max(0, Math.min(imgH - cBottom.value - MIN, e.y));
      cLeft.value  = Math.max(0, Math.min(imgW - cRight.value  - MIN, e.x));
    } else if (corner === "TR") {
      cTop.value   = Math.max(0, Math.min(imgH - cBottom.value - MIN, e.y));
      cRight.value = Math.max(0, Math.min(imgW - cLeft.value   - MIN, imgW - e.x));
    } else if (corner === "BL") {
      cBottom.value = Math.max(0, Math.min(imgH - cTop.value  - MIN, imgH - e.y));
      cLeft.value   = Math.max(0, Math.min(imgW - cRight.value - MIN, e.x));
    } else {
      cBottom.value = Math.max(0, Math.min(imgH - cTop.value  - MIN, imgH - e.y));
      cRight.value  = Math.max(0, Math.min(imgW - cLeft.value  - MIN, imgW - e.x));
    }
  });
  const style = useAnimatedStyle(() => {
    "worklet";
    const base = { position: "absolute" as const, width: 28, height: 28, zIndex: 30 };
    if (corner === "TL") return { ...base, top:    cTop.value    - 14, left:  cLeft.value  - 14 };
    if (corner === "TR") return { ...base, top:    cTop.value    - 14, right: cRight.value - 14 };
    if (corner === "BL") return { ...base, bottom: cBottom.value - 14, left:  cLeft.value  - 14 };
    return                      { ...base, bottom: cBottom.value - 14, right: cRight.value - 14 };
  });
  return (
    <GestureDetector gesture={g}>
      <Animated.View style={[SS.cropHandle, style]} />
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

  const [imgUri, setImgUri]     = useState(imageUri);
  const [imgSize, setImgSize]   = useState({ width: SW, height: SW });
  const [imgRot, setImgRot]     = useState(0);
  const [processing, setProc]   = useState(false);

  const [mode, setMode]         = useState<EditMode>("none");
  const [color, setColor]       = useState(PALETTE[2]);
  const [stroke, setStroke]     = useState(STROKE_SIZES[1]);
  const [filled, setFilled]     = useState(false);
  const [fontSize, setFontSize] = useState(22);

  const [paths, setPaths]       = useState<DrawPath[]>([]);
  const [redoStack, setRedo]    = useState<DrawPath[]>([]);
  const [texts, setTexts]       = useState<TextAnnotation[]>([]);
  const [arrows, setArrows]     = useState<ArrowAnnotation[]>([]);
  const [shapes, setShapes]     = useState<ShapeAnnotation[]>([]);
  const [measures, setMeasures] = useState<MeasureAnnotation[]>([]);

  const [liveArrow, setLiveArrow]   = useState<ArrowAnnotation | null>(null);
  const [liveShape, setLiveShape]   = useState<ShapeAnnotation | null>(null);
  const [liveMeasure, setLiveMeasure] = useState<MeasureAnnotation | null>(null);

  const [textModal, setTextModal]   = useState(false);
  const [textPos, setTextPos]       = useState({ x: 0, y: 0 });
  const [textVal, setTextVal]       = useState("");
  const [measureModal, setMeasureModal] = useState(false);
  const [pendingMeasure, setPendingMeasure] = useState<MeasureAnnotation | null>(null);
  const [measureLabel, setMeasureLabel]     = useState("");

  const cTop    = useSharedValue(0);
  const cLeft   = useSharedValue(0);
  const cRight  = useSharedValue(0);
  const cBottom = useSharedValue(0);

  const viewRef = useRef<View>(null);

  // ── Header height — computed once ──────────────────────────────────────────
  // We take the REAL safe-area top (Dynamic Island = 59, notch = 44, flat = 20…)
  // and add 44pt (Apple HIG nav bar). We also add a 2pt buffer just in case.
  const statusBarH = Platform.OS === "android" ? (RNStatusBar.currentHeight ?? 24) : 0;
  const safeTop    = Math.max(insets.top, statusBarH);
  const HEADER_H   = safeTop + 44;

  useEffect(() => {
    if (imageUri) {
      setImgUri(imageUri);
      Image.getSize(imageUri, (w, h) => {
        setImgSize({ width: SW, height: SW / (w / h) });
      });
    }
  }, [imageUri]);

  // ─── Drawing gestures ─────────────────────────────────────────────────────

  const drawG = Gesture.Pan()
    .onStart((g) => {
      if (mode !== "draw") return;
      runOnJS(setPaths)((p) => [...p, { id: uid(), segments: `M ${g.x} ${g.y}`, color, strokeWidth: stroke }]);
      runOnJS(setRedo)([]);
    })
    .onUpdate((g) => {
      if (mode !== "draw") return;
      runOnJS(setPaths)((p) => {
        const last = p[p.length - 1];
        if (!last) return p;
        return [...p.slice(0, -1), { ...last, segments: `${last.segments} L ${g.x} ${g.y}` }];
      });
    })
    .runOnJS(true);

  const arrowG = Gesture.Pan()
    .onStart((g) => { if (mode !== "arrow") return; runOnJS(setLiveArrow)({ id: uid(), x1: g.x, y1: g.y, x2: g.x, y2: g.y, color, strokeWidth: stroke }); })
    .onUpdate((g) => { if (mode !== "arrow") return; runOnJS(setLiveArrow)((p) => p ? { ...p, x2: g.x, y2: g.y } : null); })
    .onEnd(() => { if (mode !== "arrow") return; runOnJS((a: ArrowAnnotation | null) => { if (a) { setArrows((p) => [...p, a]); setLiveArrow(null); } })(liveArrow); })
    .runOnJS(true);

  const shapeG = Gesture.Pan()
    .onStart((g) => { if (mode !== "rect" && mode !== "circle") return; runOnJS(setLiveShape)({ id: uid(), type: mode as "rect"|"circle", x: g.x, y: g.y, x2: g.x, y2: g.y, color, strokeWidth: stroke, filled }); })
    .onUpdate((g) => { if (mode !== "rect" && mode !== "circle") return; runOnJS(setLiveShape)((p) => p ? { ...p, x2: g.x, y2: g.y } : null); })
    .onEnd(() => { if (mode !== "rect" && mode !== "circle") return; runOnJS((s: ShapeAnnotation | null) => { if (s) { setShapes((p) => [...p, s]); setLiveShape(null); } })(liveShape); })
    .runOnJS(true);

  const measureG = Gesture.Pan()
    .onStart((g) => { if (mode !== "measure") return; runOnJS(setLiveMeasure)({ id: uid(), x1: g.x, y1: g.y, x2: g.x, y2: g.y, color, label: "" }); })
    .onUpdate((g) => { if (mode !== "measure") return; runOnJS(setLiveMeasure)((p) => p ? { ...p, x2: g.x, y2: g.y } : null); })
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

  const tapG = Gesture.Tap()
    .onEnd((g) => {
      if (mode !== "text") return;
      runOnJS(setTextPos)({ x: g.x, y: g.y });
      runOnJS(setTextVal)("");
      runOnJS(setTextModal)(true);
    })
    .runOnJS(true);

  const activeGesture =
    mode === "draw"    ? drawG
    : mode === "arrow" ? arrowG
    : mode === "rect" || mode === "circle" ? shapeG
    : mode === "measure" ? measureG
    : mode === "text"  ? tapG
    : Gesture.Tap();

  // ─── Actions ──────────────────────────────────────────────────────────────

  const undo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (mode === "draw" && paths.length > 0) { const l = paths[paths.length-1]; setRedo((p)=>[l,...p]); setPaths((p)=>p.slice(0,-1)); }
    else if (mode === "text"    && texts.length   > 0) setTexts((p)=>p.slice(0,-1));
    else if (mode === "arrow"   && arrows.length  > 0) setArrows((p)=>p.slice(0,-1));
    else if ((mode==="rect"||mode==="circle") && shapes.length>0) setShapes((p)=>p.slice(0,-1));
    else if (mode === "measure" && measures.length> 0) setMeasures((p)=>p.slice(0,-1));
  };

  const redoAction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (mode === "draw" && redoStack.length > 0) {
      const f = redoStack[0]; setRedo((p)=>p.slice(1)); setPaths((p)=>[...p,f]);
    }
  };

  const clearAll = () => {
    Alert.alert("Limpiar", "¿Eliminar todas las anotaciones?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Limpiar", style: "destructive", onPress: () => { setPaths([]); setTexts([]); setArrows([]); setShapes([]); setMeasures([]); setRedo([]); } },
    ]);
  };

  const rotate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setImgRot((r) => (r + 90) % 360);
  };

  const applyCrop = async () => {
    setProc(true);
    try {
      const r = await ImageManipulator.manipulateAsync(
        imgUri!,
        [{ crop: { originX: cLeft.value, originY: cTop.value, width: imgSize.width - cLeft.value - cRight.value, height: imgSize.height - cTop.value - cBottom.value } }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );
      setImgUri(r.uri);
      setMode("none");
      cTop.value = 0; cLeft.value = 0; cRight.value = 0; cBottom.value = 0;
      Image.getSize(r.uri, (w, h) => setImgSize({ width: SW, height: SW / (w / h) }));
    } catch { Alert.alert("Error", "No se pudo recortar"); }
    finally { setProc(false); }
  };

  const save = async () => {
    setProc(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") { Alert.alert("Permiso denegado", "Se necesita acceso a la galería."); setProc(false); return; }
      const uri = await captureRef(viewRef, { format: "jpg", quality: 0.95 });
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert("¡Guardado!", "La imagen se guardó en tu galería.", [
        { text: "OK", onPress: () => projectId ? router.replace({ pathname: "/project/[id]", params: { id: projectId } }) : router.back() },
      ]);
    } catch { Alert.alert("Error", "No se pudo guardar la imagen."); }
    finally { setProc(false); }
  };

  const confirmText = () => {
    if (textVal.trim()) setTexts((p) => [...p, { id: uid(), text: textVal.trim(), x: textPos.x, y: textPos.y, color, fontSize }]);
    setTextModal(false); setTextVal("");
  };

  const confirmMeasure = () => {
    if (pendingMeasure) setMeasures((p) => [...p, { ...pendingMeasure, label: measureLabel || pendingMeasure.label }]);
    setMeasureModal(false); setPendingMeasure(null); setMeasureLabel("");
  };

  const updateText = (id: string, patch: Partial<TextAnnotation>) => {
    setTexts((prev) => prev.map((t) => t.id === id ? { ...t, ...patch } : t));
  };

  // ─── Canvas helpers ───────────────────────────────────────────────────────

  const buildArrow = (a: ArrowAnnotation) => {
    const ang = Math.atan2(a.y2 - a.y1, a.x2 - a.x1), hl = 14;
    const p = Skia.Path.Make();
    p.moveTo(a.x1, a.y1); p.lineTo(a.x2, a.y2);
    p.moveTo(a.x2, a.y2); p.lineTo(a.x2 - hl * Math.cos(ang - Math.PI/6), a.y2 - hl * Math.sin(ang - Math.PI/6));
    p.moveTo(a.x2, a.y2); p.lineTo(a.x2 - hl * Math.cos(ang + Math.PI/6), a.y2 - hl * Math.sin(ang + Math.PI/6));
    return p;
  };

  const buildShape = (s: ShapeAnnotation) => {
    const x = Math.min(s.x, s.x2), y = Math.min(s.y, s.y2), w = Math.abs(s.x2-s.x), h = Math.abs(s.y2-s.y);
    const p = Skia.Path.Make();
    if (s.type === "rect") p.addRect(Skia.XYWHRect(x, y, w, h));
    else p.addOval(Skia.XYWHRect(x, y, w, h));
    return p;
  };

  const buildMeasure = (m: MeasureAnnotation) => {
    const ang = Math.atan2(m.y2-m.y1, m.x2-m.x1), perp = ang + Math.PI/2, tk = 6;
    const p = Skia.Path.Make();
    p.moveTo(m.x1, m.y1); p.lineTo(m.x2, m.y2);
    p.moveTo(m.x1 + tk*Math.cos(perp), m.y1 + tk*Math.sin(perp));
    p.lineTo(m.x1 - tk*Math.cos(perp), m.y1 - tk*Math.sin(perp));
    p.moveTo(m.x2 + tk*Math.cos(perp), m.y2 + tk*Math.sin(perp));
    p.lineTo(m.x2 - tk*Math.cos(perp), m.y2 - tk*Math.sin(perp));
    return p;
  };

  // ─── Derived ──────────────────────────────────────────────────────────────

  const hasAnnotations = paths.length>0 || texts.length>0 || arrows.length>0 || shapes.length>0 || measures.length>0;
  const canUndo =
    (mode==="draw" && paths.length>0) || (mode==="text" && texts.length>0) ||
    (mode==="arrow" && arrows.length>0) || ((mode==="rect"||mode==="circle") && shapes.length>0) ||
    (mode==="measure" && measures.length>0);
  const showOptions = ["draw","arrow","rect","circle","measure","text"].includes(mode);

  if (!imgUri) {
    return (
      <View style={[SS.container, SS.center]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ color: "#999", marginTop: 16 }}>Cargando imagen...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={SS.container}>

      {/* ── Editor area (image + canvas + annotations) ── */}
      {/* paddingTop pushes content below the fixed header */}
      <View style={[SS.editorArea, { paddingTop: HEADER_H }]}>
        <GestureDetector gesture={activeGesture}>
          <View
            ref={viewRef}
            collapsable={false}
            style={[
              SS.imgWrapper,
              { width: imgSize.width, height: imgSize.height },
              imgRot !== 0 && { transform: [{ rotate: `${imgRot}deg` }] },
            ]}
          >
            <Image source={{ uri: imgUri }} style={SS.img} resizeMode="contain" />

            <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
              {paths.map((p) => {
                const sk = Skia.Path.MakeFromSVGString(p.segments);
                if (!sk) return null;
                const paint = Skia.Paint();
                paint.setColor(Skia.Color(p.color)); paint.setStrokeWidth(p.strokeWidth);
                paint.setStyle(1); paint.setAntiAlias(true); paint.setStrokeCap(1); paint.setStrokeJoin(1);
                return <Path key={p.id} path={sk} paint={paint} />;
              })}
              {[...arrows, ...(liveArrow ? [liveArrow] : [])].map((a) => {
                const paint = Skia.Paint();
                paint.setColor(Skia.Color(a.color)); paint.setStrokeWidth(a.strokeWidth);
                paint.setStyle(1); paint.setAntiAlias(true);
                return <Path key={a.id} path={buildArrow(a)} paint={paint} />;
              })}
              {[...shapes, ...(liveShape ? [liveShape] : [])].map((s) => {
                const paint = Skia.Paint();
                paint.setColor(Skia.Color(s.color)); paint.setStrokeWidth(s.strokeWidth);
                paint.setStyle(s.filled ? 0 : 1); paint.setAntiAlias(true);
                return <Path key={s.id} path={buildShape(s)} paint={paint} />;
              })}
              {[...measures, ...(liveMeasure ? [liveMeasure] : [])].map((m) => {
                const paint = Skia.Paint();
                paint.setColor(Skia.Color(m.color)); paint.setStrokeWidth(2);
                paint.setStyle(1); paint.setAntiAlias(true);
                return <Path key={m.id} path={buildMeasure(m)} paint={paint} />;
              })}
            </Canvas>

            {texts.map((t) => (
              <TextSticker key={t.id} ann={t} onUpdate={updateText} active={mode === "text"} />
            ))}

            {measures.map((m) => (
              <View key={`lbl-${m.id}`} style={{
                position:"absolute", left:(m.x1+m.x2)/2-30, top:(m.y1+m.y2)/2-18,
                backgroundColor:"rgba(0,0,0,0.65)", paddingHorizontal:6, paddingVertical:2, borderRadius:4,
              }} pointerEvents="none">
                <Text style={{ color: m.color, fontSize: 12, fontWeight: "700" }}>{m.label}</Text>
              </View>
            ))}

            {mode === "crop" && (
              <>
                <CropOverlay cTop={cTop} cLeft={cLeft} cRight={cRight} cBottom={cBottom} imgW={imgSize.width} imgH={imgSize.height} />
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
      <View style={SS.toolbar}>
        {showOptions && (
          <View style={SS.optRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={SS.colorRow}>
              {PALETTE.map((c) => (
                <TouchableOpacity key={c} onPress={() => setColor(c)}
                  style={[SS.dot, { backgroundColor: c }, color === c && SS.dotActive]} />
              ))}
            </ScrollView>
            <View style={SS.subRow}>
              {mode !== "text" && mode !== "measure" && STROKE_SIZES.map((w) => (
                <TouchableOpacity key={w} onPress={() => setStroke(w)} style={[SS.subBtn, stroke===w && SS.subBtnActive]}>
                  <View style={{ width: w, height: w, borderRadius: w/2, backgroundColor: color }} />
                </TouchableOpacity>
              ))}
              {mode === "text" && [14,18,22,28,36].map((fs) => (
                <TouchableOpacity key={fs} onPress={() => setFontSize(fs)} style={[SS.subBtn, fontSize===fs && SS.subBtnActive]}>
                  <Text style={{ color, fontSize: 10, fontWeight: "700" }}>{fs}</Text>
                </TouchableOpacity>
              ))}
              {(mode==="rect"||mode==="circle") && (
                <TouchableOpacity onPress={() => setFilled((v)=>!v)} style={[SS.subBtn, filled && SS.subBtnActive]}>
                  <MaterialIcons name={filled ? "format-color-fill" : "format-color-reset"} size={18} color="#FFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={SS.toolRow}>
          {TOOLS.map((t) => {
            const active = mode === t.id;
            return (
              <TouchableOpacity key={t.id}
                onPress={() => { Haptics.selectionAsync(); setMode(active ? "none" : t.id); }}
                style={[SS.toolBtn, active && SS.toolBtnActive]}>
                <MaterialIcons name={t.icon as any} size={22} color={active ? "#007AFF" : "#FFF"} />
                <Text style={[SS.toolTxt, active && { color: "#007AFF" }]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity onPress={rotate} style={SS.toolBtn}>
            <MaterialIcons name="rotate-right" size={22} color="#FFF" />
            <Text style={SS.toolTxt}>Rotar</Text>
          </TouchableOpacity>
        </ScrollView>

        {mode === "crop" && (
          <TouchableOpacity onPress={applyCrop} style={SS.applyBtn}>
            <Text style={SS.applyBtnText}>Aplicar Recorte</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: Math.max(insets.bottom, 8) }} />
      </View>

      {/* ══════════════════════════════════════════════════════════════════════
          FIXED HEADER — rendered LAST so it always paints on top of everything.
          Solid opaque background + zIndex:999 ensures the image can NEVER
          overlap it, regardless of how the screen was pushed (camera or gallery).
         ══════════════════════════════════════════════════════════════════════ */}
      <View
        style={[
          SS.header,
          {
            height: HEADER_H,
            paddingTop: safeTop,
            // Extra safety: also set top:0 so it anchors to the very top of the screen
            top: 0,
          },
        ]}
        pointerEvents="box-none"
      >
        {/* Cancel */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={SS.hSideBtn}
          hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
        >
          <Text style={SS.hCancelTxt}>Cancelar</Text>
        </TouchableOpacity>

        {/* Title */}
        <Text style={SS.hTitle} numberOfLines={1}>Anotar Foto</Text>

        {/* Right actions */}
        <View style={SS.hRight}>
          {hasAnnotations && (
            <TouchableOpacity
              onPress={clearAll}
              style={SS.hIconBtn}
              hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
            >
              <MaterialIcons name="delete-sweep" size={20} color="#FF3B30" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={undo}
            disabled={!canUndo}
            style={SS.hIconBtn}
            hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
          >
            <MaterialIcons name="undo" size={20} color={canUndo ? "#FFF" : "rgba(255,255,255,0.25)"} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={redoAction}
            disabled={redoStack.length === 0}
            style={SS.hIconBtn}
            hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
          >
            <MaterialIcons name="redo" size={20} color={redoStack.length > 0 ? "#FFF" : "rgba(255,255,255,0.25)"} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={save}
            hitSlop={{ top: 10, bottom: 10, left: 4, right: 8 }}
          >
            <Text style={SS.hSaveTxt}>Guardar</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Separator under header */}
      <View style={[SS.hSep, { top: HEADER_H }]} pointerEvents="none" />

      {/* ── Modals ── */}
      <Modal visible={textModal} transparent animationType="slide" onRequestClose={() => setTextModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={SS.overlay}>
          <View style={[SS.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
            <View style={SS.sheetHandle} />
            <Text style={SS.sheetTitle}>Agregar Texto</Text>
            <Text style={SS.sheetSub}>Luego puedes arrastrarlo y escalarlo con dos dedos.</Text>
            <TextInput value={textVal} onChangeText={setTextVal}
              placeholder="Escribe aquí..." placeholderTextColor="#666"
              style={SS.sheetInput} autoFocus multiline />
            <View style={SS.sheetBtns}>
              <TouchableOpacity onPress={() => setTextModal(false)} style={[SS.sheetBtn, SS.sheetBtnCancel]}>
                <Text style={SS.sheetBtnCancelTxt}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmText} style={[SS.sheetBtn, SS.sheetBtnConfirm]}>
                <Text style={SS.sheetBtnConfirmTxt}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={measureModal} transparent animationType="slide" onRequestClose={() => setMeasureModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={SS.overlay}>
          <View style={[SS.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
            <View style={SS.sheetHandle} />
            <Text style={SS.sheetTitle}>Etiqueta de Medida</Text>
            <Text style={SS.sheetSub}>Personaliza la etiqueta (ej: "2.5 m", "120 cm")</Text>
            <TextInput value={measureLabel} onChangeText={setMeasureLabel}
              placeholder="Ej: 2.5 m" placeholderTextColor="#666"
              style={SS.sheetInput} autoFocus />
            <View style={SS.sheetBtns}>
              <TouchableOpacity onPress={() => setMeasureModal(false)} style={[SS.sheetBtn, SS.sheetBtnCancel]}>
                <Text style={SS.sheetBtnCancelTxt}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmMeasure} style={[SS.sheetBtn, SS.sheetBtnConfirm]}>
                <Text style={SS.sheetBtnConfirmTxt}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {processing && (
        <View style={SS.loader}>
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={SS.loaderTxt}>Procesando...</Text>
        </View>
      )}
    </GestureHandlerRootView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const SS = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center:    { justifyContent: "center", alignItems: "center" },

  // ── FIXED HEADER ──
  // position:"absolute" + top:0 + zIndex:999 + solid background
  // This is the definitive fix: the header is ALWAYS above everything.
  header: {
    position: "absolute",
    left: 0, right: 0,
    zIndex: 999,
    backgroundColor: "#111",        // solid — never transparent
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 8,
    paddingBottom: 0,
    // Shadow so it visually separates from content even if colors are similar
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 20,                   // Android elevation
  },
  hSep: {
    position: "absolute",
    left: 0, right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.15)",
    zIndex: 998,
  },
  hSideBtn: { width: 80, height: 44, justifyContent: "center", paddingLeft: 8 },
  hCancelTxt: { color: "#FFF", fontSize: 17, fontWeight: "400", letterSpacing: -0.2 },
  hTitle: {
    flex: 1, textAlign: "center", color: "#FFF",
    fontSize: 17, fontWeight: "600", letterSpacing: -0.3,
    height: 44, lineHeight: 44,
  },
  hRight: {
    width: 80, height: 44,
    flexDirection: "row", alignItems: "center",
    justifyContent: "flex-end", gap: 2, paddingRight: 4,
  },
  hIconBtn: { width: 32, height: 44, alignItems: "center", justifyContent: "center" },
  hSaveTxt: {
    color: "#007AFF", fontSize: 17, fontWeight: "600",
    letterSpacing: -0.2, height: 44, lineHeight: 44, paddingRight: 4,
  },

  // ── Editor ──
  editorArea: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" },
  imgWrapper: { position: "relative", backgroundColor: "#111" },
  img: { width: "100%", height: "100%" },

  // ── Crop ──
  cropHandle: {
    borderRadius: 14, backgroundColor: "#FFF",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6, shadowRadius: 4, elevation: 8,
  },
  gridLine: { position: "absolute", backgroundColor: "rgba(255,255,255,0.3)" },

  // ── Toolbar ──
  toolbar: {
    backgroundColor: "#111",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.12)",
    paddingTop: 8,
  },
  optRow: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.1)", paddingBottom: 10, marginBottom: 2 },
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

  // ── Text sticker ──
  stickerBg: { backgroundColor: "rgba(0,0,0,0.50)", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  stickerText: { fontWeight: "700" },
  stickerHandle: {
    position: "absolute", top: -8, right: -8,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: "#007AFF", alignItems: "center", justifyContent: "center",
  },

  // ── Bottom sheet ──
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

  // ── Loader ──
  loader: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.72)", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  loaderTxt: { color: "#FFF", fontWeight: "600", marginTop: 12, fontSize: 15 },
});
