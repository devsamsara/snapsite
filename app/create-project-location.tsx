import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, Image, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

// Mock data for nearby projects
const NEARBY_PROJECTS = [
  { id: '1', title: 'Roof Repair', latitude: 40.7128, longitude: -74.0060, image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=100&h=100&fit=crop' },
  { id: '2', title: 'Office Renovation', latitude: 40.7150, longitude: -74.0080, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=100&h=100&fit=crop' },
  { id: '3', title: 'Bridge Construction', latitude: 40.7110, longitude: -74.0040, image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=100&h=100&fit=crop' },
  { id: '4', title: 'Parking Lot', latitude: 40.7180, longitude: -74.0100, image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&h=100&fit=crop' },
  { id: '5', title: 'New Deck', latitude: 40.7100, longitude: -74.0120, image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=100&h=100&fit=crop' },
];

export default function CreateProjectLocationScreen() {
  const router = useRouter();
  const colors = useColors();
  const mapRef = useRef<MapView>(null);
  
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState({
    latitude: 40.7128,
    longitude: -74.0060,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: 40.7128,
    longitude: -74.0060,
  });
  const [address, setAddress] = useState<string>('Buscando dirección...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tu ubicación para centrar el mapa.');
        setLoading(false);
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      const newRegion = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
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
        setAddress(fullAddress.trim());
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
          <Marker
            key={project.id}
            coordinate={{ latitude: project.latitude, longitude: project.longitude }}
            title={project.title}
          >
            <View style={styles.markerContainer}>
              <View style={[styles.markerBubble, { borderColor: colors.primary }]}>
                <Image source={{ uri: project.image }} style={styles.markerImage} />
              </View>
              <View style={[styles.markerArrow, { borderTopColor: colors.primary }]} />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Center Picker Marker */}
      <View style={styles.centerMarkerContainer} pointerEvents="none">
        <View style={styles.pickerMarker}>
          <IconSymbol name="mappin.and.ellipse" size={40} color={colors.primary} />
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

      {/* Bottom Info Card */}
      <View style={styles.bottomCardContainer}>
        <BlurView intensity={90} tint="dark" style={styles.infoCard}>
          <View style={styles.addressRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + '30' }]}>
              <IconSymbol name="location.fill" size={20} color={colors.primary} />
            </View>
            <View style={styles.addressTextContainer}>
              <Text style={styles.addressLabel}>Ubicación Seleccionada</Text>
              <Text style={styles.addressValue} numberOfLines={2}>{address}</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.confirmButton, { backgroundColor: colors.primary }]}
            onPress={handleConfirmLocation}
          >
            <Text style={styles.confirmButtonText}>Confirmar Ubicación</Text>
          </TouchableOpacity>
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
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    width: width,
    height: height,
  },
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
  headerTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    borderWidth: 2,
    padding: 2,
    overflow: 'hidden',
  },
  markerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
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
    bottom: 40,
    width: '100%',
    paddingHorizontal: 20,
  },
  infoCard: {
    borderRadius: 24,
    padding: 20,
    overflow: 'hidden',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  addressLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addressValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  confirmButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
  myLocationButton: {
    position: 'absolute',
    bottom: 220,
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
