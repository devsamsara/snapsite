// hooks/use-image-picker.ts
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export const useImagePicker = () => {
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    const requestCameraPermission = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Permiso Requerido',
                'Necesitamos acceso a tu cámara para tomar fotos.',
                [{ text: 'OK' }]
            );
            return false;
        }
        return true;
    };

    const requestGalleryPermission = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Permiso Requerido',
                'Necesitamos acceso a tu galería para seleccionar fotos.',
                [{ text: 'OK' }]
            );
            return false;
        }
        return true;
    };

    const takePhoto = async (): Promise<string | null> => {
        setIsPickerOpen(true);

        const hasPermission = await requestCameraPermission();
        if (!hasPermission) {
            setIsPickerOpen(false);
            return null;
        }

        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                quality: 1,
            });

            setIsPickerOpen(false);

            if (!result.canceled && result.assets && result.assets[0]) {
                return result.assets[0].uri;
            }
            return null;
        } catch (error) {
            console.error("Error taking photo:", error);
            setIsPickerOpen(false);
            return null;
        }
    };

    const pickFromGallery = async (): Promise<string | null> => {
        setIsPickerOpen(true);

        const hasPermission = await requestGalleryPermission();
        if (!hasPermission) {
            setIsPickerOpen(false);
            return null;
        }

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                quality: 1,
            });

            setIsPickerOpen(false);

            if (!result.canceled && result.assets && result.assets[0]) {
                return result.assets[0].uri;
            }
            return null;
        } catch (error) {
            console.error("Error picking image:", error);
            setIsPickerOpen(false);
            return null;
        }
    };

    return {
        takePhoto,
        pickFromGallery,
        isPickerOpen,
    };
};