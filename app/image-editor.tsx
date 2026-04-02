import { Text, View, TouchableOpacity, Image, Alert, Dimensions, StyleSheet, Platform, ScrollView, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useState, useRef, useEffect } from 'react';
import * as ImageManipulator from 'expo-image-manipulator';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { GestureHandlerRootView, PanGestureHandler, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type EditMode = 'none' | 'draw' | 'crop';

// Usamos strings SVG para representar los caminos, esto es mucho más seguro para el estado de React
// que los objetos SkPath nativos que pueden causar errores de "undefined" si no se manejan bien.
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
  
  // Drawing state
  const [paths, setPaths] = useState<DrawPath[]>([]);
  const [redoStack, setRedoStack] = useState<DrawPath[]>([]);
  const [drawColor, setDrawColor] = useState(COLORS[2]); // Default Red
  const [strokeWidth, setStrokeWidth] = useState(STROKE_WIDTHS[1]);
  
  const imageViewRef = useRef<View>(null);

  useEffect(() => {
    if (imageUri) {
      setCurrentImageUri(imageUri);
    }
  }, [imageUri]);

  // Gesture Handler para dibujar
  const gesture = Gesture.Pan()
    .onStart((g) => {
      if (editMode !== 'draw') return;
      const newPath: DrawPath = {
        segments: `M ${g.x} ${g.y}`,
        color: drawColor,
        strokeWidth: strokeWidth,
      };
      setPaths((prev) => [...prev, newPath]);
      setRedoStack([]);
    })
    .onUpdate((g) => {
      if (editMode !== 'draw') return;
      setPaths((prev) => {
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
    } catch (error) {
      Alert.alert("Error", "No se pudo rotar la imagen");
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
          { text: "OK", onPress: () => router.dismissAll() }
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
          <TouchableOpacity 
            onPress={handleUndo} 
            disabled={paths.length === 0}
            style={[styles.iconButton, paths.length === 0 && styles.disabled]}
          >
            <IconSymbol name="arrow.uturn.backward" size={20} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleRedo} 
            disabled={redoStack.length === 0}
            style={[styles.iconButton, redoStack.length === 0 && styles.disabled]}
          >
            <IconSymbol name="arrow.uturn.forward" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
          <Text style={[styles.doneText, { color: colors.primary }]}>Listo</Text>
        </TouchableOpacity>
      </View>

      {/* Main Editor Area */}
      <View style={styles.editorArea}>
        <GestureDetector gesture={gesture}>
          <View ref={imageViewRef} collapsable={false} style={styles.imageWrapper}>
            <Image
              source={{ uri: currentImageUri }}
              style={styles.mainImage}
              resizeMode="contain"
            />
            <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
              {paths.map((p, i) => (
                <Path
                  key={i}
                  path={p.segments}
                  color={p.color}
                  style="stroke"
                  strokeWidth={p.strokeWidth}
                  strokeCap="round"
                  strokeJoin="round"
                />
              ))}
            </Canvas>
          </View>
        </GestureDetector>
      </View>

      {/* Bottom Toolbar */}
      <View style={styles.bottomToolbar}>
        {editMode === 'draw' && (
          <View style={styles.drawingTools}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorList}>
              {COLORS.map(c => (
                <TouchableOpacity 
                  key={c} 
                  onPress={() => setDrawColor(c)}
                  style={[styles.colorCircle, { backgroundColor: c }, drawColor === c && styles.activeColor]}
                />
              ))}
            </ScrollView>
            <View style={styles.strokeList}>
              {STROKE_WIDTHS.map(w => (
                <TouchableOpacity 
                  key={w} 
                  onPress={() => setStrokeWidth(w)}
                  style={[styles.strokeButton, strokeWidth === w && { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                >
                  <View style={[styles.strokeIndicator, { width: w, height: w, borderRadius: w/2, backgroundColor: drawColor }]} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.mainTools}>
          <TouchableOpacity 
            onPress={() => setEditMode(editMode === 'draw' ? 'none' : 'draw')}
            style={[styles.toolButton, editMode === 'draw' && styles.activeTool]}
          >
            <IconSymbol name="pencil.tip.crop.circle" size={28} color={editMode === 'draw' ? colors.primary : "#FFF"} />
            <Text style={[styles.toolText, editMode === 'draw' && { color: colors.primary }]}>Dibujar</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleRotate} style={styles.toolButton}>
            <IconSymbol name="rotate.right" size={28} color="#FFF" />
            <Text style={styles.toolText}>Rotar</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => Alert.alert("Próximamente", "La herramienta de recorte estará disponible pronto.")} style={styles.toolButton}>
            <IconSymbol name="crop" size={28} color="#FFF" />
            <Text style={styles.toolText}>Recortar</Text>
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
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 16,
    height: Platform.OS === 'ios' ? 100 : 70,
    backgroundColor: '#111',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 20,
  },
  headerButton: {
    padding: 8,
  },
  cancelText: {
    color: '#FFF',
    fontSize: 17,
  },
  doneText: {
    fontSize: 17,
    fontWeight: '600',
  },
  iconButton: {
    padding: 4,
  },
  disabled: {
    opacity: 0.3,
  },
  editorArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  imageWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    backgroundColor: '#111',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  bottomToolbar: {
    backgroundColor: '#111',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingTop: 10,
  },
  mainTools: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 10,
  },
  toolButton: {
    alignItems: 'center',
    gap: 4,
    width: 80,
  },
  toolText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '500',
  },
  activeTool: {
    opacity: 1,
  },
  drawingTools: {
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    paddingBottom: 15,
    marginBottom: 10,
  },
  colorList: {
    paddingHorizontal: 20,
    gap: 15,
    height: 40,
    alignItems: 'center',
  },
  colorCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeColor: {
    borderColor: '#FFF',
    transform: [{ scale: 1.1 }],
  },
  strokeList: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 15,
  },
  strokeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  strokeIndicator: {
    backgroundColor: '#FFF',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  }
});
