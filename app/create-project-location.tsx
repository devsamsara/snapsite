import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Image,
  Platform
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { BlurView } from 'expo-blur';
import { AppAlert } from '@/components/ui/app-alert';
import { reverseGeocode } from '@/utils/geo.utils';
import { useQuery } from '@apollo/client';
import { GetMyProjectsDocument } from '@/gql/graphql';

const { width, height } = Dimensions.get('window');

/** Devuelve las iniciales (máx 2 letras) del nombre de un proyecto */
function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** Marcador de proyecto: thumbnail o iniciales */
function ProjectMarker({ name, thumbnail, isNearby, primaryColor, successColor }: {
  name: string;
  thumbnail?: string | null;
  isNearby: boolean;
  primaryColor: string;
  successColor: string;
}) {
  const borderColor = isNearby ? successColor : primaryColor;
  return (
    <View style={mk.container}>
      <View style={[mk.bubble, { borderColor }]}>
        {thumbnail ? (
          <Image source={{ uri: thumbnail }} style={mk.image} />
        ) : (
          <View style={[mk.initials, { backgroundColor: primaryColor + '22' }]}>
            <Text style={[mk.initialsText, { color: primaryColor }]}>
              {getInitials(name)}
            </Text>
          </View>
        )}
      </View>
      <View style={[mk.arrow, { borderTopColor: borderColor }]} />
    </View>
  );
}

const mk = StyleSheet.create({
  container: { alignItems: 'center' },
  bubble: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#FFF', borderWidth: 2, padding: 2, overflow: 'hidden',
  },
  image: { width: '100%', height: '100%', borderRadius: 20 },
  initials: { width: '100%', height: '100%', borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  initialsText: { fontSize: 14, fontWeight: '800' },
  arrow: {
    width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid',
    borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8,
    borderLeftColor: 'transparent', borderRightColor: 'transparent', marginTop: -1,
  },
});

export default function CreateProjectLocationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const mapRef = useRef<MapView>(null);

  const [nearbyProject, setNearbyProject] = useState<any>(null);
  const [region, setRegion] = useState({ latitude: 0, longitude: 0, latitudeDelta: 0.005, longitudeDelta: 0.005 });
  const [selectedLocation, setSelectedLocation] = useState({ latitude: 0, longitude: 0 });
  const [address, setAddress] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [postalCode, setPostalCode] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Proyectos reales del usuario
  const { data: projectsData } = useQuery(GetMyProjectsDocument, { fetchPolicy: 'cache-and-network' });
  const projectsWithCoords = (projectsData?.getMyProjects ?? []).filter(
    (p) => p.latitude != null && p.longitude != null
  );

  // Haversine distance in km
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const checkNearbyProject = (lat: number, lng: number, projects = projectsWithCoords) => {
    let found: any = null;
    for (const proj of projects) {
      if (getDistance(lat, lng, proj.latitude!, proj.longitude!) < 0.05) {
        found = proj;
        break;
      }
    }
    setNearbyProject(found);
  };

  const checkAddr = (addr: any) => {
    if (addr) {
      const fullAddress = `${addr.street || ''} ${addr.streetNumber || ''}, ${addr.postalCode || ''}`;
      setAddress(fullAddress.trim() || t('createProject.unknownLocation'));
      setCity(addr.city || addr.subregion || '');
      setPostalCode(addr.postalCode || '');
    }
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        AppAlert.alert(t('createProject.permissionDenied'), t('createProject.permissionMessage'));
        setLoading(false);
        return;
      }

      await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 5 },
        (loc) => checkNearbyProject(loc.coords.latitude, loc.coords.longitude)
      );

      const currentLocation = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = currentLocation.coords;
      setRegion({ latitude, longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 });
      setSelectedLocation({ latitude, longitude });
      setLoading(false);
      const addr = await reverseGeocode(latitude, longitude);
      checkAddr(addr);
      checkNearbyProject(latitude, longitude);
    })();
  }, []);

  // Re-check when projects load from API
  useEffect(() => {
    if (selectedLocation.latitude !== 0 && projectsWithCoords.length > 0) {
      checkNearbyProject(selectedLocation.latitude, selectedLocation.longitude, projectsWithCoords);
    }
  }, [projectsData]);

  const onRegionChangeComplete = async (newRegion: any) => {
    setSelectedLocation({ latitude: newRegion.latitude, longitude: newRegion.longitude });
    const addr = await reverseGeocode(newRegion.latitude, newRegion.longitude);
    checkAddr(addr);
    checkNearbyProject(newRegion.latitude, newRegion.longitude);
  };

  const handleConfirmLocation = () => {
    router.push({
      pathname: '/create-project-details',
      params: { latitude: selectedLocation.latitude, longitude: selectedLocation.longitude, address, city, postalCode },
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.muted, marginTop: 16 }}>{t('createProject.loadingMap')}</Text>
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
        {projectsWithCoords.map((project) => (
          <Marker
            key={project.id}
            coordinate={{ latitude: project.latitude!, longitude: project.longitude! }}
            title={project.name}
          >
            <ProjectMarker
              name={project.name}
              thumbnail={project.thumbnail}
              isNearby={nearbyProject?.id === project.id}
              primaryColor={colors.primary}
              successColor={colors.success}
            />
          </Marker>
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
          <Text style={styles.headerTitle}>{t('createProject.locationTitle')}</Text>
          <View style={{ width: 40 }} />
        </BlurView>
      </View>

      {/* Bottom Info Card */}
      <View style={styles.bottomCardContainer}>
        <BlurView intensity={95} tint="dark" style={styles.infoCard}>
          <View style={styles.statusRow}>
            <View style={[styles.statusIndicator, { backgroundColor: nearbyProject ? colors.success : colors.muted }]} />
            <Text style={styles.statusLabel}>
              {nearbyProject
                ? t('createProject.nearProject', { name: nearbyProject.name })
                : t('createProject.searchingNearby')}
            </Text>
          </View>
          <View style={styles.addressRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + '30' }]}>
              <IconSymbol name="location.fill" size={20} color={colors.primary} />
            </View>
            <View style={styles.addressTextContainer}>
              <Text style={styles.addressLabel}>{t('createProject.selectedAddress')}</Text>
              <Text style={styles.addressValue} numberOfLines={1}>{address}</Text>
            </View>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={handleConfirmLocation}>
              <Text style={styles.secondaryButtonText}>{t('createProject.newProject')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }, !nearbyProject && styles.btnDisabled]}
              onPress={() => {
                if (nearbyProject) {
                  router.push({ pathname: '/camera-capture', params: { projectId: nearbyProject.id } });
                } else {
                  AppAlert.alert(t('common.error'), t('createProject.noNearbyProject'));
                }
              }}
            >
              <IconSymbol name="camera.fill" size={20} color="#FFF" />
              <Text style={styles.confirmButtonText}>{t('createProject.takePhoto')}</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>

      {/* My Location Button */}
      <TouchableOpacity
        style={styles.myLocationButton}
        onPress={async () => {
          const loc = await Location.getCurrentPositionAsync({});
          mapRef.current?.animateToRegion({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
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
  map: { width, height },
  header: { position: 'absolute', top: 5, width: '100%', paddingTop: Platform.OS === 'ios' ? 50 : 20 },
  headerBlur: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, marginHorizontal: 16, borderRadius: 20, overflow: 'hidden',
  },
  headerTitle: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  centerMarkerContainer: {
    position: 'absolute', top: '50%', left: '50%',
    marginTop: -40, marginLeft: -20, alignItems: 'center', justifyContent: 'center',
  },
  pickerMarker: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4 },
  bottomCardContainer: { position: 'absolute', bottom: 30, width: '100%', paddingHorizontal: 16 },
  infoCard: { borderRadius: 28, padding: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statusRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 12, alignSelf: 'flex-start',
  },
  statusIndicator: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusLabel: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  addressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  addressTextContainer: { flex: 1, marginLeft: 12 },
  addressLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  addressValue: { color: '#FFF', fontSize: 15, fontWeight: '600', marginTop: 2 },
  buttonRow: { flexDirection: 'row', gap: 12 },
  actionButton: { flex: 1, height: 54, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  secondaryButton: { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  secondaryButtonText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  confirmButtonText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  btnDisabled: { opacity: 0.5 },
  myLocationButton: { position: 'absolute', bottom: 260, right: 20, borderRadius: 25, overflow: 'hidden' },
  myLocationBlur: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center' },
});
