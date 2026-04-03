/**
 * modals/project-settings.tsx
 *
 * Stack.Screen formSheet — Configuración / menú del proyecto.
 *
 * Secciones:
 *   - Info del proyecto (nombre + ubicación)
 *   - Acciones rápidas: Editar, Compartir, Exportar
 *   - Gestión: Contacto, Etiquetas, Descripción, Colaboradores
 *   - Zona de peligro: Archivar, Eliminar
 *
 * Params recibidos:
 *   - projectId: string
 *   - projectName: string
 *   - projectLocation: string
 */

import React from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {useLocalSearchParams, useRouter} from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {ModalBody, ModalHeader, ModalRoot} from "@/components/ui/modal-layout";
import {useColors} from "@/hooks/use-colors";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ActionRow {
    icon: string;
    label: string;
    description?: string;
    onPress: () => void;
    color?: string;
    showChevron?: boolean;
}

// ─── Sub-componente: fila de acción ──────────────────────────────────────────

function ActionItem({icon, label, description, onPress, color, showChevron = true}: ActionRow) {
    const colors = useColors();
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[S.actionRow, {borderBottomColor: colors.border}]}
            activeOpacity={0.65}
        >
            <View style={[S.actionIcon, {backgroundColor: (color ?? colors.primary) + "18"}]}>
                <MaterialIcons name={icon as any} size={20} color={color ?? colors.primary}/>
            </View>
            <View style={S.actionText}>
                <Text style={[S.actionLabel, {color: color ?? colors.foreground}]}>{label}</Text>
                {!!description && (
                    <Text style={[S.actionDesc, {color: colors.muted}]}>{description}</Text>
                )}
            </View>
            {showChevron && (
                <MaterialIcons name="chevron-right" size={20} color={colors.muted}/>
            )}
        </TouchableOpacity>
    );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ProjectSettingsModal() {
    const router = useRouter();
    const colors = useColors();
    const {projectId, projectName, projectLocation} =
        useLocalSearchParams<{ projectId: string; projectName: string; projectLocation: string }>();

    const handleClose = () => router.back();

    const handleEdit = () => {
        router.back();
        // TODO: navegar a pantalla de edición del proyecto
        Alert.alert("Editar proyecto", "Próximamente podrás editar los datos del proyecto.");
    };

    const handleShare = () => {
        Alert.alert("Compartir", "Próximamente podrás compartir el proyecto.");
    };

    const handleExport = () => {
        Alert.alert("Exportar", "Próximamente podrás exportar el informe del proyecto.");
    };

    const handleContacts = () => {
        Alert.alert("Contactos", "Próximamente podrás gestionar los contactos del proyecto.");
    };

    const handleTags = () => {
        Alert.alert("Etiquetas", "Próximamente podrás gestionar las etiquetas del proyecto.");
    };

    const handleDescription = () => {
        Alert.alert("Descripción", "Próximamente podrás editar la descripción del proyecto.");
    };

    const handleCollaborators = () => {
        Alert.alert("Colaboradores", "Próximamente podrás gestionar los colaboradores.");
    };

    const handleArchive = () => {
        Alert.alert(
            "Archivar proyecto",
            "El proyecto se moverá al archivo. Podrás restaurarlo en cualquier momento.",
            [
                {text: "Cancelar", style: "cancel"},
                {
                    text: "Archivar",
                    style: "default",
                    onPress: () => {
                        router.back();
                        // TODO: llamar API de archivar
                    },
                },
            ]
        );
    };

    const handleDelete = () => {
        Alert.alert(
            "Eliminar proyecto",
            `¿Estás seguro de que quieres eliminar "${projectName}"? Esta acción no se puede deshacer.`,
            [
                {text: "Cancelar", style: "cancel"},
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: () => {
                        router.back();
                        // TODO: llamar API de eliminar y navegar atrás
                    },
                },
            ]
        );
    };

    console.log(colors.background)
    return (
        <KeyboardAvoidingView
            style={S.root}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
        >
            <ModalRoot>
                <ModalHeader
                    title="Configuración"
                    subtitle={projectName ?? "Proyecto"}
                    onClose={handleClose}
                />

                <ModalBody>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{paddingBottom: 50}}
                    >
                        <View style={[S.infoBox, {backgroundColor: colors.surface, borderColor: colors.border}]}>
                            <View style={[S.infoIcon, {backgroundColor: colors.primary + "18"}]}>
                                <MaterialIcons name="folder" size={22} color={colors.primary}/>
                            </View>
                            <View style={{flex: 1}}>
                                <Text style={[S.infoName, {color: colors.foreground}]} numberOfLines={1}>
                                    {projectName ?? "Proyecto"}
                                </Text>
                                {!!projectLocation && (
                                    <View style={{flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2}}>
                                        <MaterialIcons name="location-on" size={12} color={colors.muted}/>
                                        <Text style={[S.infoLoc, {color: colors.muted}]} numberOfLines={1}>
                                            {projectLocation}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        <Text style={[S.sectionTitle, {color: colors.muted}]}>ACCIONES</Text>
                        <View style={[S.section, {backgroundColor: colors.surface, borderColor: colors.border}]}>
                            <ActionItem icon="edit" label="Editar proyecto" description="Nombre, fechas y estado"
                                        onPress={handleEdit}/>
                            <ActionItem icon="share" label="Compartir" description="Enviar enlace del proyecto"
                                        onPress={handleShare}/>
                            <ActionItem icon="picture-as-pdf" label="Exportar informe"
                                        description="PDF con fotos y notas" onPress={handleExport} showChevron={false}/>
                        </View>

                        <Text style={[S.sectionTitle, {color: colors.muted}]}>GESTIÓN</Text>
                        <View style={[S.section, {backgroundColor: colors.surface, borderColor: colors.border}]}>
                            <ActionItem icon="contacts" label="Contactos" description="Clientes y proveedores"
                                        onPress={handleContacts}/>
                            <ActionItem icon="label" label="Etiquetas" description="Categorías del proyecto"
                                        onPress={handleTags}/>
                            <ActionItem icon="description" label="Descripción" description="Detalles del proyecto"
                                        onPress={handleDescription}/>
                            <ActionItem icon="group-add" label="Colaboradores" description="Gestionar accesos"
                                        onPress={handleCollaborators} showChevron={false}/>
                        </View>

                        <Text style={[S.sectionTitle, {color: colors.muted}]}>ZONA DE PELIGRO</Text>
                        <View style={[S.section, {backgroundColor: colors.surface, borderColor: colors.border}]}>
                            <ActionItem
                                icon="archive"
                                label="Archivar proyecto"
                                description="Mover al archivo sin eliminar"
                                onPress={handleArchive}
                                color={colors.warning}
                                showChevron={false}
                            />
                            <ActionItem
                                icon="delete-forever"
                                label="Eliminar proyecto"
                                description="Esta acción no se puede deshacer"
                                onPress={handleDelete}
                                color={colors.error}
                                showChevron={false}
                            />
                        </View>
                    </ScrollView>
                </ModalBody>
            </ModalRoot>
        </KeyboardAvoidingView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
    root: {flex: 1},

    infoBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        marginTop: 12,
        marginBottom: 8,
        borderRadius: 14,
        borderWidth: 1,
        padding: 14,
    },
    infoIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    infoName: {
        fontSize: 15,
        fontWeight: "700",
    },
    infoLoc: {
        fontSize: 12,
    },

    sectionTitle: {
        fontSize: 12,
        fontWeight: "600",
        letterSpacing: 0.5,
        marginTop: 20,
        marginBottom: 6,
    },

    section: {
        borderRadius: 14,
        borderWidth: 1,
        overflow: "hidden",
    },

    actionRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 13,
        borderBottomWidth: StyleSheet.hairlineWidth,
        gap: 14,
    },
    actionIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    actionText: {flex: 1},
    actionLabel: {
        fontSize: 15,
        fontWeight: "500",
    },
    actionDesc: {
        fontSize: 12,
        marginTop: 1,
    },
});
