/**
 * modals/edit-project.tsx
 *
 * formSheet modal — Editar datos del proyecto.
 *
 * Campos: nombre, ubicación (mapa interactivo), estado, progreso (slider), fecha inicio, fecha fin
 * Validación: Zod + react-hook-form + AppInput
 *
 * Params recibidos:
 *   - projectId: string
 *   - projectName: string
 *   - projectLocation: string
 *   - projectLatitude: string
 *   - projectLongitude: string
 *   - projectStatus: string  ("active" | "paused" | "completed" | "cancelled")
 *   - projectStartDate: string  (timestamp ms como string)
 *   - projectEndDate: string    (timestamp ms como string)
 *   - projectProgress: string   (0-100 como string)
 */
import { PressableScale } from '@/components/ui/pressable-scale';
import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useMutation } from '@apollo/client/react';

import {
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalRoot,
} from '@/components/ui/modal-layout';
import { AppInput } from '@/components/ui/app-input';
import { useColors } from '@/hooks/use-colors';
import { AppAlert } from '@/components/ui/app-alert';
import {
  UpdateProjectDocument,
  FindProjectDocument,
  GetMyProjectsDocument,
} from '@/gql/graphql';

import MapView, { Marker } from 'react-native-maps';
import { reverseGeocode } from '@/utils/geo.utils';
import { Button } from '@/components/ui/button';

const mapsAvailable = true;

// ─── Helpers ─────────────────────────────────────────────────────────────────
/** Convierte timestamp ms (string) → "DD/MM/YYYY". Devuelve "" si inválido. */
function tsToDate(ts: string | undefined): string {
  if (!ts) return '';
  const n = Number(ts);
  if (!n) return '';
  const d = new Date(n);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** Convierte "DD/MM/YYYY" → timestamp ms (number). Devuelve null si inválido. */
function dateToTs(s: string): number | null {
  if (!s) return null;
  const [dd, mm, yyyy] = s.split('/');
  if (!dd || !mm || !yyyy) return null;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (Number.isNaN(d.getTime())) return null;
  return d.getTime();
}

// ─── Status options ───────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'active', icon: 'play-circle-filled', color: '#10B981' },
  { value: 'paused', icon: 'pause-circle-filled', color: '#F59E0B' },
  { value: 'completed', icon: 'check-circle', color: '#2563EB' },
  { value: 'cancelled', icon: 'cancel', color: '#EF4444' },
  { value: 'archived', icon: 'folder', color: '#827878' },
] as const;

type StatusValue = (typeof STATUS_OPTIONS)[number]['value'];

// ─── Zod schema ───────────────────────────────────────────────────────────────

function buildSchema(t: (k: string) => string) {
  const dateRegex = /^(\d{2}\/\d{2}\/\d{4})?$/;
  return z.object({
    name: z
      .string()
      .min(1, t('editProject.errorName'))
      .min(3, t('editProject.errorNameMin'))
      .max(80, t('editProject.errorNameMax')),
    startDate: z
      .string()
      .regex(dateRegex, t('editProject.errorDateFormat'))
      .optional()
      .or(z.literal('')),
    endDate: z
      .string()
      .regex(dateRegex, t('editProject.errorDateFormat'))
      .optional()
      .or(z.literal('')),
  });
}

// ─── Progress slider ──────────────────────────────────────────────────────────
// Mismo patrón probado que los sliders de ajuste: PanResponder creado UNA SOLA
// VEZ con useRef, y refs para value/onChange para evitar closures obsoletos.
// El ancho del track se mide con onLayout, así no depende de paddings del padre.

const PROGRESS_THUMB = 24;

interface ProgressSliderProps {
  value: number; // 0–100
  onChange: (v: number) => void;
  trackColor: string;
  fillColor: string;
}

function ProgressSlider({
  value,
  onChange,
  trackColor,
  fillColor,
}: ProgressSliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);

  const valueRef = useRef(value);
  const trackWidthRef = useRef(trackWidth);
  const startPxRef = useRef(0);
  const onChangeRef = useRef(onChange);

  valueRef.current = value;
  trackWidthRef.current = trackWidth;
  onChangeRef.current = onChange;

  const clamp = (v: number, lo: number, hi: number) =>
    Math.min(Math.max(v, lo), hi);
  const toPos = (v: number) => (v / 100) * trackWidthRef.current;
  const toVal = (px: number) =>
    trackWidthRef.current
      ? clamp(Math.round((px / trackWidthRef.current) * 100), 0, 100)
      : 0;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,

      onPanResponderGrant: () => {
        startPxRef.current = toPos(valueRef.current);
      },
      onPanResponderMove: (_, gs) => {
        if (!trackWidthRef.current) return;
        const newPx = clamp(
          startPxRef.current + gs.dx,
          0,
          trackWidthRef.current
        );
        onChangeRef.current(toVal(newPx));
      },
    })
  ).current;

  const fillPx = trackWidth ? toPos(value) : 0;
  const thumbLeft = clamp(
    fillPx - PROGRESS_THUMB / 2,
    0,
    Math.max(trackWidth - PROGRESS_THUMB, 0)
  );

  return (
    <View
      style={PS.track}
      onLayout={e => setTrackWidth(e.nativeEvent.layout.width)}
      {...pan.panHandlers}
    >
      <View style={[PS.trackBg, { backgroundColor: trackColor }]} />
      <View
        style={[PS.trackFill, { width: fillPx, backgroundColor: fillColor }]}
      />
      <View style={[PS.thumb, { left: thumbLeft, borderColor: fillColor }]} />
    </View>
  );
}

const PS = StyleSheet.create({
  track: {
    height: PROGRESS_THUMB + 14,
    justifyContent: 'center',
  },
  trackBg: {
    height: 6,
    borderRadius: 3,
    width: '100%',
  },
  trackFill: {
    position: 'absolute',
    height: 6,
    borderRadius: 3,
  },
  thumb: {
    position: 'absolute',
    width: PROGRESS_THUMB,
    height: PROGRESS_THUMB,
    borderRadius: PROGRESS_THUMB / 2,
    backgroundColor: '#FFF',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function EditProjectModal() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();

  const {
    projectId,
    projectName,
    projectLocation,
    projectLatitude,
    projectLongitude,
    projectStatus,
    projectStartDate,
    projectEndDate,
    projectProgress,
  } = useLocalSearchParams<{
    projectId: string;
    projectName: string;
    projectLocation: string;
    projectLatitude: string;
    projectLongitude: string;
    projectStatus: string;
    projectStartDate: string;
    projectEndDate: string;
    projectProgress: string;
  }>();

  const [status, setStatus] = useState<StatusValue>(
    (projectStatus as StatusValue) ?? 'active'
  );
  const [isSaving, setIsSaving] = useState(false);

  // ── Progreso ───────────────────────────────────────────────────────────────
  const [progress, setProgress] = useState<number>(() => {
    const n = Number.parseInt(projectProgress ?? '', 10);
    return Number.isNaN(n) ? 0 : Math.min(Math.max(n, 0), 100);
  });

  // ── Ubicación ──────────────────────────────────────────────────────────────
  const initLat = projectLatitude
    ? Number.parseFloat(projectLatitude)
    : 40.4168;
  const initLng = projectLongitude
    ? Number.parseFloat(projectLongitude)
    : -3.7038;
  const [locationLabel, setLocationLabel] = useState(projectLocation ?? '');
  const [coords, setCoords] = useState({ lat: initLat, lng: initLng });
  const [mapVisible, setMapVisible] = useState(false);
  const [tempCoords, setTempCoords] = useState({ lat: initLat, lng: initLng });

  // ── GraphQL ────────────────────────────────────────────────────────────────
  const [updateProject] = useMutation(UpdateProjectDocument, {
    refetchQueries: [FindProjectDocument, GetMyProjectsDocument],
  });

  const EditFormSchema = buildSchema(t);
  type EditFormType = z.infer<typeof EditFormSchema>;

  const { control, handleSubmit } = useForm<EditFormType>({
    resolver: zodResolver(EditFormSchema),
    defaultValues: {
      name: projectName ?? '',
      startDate: tsToDate(projectStartDate),
      endDate: tsToDate(projectEndDate),
    },
  });

  const onSubmit = async (data: z.infer<typeof EditFormSchema>) => {
    setIsSaving(true);
    try {
      await updateProject({
        variables: {
          id: projectId,
          input: {
            name: data.name,
            location: locationLabel,
            latitude: coords.lat,
            longitude: coords.lng,
            status,
            progress,
            startDate: data.startDate
              ? String(dateToTs(data.startDate))
              : undefined,
            endDate: data.endDate ? String(dateToTs(data.endDate)) : undefined,
          },
        },
      });
      AppAlert.alert(
        t('editProject.successTitle'),
        t('editProject.successMsg')
      );
      router.back();
    } catch {
      AppAlert.alert(t('common.error'), t('common.tryAgain'));
    } finally {
      setIsSaving(false);
    }
  };

  const openMap = () => {
    setTempCoords(coords);
    setMapVisible(true);
  };

  const confirmLocation = async () => {
    setCoords(tempCoords);
    setMapVisible(false);
    const addr = await reverseGeocode(tempCoords.lat, tempCoords.lng);
    checkAddr(addr);
  };

  const checkAddr = (addr: any) => {
    if (addr) {
      const fullAddress = `${addr.street || ''} ${addr.streetNumber || ''}, ${addr.postalCode || ''}`;
      setLocationLabel(fullAddress);
    }
  };
  return (
    <KeyboardAvoidingView
      style={S.flex1}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
    >
      <ModalRoot>
        <ModalHeader
          title={t('editProject.title')}
          subtitle={t('editProject.subtitle')}
          onClose={() => router.back()}
        />

        <ModalBody>
          <ScrollView
            contentContainerStyle={S.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Name ── */}
            <AppInput
              name="name"
              control={control}
              label={t('editProject.name')}
              placeholder={t('editProject.namePlaceholder')}
              autoCapitalize="words"
              returnKeyType="next"
              maxLength={80}
              showLength
            />

            {/* ── Location (mapa interactivo) ── */}
            <View style={S.fieldGroup}>
              <Text style={[S.label, { color: colors.foreground }]}>
                {t('editProject.location')}
              </Text>
              <PressableScale
                style={[
                  S.locationBtn,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={openMap}
              >
                <MaterialIcons
                  name="location-on"
                  size={20}
                  color={colors.primary}
                />
                <Text
                  style={[
                    S.locationBtnText,
                    { color: locationLabel ? colors.foreground : colors.muted },
                  ]}
                  numberOfLines={1}
                >
                  {locationLabel || t('editProject.locationPlaceholder')}
                </Text>
                <MaterialIcons
                  name="chevron-right"
                  size={20}
                  color={colors.muted}
                />
              </PressableScale>
              {mapsAvailable && MapView && (
                <PressableScale
                  style={[S.mapPreview, { borderColor: colors.border }]}
                  onPress={openMap}
                >
                  <MapView
                    style={S.mapPreviewInner}
                    region={{
                      latitude: coords.lat,
                      longitude: coords.lng,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}
                    scrollEnabled={false}
                    zoomEnabled={false}
                    pitchEnabled={false}
                    rotateEnabled={false}
                    pointerEvents="none"
                  >
                    <Marker
                      coordinate={{
                        latitude: coords.lat,
                        longitude: coords.lng,
                      }}
                    />
                  </MapView>
                  <View style={S.mapPreviewOverlay}>
                    <MaterialIcons
                      name="edit-location"
                      size={18}
                      color="#FFF"
                    />
                    <Text style={S.mapPreviewOverlayText}>
                      {t('editProject.changeLocation')}
                    </Text>
                  </View>
                </PressableScale>
              )}
            </View>

            {/* ── Status selector ── */}
            <View style={S.fieldGroup}>
              <Text style={[S.label, { color: colors.foreground }]}>
                {t('editProject.status')}
              </Text>
              <View style={S.statusRow}>
                {STATUS_OPTIONS.map(opt => {
                  const active = opt.value === status;
                  return (
                    <PressableScale
                      key={opt.value}
                      onPress={() => setStatus(opt.value)}
                      style={[
                        S.statusChip,
                        {
                          backgroundColor: active
                            ? opt.color + '18'
                            : colors.surface,
                          borderColor: active ? opt.color : colors.border,
                        },
                      ]}
                    >
                      <MaterialIcons
                        name={opt.icon as any}
                        size={16}
                        color={active ? opt.color : colors.muted}
                      />
                      <Text
                        style={[
                          S.statusLabel,
                          { color: active ? opt.color : colors.muted },
                        ]}
                      >
                        {t(
                          `editProject.status${opt.value.charAt(0).toUpperCase() + opt.value.slice(1)}`
                        )}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>
            </View>

            {/* ── Progress slider ── */}
            <View style={S.fieldGroup}>
              <View style={S.progressHeaderRow}>
                <Text
                  style={[
                    S.label,
                    { color: colors.foreground, marginBottom: 0 },
                  ]}
                >
                  {t('editProject.progress')}
                </Text>
                <Text style={[S.progressValueText, { color: colors.primary }]}>
                  {progress}%
                </Text>
              </View>
              <ProgressSlider
                value={progress}
                onChange={setProgress}
                trackColor={colors.border}
                fillColor={colors.primary}
              />
            </View>

            {/* ── Dates ── */}
            <View style={S.dateRow}>
              <View style={S.flex1}>
                <AppInput
                  name="startDate"
                  control={control}
                  label={t('editProject.startDate')}
                  placeholder={t('editProject.datePlaceholder')}
                  keyboardType="numbers-and-punctuation"
                  returnKeyType="next"
                  maxLength={10}
                />
              </View>
              <View style={S.flex1}>
                <AppInput
                  name="endDate"
                  control={control}
                  label={t('editProject.endDate')}
                  placeholder={t('editProject.datePlaceholder')}
                  keyboardType="numbers-and-punctuation"
                  returnKeyType="done"
                  maxLength={10}
                />
              </View>
            </View>
          </ScrollView>
        </ModalBody>

        <ModalFooter>
          <Button
            title={isSaving ? t('editProject.saving') : t('editProject.save')}
            onPress={handleSubmit(onSubmit)}
            disabled={isSaving}
            style={[
              S.saveBtn,
              { backgroundColor: isSaving ? colors.border : colors.primary },
            ]}
          />
        </ModalFooter>
      </ModalRoot>

      {/* ── Modal del mapa completo ── */}
      <Modal
        visible={mapVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setMapVisible(false)}
      >
        <View
          style={[S.mapModalContainer, { backgroundColor: colors.background }]}
        >
          <View
            style={[S.mapModalHeader, { borderBottomColor: colors.border }]}
          >
            <PressableScale
              onPress={() => setMapVisible(false)}
              style={S.mapModalClose}
            >
              <MaterialIcons name="close" size={24} color={colors.foreground} />
            </PressableScale>
            <Text style={[S.mapModalTitle, { color: colors.foreground }]}>
              {t('editProject.selectLocation')}
            </Text>
            <PressableScale
              onPress={confirmLocation}
              style={S.mapModalConfirm}
            >
              <Text style={[S.mapModalConfirmText, { color: colors.primary }]}>
                {t('editProject.confirm')}
              </Text>
            </PressableScale>
          </View>

          <View style={[S.mapInstruction, { backgroundColor: colors.surface }]}>
            <MaterialIcons name="touch-app" size={16} color={colors.muted} />
            <Text style={[S.mapInstructionText, { color: colors.muted }]}>
              {t('editProject.tapToMove')}
            </Text>
          </View>

          {mapsAvailable && MapView ? (
            <MapView
              style={S.fullMap}
              initialRegion={{
                latitude: tempCoords.lat,
                longitude: tempCoords.lng,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              onPress={(e: any) => {
                const { latitude, longitude } = e.nativeEvent.coordinate;
                setTempCoords({ lat: latitude, lng: longitude });
              }}
            >
              <Marker
                coordinate={{
                  latitude: tempCoords.lat,
                  longitude: tempCoords.lng,
                }}
                draggable
                onDragEnd={(e: any) => {
                  const { latitude, longitude } = e.nativeEvent.coordinate;
                  setTempCoords({ lat: latitude, lng: longitude });
                }}
              />
            </MapView>
          ) : (
            <View
              style={[
                S.fullMap,
                S.mapUnavailable,
                { backgroundColor: colors.surface },
              ]}
            >
              <MaterialIcons name="map" size={48} color={colors.muted} />
              <Text style={[S.mapUnavailableText, { color: colors.muted }]}>
                {t('editProject.mapUnavailable')}
              </Text>
            </View>
          )}

          <View
            style={[
              S.coordsBar,
              {
                backgroundColor: colors.surface,
                borderTopColor: colors.border,
              },
            ]}
          >
            <MaterialIcons name="my-location" size={14} color={colors.muted} />
            <Text style={[S.coordsText, { color: colors.muted }]}>
              {tempCoords.lat.toFixed(5)}, {tempCoords.lng.toFixed(5)}
            </Text>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  flex1: { flex: 1 },
  body: {
    paddingTop: 8,
    paddingBottom: 24,
    gap: 4,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  // ── Location button ──────────────────────────────────────────────────────
  locationBtn: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  locationBtnText: {
    flex: 1,
    fontSize: 16,
  },
  // ── Map preview ──────────────────────────────────────────────────────────
  mapPreview: {
    marginTop: 8,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  mapPreviewInner: {
    flex: 1,
  },
  mapPreviewOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mapPreviewOverlayText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  // ── Status ───────────────────────────────────────────────────────────────
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  // ── Progress ─────────────────────────────────────────────────────────────
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressValueText: {
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  // ── Dates ────────────────────────────────────────────────────────────────
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  // ── Save button ──────────────────────────────────────────────────────────
  saveBtn: {
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  // ── Map modal ────────────────────────────────────────────────────────────
  mapModalContainer: {
    flex: 1,
  },
  mapModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  mapModalClose: {
    padding: 4,
    width: 60,
  },
  mapModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  mapModalConfirm: {
    padding: 4,
    width: 60,
    alignItems: 'flex-end',
  },
  mapModalConfirmText: {
    fontSize: 16,
    fontWeight: '700',
  },
  mapInstruction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  mapInstructionText: {
    fontSize: 13,
  },
  fullMap: {
    flex: 1,
  },
  mapUnavailable: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  mapUnavailableText: {
    fontSize: 14,
  },
  coordsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  coordsText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
