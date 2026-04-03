/**
 * modals/annotation-text.tsx
 *
 * Stack.Screen modal — agregar anotación de texto al editor de fotos.
 * Se abre desde image-editor con router.push y devuelve el resultado
 * vía router.back() + un callback almacenado en un store global ligero.
 *
 * Params recibidos:
 *   - color: string   (color actual del editor)
 *   - fontSize: string (tamaño de fuente actual)
 *   - x: string        (posición x donde se tocó)
 *   - y: string        (posición y donde se tocó)
 */

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { annotationTextStore } from "@/lib/modal-stores";

const PALETTE = [
  "#FFFFFF","#000000","#FF3B30","#FF9500","#FFCC00",
  "#34C759","#5AC8FA","#007AFF","#5856D6","#FF2D55",
];
const FONTSIZES = [14, 18, 22, 28, 36];

export default function AnnotationTextModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    color: string; fontSize: string; x: string; y: string;
  }>();

  const [text, setText]       = useState("");
  const [color, setColor]     = useState(params.color ?? "#FFFFFF");
  const [fontSize, setFontSize] = useState(Number(params.fontSize ?? 22));

  const handleConfirm = () => {
    if (!text.trim()) { router.back(); return; }
    annotationTextStore.resolve({
      text: text.trim(),
      color,
      fontSize,
      x: Number(params.x ?? 0),
      y: Number(params.y ?? 0),
    });
    router.back();
  };

  const handleCancel = () => {
    annotationTextStore.cancel();
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Drag indicator */}
      <View style={styles.pill} />

      <Text style={styles.title}>Agregar Texto</Text>
      <Text style={styles.sub}>Luego puedes arrastrarlo y escalarlo con dos dedos.</Text>

      {/* Preview */}
      <View style={styles.preview}>
        <Text style={[styles.previewTxt, { color, fontSize }]}>
          {text || "Vista previa…"}
        </Text>
      </View>

      {/* Text input */}
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Escribe aquí..."
        placeholderTextColor="#666"
        style={styles.input}
        autoFocus
        multiline
        maxLength={200}
      />
      <Text style={styles.counter}>{text.length}/200</Text>

      {/* Color palette */}
      <Text style={styles.sectionLabel}>Color</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.palette}>
        {PALETTE.map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => setColor(c)}
            style={[styles.dot, { backgroundColor: c }, color === c && styles.dotActive]}
          />
        ))}
      </ScrollView>

      {/* Font size */}
      <Text style={styles.sectionLabel}>Tamaño</Text>
      <View style={styles.sizeRow}>
        {FONTSIZES.map((fs) => (
          <TouchableOpacity
            key={fs}
            onPress={() => setFontSize(fs)}
            style={[styles.sizeBtn, fontSize === fs && styles.sizeBtnActive]}
          >
            <Text style={[styles.sizeTxt, fontSize === fs && styles.sizeTxtActive]}>{fs}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Actions */}
      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <TouchableOpacity onPress={handleCancel} style={[styles.btn, styles.btnGray]}>
          <Text style={styles.btnGrayTxt}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleConfirm}
          style={[styles.btn, styles.btnBlue, !text.trim() && styles.btnDisabled]}
          disabled={!text.trim()}
        >
          <MaterialIcons name="check" size={18} color="#FFF" />
          <Text style={styles.btnBlueTxt}>Agregar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#1C1C1E", paddingHorizontal: 20, paddingTop: 12 },
  pill: { width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.25)", alignSelf: "center", marginBottom: 20 },
  title: { color: "#FFF", fontSize: 20, fontWeight: "700", marginBottom: 4 },
  sub: { color: "#999", fontSize: 13, marginBottom: 16 },
  preview: { backgroundColor: "#2C2C2E", borderRadius: 12, minHeight: 60, justifyContent: "center", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, marginBottom: 14 },
  previewTxt: { fontWeight: "700", textAlign: "center" },
  input: { backgroundColor: "#2C2C2E", borderRadius: 10, padding: 14, fontSize: 16, color: "#FFF", minHeight: 80, textAlignVertical: "top" },
  counter: { color: "#555", fontSize: 11, textAlign: "right", marginTop: 4, marginBottom: 16 },
  sectionLabel: { color: "#999", fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  palette: { gap: 12, paddingBottom: 4, marginBottom: 16 },
  dot: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: "transparent" },
  dotActive: { borderColor: "#FFF", transform: [{ scale: 1.2 }] },
  sizeRow: { flexDirection: "row", gap: 8, marginBottom: 24 },
  sizeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", backgroundColor: "#2C2C2E" },
  sizeBtnActive: { backgroundColor: "#007AFF" },
  sizeTxt: { color: "#999", fontSize: 14, fontWeight: "600" },
  sizeTxtActive: { color: "#FFF" },
  actions: { flexDirection: "row", gap: 12, marginTop: "auto" as any },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6 },
  btnGray: { backgroundColor: "#2C2C2E" },
  btnGrayTxt: { color: "#FFF", fontWeight: "500", fontSize: 15 },
  btnBlue: { backgroundColor: "#007AFF" },
  btnBlueTxt: { color: "#FFF", fontWeight: "700", fontSize: 15 },
  btnDisabled: { opacity: 0.4 },
});
