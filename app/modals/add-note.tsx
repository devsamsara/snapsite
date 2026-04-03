/**
 * modals/add-note.tsx
 *
 * Stack.Screen modal (formSheet) — agregar una nota al proyecto.
 * Devuelve el resultado via addNoteStore.
 */

import React, { useState } from "react";
import {
    Text,
    TextInput,
    StyleSheet,
    KeyboardAvoidingView,
    Platform, View,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { addNoteStore } from "@/lib/modal-stores";
import { ModalHeader, ModalBody, ModalFooter, ModalRoot } from "@/components/ui/modal-layout";
import { Button } from "@/components/ui/button";
import { useColors } from "@/hooks/use-colors";

// ─── Component ────────────────────────────────────────────────────────────────

export default function AddNoteModal() {
  const router  = useRouter();
  const colors  = useColors();
  const { projectId } = useLocalSearchParams<{ projectId?: string }>();

  const [text, setText] = useState("");

  const handleSave = () => {
    if (!text.trim()) return;
    addNoteStore.resolve({ projectId: projectId ?? "", text: text.trim() });
    router.back();
  };

  const handleCancel = () => {
    addNoteStore.cancel();
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ModalRoot>

        {/* ── Header ── */}
        <ModalHeader
          title="Nueva Nota"
          subtitle="La nota será visible para todos los miembros del proyecto."
          onClose={handleCancel}
        />

        {/* ── Body ── */}
        <ModalBody>

          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Escribe una nota para el equipo..."
            placeholderTextColor={colors.muted}
            style={[S.input, {
              color: colors.foreground,
              backgroundColor: colors.background,
              borderColor: colors.border,
            }]}
            multiline
            autoFocus
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={[S.counter, { color: colors.muted }]}>{text.length}/500</Text>

        </ModalBody>

        {/* ── Footer ── */}
        <ModalFooter row>
            <View style={{flex: 1}}>
                <Button title="Cancelar"    onPress={handleCancel} variant="secondary" size="md" />
            </View>
            <View style={{flex: 1}}>
                <Button
                    title="Guardar Nota"
                    onPress={handleSave}
                    variant="primary"
                    size="md"
                    leftIcon="check"
                    disabled={!text.trim()}
                />
            </View>


        </ModalFooter>

      </ModalRoot>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  input: {
    borderRadius: 12, borderWidth: 1,
    padding: 14, fontSize: 15,
    minHeight: 140, textAlignVertical: "top",
  },
  counter: {
    fontSize: 11, textAlign: "right",
    marginTop: 6,
  },
});
