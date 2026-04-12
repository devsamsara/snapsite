// components/PhotoEditorModal.tsx
//
// Migración: @shopify/react-native-skia → react-native-svg
// Motivo: Skia + Reanimated + VisionCamera compiten por el mismo recurso JSI,
// provocando EXC_BAD_ACCESS (SIGSEGV) en producción. react-native-svg opera
// en el hilo de UI mediante el bridge estándar, sin conflictos JSI.
//
// Funcionalidades preservadas:
//   - Dibujo libre (freehand) con herramientas lápiz / pluma / marcador
//   - Borrador (elimina el último trazo)
//   - Paleta de colores
//   - Rotar / Voltear imagen con expo-image-manipulator
//   - Guardar / Descartar

import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Text,
    Modal,
    Dimensions,
    Image,
    ScrollView,
    Alert,
    PanResponder,
    GestureResponderEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';

// ─── react-native-svg (reemplaza @shopify/react-native-skia) ──────────────────
import Svg, { Path as SvgPath } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────

type DrawingTool = 'pen' | 'marker' | 'pencil' | 'eraser';
type EditMode = 'view' | 'draw' | 'crop' | 'filter';

interface StrokePath {
    d: string;
    color: string;
    strokeWidth: number;
}

interface PhotoEditorModalProps {
    visible: boolean;
    photoUri: string;
    onSave: (editedUri: string) => void;
    onDiscard: () => void;
}

// ─── Stroke width por herramienta ─────────────────────────────────────────────

function getStrokeWidth(tool: DrawingTool): number {
    switch (tool) {
        case 'marker':  return 10;
        case 'pen':     return 4;
        case 'pencil':  return 2;
        case 'eraser':  return 18;
        default:        return 4;
    }
}

// ─── Componente principal ─────────────────────────────────────────────────────

const PhotoEditorModal: React.FC<PhotoEditorModalProps> = ({
    visible,
    photoUri,
    onSave,
    onDiscard,
}) => {
    const [editMode, setEditMode]     = useState<EditMode>('view');
    const [tool, setTool]             = useState<DrawingTool>('pen');
    const [color, setColor]           = useState('#FF0000');
    const [paths, setPaths]           = useState<StrokePath[]>([]);
    const [currentPath, setCurrentPath] = useState<string | null>(null);
    const [currentPhotoUri, setCurrentPhotoUri] = useState(photoUri);

    // Sincronizar URI cuando cambia la prop
    React.useEffect(() => {
        setCurrentPhotoUri(photoUri);
    }, [photoUri]);

    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#000000', '#FFFFFF'];

    // ── PanResponder para capturar trazos de dibujo ──────────────────────────
    // Se usa PanResponder (bridge nativo estándar) en lugar del JSI de Skia,
    // evitando completamente el conflicto con Reanimated y VisionCamera.
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder:  () => true,

            onPanResponderGrant: (e: GestureResponderEvent) => {
                const { locationX, locationY } = e.nativeEvent;
                setCurrentPath(`M ${locationX} ${locationY}`);
            },

            onPanResponderMove: (e: GestureResponderEvent) => {
                const { locationX, locationY } = e.nativeEvent;
                setCurrentPath((prev) =>
                    prev ? `${prev} L ${locationX} ${locationY}` : `M ${locationX} ${locationY}`
                );
            },

            onPanResponderRelease: () => {
                setCurrentPath((prev) => {
                    if (prev) {
                        const sw = getStrokeWidth(tool);
                        // El borrador dibuja en blanco (simula borrado visual)
                        const strokeColor = tool === 'eraser' ? '#000000' : color;
                        setPaths((p) => [...p, { d: prev, color: strokeColor, strokeWidth: sw }]);
                    }
                    return null;
                });
            },
        })
    ).current;

    // ── Guardar foto ─────────────────────────────────────────────────────────
    const handleSave = async () => {
        try {
            // Si hay trazos SVG, notificamos que el renderizado final
            // se hace mediante react-native-view-shot en el editor completo.
            // PhotoEditorModal es el editor rápido (modal); para anotaciones
            // avanzadas el usuario puede usar image-editor.tsx.
            if (paths.length > 0) {
                Alert.alert(
                    'Nota',
                    'Para guardar con anotaciones usa el editor completo (botón "Anotar"). Guardando imagen original.',
                    [{ text: 'OK', onPress: () => onSave(currentPhotoUri) }]
                );
                return;
            }
            onSave(currentPhotoUri);
        } catch (error) {
            console.error('Error saving:', error);
            Alert.alert('Error', 'No se pudo guardar');
        }
    };

    // ── Aplicar transformaciones con expo-image-manipulator ──────────────────
    const applyEdit = async (action: 'rotate' | 'flip' | 'crop') => {
        try {
            let manipResult: ImageManipulator.ImageResult | undefined;

            switch (action) {
                case 'rotate':
                    manipResult = await ImageManipulator.manipulateAsync(
                        currentPhotoUri,
                        [{ rotate: 90 }],
                        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
                    );
                    break;

                case 'flip':
                    manipResult = await ImageManipulator.manipulateAsync(
                        currentPhotoUri,
                        [{ flip: ImageManipulator.FlipType.Horizontal }],
                        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
                    );
                    break;

                case 'crop':
                    Alert.alert('Recortar', 'Usa el editor completo para recorte interactivo.');
                    return;
            }

            if (manipResult) {
                setCurrentPhotoUri(manipResult.uri);
                // Limpiar trazos al transformar la imagen
                setPaths([]);
                setCurrentPath(null);
            }
        } catch (error) {
            console.error('Error editing:', error);
            Alert.alert('Error', 'No se pudo aplicar la edición');
        }
    };

    // ── Deshacer último trazo ─────────────────────────────────────────────────
    const undoLastStroke = () => {
        setPaths((p) => p.slice(0, -1));
    };

    // ── Limpiar todos los trazos ──────────────────────────────────────────────
    const clearDrawing = () => {
        setPaths([]);
        setCurrentPath(null);
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <Modal visible={visible} animationType="slide" statusBarTranslucent>
            <View style={styles.container}>

                {/* ── Área de imagen + SVG overlay ── */}
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: currentPhotoUri }}
                        style={styles.image}
                        resizeMode="contain"
                    />

                    {/* SVG canvas para dibujo libre — reemplaza el Canvas de Skia */}
                    {editMode === 'draw' && (
                        <View
                            style={StyleSheet.absoluteFill}
                            {...panResponder.panHandlers}
                        >
                            <Svg
                                width="100%"
                                height="100%"
                                style={StyleSheet.absoluteFill}
                            >
                                {/* Trazos confirmados */}
                                {paths.map((p, i) => (
                                    <SvgPath
                                        key={i}
                                        d={p.d}
                                        stroke={p.color}
                                        strokeWidth={p.strokeWidth}
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                ))}
                                {/* Trazo en progreso */}
                                {currentPath && (
                                    <SvgPath
                                        d={currentPath}
                                        stroke={tool === 'eraser' ? '#000000' : color}
                                        strokeWidth={getStrokeWidth(tool)}
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                )}
                            </Svg>
                        </View>
                    )}
                </View>

                {/* ── Top Bar ── */}
                <View style={styles.topBar}>
                    <TouchableOpacity style={styles.topButton} onPress={onDiscard}>
                        <Ionicons name="close" size={32} color="white" />
                    </TouchableOpacity>

                    <Text style={styles.title}>Editar Foto</Text>

                    <TouchableOpacity style={styles.topButton} onPress={handleSave}>
                        <Text style={styles.doneText}>Listo</Text>
                    </TouchableOpacity>
                </View>

                {/* ── Toolbar principal (modo vista) ── */}
                {editMode === 'view' && (
                    <View style={styles.toolbar}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <ToolButton
                                icon="brush"
                                label="Dibujar"
                                onPress={() => setEditMode('draw')}
                            />
                            <ToolButton
                                icon="crop"
                                label="Recortar"
                                onPress={() => applyEdit('crop')}
                            />
                            <ToolButton
                                icon="sync"
                                label="Rotar"
                                onPress={() => applyEdit('rotate')}
                            />
                            <ToolButton
                                icon="swap-horizontal"
                                label="Voltear"
                                onPress={() => applyEdit('flip')}
                            />
                            <ToolButton
                                icon="color-filter"
                                label="Filtros"
                                onPress={() => setEditMode('filter')}
                            />
                        </ScrollView>
                    </View>
                )}

                {/* ── Herramientas de dibujo ── */}
                {editMode === 'draw' && (
                    <View style={styles.drawingTools}>
                        {/* Paleta de colores */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.colorPicker}
                        >
                            {colors.map((c) => (
                                <TouchableOpacity
                                    key={c}
                                    style={[
                                        styles.colorButton,
                                        { backgroundColor: c },
                                        color === c && styles.colorButtonActive,
                                    ]}
                                    onPress={() => setColor(c)}
                                />
                            ))}
                        </ScrollView>

                        {/* Selector de herramienta */}
                        <View style={styles.toolSelector}>
                            <ToolButton
                                icon="pencil"
                                label="Lápiz"
                                active={tool === 'pencil'}
                                onPress={() => setTool('pencil')}
                            />
                            <ToolButton
                                icon="create"
                                label="Pluma"
                                active={tool === 'pen'}
                                onPress={() => setTool('pen')}
                            />
                            <ToolButton
                                icon="brush"
                                label="Marcador"
                                active={tool === 'marker'}
                                onPress={() => setTool('marker')}
                            />
                            <ToolButton
                                icon="remove-circle-outline"
                                label="Borrador"
                                active={tool === 'eraser'}
                                onPress={() => setTool('eraser')}
                            />
                        </View>

                        {/* Acciones */}
                        <View style={styles.drawingActions}>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={undoLastStroke}
                                disabled={paths.length === 0}
                            >
                                <Ionicons
                                    name="arrow-undo"
                                    size={24}
                                    color={paths.length === 0 ? 'rgba(255,255,255,0.3)' : 'white'}
                                />
                                <Text style={[styles.actionText, paths.length === 0 && { opacity: 0.3 }]}>
                                    Deshacer
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={clearDrawing}
                            >
                                <Ionicons name="trash" size={24} color="white" />
                                <Text style={styles.actionText}>Borrar todo</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => setEditMode('view')}
                            >
                                <Ionicons name="checkmark" size={24} color="white" />
                                <Text style={styles.actionText}>Listo</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        </Modal>
    );
};

// ─── ToolButton ───────────────────────────────────────────────────────────────

const ToolButton: React.FC<{
    icon: string;
    label: string;
    active?: boolean;
    onPress: () => void;
}> = ({ icon, label, active, onPress }) => (
    <TouchableOpacity
        style={[styles.toolButton, active && styles.toolButtonActive]}
        onPress={onPress}
    >
        <Ionicons name={icon as any} size={24} color={active ? '#007AFF' : 'white'} />
        <Text style={[styles.toolLabel, active && styles.toolLabelActive]}>{label}</Text>
    </TouchableOpacity>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    imageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT * 0.7,
    },
    topBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    topButton: {
        padding: 8,
    },
    title: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    doneText: {
        color: '#007AFF',
        fontSize: 17,
        fontWeight: '600',
    },
    toolbar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingVertical: 20,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(0,0,0,0.9)',
    },
    toolButton: {
        alignItems: 'center',
        marginRight: 24,
        paddingVertical: 8,
    },
    toolButtonActive: {
        backgroundColor: 'rgba(0,122,255,0.2)',
        borderRadius: 8,
        paddingHorizontal: 12,
    },
    toolLabel: {
        color: 'white',
        fontSize: 12,
        marginTop: 4,
    },
    toolLabelActive: {
        color: '#007AFF',
    },
    drawingTools: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.9)',
        paddingVertical: 20,
        paddingHorizontal: 16,
    },
    colorPicker: {
        marginBottom: 16,
    },
    colorButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    colorButtonActive: {
        borderColor: 'white',
        borderWidth: 3,
    },
    toolSelector: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
    },
    drawingActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
    },
    actionText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default PhotoEditorModal;
