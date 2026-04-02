import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, Image, Alert, Platform } from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

// Coordenadas base solicitadas
const BASE_LAT = 37.25807244460694;
const BASE_LNG = -6.943597178738148;

// Mock data for nearby projects around the requested coordinates
const NEARBY_PROJECTS = [
  { id: '1', title: 'Reforma Huelva Centro', latitude: BASE_LAT + 0.001, longitude: BASE_LNG + 0.001, image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=100&h=100&fit=crop' },
  { id: '2', title: 'Instalación Solar El Conquero', latitude: BASE_LAT - 0.0015, longitude: BASE_LNG + 0.0005, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=100&h=100&fit=crop' },
  { id: '3', title: 'Mantenimiento Fachada', latitude: BASE_LAT + 0.0005, longitude: BASE_LNG - 0.002, image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=100&h=100&fit=crop' },
  { id: '4', title: 'Obra Nueva Av. Andalucía', latitude: BASE_LAT - 0.002, longitude: BASE_LNG - 0.001, image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&h=100&fit=crop' },
];

export default function CreateProjectLocationScreen() {
  const router = useRouter();
  const colors = useColors();
  const mapRef = useRef<MapView>(null);
  
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [nearbyProject, setNearbyProject] = useState<any>(null);
  const [region, setRegion] = useState({
    latitude: BASE_LAT,
    longitude: BASE_LNG,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: BASE_LAT,
    longitude: BASE_LNG,
  });
  const [address, setAddress] = useState<string>('Buscando dirección...');
  const [loading, setLoading] = useState(true);

  // Función Haversine para calcular distancia en km
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const checkNearbyProject = (lat: number, lng: number) => {
    let found = null;
    NEARBY_PROJECTS.forEach(proj => {
        const distance = getDistance(lat, lng, proj.latitude, proj.longitude);
        if (distance < 0.05) { // 50 metros
            found = proj;
        }
    });
    setNearbyProject(found);
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tu ubicación.');
        setLoading(false);
        return;
      }

      // Monitorizar ubicación en tiempo real (Geofencing)
      await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 5 },
        (loc) => {
          setLocation(loc);
          checkNearbyProject(loc.coords.latitude, loc.coords.longitude);
        }
      );

      let currentLocation = await Location.getCurrentPositionAsync({});
      const newRegion = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      setRegion(newRegion);
      setSelectedLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
      setLoading(false);
      reverseGeocode(currentLocation.coords.latitude, currentLocation.coords.longitude);
    })();
  }, []);

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const result = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      if (result.length > 0) {
        const addr = result[0];
        const fullAddress = `${addr.street || ''} ${addr.streetNumber || ''}, ${addr.city || ''}, ${addr.region || ''}`;
        setAddress(fullAddress.trim() || 'Ubicación desconocida');
      }
    } catch (e) {
      setAddress('Dirección no encontrada');
    }
  };

  const onRegionChangeComplete = (newRegion: any) => {
    setSelectedLocation({
      latitude: newRegion.latitude,
      longitude: newRegion.longitude,
    });
    reverseGeocode(newRegion.latitude, newRegion.longitude);
    // También chequear proyectos cercanos al mover el picker manual
    checkNearbyProject(newRegion.latitude, newRegion.longitude);
  };

  const handleConfirmLocation = () => {
    router.push({
      pathname: '/create-project-details',
      params: {
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        address: address,
      }
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.muted, marginTop: 16 }}>Cargando mapa...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        onRegionChangeComplete={onRegionChangeComplete}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {NEARBY_PROJECTS.map((project) => (
          <React.Fragment key={project.id}>
            <Marker
              coordinate={{ latitude: project.latitude, longitude: project.longitude }}
              title={project.title}
            >
              <View style={styles.markerContainer}>
                <View style={[styles.markerBubble, { borderColor: nearbyProject?.id === project.id ? colors.success : colors.primary }]}>
                  <Image source={{ uri: project.image }} style={styles.markerImage} />
                </View>
                <View style={[styles.markerArrow, { borderTopColor: nearbyProject?.id === project.id ? colors.success : colors.primary }]} />
              </View>
            </Marker>
            <Circle 
              center={{ latitude: project.latitude, longitude: project.longitude }}
              radius={50}
              fillColor={nearbyProject?.id === project.id ? "rgba(52, 199, 89, 0.15)" : "rgba(0, 122, 255, 0.05)"}
              strokeColor={nearbyProject?.id === project.id ? colors.success : colors.primary}
              strokeWidth={1}
            />
          </React.Fragment>
        ))}
      </MapView>

      {/* Center Picker Marker */}
      <View style={styles.centerMarkerContainer} pointerEvents="none">
        <View style={styles.pickerMarker}>
          <IconSymbol name="mappin.and.ellipse" size={40} color={nearbyProject ? colors.success : colors.primary} />
        </View>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <BlurView intensity={80} tint="dark" style={styles.headerBlur}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ubicación del Proyecto</Text>
          <View style={{ width: 40 }} />
        </BlurView>
      </View>

      {/* Bottom Info Card (CompanyCam Style) */}
      <View style={styles.bottomCardContainer}>
        <BlurView intensity={95} tint="dark" style={styles.infoCard}>
          <View style={styles.statusRow}>
            <View style={[styles.statusIndicator, { backgroundColor: nearbyProject ? colors.success : colors.muted }]} />
            <Text style={styles.statusLabel}>
              {nearbyProject ? `📍 En: ${nearbyProject.title}` : "Buscando proyecto cercano..."}
            </Text>
          </View>

          <View style={styles.addressRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + '30' }]}>
              <IconSymbol name="location.fill" size={20} color={colors.primary} />
            </View>
            <View style={styles.addressTextContainer}>
              <Text style={styles.addressLabel}>Dirección Seleccionada</Text>
              <Text style={styles.addressValue} numberOfLines={1}>{address}</Text>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={handleConfirmLocation}
            >
              <Text style={styles.secondaryButtonText}>NUEVO PROYECTO</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.primary }, !nearbyProject && styles.btnDisabled]}
              onPress={() => {
                if (nearbyProject) {
                  router.push('/camera-capture');
                } else {
                  Alert.alert("Aviso", "No estás cerca de ningún proyecto activo para tomar fotos vinculadas.");
                }
              }}
            >
              <IconSymbol name="camera.fill" size={20} color="#FFF" />
              <Text style={styles.confirmButtonText}>TOMAR FOTO</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>

      {/* My Location Button */}
      <TouchableOpacity 
        style={styles.myLocationButton}
        onPress={async () => {
          let currentLocation = await Location.getCurrentPositionAsync({});
          mapRef.current?.animateToRegion({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          });
        }}
      >
        <BlurView intensity={80} tint="dark" style={styles.myLocationBlur}>
          <IconSymbol name="location.north.fill" size={20} color="#FFF" />
        </BlurView>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  map: { width: width, height: height },
  header: {
    position: 'absolute',
    top: 0,
    width: '100%',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  headerBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  headerTitle: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  centerMarkerContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -40,
    marginLeft: -20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerMarker: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  markerContainer: { alignItems: 'center', justifyContent: 'center' },
  markerBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    borderWidth: 2,
    padding: 2,
    overflow: 'hidden',
  },
  markerImage: { width: '100%', height: '100%', borderRadius: 20 },
  markerArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  bottomCardContainer: {
    position: 'absolute',
    bottom: 30,
    width: '100%',
    paddingHorizontal: 16,
  },
  infoCard: {
    borderRadius: 28,
    padding: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusLabel: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressTextContainer: { flex: 1, marginLeft: 12 },
  addressLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  addressValue: { color: '#FFF', fontSize: 15, fontWeight: '600', marginTop: 2 },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  secondaryButtonText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  confirmButtonText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  btnDisabled: { opacity: 0.5 },
  myLocationButton: {
    position: 'absolute',
    bottom: 260,
    right: 20,
    borderRadius: 25,
    overflow: 'hidden',
  },
  myLocationBlur: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
