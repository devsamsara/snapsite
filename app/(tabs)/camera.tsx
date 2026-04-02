import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Alert, PanResponder } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import Svg, { Path } from 'react-native-svg';
import ViewShot, { captureRef } from 'react-native-view-shot';
import PhotoEditor from "@/components/camera/PhotoEditor";

export default function PhotoEditorPro() {
  const [image, setImage] = useState(null);
  const [paths, setPaths] = useState([]);
  const [currentPath, setCurrentPath] = useState([]);
  const [penColor, setPenColor] = useState('red');
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [isSaving, setIsSaving] = useState(false);

  // Referencia a la vista contenedora que queremos capturar
  const viewShotRef = useRef();

  // 1. Seleccionar Imagen y Recortar (nativo)
  const pickAndCropImage = async () => {
    // Limpiamos ediciones previas
    setPaths([]);
    setCurrentPath([]);

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, // Recorte básico nativo
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // 2. Lógica de Dibujo (PanResponder)
  const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          setCurrentPath([`M${locationX},${locationY}`]);
        },
        onPanResponderMove: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          setCurrentPath((prev) => [...prev, `L${locationX},${locationY}`]);
        },
        onPanResponderRelease: () => {
          if (currentPath.length > 1) { // Aseguramos que sea un trazo válido
            setPaths((prev) => [...prev, { path: currentPath.join(' '), color: penColor, width: strokeWidth }]);
          }
          setCurrentPath([]);
        },
      })
  ).current;

  // 3. LA SOLUCIÓN: Capturar la Vista y Guardar
  const saveFinalImage = async () => {
    if (!image) return;
    setIsSaving(true);

    try {
      // Primero, pedimos permisos para la galería
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permisos requeridos", "Necesitamos permiso para guardar en tu galería.");
        setIsSaving(false);
        return;
      }

      // Capturamos el contenido de viewShotRef
      // Esto genera un nuevo archivo temporal JPG con la foto y el dibujo
      const resultUri = await captureRef(viewShotRef, {
        format: 'jpg',
        quality: 1,
        result: 'tmpfile'
      });

      // Ahora guardamos *ese* nuevo archivo en la biblioteca de medios
      await MediaLibrary.saveToLibraryAsync(resultUri);
      Alert.alert("¡Éxito!", "Imagen guardada con tus dibujos en la galería.");

    } catch (e) {
      console.error("Error al guardar:", e);
      Alert.alert("Error", "No se pudo generar o guardar la imagen.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
      <View style={styles.container}>
        <PhotoEditor  />
      </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e1e1e', justifyContent: 'center' },
  canvasWrapper: { alignItems: 'center', justifyContent: 'center', padding: 10 },
  canvas: { width: 350, height: 466, backgroundColor: '#000', borderRadius: 8, overflow: 'hidden' }, // Relación 4:3
  image: { width: '100%', height: '100%' },
  toolbar: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#2a2a2a', padding: 20, borderTopLeftRadius: 15, borderTopRightRadius: 15 },
  colorRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 15 },
  colorDot: { width: 35, height: 35, borderRadius: 17.5, marginHorizontal: 8, borderWidth: 3 },
  sizeRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  sizeBtn: { width: 40, height: 40, borderRadius: 20, marginHorizontal: 6, justifyContent: 'center', alignItems: 'center' },
  buttonMain: { backgroundColor: '#2196F3', padding: 18, borderRadius: 10, alignSelf: 'center' },
  saveBtn: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 8, width: '100%', alignItems: 'center' },
  text: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});