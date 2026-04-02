/**
 * PhotoEditor.tsx — Complete rewrite
 *
 * KEY FIX: The Skia Canvas is wrapped in a View with pointerEvents="none"
 * so it NEVER intercepts touches. All touch handling happens on the SVG
 * drawing layer and crop overlay ABOVE it.
 *
 * Saving uses react-native-view-shot (captureRef) to combine image + SVG
 * drawings into a single file, then expo-image-manipulator for crop.
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, StyleSheet, TouchableOpacity, Text,
  Dimensions, StatusBar, SafeAreaView,
  Alert, ActivityIndicator, Pressable,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
import { BlurView } from 'expo-blur';
import {
  Canvas,
  Image as SkiaImage,
  useImage,
  ColorMatrix,
} from '@shopify/react-native-skia';
import {Adjustments, AspectRatio, CropRect, DrawMode, DrawPath, EditorTool} from "@/components/camera";
import {DEFAULT_ADJUSTMENTS, DEFAULT_CROP} from "@/components/camera/types";


const { width: SW, height: SH } = Dimensions.get('window');

// ─── Color matrix ─────────────────────────────────────────────────────────────

function buildColorMatrix(a: Adjustments): number[] {
  const b = a.brightness;
  const c = 1 + a.contrast;
  const s = 1 + a.saturation;
  const w = a.warmth;
  const lr = 0.213, lg = 0.715, lb = 0.072;

  const sr = (1 - s) * lr + s, sg = (1 - s) * lg,     sb = (1 - s) * lb;
  const gr = (1 - s) * lr,     gg = (1 - s) * lg + s, gb = (1 - s) * lb;
  const br = (1 - s) * lr,     bg = (1 - s) * lg,     bb = (1 - s) * lb + s;

  const o  = b + (1 - c) * 0.5;
  const wR = w > 0 ? w * 0.08 : 0;
  const wB = w < 0 ? -w * 0.08 : 0;

  return [
    sr * c, sg * c, sb * c, 0, o + wR,
    gr * c, gg * c, gb * c, 0, o,
    br * c, bg * c, bb * c, 0, o + wB,
    0, 0, 0, 1, 0,
  ];
}

// ─── Picker screen ────────────────────────────────────────────────────────────

const PickerScreen: React.FC<{ onImage: (uri: string) => void }> = ({ onImage }) => {
  const [busy, setBusy] = useState(false);

  const pick = async (source: 'camera' | 'library') => {
    setBusy(true);
    try {
      let result;
      if (source === 'camera') {
        const p = await ImagePicker.requestCameraPermissionsAsync();
        if (!p.granted) { Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara.'); return; }
        result = await ImagePicker.launchCameraAsync({ quality: 1, allowsEditing: false });
      } else {
        const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!p.granted) { Alert.alert('Permiso requerido', 'Necesitamos acceso a tus fotos.'); return; }
        result = await ImagePicker.launchImageLibraryAsync({ quality: 1, allowsEditing: false });
      }
      if (!result.canceled && result.assets[0]) {
        onImage(result.assets[0].uri);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={pickerSt.container}>
      <StatusBar barStyle="light-content" />
      <Text style={pickerSt.title}>Photo Editor</Text>
      <Text style={pickerSt.sub}>Selecciona una imagen para comenzar</Text>

      <View style={pickerSt.card}>
        <Pressable style={({ pressed }) => [pickerSt.row, pressed && pickerSt.rowPressed]}
          onPress={() => pick('camera')} disabled={busy}>
          <Text style={pickerSt.rowIcon}>📷</Text>
          <Text style={pickerSt.rowLabel}>Tomar foto</Text>
          <Text style={pickerSt.chevron}>›</Text>
        </Pressable>
        <View style={pickerSt.div} />
        <Pressable style={({ pressed }) => [pickerSt.row, pressed && pickerSt.rowPressed]}
          onPress={() => pick('library')} disabled={busy}>
          <Text style={pickerSt.rowIcon}>🖼</Text>
          <Text style={pickerSt.rowLabel}>Elegir de la galería</Text>
          <Text style={pickerSt.chevron}>›</Text>
        </Pressable>
      </View>

      {busy && <ActivityIndicator color="#FFD60A" style={{ marginTop: 24 }} />}
    </View>
  );
};

const pickerSt = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', padding: 28 },
  title:      { fontSize: 30, fontWeight: '700', color: '#fff', marginBottom: 8, letterSpacing: -0.5 },
  sub:        { fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 40 },
  card:       { width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  row:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 18, gap: 14 },
  rowPressed: { backgroundColor: 'rgba(255,255,255,0.08)' },
  rowIcon:    { fontSize: 22 },
  rowLabel:   { flex: 1, fontSize: 16, fontWeight: '500', color: '#fff' },
  chevron:    { fontSize: 22, color: 'rgba(255,255,255,0.25)' },
  div:        { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.1)', marginLeft: 56 },
});

// ─── Editor screen ────────────────────────────────────────────────────────────

// Height available for the image (between header and toolbar)
const IMG_AREA_H = SH * 0.52;
const ADJUST_H   = 230;

const EditorScreen: React.FC<{
  imageUri: string;
  onCancel: () => void;
  onSaved: () => void;
}> = ({ imageUri, onCancel, onSaved }) => {

  const viewShotRef = useRef<View>(null);
  const skiaImage   = useImage(imageUri);

  const [activeTool,  setActiveTool]  = useState<EditorTool>('adjust');
  const [adjustments, setAdjustments] = useState<Adjustments>(DEFAULT_ADJUSTMENTS);
  const [cropRect,    setCropRect]    = useState<CropRect>(DEFAULT_CROP);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('free');
  const [rotation,    setRotation]    = useState<0|90|180|270>(0);
  const [flipH,       setFlipH]       = useState(false);
  const [drawPaths,   setDrawPaths]   = useState<DrawPath[]>([]);
  const [drawColor,   setDrawColor]   = useState('#FF453A');
  const [strokeWidth, setStrokeWidth] = useState(6);
  const [drawMode,    setDrawMode]    = useState<DrawMode>('pen');
  const [isSaving,    setIsSaving]    = useState(false);
  const [imgSize,     setImgSize]     = useState({ w: SW, h: IMG_AREA_H });

  // Compute displayed image size from natural dimensions
  useEffect(() => {
    if (!skiaImage) return;
    const iw = skiaImage.width();
    const ih = skiaImage.height();
    const scaleW = SW / iw;
    const scaleH = IMG_AREA_H / ih;
    const scale  = Math.min(scaleW, scaleH, 1);
    setImgSize({ w: iw * scale, h: ih * scale });
  }, [skiaImage]);

  const colorMatrix = buildColorMatrix(adjustments);
  const isCropping  = activeTool === 'crop';
  const isDrawing   = activeTool === 'draw';

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleAdjust = useCallback((key: keyof Adjustments, v: number) => {
    setAdjustments(prev => ({ ...prev, [key]: v }));
  }, []);

  const handleRotate = useCallback(async () => {
    setRotation(r => ((r + 90) % 360) as 0|90|180|270);
  }, []);

  const handleFlip = useCallback(() => setFlipH(f => !f), []);

  const handleReset = useCallback(() => {
    setRotation(0); setFlipH(false);
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setCropRect(DEFAULT_CROP); setDrawPaths([]);
  }, []);

  const handleUndo = useCallback(() => setDrawPaths(p => p.slice(0, -1)), []);

  // ── Save ────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a la galería para guardar.');
        return;
      }

      // 1. Capture the View (image + SVG drawing layer combined)
      const capturedUri = await captureRef(viewShotRef, {
        format: 'jpg', quality: 0.95, result: 'tmpfile',
      });

      // 2. Apply rotation + flip + crop via expo-image-manipulator
      const ops: ImageManipulator.Action[] = [];
      if (rotation !== 0)  ops.push({ rotate: rotation });
      if (flipH)           ops.push({ flip: ImageManipulator.FlipType.Horizontal });

      const hasCustomCrop =
        cropRect.x !== 0 || cropRect.y !== 0 ||
        cropRect.width !== 1 || cropRect.height !== 1;

      if (hasCustomCrop && skiaImage) {
        // Crop relative to the CAPTURED image dimensions (which equal imgSize)
        ops.push({ crop: {
          originX: Math.round(cropRect.x * imgSize.w),
          originY: Math.round(cropRect.y * imgSize.h),
          width:   Math.round(cropRect.width  * imgSize.w),
          height:  Math.round(cropRect.height * imgSize.h),
        }});
      }

      let finalUri = capturedUri;
      if (ops.length > 0) {
        const manip = await ImageManipulator.manipulateAsync(
          capturedUri, ops,
          { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG }
        );
        finalUri = manip.uri;
      }

      await MediaLibrary.saveToLibraryAsync(finalUri);
      Alert.alert('¡Guardado!', 'La imagen ha sido guardada en tu galería.', [
        { text: 'OK', onPress: onSaved },
      ]);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo guardar la imagen.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Rotation / flip transform (visual only) ─────────────────────────────────
  const imgTransform = {
    transform: [
      { rotate: `${rotation}deg` },
      { scaleX: flipH ? -1 : 1 },
    ],
  };

  return (
    <View style={edSt.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <SafeAreaView>
        <View style={edSt.header}>
          <TouchableOpacity onPress={onCancel} disabled={isSaving} style={edSt.hBtn}>
            <Text style={edSt.cancelTxt}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={edSt.headerTitle}>Editar</Text>
          <TouchableOpacity onPress={handleSave} disabled={isSaving} style={edSt.hBtn}>
            {isSaving
              ? <ActivityIndicator color="#FFD60A" size="small" />
              : <Text style={edSt.doneTxt}>Listo</Text>}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* ── Image area ──────────────────────────────────────────────────── */}
      <View style={edSt.imageArea}>

        {/*
         * viewShotRef captures everything inside this View:
         * the Skia-rendered image (with color adjustments) AND the SVG drawings.
         */}
        <View
          ref={viewShotRef}
          style={[edSt.imageWrapper, { width: imgSize.w, height: imgSize.h }, imgTransform]}
          collapsable={false}   // required for captureRef on Android
        >
          {/*
           * ── SKIA CANVAS ──────────────────────────────────────────────
           * pointerEvents="none" on the wrapper View is the KEY FIX:
           * the Canvas NEVER intercepts touches, so the layers above work.
           */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Canvas style={{ width: imgSize.w, height: imgSize.h }}>
              {skiaImage && (
                <SkiaImage
                  image={skiaImage}
                  x={0} y={0}
                  width={imgSize.w}
                  height={imgSize.h}
                  fit="fill"
                >
                  <ColorMatrix matrix={colorMatrix} />
                </SkiaImage>
              )}
            </Canvas>
          </View>

          {/*
           * ── SVG DRAWING LAYER ────────────────────────────────────────
           * react-native-svg — no Skia, no touch conflicts.
           * Receives touches only when draw mode is active.
           */}
          <DrawingCanvas
            width={imgSize.w}
            height={imgSize.h}
            paths={drawPaths}
            color={drawColor}
            strokeWidth={strokeWidth}
            mode={drawMode}
            onPathsChange={setDrawPaths}
            enabled={isDrawing}
          />

          {/*
           * ── CROP OVERLAY ─────────────────────────────────────────────
           * Receives touches only when crop mode is active.
           */}
          <CropOverlay
            containerWidth={imgSize.w}
            containerHeight={imgSize.h}
            cropRect={cropRect}
            aspectRatio={aspectRatio}
            onCropChange={setCropRect}
            onAspectRatioChange={setAspectRatio}
            visible={isCropping}
          />
        </View>

        {!skiaImage && (
          <ActivityIndicator color="#FFD60A" style={StyleSheet.absoluteFill} />
        )}
      </View>

      {/* ── Adjust panel ────────────────────────────────────────────────── */}
      {activeTool === 'adjust' && (
        <View style={edSt.adjustPanel}>
          <AdjustPanel adjustments={adjustments} onChange={handleAdjust} visible />
        </View>
      )}

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <EditorToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        drawMode={drawMode}
        drawColor={drawColor}
        strokeWidth={strokeWidth}
        onDrawModeChange={setDrawMode}
        onColorChange={setDrawColor}
        onStrokeWidthChange={setStrokeWidth}
        onUndo={handleUndo}
        canUndo={drawPaths.length > 0}
        onRotate={handleRotate}
        onFlip={handleFlip}
        onReset={handleReset}
      />
    </View>
  );
};

const edSt = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#000' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.1)' },
  hBtn:         { minWidth: 70, paddingVertical: 4 },
  headerTitle:  { fontSize: 16, fontWeight: '600', color: '#fff' },
  cancelTxt:    { fontSize: 16, color: 'rgba(255,255,255,0.6)' },
  doneTxt:      { fontSize: 16, fontWeight: '700', color: '#FFD60A', textAlign: 'right' },
  imageArea:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  imageWrapper: { overflow: 'hidden' },
  adjustPanel:  { height: ADJUST_H, backgroundColor: 'rgba(16,16,16,0.98)', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.08)' },
});

// ─── Public API ───────────────────────────────────────────────────────────────

interface PhotoEditorProps {
  initialUri?: string;
  onSaved?:   () => void;
  onCancel?:  () => void;
}

export const PhotoEditor: React.FC<PhotoEditorProps> = ({ initialUri, onSaved, onCancel }) => {
  const [uri, setUri] = useState<string | null>(initialUri ?? null);

  if (uri) {
    return (
      <EditorScreen
        imageUri={uri}
        onCancel={() => { setUri(null); onCancel?.(); }}
        onSaved={() => { setUri(null); onSaved?.(); }}
      />
    );
  }
  return <PickerScreen onImage={setUri} />;
};

export default PhotoEditor;
