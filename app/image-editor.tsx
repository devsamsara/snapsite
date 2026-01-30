import { Text, View, TouchableOpacity, Image, Alert, Dimensions } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useState } from 'react';
import * as ImageManipulator from 'expo-image-manipulator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type EditMode = 'none' | 'crop' | 'draw' | 'adjust';

export default function ImageEditorScreen() {
  const router = useRouter();
  const colors = useColors();
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const [currentImageUri, setCurrentImageUri] = useState(imageUri);
  const [editMode, setEditMode] = useState<EditMode>('none');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!imageUri) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text style={{ color: colors.muted }}>No image selected</Text>
      </View>
    );
  }

  const handleCrop = async () => {
    setIsProcessing(true);
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        currentImageUri,
        [
          {
            crop: {
              originX: 0,
              originY: 0,
              width: 1000,
              height: 1000,
            },
          },
        ],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      setCurrentImageUri(manipResult.uri);
      setEditMode('none');
    } catch (error) {
      Alert.alert("Error", "No se pudo recortar la imagen");
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
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
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
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      setCurrentImageUri(manipResult.uri);
    } catch (error) {
      Alert.alert("Error", "No se pudo voltear la imagen");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    // TODO: Save the edited image to the project
    Alert.alert(
      "Foto Guardada",
      "La foto ha sido agregada al proyecto exitosamente.",
      [
        {
          text: "OK",
          onPress: () => {
            // Go back to project detail
            router.back();
            router.back();
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
          onPress: () => router.back(),
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-black">
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 60,
          paddingBottom: 16,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <TouchableOpacity
          onPress={handleCancel}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 12,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>
            Cancelar
          </Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: '600', color: '#FFFFFF' }}>
          Editar Foto
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isProcessing}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 12,
            opacity: isProcessing ? 0.5 : 1,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.primary }}>
            Guardar
          </Text>
        </TouchableOpacity>
      </View>

      {/* Image Preview */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Image
          source={{ uri: currentImageUri }}
          style={{
            width: SCREEN_WIDTH,
            height: SCREEN_WIDTH,
          }}
          resizeMode="contain"
        />
        {isProcessing && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16 }}>Procesando...</Text>
          </View>
        )}
      </View>

      {/* Edit Mode Panel */}
      {editMode !== 'none' && (
        <View
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            paddingHorizontal: 24,
            paddingVertical: 20,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          }}
        >
          {editMode === 'crop' && (
            <View>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 16 }}>
                Recortar Imagen
              </Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={handleCrop}
                  style={{
                    flex: 1,
                    backgroundColor: colors.primary,
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>
                    Aplicar Recorte
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setEditMode('none')}
                  style={{
                    paddingHorizontal: 20,
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>
                    Cancelar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {editMode === 'draw' && (
            <View>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 16 }}>
                Dibujar (Próximamente)
              </Text>
              <TouchableOpacity
                onPress={() => setEditMode('none')}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>
                  Cerrar
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {editMode === 'adjust' && (
            <View>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 16 }}>
                Ajustes
              </Text>
              <View style={{ gap: 12 }}>
                <TouchableOpacity
                  onPress={handleRotate}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>
                    Rotar 90°
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleFlip}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>
                    Voltear Horizontal
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setEditMode('none')}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>
                    Cerrar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Bottom Toolbar */}
      {editMode === 'none' && (
        <View
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            paddingHorizontal: 24,
            paddingVertical: 20,
            paddingBottom: 40,
            flexDirection: 'row',
            justifyContent: 'space-around',
          }}
        >
          <TouchableOpacity
            onPress={() => setEditMode('crop')}
            style={{ alignItems: 'center' }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}
            >
              <IconSymbol name="crop" size={24} color="#FFFFFF" />
            </View>
            <Text style={{ fontSize: 12, color: '#FFFFFF' }}>Recortar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setEditMode('draw')}
            style={{ alignItems: 'center' }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}
            >
              <IconSymbol name="pencil.tip.crop.circle" size={24} color="#FFFFFF" />
            </View>
            <Text style={{ fontSize: 12, color: '#FFFFFF' }}>Dibujar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setEditMode('adjust')}
            style={{ alignItems: 'center' }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}
            >
              <IconSymbol name="slider.horizontal.3" size={24} color="#FFFFFF" />
            </View>
            <Text style={{ fontSize: 12, color: '#FFFFFF' }}>Ajustes</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
