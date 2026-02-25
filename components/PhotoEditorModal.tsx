// components/PhotoEditorModal.tsx
import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import { Canvas, Path, Skia, useCanvasRef } from '@shopify/react-native-skia';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type DrawingTool = 'pen' | 'marker' | 'pencil' | 'eraser';
type EditMode = 'view' | 'draw' | 'crop' | 'filter';

interface PhotoEditorModalProps {
    visible: boolean;
    photoUri: string;
    onSave: (editedUri: string) => void;
    onDiscard: () => void;
}

const PhotoEditorModal: React.FC<PhotoEditorModalProps> = ({
                                                               visible,
                                                               photoUri,
                                                               onSave,
                                                               onDiscard,
                                                           }) => {
    const canvasRef = useCanvasRef();

    const [editMode, setEditMode] = useState<EditMode>('view');
    const [tool, setTool] = useState<DrawingTool>('pen');
    const [color, setColor] = useState('#FF0000');
    const [paths, setPaths] = useState<any[]>([]);
    const [currentPath, setCurrentPath] = useState<any>(null);

    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#000000', '#FFFFFF'];

    // Guardar foto (con o sin ediciones)
    const handleSave = async () => {
        try {
            let finalUri = photoUri;

            // Si hay dibujos, renderizar canvas y combinar
            if (paths.length > 0) {
                // Aquí combinarías la imagen con el canvas
                // Por ahora guardamos la original
                Alert.alert('Nota', 'Editor de dibujo en desarrollo. Guardando original.');
            }

            onSave(finalUri);
        } catch (error) {
            console.error('Error saving:', error);
            Alert.alert('Error', 'No se pudo guardar');
        }
    };

    // Aplicar filtros/rotación/crop
    const applyEdit = async (action: 'rotate' | 'flip' | 'crop') => {
        try {
            let manipResult;

            switch (action) {
                case 'rotate':
                    manipResult = await ImageManipulator.manipulateAsync(
                        photoUri,
                        [{ rotate: 90 }],
                        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
                    );
                    break;

                case 'flip':
                    manipResult = await ImageManipulator.manipulateAsync(
                        photoUri,
                        [{ flip: ImageManipulator.FlipType.Horizontal }],
                        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
                    );
                    break;

                case 'crop':
                    // Implementar crop interactivo
                    Alert.alert('Crop', 'Función en desarrollo');
                    return;
            }

            if (manipResult) {
                // Actualizar la imagen mostrada
                console.log('Edited:', manipResult.uri);
            }
        } catch (error) {
            console.error('Error editing:', error);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" statusBarTranslucent>
            <View style={styles.container}>
                {/* Imagen */}
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: photoUri }}
                        style={styles.image}
                        resizeMode="contain"
                    />

                    {/* Canvas para dibujar */}
                    {editMode === 'draw' && (
                        <View style={StyleSheet.absoluteFill}>
                            <Canvas
                                ref={canvasRef}
                                style={StyleSheet.absoluteFill}
                                onTouchStart={(e) => {
                                    const { x, y } = e.nativeEvent;
                                    const newPath = Skia.Path.Make();
                                    newPath.moveTo(x, y);
                                    setCurrentPath({ path: newPath, color, tool });
                                }}
                                onTouchMove={(e) => {
                                    if (!currentPath) return;
                                    const { x, y } = e.nativeEvent;
                                    currentPath.path.lineTo(x, y);
                                    canvasRef.current?.redraw();
                                }}
                                onTouchEnd={() => {
                                    if (currentPath) {
                                        setPaths([...paths, currentPath]);
                                        setCurrentPath(null);
                                    }}
                                }
                            >
                                {paths.map((p, i) => (
                                    <Path
                                        key={i}
                                        path={p.path}
                                        color={p.color}
                                        style="stroke"
                                        strokeWidth={p.tool === 'marker' ? 8 : p.tool === 'pen' ? 4 : 2}
                                    />
                                ))}
                                {currentPath && (
                                    <Path
                                        path={currentPath.path}
                                        color={currentPath.color}
                                        style="stroke"
                                        strokeWidth={tool === 'marker' ? 8 : tool === 'pen' ? 4 : 2}
                                    />
                                )}
                            </Canvas>
                        </View>
                    )}
                </View>

                {/* Top Bar */}
                <View style={styles.topBar}>
                    <TouchableOpacity style={styles.topButton} onPress={onDiscard}>
                        <Ionicons name="close" size={32} color="white" />
                    </TouchableOpacity>

                    <Text style={styles.title}>Editar Foto</Text>

                    <TouchableOpacity style={styles.topButton} onPress={handleSave}>
                        <Text style={styles.doneText}>Listo</Text>
                    </TouchableOpacity>
                </View>

                {/* Toolbar */}
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

                {/* Drawing Tools */}
                {editMode === 'draw' && (
                    <View style={styles.drawingTools}>
                        {/* Color Picker */}
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

                        {/* Tool Selector */}
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
                        </View>

                        {/* Actions */}
                        <View style={styles.drawingActions}>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => {
                                    setPaths([]);
                                    setCurrentPath(null);
                                }}
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