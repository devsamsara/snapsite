/**
 * modals/project-export.tsx
 *
 * formSheet modal — Exportar informe del proyecto como PDF.
 *
 * Funcionalidades:
 *   - Toggles de contenido: fotos, notas, anotaciones, equipo
 *   - Selector de calidad de imagen: baja / media / alta
 *   - Genera PDF con expo-print (HTML → PDF)
 *   - Comparte el PDF con expo-sharing
 *
 * Params recibidos:
 *   - projectId: string
 *   - projectName: string
 *   - projectLocation: string (opcional)
 */
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ModalBody, ModalFooter, ModalHeader, ModalRoot } from "@/components/ui/modal-layout";
import { useColors } from "@/hooks/use-colors";
import { AppAlert } from '@/components/ui/app-alert';

// ─── Types ────────────────────────────────────────────────────────────────────

type Quality = "low" | "medium" | "high";

interface ExportOptions {
  includePhotos:       boolean;
  includeNotes:        boolean;
  includeAnnotations:  boolean;
  includeTeam:         boolean;
  quality:             Quality;
}

// ─── PDF template ─────────────────────────────────────────────────────────────

function buildPdfHtml(projectName: string, location: string, opts: ExportOptions): string {
  const date = new Date().toLocaleDateString("es-ES", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const sections: string[] = [];

  if (opts.includePhotos) {
    sections.push(`
      <section>
        <h2>📷 Fotos del proyecto</h2>
        <p class="placeholder">Las fotos del proyecto aparecerán aquí al conectar con la API.</p>
      </section>`);
  }

  if (opts.includeNotes) {
    sections.push(`
      <section>
        <h2>📝 Notas</h2>
        <p class="placeholder">Las notas del proyecto aparecerán aquí al conectar con la API.</p>
      </section>`);
  }

  if (opts.includeAnnotations) {
    sections.push(`
      <section>
        <h2>📐 Anotaciones</h2>
        <p class="placeholder">Las anotaciones y medidas aparecerán aquí al conectar con la API.</p>
      </section>`);
  }

  if (opts.includeTeam) {
    sections.push(`
      <section>
        <h2>👥 Equipo</h2>
        <p class="placeholder">Los miembros del equipo aparecerán aquí al conectar con la API.</p>
      </section>`);
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Informe — ${projectName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1E293B; background: #fff; padding: 40px; }
    header { border-bottom: 3px solid #2563EB; padding-bottom: 24px; margin-bottom: 32px; }
    .badge { display: inline-block; background: #2563EB; color: #fff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; letter-spacing: 0.5px; margin-bottom: 12px; }
    h1 { font-size: 28px; font-weight: 800; color: #1E293B; margin-bottom: 6px; }
    .meta { font-size: 13px; color: #64748B; }
    section { margin-bottom: 28px; }
    h2 { font-size: 16px; font-weight: 700; color: #2563EB; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #E2E8F0; }
    .placeholder { font-size: 13px; color: #94A3B8; font-style: italic; padding: 16px; background: #F8FAFC; border-radius: 8px; border: 1px dashed #E2E8F0; }
    footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #E2E8F0; font-size: 11px; color: #94A3B8; text-align: center; }
  </style>
</head>
<body>
  <header>
    <div class="badge">INFORME DE PROYECTO</div>
    <h1>${projectName}</h1>
    <p class="meta">${location ? `📍 ${location} &nbsp;·&nbsp; ` : ""}📅 Generado el ${date}</p>
  </header>
  ${sections.join("\n")}
  <footer>Generado con snapSite &nbsp;·&nbsp; ${date}</footer>
</body>
</html>`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProjectExportModal() {
  const { t }   = useTranslation();
  const router  = useRouter();
  const colors  = useColors();

  const { projectId, projectName, projectLocation } =
    useLocalSearchParams<{
      projectId: string;
      projectName: string;
      projectLocation: string;
    }>();

  const [opts, setOpts] = useState<ExportOptions>({
    includePhotos:      true,
    includeNotes:       true,
    includeAnnotations: true,
    includeTeam:        false,
    quality:            "medium",
  });

  const [isExporting, setIsExporting] = useState(false);

  const toggle = (key: keyof Omit<ExportOptions, "quality">) =>
    setOpts((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const html = buildPdfHtml(
        projectName ?? "Proyecto",
        projectLocation ?? "",
        opts
      );

      const { uri } = await Print.printToFileAsync({ html, base64: false });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: t("projectExport.shareTitle"),
          UTI: "com.adobe.pdf",
        });
      } else {
        AppAlert.alert(
          t("projectExport.successTitle"),
          t("projectExport.successMsg")
        );
      }
    } catch (err) {
      AppAlert.alert(t("projectExport.errorTitle"), t("projectExport.errorMsg"));
    } finally {
      setIsExporting(false);
    }
  };

  // ── Row component ──────────────────────────────────────────────────────────

  const ToggleRow = ({
    icon,
    label,
    desc,
    value,
    onToggle,
  }: {
    icon: string;
    label: string;
    desc: string;
    value: boolean;
    onToggle: () => void;
  }) => (
    <View style={[S.row, { borderBottomColor: colors.border }]}>
      <View
        style={[S.rowIcon, { backgroundColor: colors.primary + "14" }]}
      >
        <MaterialIcons name={icon as any} size={18} color={colors.primary} />
      </View>
      <View style={S.flex1}>
        <Text style={[S.rowLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[S.rowDesc, { color: colors.muted }]}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primary + "60" }}
        thumbColor={value ? colors.primary : colors.muted}
      />
    </View>
  );

  const QUALITY_OPTIONS: { key: Quality; label: string }[] = [
    { key: "low",    label: t("projectExport.qualityLow")    },
    { key: "medium", label: t("projectExport.qualityMedium") },
    { key: "high",   label: t("projectExport.qualityHigh")   },
  ];

  return (
    <ModalRoot>
      <ModalHeader
        title={t("projectExport.title")}
        subtitle={projectName ?? ""}
        onClose={() => router.back()}
      />

      <ModalBody>
        <ScrollView
          contentContainerStyle={S.body}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Content section ── */}
          <Text style={[S.sectionLabel, { color: colors.muted }]}>
            {t("projectExport.sectionContent")}
          </Text>
          <View style={[S.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ToggleRow
              icon="photo-library"
              label={t("projectExport.includePhotos")}
              desc={t("projectExport.includePhotosDesc")}
              value={opts.includePhotos}
              onToggle={() => toggle("includePhotos")}
            />
            <ToggleRow
              icon="notes"
              label={t("projectExport.includeNotes")}
              desc={t("projectExport.includeNotesDesc")}
              value={opts.includeNotes}
              onToggle={() => toggle("includeNotes")}
            />
            <ToggleRow
              icon="straighten"
              label={t("projectExport.includeAnnotations")}
              desc={t("projectExport.includeAnnotationsDesc")}
              value={opts.includeAnnotations}
              onToggle={() => toggle("includeAnnotations")}
            />
            <View style={[S.row, { borderBottomWidth: 0 }]}>
              <View style={[S.rowIcon, { backgroundColor: colors.primary + "14" }]}>
                <MaterialIcons name="group" size={18} color={colors.primary} />
              </View>
              <View style={S.flex1}>
                <Text style={[S.rowLabel, { color: colors.foreground }]}>
                  {t("projectExport.includeTeam")}
                </Text>
                <Text style={[S.rowDesc, { color: colors.muted }]}>
                  {t("projectExport.includeTeamDesc")}
                </Text>
              </View>
              <Switch
                value={opts.includeTeam}
                onValueChange={() => toggle("includeTeam")}
                trackColor={{ false: colors.border, true: colors.primary + "60" }}
                thumbColor={opts.includeTeam ? colors.primary : colors.muted}
              />
            </View>
          </View>

          {/* ── Format section ── */}
          <Text style={[S.sectionLabel, { color: colors.muted }]}>
            {t("projectExport.sectionFormat")}
          </Text>
          <View style={[S.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={S.qualityRow}>
              <Text style={[S.rowLabel, { color: colors.foreground }]}>
                {t("projectExport.quality")}
              </Text>
              <View style={S.qualityBtns}>
                {QUALITY_OPTIONS.map((q) => {
                  const active = opts.quality === q.key;
                  return (
                    <TouchableOpacity
                      key={q.key}
                      onPress={() => setOpts((p) => ({ ...p, quality: q.key }))}
                      style={[
                        S.qualityBtn,
                        {
                          backgroundColor: active ? colors.primary : colors.background,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          S.qualityBtnText,
                          { color: active ? "#fff" : colors.muted },
                        ]}
                      >
                        {q.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </ScrollView>
      </ModalBody>

      <ModalFooter>
        <TouchableOpacity
          onPress={handleExport}
          disabled={isExporting}
          style={[
            S.exportBtn,
            { backgroundColor: isExporting ? colors.border : colors.primary },
          ]}
          activeOpacity={0.8}
        >
          {isExporting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <MaterialIcons name="picture-as-pdf" size={20} color="#fff" />
          )}
          <Text style={[S.exportBtnText, { color: isExporting ? colors.muted : "#fff" }]}>
            {isExporting ? t("projectExport.exporting") : t("projectExport.export")}
          </Text>
        </TouchableOpacity>
      </ModalFooter>
    </ModalRoot>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  body: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginTop: 8,
    marginBottom: 2,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  rowDesc: {
    fontSize: 12,
    marginTop: 1,
  },
  qualityRow: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  qualityBtns: {
    flexDirection: "row",
    gap: 8,
  },
  qualityBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
  },
  qualityBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
  },
  exportBtnText: {
    fontSize: 16,
    fontWeight: "700",
  },
  flex1: { flex: 1 },
});
