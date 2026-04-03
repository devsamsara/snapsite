/**
 * modals/add-note.tsx
 *
 * Stack.Screen modal — agregar una nota al proyecto.
 * Devuelve el resultado vía addNoteStore.
 *
 * Params recibidos:
 *   - projectId: string
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
import { addNoteStore } from "@/lib/modal-stores";

export default function AddNoteModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { projectId } = useLocalSearchParams<{ projectId: string }>();

  const [text, setText] = useState("");

  const handleSave = () => {
    if (!text.trim()) return;
    addNoteStore.resolve({ projectId, text: text.trim() });
    router.back();
  };

  const handleCancel = () => {
    addNoteStore.cancel();
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.pill} />

      <View style={styles.header}>
        <Text style={styles.title}>Nueva Nota</Text>
        <TouchableOpacity onPress={handleCancel} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialIcons name="close" size={22} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>
      </View>

      <Text style={styles.sub}>
        La nota será visible para todos los miembros del proyecto.
      </Text>

      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Escribe una nota para el equipo..."
        placeholderTextColor="#666"
        style={styles.input}
        multiline
        autoFocus
        maxLength={500}
        textAlignVertical="top"
      />
      <Text style={styles.counter}>{text.length}/500</Text>

      <TouchableOpacity
        onPress={handleSave}
        disabled={!text.trim()}
        style={[
          styles.saveBtn,
          { paddingBottom: Math.max(insets.bottom, 16) + 14 },
          !text.trim() && styles.saveBtnDisabled,
        ]}
      >
        <MaterialIcons name="check" size={18} color="#FFF" />
        <Text style={styles.saveBtnTxt}>Guardar Nota</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#1C1C1E", paddingHorizontal: 20, paddingTop: 12 },
  pill: { width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.25)", alignSelf: "center", marginBottom: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  title: { color: "#FFF", fontSize: 20, fontWeight: "700" },
  sub: { color: "#999", fontSize: 13, marginBottom: 18 },
  input: { backgroundColor: "#2C2C2E", borderRadius: 12, padding: 14, fontSize: 16, color: "#FFF", minHeight: 140 },
  counter: { color: "#555", fontSize: 11, textAlign: "right", marginTop: 6, marginBottom: 24 },
  saveBtn: {
    backgroundColor: "#007AFF", borderRadius: 14,
    alignItems: "center", flexDirection: "row", justifyContent: "center",
    gap: 8, paddingTop: 15, marginTop: "auto" as any,
  },
  saveBtnDisabled: { backgroundColor: "#2C2C2E" },
  saveBtnTxt: { color: "#FFF", fontWeight: "700", fontSize: 16 },
});
