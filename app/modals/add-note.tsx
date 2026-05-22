/**
 * modals/add-note.tsx
 *
 * Stack.Screen modal (formSheet) — agregar una nota al proyecto.
 * Devuelve el resultado via addNoteStore.
 */

import React, {useState} from "react";
import {KeyboardAvoidingView, Platform, StyleSheet, Text, View,} from "react-native";
import {useLocalSearchParams, useRouter} from "expo-router";
import { useTranslation } from "react-i18next";
import {addNoteStore} from "@/lib/modal-stores";
import {ModalBody, ModalFooter, ModalHeader, ModalRoot} from "@/components/ui/modal-layout";
import {Button} from "@/components/ui/button";
import {useColors} from "@/hooks/use-colors";
import {AppInput} from "@/components/ui/app-input";
import * as z from 'zod';
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";

type FormValues = { note: string };

export default function AddNoteModal() {
    const { t }  = useTranslation();
    const router = useRouter();
    const colors = useColors();
    const {projectId} = useLocalSearchParams<{ projectId?: string }>();

    const [text, setText] = useState("");

    const schema = z.object({
        note: z.string().min(1, t('validation.required')),
    });

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
            style={S.flex1}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ModalRoot>

                {/* ── Header ── */}
                <ModalHeader
                    title={t('modals.addNote.title')}
                    subtitle={t('modals.addNote.subtitle')}
                    onClose={handleCancel}
                />

                {/* ── Body ── */}
                <ModalBody style={S.modalBody}>
                    <AppInput
                        name="note"
                        control={control}
                        label={t('modals.addNote.label')}
                        placeholder={t('modals.addNote.placeholder')}
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
                    <View style={S.flex1}>
                        <Button title={t('common.cancel')} onPress={handleCancel} variant="secondary" size="md"/>
                    </View>
                    <View style={S.flex1}>
                        <Button
                            title={t('modals.addNote.save')}
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
    flex1:     { flex: 1 },
    modalBody: { flex: 1, height: 140 * 1.7 },
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
