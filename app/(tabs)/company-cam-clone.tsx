import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Dimensions } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { captureRef } from 'react-native-view-shot';

// --- DATOS DE EJEMPLO (Tus proyectos en la base de datos) ---
const PROJECTS = [
    { id: '1', name: 'Obra Calle Mayor', lat: 40.4167, lng: -3.7037 }, // Madrid ejemplo
    { id: '2', name: 'Reforma Oficinas', lat: 40.4200, lng: -3.7050 },
];

export default function CompanyCamClone() {
    const [location, setLocation] = useState(null);
    const [nearbyProject, setNearbyProject] = useState(null);
    const [region, setRegion] = useState(null);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

            // Monitorizar ubicación en tiempo real
            await Location.watchPositionAsync(
                { accuracy: Location.Accuracy.High, distanceInterval: 10 },
                (loc) => {
                    const userCoords = loc.coords;
                    setLocation(userCoords);
                    checkNearbyProject(userCoords);

                    if (!region) {
                        setRegion({
                            latitude: userCoords.latitude,
                            longitude: userCoords.longitude,
                            latitudeDelta: 0.005,
                            longitudeDelta: 0.005,
                        });
                    }
                }
            );
        })();
    }, []);

    // Lógica de Geofencing: ¿Estamos a menos de 50 metros de un proyecto?
    const checkNearbyProject = (userCoords) => {
        let found = null;
        PROJECTS.forEach(proj => {
            const distance = getDistance(userCoords.latitude, userCoords.longitude, proj.lat, proj.lng);
            if (distance < 0.05) { // 0.05 km = 50 metros
                found = proj;
            }
        });
        setNearbyProject(found);
    };

    // Función auxiliar Haversine para calcular distancia
    const getDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    };

    const handleTakePhoto = async () => {
        if (!nearbyProject) {
            Alert.alert("Aviso", "No estás cerca de ningún proyecto activo.");
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            // Aquí abrirías tu componente de dibujo pasándole result.assets[0].uri
            // y el ID del nearbyProject para guardarlo vinculado.
            Alert.alert("Foto capturada", `Vinculada a: ${nearbyProject.name}`);
        }
    };

    return (
        <View style={styles.container}>
            {region && (
                <MapView style={styles.map} region={region} showsUserLocation>
                    {PROJECTS.map(proj => (
                        <React.Fragment key={proj.id}>
                            <Marker
                                coordinate={{ latitude: proj.lat, longitude: proj.lng }}
                                title={proj.name}
                                pinColor={nearbyProject?.id === proj.id ? 'green' : 'red'}
                            />
                            <Circle
                                center={{ latitude: proj.lat, longitude: proj.lng }}
                                radius={50}
                                fillColor="rgba(0, 255, 0, 0.1)"
                                strokeColor="green"
                            />
                        </React.Fragment>
                    ))}
                </MapView>
            )}

            {/* Panel Inferior tipo CompanyCam */}
            <View style={styles.bottomSheet}>
                <Text style={styles.statusLabel}>
                    {nearbyProject ? `📍 En: ${nearbyProject.name}` : "Buscando proyecto cercano..."}
                </Text>

                <TouchableOpacity
                    style={[styles.cameraBtn, !nearbyProject && styles.btnDisabled]}
                    onPress={handleTakePhoto}
                >
                    <Text style={styles.btnText}>TOMAR FOTO DE OBRA</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { width: '100%', height: '70%' },
    bottomSheet: {
        height: '30%',
        backgroundColor: '#fff',
        padding: 20,
        alignItems: 'center',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        elevation: 10
    },
    statusLabel: { fontSize: 16, fontWeight: 'bold', marginBottom: 20, color: '#333' },
    cameraBtn: {
        backgroundColor: '#007AFF',
        width: '100%',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center'
    },
    btnDisabled: { backgroundColor: '#ccc' },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});