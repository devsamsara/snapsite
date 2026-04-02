import { Text, View, TouchableOpacity, Image, Alert, Dimensions, StyleSheet, Platform, ScrollView, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useState, useRef, useEffect } from 'react';
import * as ImageManipulator from 'expo-image-manipulator';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type EditMode = 'none' | 'draw' | 'crop';

interface DrawPath {
  segments: string;
  color: string;
  strokeWidth: number;
}

const COLORS = [
  '#FFFFFF', '#000000', '#FF3B30', '#FF9500', '#FFCC00', 
  '#4CD964', '#5AC8FA', '#007AFF', '#5856D6', '#FF2D55'
];

const STROKE_WIDTHS = [3, 5, 8, 12, 20];

export default function ImageEditorScreen() {
  const router = useRouter();
  const colors = useColors();
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  
  const [currentImageUri, setCurrentImageUri] = useState(imageUri);
  const [editMode, setEditMode] = useState<EditMode>('none');
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageSize, setImageSize] = useState({ width: SCREEN_WIDTH, height: SCREEN_WIDTH });
  
  // Drawing state
  const [paths, setPaths] = useState<DrawPath[]>([]);
  const [redoStack, setRedoStack] = useState<DrawPath[]>([]);
  const [drawColor, setDrawColor] = useState(COLORS[2]);
  const [strokeWidth, setStrokeWidth] = useState(STROKE_WIDTHS[1]);
  
  // Crop state (Reanimated)
  const cropTop = useSharedValue(0);
  const cropLeft = useSharedValue(0);
  const cropRight = useSharedValue(0);
  const cropBottom = useSharedValue(0);
  
  const imageViewRef = useRef<View>(null);

  useEffect(() => {
    if (imageUri) {
      setCurrentImageUri(imageUri);
      Image.getSize(imageUri, (w, h) => {
        const aspectRatio = w / h;
        const displayWidth = SCREEN_WIDTH;
        const displayHeight = SCREEN_WIDTH / aspectRatio;
        setImageSize({ width: displayWidth, height: displayHeight });
      });
    }
  }, [imageUri]);

  // Gesture for Drawing
  const drawGesture = Gesture.Pan()
    .onStart((g) => {
      if (editMode !== 'draw') return;
      const newPath: DrawPath = {
        segments: `M ${g.x} ${g.y}`,
        color: drawColor,
        strokeWidth: strokeWidth,
      };
      runOnJS(setPaths)((prev) => [...prev, newPath]);
      runOnJS(setRedoStack)([]);
    })
    .onUpdate((g) => {
      if (editMode !== 'draw') return;
      runOnJS(setPaths)((prev) => {
        const lastPath = prev[prev.length - 1];
        if (!lastPath) return prev;
        const updatedPath = {
          ...lastPath,
          segments: `${lastPath.segments} L ${g.x} ${g.y}`,
        };
        return [...prev.slice(0, -1), updatedPath];
      });
    })
    .runOnJS(true);

  // Gesture for Cropping (Top-Left Corner)
  const cropGestureTL = Gesture.Pan()
    .onUpdate((g) => {
      if (editMode !== 'crop') return;
      const newTop = Math.max(0, Math.min(imageSize.height - cropBottom.value - 50, g.y));
      const newLeft = Math.max(0, Math.min(imageSize.width - cropRight.value - 50, g.x));
      cropTop.value = newTop;
      cropLeft.value = newLeft;
    });

  // Gesture for Cropping (Bottom-Right Corner)
  const cropGestureBR = Gesture.Pan()
    .onUpdate((g) => {
      if (editMode !== 'crop') return;
      const newBottom = Math.max(0, Math.min(imageSize.height - cropTop.value - 50, imageSize.height - g.y));
      const newRight = Math.max(0, Math.min(imageSize.width - cropLeft.value - 50, imageSize.width - g.x));
      cropBottom.value = newBottom;
      cropRight.value = newRight;
    });

  const animatedCropStyle = useAnimatedStyle(() => ({
    top: cropTop.value,
    left: cropLeft.value,
    right: cropRight.value,
    bottom: cropBottom.value,
    borderColor: '#FFF',
    borderWidth: 2,
    position: 'absolute',
  }));

  if (!currentImageUri) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.muted, marginTop: 16 }}>Cargando imagen...</Text>
      </View>
    );
  }

  const handleUndo = () => {
    if (paths.length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const last = paths[paths.length - 1];
      setRedoStack(prev => [last, ...prev]);
      setPaths(prev => prev.slice(0, -1));
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const first = redoStack[0];
      setRedoStack(prev => prev.slice(1));
      setPaths(prev => [...prev, first]);
    }
  };

  const handleRotate = async () => {
    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        currentImageUri,
        [{ rotate: 90 }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );
      setCurrentImageUri(manipResult.uri);
      // Update image size after rotation
      Image.getSize(manipResult.uri, (w, h) => {
        const aspectRatio = w / h;
        const displayWidth = SCREEN_WIDTH;
        const displayHeight = SCREEN_WIDTH / aspectRatio;
        setImageSize({ width: displayWidth, height: displayHeight });
      });
    } catch (error) {
      Alert.alert("Error", "No se pudo rotar la imagen");
    } finally {
      setIsProcessing(false);
    }
  };

  const applyCrop = async () => {
    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { width: imgW, height: imgH } = await new Promise<{width: number, height: number}>((resolve) => {
        Image.getSize(currentImageUri, (w, h) => resolve({width: w, height: h}));
      });

      const scale = imgW / imageSize.width;
      const cropX = cropLeft.value * scale;
      const cropY = cropTop.value * scale;
      const cropW = (imageSize.width - cropLeft.value - cropRight.value) * scale;
      const cropH = (imageSize.height - cropTop.value - cropBottom.value) * scale;

      const manipResult = await ImageManipulator.manipulateAsync(
        currentImageUri,
        [{ crop: { originX: cropX, originY: cropY, width: cropW, height: cropH } }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );
      setCurrentImageUri(manipResult.uri);
      setEditMode('none');
      
      // Update image size after crop
      Image.getSize(manipResult.uri, (w, h) => {
        const aspectRatio = w / h;
        const displayWidth = SCREEN_WIDTH;
        const displayHeight = SCREEN_WIDTH / aspectRatio;
        setImageSize({ width: displayWidth, height: displayHeight });
      });

      // Reset crop values
      cropTop.value = 0; cropLeft.value = 0; cropRight.value = 0; cropBottom.value = 0;
    } catch (error) {
      Alert.alert("Error", "No se pudo recortar la imagen");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    setIsProcessing(true);
    try {
      let finalUri = currentImageUri;
      
      if (paths.length > 0 && imageViewRef.current) {
        finalUri = await captureRef(imageViewRef, {
          format: 'jpg',
          quality: 1,
        });
      }

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(finalUri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Éxito", "Imagen guardada en tu galería", [
          { 
            text: "OK", 
            onPress: () => {
              if (params.projectId) {
                router.push({
                  pathname: '/(tabs)/projects',
                  params: { id: params.projectId }
                });
              } else {
                router.dismissAll();
              }
            } 
          }
        ]);
      } else {
        Alert.alert("Permiso denegado", "No podemos guardar la imagen sin permisos de galería.");
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar la imagen");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: '#000' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          {editMode === 'draw' && (
            <>
              <TouchableOpacity onPress={handleUndo} disabled={paths.length === 0} style={[styles.iconButton, paths.length === 0 && styles.disabled]}>
                <IconSymbol name="arrow.uturn.backward" size={20} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleRedo} disabled={redoStack.length === 0} style={[styles.iconButton, redoStack.length === 0 && styles.disabled]}>
                <IconSymbol name="arrow.uturn.forward" size={20} color="#FFF" />
              </TouchableOpacity>
            </>
          )}
          {editMode === 'crop' && (
            <TouchableOpacity onPress={applyCrop} style={styles.applyCropButton}>
              <Text style={{ color: '#FFF', fontWeight: '600' }}>Aplicar</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
          <Text style={[styles.doneText, { color: colors.primary }]}>Listo</Text>
        </TouchableOpacity>
      </View>

      {/* Main Editor Area */}
      <View style={styles.editorArea}>
        <GestureDetector gesture={drawGesture}>
          <View 
            ref={imageViewRef} 
            collapsable={false} 
            style={[styles.imageWrapper, { width: imageSize.width, height: imageSize.height }]}
          >
            <Image source={{ uri: currentImageUri }} style={styles.mainImage} resizeMode="contain" />
            <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
              {Array.isArray(paths) && paths.map((p, i) => (
                p && p.segments ? (
                  <Path key={i} path={p.segments} color={p.color} style="stroke" strokeWidth={p.strokeWidth} strokeCap="round" strokeJoin="round" />
                ) : null
              ))}
            </Canvas>

            {editMode === 'crop' && (
              <>
                <Animated.View style={animatedCropStyle}>
                  <GestureDetector gesture={cropGestureTL}>
                    <View style={[styles.cropHandle, { top: -15, left: -15 }]} />
                  </GestureDetector>
                  <GestureDetector gesture={cropGestureBR}>
                    <View style={[styles.cropHandle, { bottom: -15, right: -15 }]} />
                  </GestureDetector>
                  {/* Grid lines */}
                  <View style={[styles.gridLine, { top: '33.3%', width: '100%', height: 1 }]} />
                  <View style={[styles.gridLine, { top: '66.6%', width: '100%', height: 1 }]} />
                  <View style={[styles.gridLine, { left: '33.3%', height: '100%', width: 1 }]} />
                  <View style={[styles.gridLine, { left: '66.6%', height: '100%', width: 1 }]} />
                </Animated.View>
              </>
            )}
          </View>
        </GestureDetector>
      </View>

      {/* Bottom Toolbar */}
      <View style={styles.bottomToolbar}>
        {editMode === 'draw' && (
          <View style={styles.drawingTools}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorList}>
              {COLORS.map(c => (
                <TouchableOpacity key={c} onPress={() => setDrawColor(c)} style={[styles.colorCircle, { backgroundColor: c }, drawColor === c && styles.activeColor]} />
              ))}
            </ScrollView>
            <View style={styles.strokeList}>
              {STROKE_WIDTHS.map(w => (
                <TouchableOpacity key={w} onPress={() => setStrokeWidth(w)} style={[styles.strokeButton, strokeWidth === w && { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <View style={[styles.strokeIndicator, { width: w, height: w, borderRadius: w/2, backgroundColor: drawColor }]} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.mainTools}>
          <TouchableOpacity onPress={() => setEditMode(editMode === 'draw' ? 'none' : 'draw')} style={[styles.toolButton, editMode === 'draw' && styles.activeTool]}>
            <IconSymbol name="pencil.tip.crop.circle" size={28} color={editMode === 'draw' ? colors.primary : "#FFF"} />
            <Text style={[styles.toolText, editMode === 'draw' && { color: colors.primary }]}>Dibujar</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleRotate} style={styles.toolButton}>
            <IconSymbol name="rotate.right" size={28} color="#FFF" />
            <Text style={styles.toolText}>Rotar</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setEditMode(editMode === 'crop' ? 'none' : 'crop')} style={[styles.toolButton, editMode === 'crop' && styles.activeTool]}>
            <IconSymbol name="crop" size={28} color={editMode === 'crop' ? colors.primary : "#FFF"} />
            <Text style={[styles.toolText, editMode === 'crop' && { color: colors.primary }]}>Recortar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isProcessing && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={{ color: '#FFF', fontWeight: '600', marginTop: 12 }}>Procesando...</Text>
        </View>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingHorizontal: 16,
    height: Platform.OS === 'ios' ? 100 : 70, backgroundColor: '#111',
  },
  headerActions: { flexDirection: 'row', gap: 20, alignItems: 'center' },
  headerButton: { padding: 8 },
  cancelText: { color: '#FFF', fontSize: 17 },
  doneText: { fontSize: 17, fontWeight: '600' },
  iconButton: { padding: 4 },
  disabled: { opacity: 0.3 },
  applyCropButton: { backgroundColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  editorArea: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  imageWrapper: { backgroundColor: '#111', position: 'relative' },
  mainImage: { width: '100%', height: '100%' },
  cropHandle: { width: 30, height: 30, backgroundColor: '#FFF', borderRadius: 15, position: 'absolute', zIndex: 10 },
  gridLine: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.5)' },
  bottomToolbar: { backgroundColor: '#111', paddingBottom: Platform.OS === 'ios' ? 40 : 20, paddingTop: 10 },
  mainTools: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingTop: 10 },
  toolButton: { alignItems: 'center', gap: 4, width: 80 },
  toolText: { color: '#FFF', fontSize: 11, fontWeight: '500' },
  activeTool: { opacity: 1 },
  drawingTools: { borderBottomWidth: 1, borderBottomColor: '#222', paddingBottom: 15, marginBottom: 10 },
  colorList: { paddingHorizontal: 20, gap: 15, height: 40, alignItems: 'center' },
  colorCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
  activeColor: { borderColor: '#FFF', transform: [{ scale: 1.1 }] },
  strokeList: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 15 },
  strokeButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  strokeIndicator: { backgroundColor: '#FFF' },
  loader: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }
});
