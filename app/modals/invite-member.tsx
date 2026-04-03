/**
 * modals/invite-member.tsx
 *
 * Stack.Screen formSheet — Invitar un nuevo miembro al proyecto.
 *
 * Campos:
 *   - Nombre completo (requerido)
 *   - Email (requerido, validación básica)
 *   - Rol (selector: Jefe de Obra, Arquitecto/a, Electricista, Pintor/a,
 *           Fontanero/a, Inspector, Otro)
 *
 * Patrón idéntico a add-note:
 *   1. project/[id].tsx llama inviteMemberStore.open() + router.push()
 *   2. Este modal llama inviteMemberStore.resolve(data) + router.back()
 *
 * Params recibidos:
 *   - projectId: string
 */

import React, {useRef, useState} from "react";
import {KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View,} from "react-native";
import {useLocalSearchParams, useRouter} from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {ModalBody, ModalFooter, ModalHeader, ModalRoot} from "@/components/ui/modal-layout";
import {Button} from "@/components/ui/button";
import {inviteMemberStore} from "@/lib/modal-stores";
import {useColors} from "@/hooks/use-colors";
import {AppInput} from "@/components/ui/app-input";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import * as z from 'zod';

const ROLES = [
    "Jefe de Obra",
    "Arquitecto/a",
    "Electricista",
    "Pintor/a",
    "Fontanero/a",
    "Inspector",
    "Otro",
] as const;

type Role = (typeof ROLES)[number];

const schema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    email: z.string().trim().toLowerCase().email({
        message: "El formato del correo electrónico no es válido"
    }),
});
type FormValues = z.infer<typeof schema>;

export default function InviteMemberModal() {
    const router = useRouter();
    const colors = useColors();
    const params = useLocalSearchParams<{ projectId: string }>();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<Role>("Jefe de Obra");
    const [nameError, setNameError] = useState("");
    const [emailError, setEmailError] = useState("");

    const {control, handleSubmit} = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {name: '', email: ''},
    });

    const emailRef = useRef<TextInput>(null);

    // ── Validation ──────────────────────────────────────────────────────────────

    const validateEmail = (value: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

    const validate = () => {
        let valid = true;
        if (!name.trim()) {
            setNameError("El nombre es obligatorio.");
            valid = false;
        } else {
            setNameError("");
        }
        if (!email.trim()) {
            setEmailError("El email es obligatorio.");
            valid = false;
        } else if (!validateEmail(email)) {
            setEmailError("Introduce un email válido.");
            valid = false;
        } else {
            setEmailError("");
        }
        return valid;
    };

    // ── Actions ─────────────────────────────────────────────────────────────────

    const handleCancel = () => {
        inviteMemberStore.cancel();
        router.back();
    };

    const handleInvite = () => {
        if (!validate()) return;
        inviteMemberStore.resolve({
            projectId: params.projectId ?? "",
            name: name.trim(),
            email: email.trim().toLowerCase(),
            role,
        });
        router.back();
    };

    // ── Render ──────────────────────────────────────────────────────────────────

    return (
        <KeyboardAvoidingView
            style={[S.root]}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
            <ModalRoot>
                <ModalHeader
                    title="Invitar miembro"
                    subtitle="El miembro recibirá una invitación al proyecto"
                    onClose={handleCancel}
                />
                <ModalBody>

                    <AppInput
                        label="Nombre Completo"
                        name="name"
                        control={control}
                        placeholder="Ej: María García"
                        icon="person.fill"
                        autoCapitalize="words"
                        autoCorrect={false}
                    />
                    <AppInput
                        label="Correo electrónico"
                        name="email"
                        control={control}
                        placeholder="Ej: María García"
                        icon="email"
                        autoCapitalize="words"
                        autoCorrect={false}
                    />
                    <View style={S.rolesGrid}>
                        {ROLES.map((r) => {
                            const selected = role === r;
                            return (
                                <TouchableOpacity
                                    key={r}
                                    onPress={() => setRole(r)}
                                    style={[
                                        S.roleChip,
                                        {
                                            backgroundColor: selected ? colors.primary : colors.background,
                                            borderColor: selected ? colors.primary : colors.border,
                                        },
                                    ]}
                                    activeOpacity={0.75}
                                >
                                    <Text
                                        style={[
                                            S.roleChipText,
                                            {color: selected ? "#FFF" : colors.foreground},
                                        ]}
                                    >
                                        {r}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Nota informativa */}
                    <View style={[S.infoBox, {
                        backgroundColor: colors.primary + "12",
                        borderColor: colors.primary + "30"
                    }]}>
                        <MaterialIcons name="info-outline" size={16} color={colors.primary}/>
                        <Text style={[S.infoText, {color: colors.primary}]}>
                            Se enviará un email de invitación a la dirección indicada.
                        </Text>
                    </View>

                </ModalBody>
                <ModalFooter row>
                    <Button
                        title="Cancelar"
                        onPress={handleCancel}
                        variant="ghost"
                        size="md"
                        style={{flex: 1}}
                    />
                    <Button
                        title="Invitar"
                        onPress={handleSubmit(handleInvite)}
                        variant="primary"
                        size="md"
                        leftIcon="person-add"
                        style={{flex: 2}}
                    />
                </ModalFooter>
            </ModalRoot>

        </KeyboardAvoidingView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
    root: {flex: 1},

    label: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 8,
    },

    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 50,
    },
    inputIcon: {marginRight: 10},
    input: {
        flex: 1,
        fontSize: 15,
        height: "100%",
    },

    errorText: {
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },

    rolesGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 4,
    },
    roleChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    roleChipText: {
        fontSize: 13,
        fontWeight: "600",
    },

    infoBox: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8,
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        marginTop: 20,
        marginBottom: 8,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
    },
});
