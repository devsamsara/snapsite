import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/hooks/use-colors';
import { useCardStyle } from '@/hooks/use-card-style';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BlurView } from 'expo-blur';

// Coordenadas por defecto (Huelva) si el backend no devuelve lat/lng aún
const FALLBACK_LAT = 37.25807244460694;
const FALLBACK_LNG = -6.943597178738148;

export default function LocationMapScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const cardElevation = useCardStyle();
  const mapRef = useRef<MapView>(null);

  const params = useLocalSearchParams<{
    id: string;
    name: string;
    lastVisit: string;
    projectsCount: string;
    latitude: string;
    longitude: string;
  }>();

  const lat = params.latitude ? parseFloat(params.latitude) : FALLBACK_LAT;
  const lng = params.longitude ? parseFloat(params.longitude) : FALLBACK_LNG;
  const name = params.name ?? '';
  const lastVisit = params.lastVisit ?? '';
  const projectsCount = params.projectsCount ? parseInt(params.projectsCount, 10) : 0;

  const region = {
    latitude: lat,
    longitude: lng,
    latitudeDelta: 0.008,
    longitudeDelta: 0.008,
  };

  useEffect(() => {
    // Pequeño delay para que el mapa esté montado antes de animar
    const timer = setTimeout(() => {
      mapRef.current?.animateToRegion(region, 600);
    }, 300);
    return () => clearTimeout(timer);
  }, [lat, lng]);

  const handleOpenMaps = () => {
    const label = encodeURIComponent(name);
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
    });
    if (url) Linking.openURL(url);
  };

  return (
    <View style={S.container}>
      {/* Mapa a pantalla completa */}
      <MapView
        ref={mapRef}
        style={S.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
      >
        <Marker
          coordinate={{ latitude: lat, longitude: lng }}
          title={name}
          description={lastVisit}
        />
      </MapView>

      {/* Botón volver */}
      <TouchableOpacity
        style={[S.backBtn, { backgroundColor: colors.surface }]}
        onPress={() => router.back()}
        activeOpacity={0.8}
      >
        <IconSymbol name="chevron.left" size={20} color={colors.foreground} />
      </TouchableOpacity>

      {/* Card inferior con datos de la ubicación */}
      <BlurView
        intensity={Platform.OS === 'ios' ? 60 : 80}
        tint={colors.background === '#0F172A' ? 'dark' : 'light'}
        style={S.cardBlur}
      >
        <View style={[S.card, cardElevation]}>
          {/* Cabecera de la card */}
          <View style={S.cardHeader}>
            <View style={[S.iconCircle, { backgroundColor: colors.primary + '20' }]}>
              <IconSymbol name="location.fill" size={22} color={colors.primary} />
            </View>
            <View style={S.cardTitleBlock}>
              <Text
                style={[S.cardTitle, { color: colors.foreground }]}
                numberOfLines={1}
              >
                {name}
              </Text>
              <Text style={[S.cardSubtitle, { color: colors.muted }]}>
                {lastVisit}
              </Text>
            </View>
          </View>

          {/* Separador */}
          <View style={[S.divider, { backgroundColor: colors.border }]} />

          {/* Fila de metadatos */}
          <View style={S.metaRow}>
            {/* Coordenadas */}
            <View style={S.metaItem}>
              <IconSymbol name="mappin.and.ellipse" size={14} color={colors.muted} />
              <Text style={[S.metaText, { color: colors.muted }]} numberOfLines={1}>
                {lat.toFixed(5)}, {lng.toFixed(5)}
              </Text>
            </View>
            {/* Proyectos */}
            <View style={S.metaItem}>
              <IconSymbol name="folder.fill" size={14} color={colors.muted} />
              <Text style={[S.metaText, { color: colors.muted }]}>
                {projectsCount} {t('home.projects')}
              </Text>
            </View>
          </View>

          {/* Botón abrir en Maps */}
          <TouchableOpacity
            style={[S.openMapsBtn, { backgroundColor: colors.primary }]}
            onPress={handleOpenMaps}
            activeOpacity={0.85}
          >
            <IconSymbol name="map.fill" size={16} color="#FFFFFF" />
            <Text style={S.openMapsBtnText}>
              {t('locationMap.openInMaps')}
            </Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </View>
  );
}

const S = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  // ── Botón volver ──
  backBtn: {
    position: 'absolute',
    top: 56,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  // ── Card inferior ──
  cardBlur: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  card: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleBlock: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  metaText: {
    fontSize: 12,
    flex: 1,
  },
  openMapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 12,
    marginTop: 4,
  },
  openMapsBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
