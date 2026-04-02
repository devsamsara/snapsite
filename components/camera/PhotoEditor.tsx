import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Pressable,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeIn,
  FadeOut,
  SlideInDown,
} from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { BlurView } from 'expo-blur';
import {
  Canvas,
  Image as SkiaImage,
  useImage,
  useCanvasRef,
  ColorMatrix,
  Paint,
  Path,
  Skia,
} from '@shopify/react-native-skia';

import { CropOverlay } from './CropOverlay';
import { AdjustPanel } from './AdjustPanel';
import { EditorToolbar } from './EditorToolbar';
import { DrawingCanvas } from './DrawingCanvas';
import {
  EditorTool,
  EditorPhase,
  DrawMode,
  DrawPath,
  CropRect,
  Adjustments,
  AspectRatio,
  DEFAULT_ADJUSTMENTS,
  DEFAULT_CROP,
} from './types';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ─── Color matrix helpers ────────────────────────────────────────────────────

/** Build a 4×5 color matrix for brightness/contrast/saturation/warmth */
const buildColorMatrix = (a: Adjustments): number[] => {
  const b = a.brightness; // -1..1
  const c = 1 + a.contrast; // 0..2
  const s = 1 + a.saturation; // 0..2
  const w = a.warmth; // -1..1

  // Luminance weights
  const lr = 0.213, lg = 0.715, lb = 0.072;

  // Saturation matrix
  const sr = (1 - s) * lr + s;
  const sg = (1 - s) * lg;
  const sb = (1 - s) * lb;
  const gr = (1 - s) * lr;
  const gg = (1 - s) * lg + s;
  const gb = (1 - s) * lb;
  const brow = (1 - s) * lr;
  const bg = (1 - s) * lg;
  const bb = (1 - s) * lb + s;

  // Combine with contrast and brightness
  const o = b + (1 - c) * 0.5; // offset to center contrast
  const wR = w > 0 ? w * 0.1 : 0; // add red for warmth
  const wB = w < 0 ? -w * 0.1 : 0; // add blue for cool

  return [
    sr * c, sg * c, sb * c, 0, o + wR,
    gr * c, gg * c, gb * c, 0, o,
    brow * c, bg * c, bb * c, 0, o + wB,
    0, 0, 0, 1, 0,
  ];
};

// ─── Picker Screen ────────────────────────────────────────────────────────────

interface PickerScreenProps {
  onImageSelected: (uri: string) => void;
}

const PickerScreen: React.FC<PickerScreenProps> = ({ onImageSelected }) => {
  const [requesting, setRequesting] = useState(false);

  const openGallery = async () => {
    setRequesting(true);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required', 'Allow access to your photos to continue.');
      setRequesting(false);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: false,
      exif: false,
    });
    setRequesting(false);
    if (!result.canceled && result.assets[0]) {
      onImageSelected(result.assets[0].uri);
    }
  };

  const openCamera = async () => {
    setRequesting(true);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required', 'Allow camera access to continue.');
      setRequesting(false);
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 1,
      allowsEditing: false,
      exif: false,
    });
    setRequesting(false);
    if (!result.canceled && result.assets[0]) {
      onImageSelected(result.assets[0].uri);
    }
  };

  return (
    <View style={pickerStyles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={pickerStyles.header}>
        <Text style={pickerStyles.appName}>Photo Editor</Text>
        <Text style={pickerStyles.subtitle}>Select an image to begin</Text>
      </View>

      {/* Options */}
      <Animated.View entering={SlideInDown.duration(500).springify()} style={pickerStyles.options}>
        <Pressable
          style={({ pressed }) => [pickerStyles.option, pressed && pickerStyles.optionPressed]}
          onPress={openCamera}
          disabled={requesting}
        >
          <View style={pickerStyles.optionIcon}>
            <Text style={pickerStyles.optionEmoji}>📷</Text>
          </View>
          <View style={pickerStyles.optionText}>
            <Text style={pickerStyles.optionTitle}>Take Photo</Text>
            <Text style={pickerStyles.optionDesc}>Use the camera</Text>
          </View>
          <Text style={pickerStyles.chevron}>›</Text>
        </Pressable>

        <View style={pickerStyles.separator} />

        <Pressable
          style={({ pressed }) => [pickerStyles.option, pressed && pickerStyles.optionPressed]}
          onPress={openGallery}
          disabled={requesting}
        >
          <View style={[pickerStyles.optionIcon, { backgroundColor: 'rgba(50,215,75,0.15)' }]}>
            <Text style={pickerStyles.optionEmoji}>🖼</Text>
          </View>
          <View style={pickerStyles.optionText}>
            <Text style={pickerStyles.optionTitle}>Choose from Library</Text>
            <Text style={pickerStyles.optionDesc}>Browse your photos</Text>
          </View>
          <Text style={pickerStyles.chevron}>›</Text>
        </Pressable>
      </Animated.View>

      {requesting && (
        <ActivityIndicator color="#FFD60A" style={{ marginTop: 32 }} />
      )}

      <Text style={pickerStyles.hint}>
        Edit crops • Draw markup • Adjust colors • Save to library
      </Text>
    </View>
  );
};

const pickerStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '400',
  },
  options: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  optionPressed: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,214,10,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionEmoji: {
    fontSize: 22,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
  },
  chevron: {
    fontSize: 22,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '300',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginLeft: 74,
  },
  hint: {
    marginTop: 40,
    fontSize: 12,
    color: 'rgba(255,255,255,0.25)',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});

// ─── Editor Screen ─────────────────────────────────────────────────────────────

interface EditorScreenProps {
  imageUri: string;
  onCancel: () => void;
  onSaved: () => void;
}

const IMAGE_AREA_HEIGHT = SCREEN_H * 0.52;

const EditorScreen: React.FC<EditorScreenProps> = ({
  imageUri,
  onCancel,
  onSaved,
}) => {
  const canvasRef = useCanvasRef();
  const skiaImage = useImage(imageUri);

  const [activeTool, setActiveTool] = useState<EditorTool>('adjust');
  const [adjustments, setAdjustments] = useState<Adjustments>(DEFAULT_ADJUSTMENTS);
  const [cropRect, setCropRect] = useState<CropRect>(DEFAULT_CROP);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('free');
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);
  const [flipH, setFlipH] = useState(false);
  const [drawPaths, setDrawPaths] = useState<DrawPath[]>([]);
  const [drawColor, setDrawColor] = useState('#FF453A');
  const [strokeWidth, setStrokeWidth] = useState(6);
  const [drawMode, setDrawMode] = useState<DrawMode>('pen');
  const [isSaving, setIsSaving] = useState(false);

  // Image natural dimensions
  const [imgSize, setImgSize] = useState({ width: SCREEN_W, height: IMAGE_AREA_HEIGHT });

  useEffect(() => {
    if (skiaImage) {
      const iw = skiaImage.width();
      const ih = skiaImage.height();
      const ratio = iw / ih;
      const displayW = Math.min(SCREEN_W, iw);
      const displayH = displayW / ratio;
      const finalH = Math.min(IMAGE_AREA_HEIGHT, displayH);
      const finalW = finalH * ratio;
      setImgSize({ width: Math.min(finalW, SCREEN_W), height: finalH });
    }
  }, [skiaImage]);

  const colorMatrix = buildColorMatrix(adjustments);

  const handleAdjust = useCallback((key: keyof Adjustments, val: number) => {
    setAdjustments((prev) => ({ ...prev, [key]: val }));
  }, []);

  const handleRotate = useCallback(() => {
    setRotation((r) => ((r + 90) % 360) as 0 | 90 | 180 | 270);
  }, []);

  const handleFlip = useCallback(() => {
    setFlipH((f) => !f);
  }, []);

  const handleReset = useCallback(() => {
    setRotation(0);
    setFlipH(false);
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setCropRect(DEFAULT_CROP);
    setDrawPaths([]);
  }, []);

  const handleUndo = useCallback(() => {
    setDrawPaths((prev) => prev.slice(0, -1));
  }, []);

  // ─ Save ─
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission denied', 'Allow photo library access to save.');
        return;
      }

      const manipOps: ImageManipulator.Action[] = [];

      // Rotation
      if (rotation !== 0) {
        manipOps.push({ rotate: rotation });
      }

      // Flip
      if (flipH) {
        manipOps.push({ flip: ImageManipulator.FlipType.Horizontal });
      }

      // Crop (only if not full image)
      const hasCustomCrop =
        cropRect.x !== 0 ||
        cropRect.y !== 0 ||
        cropRect.width !== 1 ||
        cropRect.height !== 1;

      if (hasCustomCrop && skiaImage) {
        const iw = skiaImage.width();
        const ih = skiaImage.height();
        manipOps.push({
          crop: {
            originX: Math.round(cropRect.x * iw),
            originY: Math.round(cropRect.y * ih),
            width: Math.round(cropRect.width * iw),
            height: Math.round(cropRect.height * ih),
          },
        });
      }

      let resultUri = imageUri;

      if (manipOps.length > 0) {
        const result = await ImageManipulator.manipulateAsync(
          imageUri,
          manipOps,
          { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG }
        );
        resultUri = result.uri;
      }

      // Capture drawing overlay as Skia snapshot, merge with image
      // Note: For production, merge using Skia ImageFilter or a separate canvas
      // Here we save the manipulated image + the drawings would require a
      // server-side or native merge step. We alert the user.
      if (drawPaths.length > 0) {
        const snapshot = canvasRef.current?.makeImageSnapshot();
        if (snapshot) {
          const encoded = snapshot.encodeToBytes(1, 95); // JPEG
          const tmpUri = `${FileSystem.cacheDirectory}photo_edit_${Date.now()}.jpg`;
          const base64 = btoa(String.fromCharCode(...encoded));
          await FileSystem.writeAsStringAsync(tmpUri, base64, {
            encoding: FileSystem.EncodingType.Base64,
          });
          resultUri = tmpUri;
        }
      }

      await MediaLibrary.saveToLibraryAsync(resultUri);
      Alert.alert('Saved!', 'Your edited photo has been saved to your library.', [
        { text: 'Done', onPress: onSaved },
      ]);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not save the photo. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Rotation transform for the image display
  const rotationStyle = {
    transform: [
      { rotate: `${rotation}deg` },
      { scaleX: flipH ? -1 : 1 },
    ],
  };

  const isDrawing = activeTool === 'draw';
  const isCropping = activeTool === 'crop';

  return (
    <View style={editorStyles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <SafeAreaView edges={['top']} style={editorStyles.headerSafe}>
        <View style={editorStyles.header}>
          <TouchableOpacity onPress={onCancel} style={editorStyles.headerBtn} disabled={isSaving}>
            <Text style={editorStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <Text style={editorStyles.title}>Edit Photo</Text>

          <TouchableOpacity
            onPress={handleSave}
            style={editorStyles.headerBtn}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFD60A" size="small" />
            ) : (
              <Text style={editorStyles.doneText}>Done</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Image area */}
      <View style={editorStyles.imageArea}>
        <View
          style={[
            editorStyles.imageWrapper,
            { width: imgSize.width, height: imgSize.height },
            rotationStyle,
          ]}
        >
          {/* Skia canvas for image + color adjustments */}
          <Canvas
            ref={canvasRef}
            style={{ width: imgSize.width, height: imgSize.height }}
          >
            {skiaImage && (
              <>
                <SkiaImage
                  image={skiaImage}
                  fit="contain"
                  x={0}
                  y={0}
                  width={imgSize.width}
                  height={imgSize.height}
                >
                  <ColorMatrix matrix={colorMatrix} />
                </SkiaImage>
              </>
            )}
          </Canvas>

          {/* Drawing overlay */}
          <DrawingCanvas
            width={imgSize.width}
            height={imgSize.height}
            paths={drawPaths}
            color={drawColor}
            strokeWidth={strokeWidth}
            mode={drawMode}
            onPathsChange={setDrawPaths}
            enabled={isDrawing}
          />

          {/* Crop overlay */}
          <CropOverlay
            containerWidth={imgSize.width}
            containerHeight={imgSize.height}
            cropRect={cropRect}
            aspectRatio={aspectRatio}
            onCropChange={setCropRect}
            onAspectRatioChange={setAspectRatio}
            visible={isCropping}
          />
        </View>

        {/* Draw mode indicator */}
        {isDrawing && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={editorStyles.drawHint}>
            <Text style={editorStyles.drawHintText}>Draw on the photo</Text>
          </Animated.View>
        )}
      </View>

      {/* Adjust panel (separate scroll area) */}
      {activeTool === 'adjust' && (
        <Animated.View
          entering={SlideInDown.duration(250)}
          style={editorStyles.adjustContainer}
        >
          <AdjustPanel
            adjustments={adjustments}
            onChange={handleAdjust}
            visible
          />
        </Animated.View>
      )}

      {/* Toolbar */}
      <View style={editorStyles.toolbar}>
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
    </View>
  );
};

const editorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  headerSafe: {
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerBtn: {
    minWidth: 64,
    paddingVertical: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: -0.2,
  },
  cancelText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '400',
  },
  doneText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFD60A',
    textAlign: 'right',
  },
  imageArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    overflow: 'hidden',
  },
  imageWrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  drawHint: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  drawHintText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  adjustContainer: {
    height: 260,
    backgroundColor: 'rgba(18,18,18,0.98)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  toolbar: {
    backgroundColor: 'rgba(0,0,0,0.92)',
  },
});

// ─── Main Export ──────────────────────────────────────────────────────────────

interface PhotoEditorProps {
  onSaved?: () => void;
  onCancel?: () => void;
}

export const PhotoEditor: React.FC<PhotoEditorProps> = ({
  onSaved,
  onCancel,
}) => {
  const [imageUri, setImageUri] = useState<string | null>(null);

  const handleImageSelected = (uri: string) => {
    setImageUri(uri);
  };

  const handleCancel = () => {
    setImageUri(null);
    onCancel?.();
  };

  const handleSaved = () => {
    setImageUri(null);
    onSaved?.();
  };

  if (imageUri) {
    return (
      <EditorScreen
        imageUri={imageUri}
        onCancel={handleCancel}
        onSaved={handleSaved}
      />
    );
  }

  return <PickerScreen onImageSelected={handleImageSelected} />;
};

export default PhotoEditor;
