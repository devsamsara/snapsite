/**
 * modals/add-note.tsx
 *
 * Stack.Screen modal (formSheet) — agregar una nota al proyecto.
 * Devuelve el resultado via addNoteStore.
 */

import React, {useState} from "react";
import {KeyboardAvoidingView, Platform, StyleSheet, Text, View,} from "react-native";
import {useLocalSearchParams, useRouter} from "expo-router";
import {addNoteStore} from "@/lib/modal-stores";
import {ModalBody, ModalFooter, ModalHeader, ModalRoot} from "@/components/ui/modal-layout";
import {Button} from "@/components/ui/button";
import {useColors} from "@/hooks/use-colors";
import {AppInput} from "@/components/ui/app-input";
import * as z from 'zod';
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";

const schema = z.object({
    note: z.string().min(1, 'El usuario es requerido'),
});
type FormValues = z.infer<typeof schema>;

export default function AddNoteModal() {
    const router = useRouter();
    const colors = useColors();
    const {projectId} = useLocalSearchParams<{ projectId?: string }>();

    const [text, setText] = useState("");

    const {control, handleSubmit} = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {note: ''},
    });


    const handleSave = () => {
        if (!text.trim()) return;
        addNoteStore.resolve({projectId: projectId ?? "", text: text.trim()});
        router.back();
    };

    const handleCancel = () => {
        addNoteStore.cancel();
        router.back();
    };

    return (
        <KeyboardAvoidingView
            style={{flex: 1}}
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
                <ModalBody style={{flex: 1, height:S.input.minHeight* 1.7}}>
                    <AppInput
                        name="note"
                        control={control}
                        label="Nota"
                        placeholder="Escribe una nota para el equipo..."
                        autoCapitalize="none"
                        multiline
                        autoFocus
                        maxLength={450}
                        value={text}
                        onChangeText={setText}
                        textAlignVertical="top"
                        numberOfLines={6}
                        style={S.input}
                        showLength
                    />


                </ModalBody>

                {/* ── Footer ── */}
                <ModalFooter row>
                    <View style={{flex: 1}}>
                        <Button title="Cancelar" onPress={handleCancel} variant="secondary" size="md"/>
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
        borderRadius: 12,
        padding: 14, fontSize: 15,
        minHeight: 140, textAlignVertical: "top",
    },
    counter: {
        fontSize: 11, textAlign: "right",
        marginTop: 6,
    },
});
