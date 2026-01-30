import { Text, View, TouchableOpacity, Image, Alert, Dimensions, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useState, useRef } from 'react';
import * as ImageManipulator from 'expo-image-manipulator';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import { captureRef } from 'react-native-view-shot';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IMAGE_SIZE = SCREEN_WIDTH;

type EditMode = 'none' | 'crop' | 'draw' | 'adjust';

interface DrawPath {
  path: string;
  color: string;
  strokeWidth: number;
}

export default function ImageEditorScreen() {
  const router = useRouter();
  const colors = useColors();
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const [currentImageUri, setCurrentImageUri] = useState(imageUri);
  const [editMode, setEditMode] = useState<EditMode>('none');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Drawing state
  const [paths, setPaths] = useState<DrawPath[]>([]);
  const [currentPath, setCurrentPath] = useState<any>(null);
  const [drawColor, setDrawColor] = useState('#FF0000');
  const [strokeWidth, setStrokeWidth] = useState(5);
  const imageViewRef = useRef<View>(null);

  if (!imageUri) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text style={{ color: colors.muted }}>No image selected</Text>
      </View>
    );
  }

  // Pan gesture for drawing
  const panGesture = Gesture.Pan()
    .onStart((event) => {
      const newPath = Skia.Path.Make();
      newPath.moveTo(event.x, event.y);
      setCurrentPath(newPath);
    })
    .onUpdate((event) => {
      if (currentPath) {
        const updatedPath = currentPath.copy();
        updatedPath.lineTo(event.x, event.y);
        setCurrentPath(updatedPath);
      }
    })
    .onEnd(() => {
      if (currentPath) {
        setPaths([...paths, {
          path: currentPath.toSVGString(),
          color: drawColor,
          strokeWidth: strokeWidth,
        }]);
        setCurrentPath(null);
      }
    });

  const handleClearDrawing = () => {
    setPaths([]);
    setCurrentPath(null);
  };

  const handleSaveDrawing = async () => {
    if (paths.length === 0) {
      Alert.alert("Sin Cambios", "No has dibujado nada en la imagen.");
      return;
    }

    setIsProcessing(true);
    try {
      // Capture the view with the image and drawings
      if (imageViewRef.current) {
        const uri = await captureRef(imageViewRef, {
          format: 'jpg',
          quality: 0.9,
        });
        setCurrentImageUri(uri);
        setPaths([]);
        setEditMode('none');
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar el dibujo");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRotate = async () => {
    setIsProcessing(true);
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        currentImageUri,
        [{ rotate: 90 }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );
      setCurrentImageUri(manipResult.uri);
    } catch (error) {
      Alert.alert("Error", "No se pudo rotar la imagen");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFlip = async () => {
    setIsProcessing(true);
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        currentImageUri,
        [{ flip: ImageManipulator.FlipType.Horizontal }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );
      setCurrentImageUri(manipResult.uri);
    } catch (error) {
      Alert.alert("Error", "No se pudo voltear la imagen");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCrop = async () => {
    setIsProcessing(true);
    try {
      // Get image dimensions first
      Image.getSize(currentImageUri, async (width, height) => {
        const cropSize = Math.min(width, height);
        const originX = (width - cropSize) / 2;
        const originY = (height - cropSize) / 2;

        const manipResult = await ImageManipulator.manipulateAsync(
          currentImageUri,
          [
            {
              crop: {
                originX: originX,
                originY: originY,
                width: cropSize,
                height: cropSize,
              },
            },
          ],
          { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
        );
        setCurrentImageUri(manipResult.uri);
        setEditMode('none');
        setIsProcessing(false);
      }, (error) => {
        Alert.alert("Error", "No se pudo obtener las dimensiones de la imagen");
        setIsProcessing(false);
      });
    } catch (error) {
      Alert.alert("Error", "No se pudo recortar la imagen");
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    Alert.alert(
      "Foto Guardada",
      "La foto ha sido agregada al proyecto exitosamente.",
      [
        {
          text: "OK",
          onPress: () => {
            // Navigate back to project detail
            router.dismissAll();
            router.back();
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      "Descartar Cambios",
      "¿Estás seguro de que quieres descartar los cambios?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Descartar",
          style: "destructive",
          onPress: () => {
            router.dismissAll();
            router.back();
          },
        },
      ]
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleCancel}
            style={styles.headerButton}
          >
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar Foto</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={isProcessing}
            style={[styles.headerButton, isProcessing && styles.disabledButton]}
          >
            <Text style={[styles.saveText, { color: colors.primary }]}>Guardar</Text>
          </TouchableOpacity>
        </View>

        {/* Image Preview with Drawing Canvas */}
        <View style={styles.imageContainer}>
          <View ref={imageViewRef} collapsable={false}>
            <Image
              source={{ uri: currentImageUri }}
              style={styles.image}
              resizeMode="contain"
            />
            {editMode === 'draw' && (
              <GestureDetector gesture={panGesture}>
                <Canvas style={styles.canvas}>
                  {paths.map((p, index) => {
                    const path = Skia.Path.MakeFromSVGString(p.path);
                    return path ? (
                      <Path
                        key={index}
                        path={path}
                        color={p.color}
                        style="stroke"
                        strokeWidth={p.strokeWidth}
                        strokeCap="round"
                        strokeJoin="round"
                      />
                    ) : null;
                  })}
                  {currentPath && (
                    <Path
                      path={currentPath}
                      color={drawColor}
                      style="stroke"
                      strokeWidth={strokeWidth}
                      strokeCap="round"
                      strokeJoin="round"
                    />
                  )}
                </Canvas>
              </GestureDetector>
            )}
          </View>
          
          {isProcessing && (
            <View style={styles.processingOverlay}>
              <Text style={styles.processingText}>Procesando...</Text>
            </View>
          )}
        </View>

        {/* Edit Mode Panels */}
        {editMode === 'crop' && (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Recortar Imagen</Text>
            <Text style={styles.panelDescription}>Se recortará al centro en formato cuadrado</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                onPress={handleCrop}
                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.primaryButtonText}>Aplicar Recorte</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setEditMode('none')}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {editMode === 'draw' && (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Dibujar</Text>
            
            {/* Color Picker */}
            <View style={styles.colorPicker}>
              {['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF', '#000000'].map((color) => (
                <TouchableOpacity
                  key={color}
                  onPress={() => setDrawColor(color)}
                  style={[
                    styles.colorButton,
                    { backgroundColor: color },
                    drawColor === color && styles.selectedColor,
                  ]}
                />
              ))}
            </View>

            {/* Stroke Width Selector */}
            <View style={styles.strokeWidthContainer}>
              <Text style={styles.strokeWidthLabel}>Grosor:</Text>
              {[3, 5, 8, 12].map((width) => (
                <TouchableOpacity
                  key={width}
                  onPress={() => setStrokeWidth(width)}
                  style={[
                    styles.strokeWidthButton,
                    strokeWidth === width && styles.selectedStrokeWidth,
                  ]}
                >
                  <Text style={styles.strokeWidthText}>{width}px</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                onPress={handleSaveDrawing}
                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                disabled={paths.length === 0}
              >
                <Text style={styles.primaryButtonText}>Aplicar Dibujo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleClearDrawing}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Limpiar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setPaths([]);
                  setCurrentPath(null);
                  setEditMode('none');
                }}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {editMode === 'adjust' && (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Ajustes</Text>
            <View style={styles.adjustButtons}>
              <TouchableOpacity
                onPress={handleRotate}
                style={styles.adjustButton}
              >
                <IconSymbol name="rotate.right" size={24} color="#FFFFFF" />
                <Text style={styles.adjustButtonText}>Rotar 90°</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleFlip}
                style={styles.adjustButton}
              >
                <IconSymbol name="arrow.left.and.right.righttriangle.left.righttriangle.right" size={24} color="#FFFFFF" />
                <Text style={styles.adjustButtonText}>Voltear</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => setEditMode('none')}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Toolbar */}
        {editMode === 'none' && (
          <View style={styles.toolbar}>
            <TouchableOpacity
              onPress={() => setEditMode('crop')}
              style={styles.toolButton}
            >
              <View style={styles.toolIcon}>
                <IconSymbol name="crop" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.toolLabel}>Recortar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setEditMode('draw')}
              style={styles.toolButton}
            >
              <View style={styles.toolIcon}>
                <IconSymbol name="pencil.tip.crop.circle" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.toolLabel}>Dibujar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setEditMode('adjust')}
              style={styles.toolButton}
            >
              <View style={styles.toolIcon}>
                <IconSymbol name="slider.horizontal.3" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.toolLabel}>Ajustes</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  disabledButton: {
    opacity: 0.5,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  panel: {
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  panelDescription: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  colorPicker: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  colorButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
  strokeWidthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  strokeWidthLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginRight: 8,
  },
  strokeWidthButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedStrokeWidth: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  strokeWidthText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  adjustButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  adjustButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  adjustButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  toolbar: {
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  toolButton: {
    alignItems: 'center',
  },
  toolIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  toolLabel: {
    fontSize: 12,
    color: '#FFFFFF',
  },
});
