/**
 * image-editor.tsx — v5  (iOS Markup pattern)
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
 *
 * Key decisions:
 * - Stack.Screen with useNavigation + useLayoutEffect sets the native header
 *   buttons (Cancelar / Guardar). The header is owned by the navigator so it
 *   is ALWAYS above the screen content — no z-index tricks needed.
 * - The image is rendered inside a View with flex:1 and Image resizeMode:"contain"
 *   so it never exceeds the available space between header and toolbar.
 * - The Skia canvas and annotation overlays are absoluteFill children of the
 *   same wrapper, so they are always clipped to the image area.
 * - Crop handles run on the UI thread via Reanimated worklets.
 * - Text stickers: Gesture.Simultaneous(pan, pinch) — drag + scale, no rotation.
 * - Image rotation: CSS transform only — annotations stay in sync.
 */

import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
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
import * as ImageManipulator from "expo-image-manipulator";
import * as Haptics from "expo-haptics";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tool = "draw" | "text" | "arrow" | "rect" | "circle" | "measure" | "crop";

interface DrawPath   { id: string; d: string; color: string; sw: number }
interface TextAnn    { id: string; text: string; x: number; y: number; color: string; fontSize: number }
interface ArrowAnn   { id: string; x1: number; y1: number; x2: number; y2: number; color: string; sw: number }
interface ShapeAnn   { id: string; type: "rect"|"circle"; x: number; y: number; x2: number; y2: number; color: string; sw: number; filled: boolean }
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
  const dT = useAnimatedStyle(() => ({ position:"absolute",left:0,right:0,top:0,height:cT.value,backgroundColor:"rgba(0,0,0,0.55)" }));
  const dB = useAnimatedStyle(() => ({ position:"absolute",left:0,right:0,bottom:0,height:cB.value,backgroundColor:"rgba(0,0,0,0.55)" }));
  const dL = useAnimatedStyle(() => ({ position:"absolute",left:0,top:cT.value,bottom:cB.value,width:cL.value,backgroundColor:"rgba(0,0,0,0.55)" }));
  const dR = useAnimatedStyle(() => ({ position:"absolute",right:0,top:cT.value,bottom:cB.value,width:cR.value,backgroundColor:"rgba(0,0,0,0.55)" }));
  const br = useAnimatedStyle(() => ({ position:"absolute",top:cT.value,left:cL.value,right:cR.value,bottom:cB.value,borderWidth:1.5,borderColor:"#FFF" }));
  const gr = useAnimatedStyle(() => ({ position:"absolute",top:cT.value,left:cL.value,right:cR.value,bottom:cB.value }));
  return (
    <>
      <Animated.View style={dT} pointerEvents="none" />
      <Animated.View style={dB} pointerEvents="none" />
      <Animated.View style={dL} pointerEvents="none" />
      <Animated.View style={dR} pointerEvents="none" />
      <Animated.View style={br} pointerEvents="none" />
      <Animated.View style={gr} pointerEvents="none">
        <View style={[S.gridLine,{top:"33%",width:"100%",height:1}]} />
        <View style={[S.gridLine,{top:"66%",width:"100%",height:1}]} />
        <View style={[S.gridLine,{left:"33%",height:"100%",width:1}]} />
        <View style={[S.gridLine,{left:"66%",height:"100%",width:1}]} />
      </Animated.View>
    </>
  );
}

function CropCorner({
  corner, cT, cL, cR, cB, imgW, imgH,
}: { corner:"TL"|"TR"|"BL"|"BR"; cT:SharedValue<number>; cL:SharedValue<number>; cR:SharedValue<number>; cB:SharedValue<number>; imgW:number; imgH:number }) {
  const MIN = 60;
  const g = Gesture.Pan().onUpdate((e) => {
    "worklet";
    if (corner==="TL")      { cT.value=Math.max(0,Math.min(imgH-cB.value-MIN,e.y));  cL.value=Math.max(0,Math.min(imgW-cR.value-MIN,e.x)); }
    else if (corner==="TR") { cT.value=Math.max(0,Math.min(imgH-cB.value-MIN,e.y));  cR.value=Math.max(0,Math.min(imgW-cL.value-MIN,imgW-e.x)); }
    else if (corner==="BL") { cB.value=Math.max(0,Math.min(imgH-cT.value-MIN,imgH-e.y)); cL.value=Math.max(0,Math.min(imgW-cR.value-MIN,e.x)); }
    else                    { cB.value=Math.max(0,Math.min(imgH-cT.value-MIN,imgH-e.y)); cR.value=Math.max(0,Math.min(imgW-cL.value-MIN,imgW-e.x)); }
  });
  const style = useAnimatedStyle(() => {
    "worklet";
    const base = { position:"absolute" as const, width:28, height:28, zIndex:30 };
    if (corner==="TL") return { ...base, top:cT.value-14,    left:cL.value-14  };
    if (corner==="TR") return { ...base, top:cT.value-14,    right:cR.value-14 };
    if (corner==="BL") return { ...base, bottom:cB.value-14, left:cL.value-14  };
    return                    { ...base, bottom:cB.value-14, right:cR.value-14 };
  });
  return (
    <GestureDetector gesture={g}>
      <Animated.View style={[S.cropHandle, style]} />
    </GestureDetector>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ImageEditorScreen() {
  const router     = useRouter();
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();
  const { imageUri, projectId } = useLocalSearchParams<{ imageUri: string; projectId?: string }>();

  // Image state
  const [imgUri, setImgUri]   = useState(imageUri ?? "");
  const [imgW, setImgW]       = useState(0);
  const [imgH, setImgH]       = useState(0);
  const [imgRot, setImgRot]   = useState(0);
  const [processing, setProc] = useState(false);

  // Tool state
  const [tool, setTool]       = useState<Tool | null>(null);
  const [color, setColor]     = useState(PALETTE[0]);
  const [stroke, setStroke]   = useState(STROKES[1]);
  const [fontSize, setFontSize] = useState(FONTSIZES[2]);
  const [filled, setFilled]   = useState(false);

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

  // Modals
  const [textModal,    setTextModal]    = useState(false);
  const [textPos,      setTextPos]      = useState({ x: 0, y: 0 });
  const [textVal,      setTextVal]      = useState("");
  const [measureModal, setMeasureModal] = useState(false);
  const [pendingM,     setPendingM]     = useState<MeasureAnn | null>(null);
  const [mLabel,       setMLabel]       = useState("");

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
  // We compute this from the measured canvas area so the image is always
  // fully visible and never overflows into the header or toolbar.
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
    setProc(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") { Alert.alert("Permiso denegado", "Se necesita acceso a la galería."); return; }
      const uri = await captureRef(viewRef, { format: "jpg", quality: 0.95 });
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert("¡Guardado!", "La imagen se guardó en tu galería.", [{
        text: "OK",
        onPress: () => projectId
          ? router.replace({ pathname: "/project/[id]", params: { id: projectId } })
          : router.back(),
      }]);
    } catch { Alert.alert("Error", "No se pudo guardar la imagen."); }
    finally { setProc(false); }
  }, [projectId, router]);

  const handleCancel = useCallback(() => router.back(), [router]);

  // ── Native header buttons via useLayoutEffect ────────────────────────────────
  // This is the correct React Navigation pattern: set header options after mount.
  // The Stack navigator owns the header so it is always above screen content.
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: "Anotar Foto",
      headerStyle: { backgroundColor: "#111" },
      headerTintColor: "#FFF",
      headerTitleStyle: { fontWeight: "600", fontSize: 17 },
      headerLeft: () => (
        <TouchableOpacity onPress={handleCancel} hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}>
          <Text style={{ color: "#FFF", fontSize: 17, fontWeight: "400", marginLeft: 4 }}>Cancelar</Text>
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity onPress={handleSave} hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}>
          <Text style={{ color: "#007AFF", fontSize: 17, fontWeight: "600", marginRight: 4 }}>Guardar</Text>
        </TouchableOpacity>
      ),
      headerBackVisible: false,
    });
  }, [navigation, handleCancel, handleSave]);

  const undo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (tool === "draw"    && paths.length   > 0) { const l = paths[paths.length-1]; setRedo((r)=>[l,...r]); setPaths((p)=>p.slice(0,-1)); }
    else if (tool === "text"    && texts.length   > 0) setTexts((p)=>p.slice(0,-1));
    else if (tool === "arrow"   && arrows.length  > 0) setArrows((p)=>p.slice(0,-1));
    else if ((tool==="rect"||tool==="circle") && shapes.length>0) setShapes((p)=>p.slice(0,-1));
    else if (tool === "measure" && measures.length> 0) setMeasures((p)=>p.slice(0,-1));
  };

  const redoAction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (tool === "draw" && redo.length > 0) {
      const f = redo[0]; setRedo((r)=>r.slice(1)); setPaths((p)=>[...p,f]);
    }
  };

  const clearAll = () => Alert.alert("Limpiar", "¿Eliminar todas las anotaciones?", [
    { text: "Cancelar", style: "cancel" },
    { text: "Limpiar", style: "destructive", onPress: () => { setPaths([]); setTexts([]); setArrows([]); setShapes([]); setMeasures([]); setRedo([]); } },
  ]);

  const rotate = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setImgRot((r)=>(r+90)%360); };

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
    } catch { Alert.alert("Error", "No se pudo recortar"); }
    finally { setProc(false); }
  };

  const confirmText = () => {
    if (textVal.trim()) setTexts((p) => [...p, { id: uid(), text: textVal.trim(), x: textPos.x, y: textPos.y, color, fontSize }]);
    setTextModal(false); setTextVal("");
  };

  const confirmMeasure = () => {
    if (pendingM) setMeasures((p) => [...p, { ...pendingM, label: mLabel || pendingM.label }]);
    setMeasureModal(false); setPendingM(null); setMLabel("");
  };

  const updateText = (id: string, patch: Partial<TextAnn>) =>
    setTexts((prev) => prev.map((t) => t.id === id ? { ...t, ...patch } : t));

  // ── Gestures ─────────────────────────────────────────────────────────────────

  const drawG = Gesture.Pan()
    .onStart((g) => { if (tool!=="draw") return; runOnJS(setPaths)((p)=>[...p,{id:uid(),d:`M ${g.x} ${g.y}`,color,sw:stroke}]); runOnJS(setRedo)([]); })
    .onUpdate((g) => { if (tool!=="draw") return; runOnJS(setPaths)((p)=>{ const l=p[p.length-1]; if(!l) return p; return [...p.slice(0,-1),{...l,d:`${l.d} L ${g.x} ${g.y}`}]; }); })
    .runOnJS(true);

  const arrowG = Gesture.Pan()
    .onStart((g) => { if (tool!=="arrow") return; runOnJS(setLiveArrow)({id:uid(),x1:g.x,y1:g.y,x2:g.x,y2:g.y,color,sw:stroke}); })
    .onUpdate((g) => { if (tool!=="arrow") return; runOnJS(setLiveArrow)((p)=>p?{...p,x2:g.x,y2:g.y}:null); })
    .onEnd(() => { if (tool!=="arrow") return; runOnJS((a:ArrowAnn|null)=>{ if(a){setArrows((p)=>[...p,a]);setLiveArrow(null);} })(liveArrow); })
    .runOnJS(true);

  const shapeG = Gesture.Pan()
    .onStart((g) => { if (tool!=="rect"&&tool!=="circle") return; runOnJS(setLiveShape)({id:uid(),type:tool as "rect"|"circle",x:g.x,y:g.y,x2:g.x,y2:g.y,color,sw:stroke,filled}); })
    .onUpdate((g) => { if (tool!=="rect"&&tool!=="circle") return; runOnJS(setLiveShape)((p)=>p?{...p,x2:g.x,y2:g.y}:null); })
    .onEnd(() => { if (tool!=="rect"&&tool!=="circle") return; runOnJS((s:ShapeAnn|null)=>{ if(s){setShapes((p)=>[...p,s]);setLiveShape(null);} })(liveShape); })
    .runOnJS(true);

  const measureG = Gesture.Pan()
    .onStart((g) => { if (tool!=="measure") return; runOnJS(setLiveMeasure)({id:uid(),x1:g.x,y1:g.y,x2:g.x,y2:g.y,color,label:""}); })
    .onUpdate((g) => { if (tool!=="measure") return; runOnJS(setLiveMeasure)((p)=>p?{...p,x2:g.x,y2:g.y}:null); })
    .onEnd(() => { if (tool!=="measure") return; runOnJS((m:MeasureAnn|null)=>{ if(m){ const auto=`${Math.round(pdist(m.x1,m.y1,m.x2,m.y2))}px`; setPendingM({...m,label:auto}); setMLabel(auto); setMeasureModal(true); setLiveMeasure(null); } })(liveMeasure); })
    .runOnJS(true);

  const tapG = Gesture.Tap()
    .onEnd((g) => { if (tool!=="text") return; runOnJS(setTextPos)({x:g.x,y:g.y}); runOnJS(setTextVal)(""); runOnJS(setTextModal)(true); })
    .runOnJS(true);

  const activeGesture =
    tool==="draw"    ? drawG
    : tool==="arrow" ? arrowG
    : tool==="rect"||tool==="circle" ? shapeG
    : tool==="measure" ? measureG
    : tool==="text"  ? tapG
    : Gesture.Tap();

  // ── Canvas helpers ────────────────────────────────────────────────────────────

  const mkArrow = (a: ArrowAnn) => {
    const ang=Math.atan2(a.y2-a.y1,a.x2-a.x1), hl=14;
    const p=Skia.Path.Make();
    p.moveTo(a.x1,a.y1); p.lineTo(a.x2,a.y2);
    p.moveTo(a.x2,a.y2); p.lineTo(a.x2-hl*Math.cos(ang-Math.PI/6),a.y2-hl*Math.sin(ang-Math.PI/6));
    p.moveTo(a.x2,a.y2); p.lineTo(a.x2-hl*Math.cos(ang+Math.PI/6),a.y2-hl*Math.sin(ang+Math.PI/6));
    return p;
  };
  const mkShape = (s: ShapeAnn) => {
    const x=Math.min(s.x,s.x2),y=Math.min(s.y,s.y2),w=Math.abs(s.x2-s.x),h=Math.abs(s.y2-s.y);
    const p=Skia.Path.Make();
    if (s.type==="rect") p.addRect(Skia.XYWHRect(x,y,w,h)); else p.addOval(Skia.XYWHRect(x,y,w,h));
    return p;
  };
  const mkMeasure = (m: MeasureAnn) => {
    const ang=Math.atan2(m.y2-m.y1,m.x2-m.x1),perp=ang+Math.PI/2,tk=6;
    const p=Skia.Path.Make();
    p.moveTo(m.x1,m.y1); p.lineTo(m.x2,m.y2);
    p.moveTo(m.x1+tk*Math.cos(perp),m.y1+tk*Math.sin(perp)); p.lineTo(m.x1-tk*Math.cos(perp),m.y1-tk*Math.sin(perp));
    p.moveTo(m.x2+tk*Math.cos(perp),m.y2+tk*Math.sin(perp)); p.lineTo(m.x2-tk*Math.cos(perp),m.y2-tk*Math.sin(perp));
    return p;
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <GestureHandlerRootView style={S.root}>
      {/*
        SafeAreaView with edges={["bottom"]} — top is handled by the Stack header.
        This gives us the exact area between the native nav bar and the home indicator.
      */}
      <SafeAreaView style={S.root} edges={["bottom"]}>

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

                {/* Skia canvas — same size as image */}
                <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
                  {paths.map((p) => {
                    const sk = Skia.Path.MakeFromSVGString(p.d); if (!sk) return null;
                    const paint = Skia.Paint();
                    paint.setColor(Skia.Color(p.color)); paint.setStrokeWidth(p.sw);
                    paint.setStyle(1); paint.setAntiAlias(true); paint.setStrokeCap(1); paint.setStrokeJoin(1);
                    return <Path key={p.id} path={sk} paint={paint} />;
                  })}
                  {[...arrows,...(liveArrow?[liveArrow]:[])].map((a) => {
                    const paint=Skia.Paint(); paint.setColor(Skia.Color(a.color)); paint.setStrokeWidth(a.sw); paint.setStyle(1); paint.setAntiAlias(true);
                    return <Path key={a.id} path={mkArrow(a)} paint={paint} />;
                  })}
                  {[...shapes,...(liveShape?[liveShape]:[])].map((s) => {
                    const paint=Skia.Paint(); paint.setColor(Skia.Color(s.color)); paint.setStrokeWidth(s.sw); paint.setStyle(s.filled?0:1); paint.setAntiAlias(true);
                    return <Path key={s.id} path={mkShape(s)} paint={paint} />;
                  })}
                  {[...measures,...(liveMeasure?[liveMeasure]:[])].map((m) => {
                    const paint=Skia.Paint(); paint.setColor(Skia.Color(m.color)); paint.setStrokeWidth(2); paint.setStyle(1); paint.setAntiAlias(true);
                    return <Path key={m.id} path={mkMeasure(m)} paint={paint} />;
                  })}
                </Canvas>

                {/* Text stickers */}
                {texts.map((t) => (
                  <TextSticker key={t.id} ann={t} onUpdate={updateText} active={tool==="text"} />
                ))}

                {/* Measure labels */}
                {measures.map((m) => (
                  <View key={`lbl-${m.id}`} style={{ position:"absolute", left:(m.x1+m.x2)/2-30, top:(m.y1+m.y2)/2-18, backgroundColor:"rgba(0,0,0,0.65)", paddingHorizontal:6, paddingVertical:2, borderRadius:4 }} pointerEvents="none">
                    <Text style={{ color:m.color, fontSize:12, fontWeight:"700" }}>{m.label}</Text>
                  </View>
                ))}

                {/* Crop overlay */}
                {tool==="crop" && (
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
        <View style={S.toolbar}>

          {/* Options row — only shown when a tool that needs options is active */}
          {tool !== null && tool !== "crop" && (
            <View style={S.optionsRow}>
              {/* Color palette */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.paletteRow}>
                {PALETTE.map((c) => (
                  <TouchableOpacity key={c} onPress={() => setColor(c)}
                    style={[S.colorDot, { backgroundColor: c }, color===c && S.colorDotActive]} />
                ))}
              </ScrollView>

              {/* Stroke / font size / fill options */}
              <View style={S.subOptions}>
                {tool !== "text" && tool !== "measure" && STROKES.map((w) => (
                  <TouchableOpacity key={w} onPress={() => setStroke(w)} style={[S.subBtn, stroke===w && S.subBtnOn]}>
                    <View style={{ width: w, height: w, borderRadius: w/2, backgroundColor: color }} />
                  </TouchableOpacity>
                ))}
                {tool === "text" && FONTSIZES.map((fs) => (
                  <TouchableOpacity key={fs} onPress={() => setFontSize(fs)} style={[S.subBtn, fontSize===fs && S.subBtnOn]}>
                    <Text style={{ color: "#FFF", fontSize: 10, fontWeight: "700" }}>{fs}</Text>
                  </TouchableOpacity>
                ))}
                {(tool==="rect"||tool==="circle") && (
                  <TouchableOpacity onPress={() => setFilled((v)=>!v)} style={[S.subBtn, filled && S.subBtnOn]}>
                    <MaterialIcons name={filled?"format-color-fill":"format-color-reset"} size={18} color="#FFF" />
                  </TouchableOpacity>
                )}
                {/* Undo / redo in options row */}
                <View style={S.subDivider} />
                <TouchableOpacity onPress={undo} disabled={!canUndo} style={S.subBtn}>
                  <MaterialIcons name="undo" size={18} color={canUndo?"#FFF":"rgba(255,255,255,0.25)"} />
                </TouchableOpacity>
                <TouchableOpacity onPress={redoAction} disabled={redo.length===0} style={S.subBtn}>
                  <MaterialIcons name="redo" size={18} color={redo.length>0?"#FFF":"rgba(255,255,255,0.25)"} />
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

      {/* ── Modals ── */}
      <Modal visible={textModal} transparent animationType="slide" onRequestClose={() => setTextModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS==="ios"?"padding":"height"} style={S.overlay}>
          <View style={[S.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
            <View style={S.sheetPill} />
            <Text style={S.sheetTitle}>Agregar Texto</Text>
            <Text style={S.sheetSub}>Luego puedes arrastrarlo y escalarlo con dos dedos.</Text>
            <TextInput value={textVal} onChangeText={setTextVal} placeholder="Escribe aquí..." placeholderTextColor="#666" style={S.sheetInput} autoFocus multiline />
            <View style={S.sheetRow}>
              <TouchableOpacity onPress={() => setTextModal(false)} style={[S.sheetBtn, S.sheetBtnGray]}>
                <Text style={S.sheetBtnGrayTxt}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmText} style={[S.sheetBtn, S.sheetBtnBlue]}>
                <Text style={S.sheetBtnBlueTxt}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={measureModal} transparent animationType="slide" onRequestClose={() => setMeasureModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS==="ios"?"padding":"height"} style={S.overlay}>
          <View style={[S.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
            <View style={S.sheetPill} />
            <Text style={S.sheetTitle}>Etiqueta de Medida</Text>
            <Text style={S.sheetSub}>Personaliza la etiqueta (ej: "2.5 m", "120 cm")</Text>
            <TextInput value={mLabel} onChangeText={setMLabel} placeholder="Ej: 2.5 m" placeholderTextColor="#666" style={S.sheetInput} autoFocus />
            <View style={S.sheetRow}>
              <TouchableOpacity onPress={() => setMeasureModal(false)} style={[S.sheetBtn, S.sheetBtnGray]}>
                <Text style={S.sheetBtnGrayTxt}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmMeasure} style={[S.sheetBtn, S.sheetBtnBlue]}>
                <Text style={S.sheetBtnBlueTxt}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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

  // Image area — fills all space between nav bar and toolbar
  canvasArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  imgWrapper: {
    // Size is set dynamically via dispW/dispH
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
  stickerDot: { position:"absolute", top:-8, right:-8, width:18, height:18, borderRadius:9, backgroundColor:"#007AFF", alignItems:"center", justifyContent:"center" },

  // Bottom toolbar
  toolbar: {
    backgroundColor: "#111",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.12)",
    paddingTop: 6,
  },

  // Options row (appears above tool strip when a tool is selected)
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

  // Modals
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#1C1C1E", borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 12 },
  sheetPill: { width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.25)", alignSelf: "center", marginBottom: 16 },
  sheetTitle: { color: "#FFF", fontSize: 17, fontWeight: "600", marginBottom: 4 },
  sheetSub: { color: "#999", fontSize: 13, marginBottom: 14 },
  sheetInput: { backgroundColor: "#2C2C2E", borderRadius: 10, padding: 14, fontSize: 16, color: "#FFF", minHeight: 52 },
  sheetRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  sheetBtn: { flex: 1, paddingVertical: 13, borderRadius: 10, alignItems: "center" },
  sheetBtnGray: { backgroundColor: "#2C2C2E" },
  sheetBtnGrayTxt: { color: "#FFF", fontWeight: "500", fontSize: 15 },
  sheetBtnBlue: { backgroundColor: "#007AFF" },
  sheetBtnBlueTxt: { color: "#FFF", fontWeight: "700", fontSize: 15 },

  // Loader
  loader: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.72)", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  loaderTxt: { color: "#FFF", fontWeight: "600", marginTop: 12, fontSize: 15 },
});
