/**
 * modals/edit-project.tsx
 *
 * formSheet modal — Editar datos del proyecto.
 *
 * Campos: nombre, ubicación (mapa interactivo), estado, fecha inicio, fecha fin
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
 */
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMutation } from "@apollo/client/react";

import { ModalBody, ModalFooter, ModalHeader, ModalRoot } from "@/components/ui/modal-layout";
import { AppInput } from "@/components/ui/app-input";
import { useColors } from "@/hooks/use-colors";
import { AppAlert } from '@/components/ui/app-alert';
import {
  UpdateProjectDocument,
  FindProjectDocument,
  GetMyProjectsDocument,
} from "@/gql/graphql";

// ── react-native-maps (safe require para Expo Go) ─────────────────────────────
const TurboModuleRegistry = require("react-native").TurboModuleRegistry;
const mapsAvailable = !!TurboModuleRegistry.get("RNMapsAirModule");
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = undefined;
if (mapsAvailable) {
  const RNMaps = require("react-native-maps");
  MapView = RNMaps.default;
  Marker = RNMaps.Marker;
  PROVIDER_GOOGLE = RNMaps.PROVIDER_GOOGLE;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
/** Convierte timestamp ms (string) → "DD/MM/YYYY". Devuelve "" si inválido. */
function tsToDate(ts: string | undefined): string {
  if (!ts) return "";
  const n = Number(ts);
  if (!n) return "";
  const d = new Date(n);
  if (isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** Convierte "DD/MM/YYYY" → timestamp ms (number). Devuelve null si inválido. */
function dateToTs(s: string): number | null {
  if (!s) return null;
  const [dd, mm, yyyy] = s.split("/");
  if (!dd || !mm || !yyyy) return null;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (isNaN(d.getTime())) return null;
  return d.getTime();
}

// ─── Status options ───────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "active",    icon: "play-circle-filled",   color: "#10B981" },
  { value: "paused",    icon: "pause-circle-filled",  color: "#F59E0B" },
  { value: "completed", icon: "check-circle",         color: "#2563EB" },
  { value: "cancelled", icon: "cancel",               color: "#EF4444" },
] as const;

type StatusValue = (typeof STATUS_OPTIONS)[number]["value"];

// ─── Zod schema ───────────────────────────────────────────────────────────────

function buildSchema(t: (k: string) => string) {
  const dateRegex = /^(\d{2}\/\d{2}\/\d{4})?$/;
  return z.object({
    name: z
      .string()
      .min(1, t("editProject.errorName"))
      .min(3, t("editProject.errorNameMin"))
      .max(80, t("editProject.errorNameMax")),
    startDate: z
      .string()
      .regex(dateRegex, t("editProject.errorDateFormat"))
      .optional()
      .or(z.literal("")),
    endDate: z
      .string()
      .regex(dateRegex, t("editProject.errorDateFormat"))
      .optional()
      .or(z.literal("")),
  });
}

type FormValues = {
  name: string;
  startDate: string;
  endDate: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function EditProjectModal() {
  const { t }    = useTranslation();
  const router   = useRouter();
  const colors   = useColors();

  const {
    projectId,
    projectName,
    projectLocation,
    projectLatitude,
    projectLongitude,
    projectStatus,
    projectStartDate,
    projectEndDate,
  } = useLocalSearchParams<{
    projectId:        string;
    projectName:      string;
    projectLocation:  string;
    projectLatitude:  string;
    projectLongitude: string;
    projectStatus:    string;
    projectStartDate: string;
    projectEndDate:   string;
  }>();

  const [status, setStatus] = useState<StatusValue>(
    (projectStatus as StatusValue) ?? "active"
  );
  const [isSaving, setIsSaving] = useState(false);

  // ── Ubicación ──────────────────────────────────────────────────────────────
  const initLat = projectLatitude  ? parseFloat(projectLatitude)  : 40.4168;
  const initLng = projectLongitude ? parseFloat(projectLongitude) : -3.7038;
  const [locationLabel, setLocationLabel] = useState(projectLocation ?? "");
  const [coords, setCoords] = useState({ lat: initLat, lng: initLng });
  const [mapVisible, setMapVisible] = useState(false);
  const [tempCoords, setTempCoords] = useState({ lat: initLat, lng: initLng });

  // ── GraphQL ────────────────────────────────────────────────────────────────
  const [updateProject] = useMutation(UpdateProjectDocument, {
    refetchQueries: [FindProjectDocument, GetMyProjectsDocument],
  });

  const schema = buildSchema(t);

  const { control, handleSubmit, formState: { isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:      projectName ?? "",
      startDate: tsToDate(projectStartDate),
      endDate:   tsToDate(projectEndDate),
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSaving(true);
    try {
      await updateProject({
        variables: {
          id: projectId,
          input: {
            name:      data.name,
            location:  locationLabel,
            latitude:  coords.lat,
            longitude: coords.lng,
            status,
            startDate: data.startDate ? String(dateToTs(data.startDate)) : undefined,
            endDate:   data.endDate   ? String(dateToTs(data.endDate))   : undefined,
          },
        },
      });
      AppAlert.alert(t("editProject.successTitle"), t("editProject.successMsg"));
      router.back();
    } catch {
      AppAlert.alert(t("common.error"), t("common.tryAgain"));
    } finally {
      setIsSaving(false);
    }
  };

  // ── Reverse geocode (nominatim) ────────────────────────────────────────────
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { "Accept-Language": "es" } }
      );
      const json = await res.json();
      if (json?.display_name) {
        const addr = json.address;
        const parts = [
          addr?.city || addr?.town || addr?.village || addr?.county,
          addr?.country,
        ].filter(Boolean);
        setLocationLabel(parts.length ? parts.join(", ") : json.display_name);
      }
    } catch {
      // Si falla, mantener el label anterior
    }
  };

  const openMap = () => {
    setTempCoords(coords);
    setMapVisible(true);
  };

  const confirmLocation = async () => {
    setCoords(tempCoords);
    setMapVisible(false);
    await reverseGeocode(tempCoords.lat, tempCoords.lng);
  };

  return (
    <KeyboardAvoidingView
      style={S.flex1}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
    >
      <ModalRoot>
        <ModalHeader
          title={t("editProject.title")}
          subtitle={t("editProject.subtitle")}
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
              label={t("editProject.name")}
              placeholder={t("editProject.namePlaceholder")}
              autoCapitalize="words"
              returnKeyType="next"
              maxLength={80}
              showLength
            />

            {/* ── Location (mapa interactivo) ── */}
            <View style={S.fieldGroup}>
              <Text style={[S.label, { color: colors.foreground }]}>
                {t("editProject.location")}
              </Text>
              <TouchableOpacity
                style={[
                  S.locationBtn,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
                onPress={openMap}
                activeOpacity={0.8}
              >
                <MaterialIcons name="location-on" size={20} color={colors.primary} />
                <Text
                  style={[S.locationBtnText, { color: locationLabel ? colors.foreground : colors.muted }]}
                  numberOfLines={1}
                >
                  {locationLabel || t("editProject.locationPlaceholder")}
                </Text>
                <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
              </TouchableOpacity>
              {mapsAvailable && MapView && (
                <TouchableOpacity
                  style={[S.mapPreview, { borderColor: colors.border }]}
                  onPress={openMap}
                  activeOpacity={0.9}
                >
                  <MapView
                    provider={PROVIDER_GOOGLE}
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
                    <Marker coordinate={{ latitude: coords.lat, longitude: coords.lng }} />
                  </MapView>
                  <View style={S.mapPreviewOverlay}>
                    <MaterialIcons name="edit-location" size={18} color="#FFF" />
                    <Text style={S.mapPreviewOverlayText}>{t("editProject.changeLocation")}</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* ── Status selector ── */}
            <View style={S.fieldGroup}>
              <Text style={[S.label, { color: colors.foreground }]}>
                {t("editProject.status")}
              </Text>
              <View style={S.statusRow}>
                {STATUS_OPTIONS.map((opt) => {
                  const active = opt.value === status;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => setStatus(opt.value)}
                      style={[
                        S.statusChip,
                        {
                          backgroundColor: active ? opt.color + "18" : colors.surface,
                          borderColor:     active ? opt.color        : colors.border,
                        },
                      ]}
                      activeOpacity={0.7}
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
                        {t(`editProject.status${opt.value.charAt(0).toUpperCase() + opt.value.slice(1)}`)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* ── Dates ── */}
            <View style={S.dateRow}>
              <View style={S.flex1}>
                <AppInput
                  name="startDate"
                  control={control}
                  label={t("editProject.startDate")}
                  placeholder={t("editProject.datePlaceholder")}
                  keyboardType="numbers-and-punctuation"
                  returnKeyType="next"
                  maxLength={10}
                />
              </View>
              <View style={S.flex1}>
                <AppInput
                  name="endDate"
                  control={control}
                  label={t("editProject.endDate")}
                  placeholder={t("editProject.datePlaceholder")}
                  keyboardType="numbers-and-punctuation"
                  returnKeyType="done"
                  maxLength={10}
                />
              </View>
            </View>
          </ScrollView>
        </ModalBody>

        <ModalFooter>
          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            disabled={isSaving}
            style={[
              S.saveBtn,
              { backgroundColor: isSaving ? colors.border : colors.primary },
            ]}
            activeOpacity={0.8}
          >
            <Text style={[S.saveBtnText, { color: isSaving ? colors.muted : "#fff" }]}>
              {isSaving ? t("editProject.saving") : t("editProject.save")}
            </Text>
          </TouchableOpacity>
        </ModalFooter>
      </ModalRoot>

      {/* ── Modal del mapa completo ── */}
      <Modal
        visible={mapVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setMapVisible(false)}
      >
        <View style={[S.mapModalContainer, { backgroundColor: colors.background }]}>
          <View style={[S.mapModalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setMapVisible(false)} style={S.mapModalClose}>
              <MaterialIcons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[S.mapModalTitle, { color: colors.foreground }]}>
              {t("editProject.selectLocation")}
            </Text>
            <TouchableOpacity onPress={confirmLocation} style={S.mapModalConfirm}>
              <Text style={[S.mapModalConfirmText, { color: colors.primary }]}>
                {t("editProject.confirm")}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[S.mapInstruction, { backgroundColor: colors.surface }]}>
            <MaterialIcons name="touch-app" size={16} color={colors.muted} />
            <Text style={[S.mapInstructionText, { color: colors.muted }]}>
              {t("editProject.tapToMove")}
            </Text>
          </View>

          {mapsAvailable && MapView ? (
            <MapView
              provider={PROVIDER_GOOGLE}
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
                coordinate={{ latitude: tempCoords.lat, longitude: tempCoords.lng }}
                draggable
                onDragEnd={(e: any) => {
                  const { latitude, longitude } = e.nativeEvent.coordinate;
                  setTempCoords({ lat: latitude, lng: longitude });
                }}
              />
            </MapView>
          ) : (
            <View style={[S.fullMap, S.mapUnavailable, { backgroundColor: colors.surface }]}>
              <MaterialIcons name="map" size={48} color={colors.muted} />
              <Text style={[S.mapUnavailableText, { color: colors.muted }]}>
                {t("editProject.mapUnavailable")}
              </Text>
            </View>
          )}

          <View style={[S.coordsBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
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
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 4,
  },
  // ── Location button ──────────────────────────────────────────────────────
  locationBtn: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
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
    overflow: "hidden",
    borderWidth: 1,
  },
  mapPreviewInner: {
    flex: 1,
  },
  mapPreviewOverlay: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mapPreviewOverlayText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  // ── Status ───────────────────────────────────────────────────────────────
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  // ── Dates ────────────────────────────────────────────────────────────────
  dateRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  // ── Save button ──────────────────────────────────────────────────────────
  saveBtn: {
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "700",
  },
  // ── Map modal ────────────────────────────────────────────────────────────
  mapModalContainer: {
    flex: 1,
  },
  mapModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  mapModalConfirm: {
    padding: 4,
    width: 60,
    alignItems: "flex-end",
  },
  mapModalConfirmText: {
    fontSize: 16,
    fontWeight: "700",
  },
  mapInstruction: {
    flexDirection: "row",
    alignItems: "center",
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
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  mapUnavailableText: {
    fontSize: 14,
  },
  coordsBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  coordsText: {
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
});
