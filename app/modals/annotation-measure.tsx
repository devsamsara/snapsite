/**
 * modals/annotation-measure.tsx
 *
 * Stack.Screen modal — personalizar la etiqueta de una medición.
 * Se abre desde image-editor con router.push y devuelve el resultado
 * vía annotationMeasureStore.
 *
 * Params recibidos:
 *   - label: string  (etiqueta auto-calculada, ej: "245px")
 *   - color: string
 */

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { annotationMeasureStore } from "@/lib/modal-stores";

const PRESETS = ["1 m", "2 m", "50 cm", "100 cm", "1.5 m", "3 m"];

export default function AnnotationMeasureModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ label: string; color: string }>();

  const [label, setLabel] = useState(params.label ?? "");

  const handleConfirm = () => {
    annotationMeasureStore.resolve({ label: label.trim() || params.label });
    router.back();
  };

  const handleCancel = () => {
    annotationMeasureStore.cancel();
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.pill} />

      <View style={styles.iconRow}>
        <View style={styles.iconBg}>
          <MaterialIcons name="straighten" size={28} color="#007AFF" />
        </View>
      </View>

      <Text style={styles.title}>Etiqueta de Medida</Text>
      <Text style={styles.sub}>Personaliza la etiqueta que aparecerá sobre la línea de medición.</Text>

      <TextInput
        value={label}
        onChangeText={setLabel}
        placeholder="Ej: 2.5 m, 120 cm, 3 ft…"
        placeholderTextColor="#666"
        style={styles.input}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={handleConfirm}
      />

      {/* Quick presets */}
      <Text style={styles.sectionLabel}>Accesos rápidos</Text>
      <View style={styles.presets}>
        {PRESETS.map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => setLabel(p)}
            style={[styles.preset, label === p && styles.presetActive]}
          >
            <Text style={[styles.presetTxt, label === p && styles.presetTxtActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <TouchableOpacity onPress={handleCancel} style={[styles.btn, styles.btnGray]}>
          <Text style={styles.btnGrayTxt}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleConfirm} style={[styles.btn, styles.btnBlue]}>
          <MaterialIcons name="check" size={18} color="#FFF" />
          <Text style={styles.btnBlueTxt}>Confirmar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#1C1C1E", paddingHorizontal: 20, paddingTop: 12 },
  pill: { width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.25)", alignSelf: "center", marginBottom: 20 },
  iconRow: { alignItems: "center", marginBottom: 16 },
  iconBg: { width: 60, height: 60, borderRadius: 30, backgroundColor: "rgba(0,122,255,0.15)", alignItems: "center", justifyContent: "center" },
  title: { color: "#FFF", fontSize: 20, fontWeight: "700", marginBottom: 4 },
  sub: { color: "#999", fontSize: 13, marginBottom: 20 },
  input: { backgroundColor: "#2C2C2E", borderRadius: 10, padding: 14, fontSize: 18, color: "#FFF", fontWeight: "600", marginBottom: 4 },
  sectionLabel: { color: "#999", fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 16, marginBottom: 10 },
  presets: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },
  preset: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#2C2C2E" },
  presetActive: { backgroundColor: "#007AFF" },
  presetTxt: { color: "#999", fontSize: 14, fontWeight: "600" },
  presetTxtActive: { color: "#FFF" },
  actions: { flexDirection: "row", gap: 12, marginTop: "auto" as any },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6 },
  btnGray: { backgroundColor: "#2C2C2E" },
  btnGrayTxt: { color: "#FFF", fontWeight: "500", fontSize: 15 },
  btnBlue: { backgroundColor: "#007AFF" },
  btnBlueTxt: { color: "#FFF", fontWeight: "700", fontSize: 15 },
});
