/**
 * modals/project-share.tsx
 *
 * formSheet modal — Compartir proyecto.
 *
 * Funcionalidades:
 *   - Mostrar enlace del proyecto con botón "Copiar"
 *   - Compartir vía WhatsApp, Email, o sistema nativo (expo-sharing)
 *   - Formulario de invitación por email (Zod + AppInput)
 *
 * Params recibidos:
 *   - projectId: string
 *   - projectName: string
 */
import React, { useState } from "react";
import {
  Alert,
  Clipboard,
  KeyboardAvoidingView,
  Linking,
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
import * as Sharing from "expo-sharing";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ModalBody, ModalHeader, ModalRoot } from "@/components/ui/modal-layout";
import { AppInput } from "@/components/ui/app-input";
import { useColors } from "@/hooks/use-colors";

// ─── Zod schema ───────────────────────────────────────────────────────────────

function buildSchema(t: (k: string) => string) {
  return z.object({
    email: z.string().email(t("projectShare.errorEmail")),
  });
}

type FormValues = { email: string };

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProjectShareModal() {
  const { t }   = useTranslation();
  const router  = useRouter();
  const colors  = useColors();

  const { projectId, projectName } =
    useLocalSearchParams<{ projectId: string; projectName: string }>();

  const projectLink = `https://snapsite.app/project/${projectId ?? "demo"}`;

  const [copied, setCopied] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  const schema = buildSchema(t);

  const { control, handleSubmit, reset, formState: { isValid } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: { email: "" },
      mode: "onChange",
    });

  // ── Copy link ──────────────────────────────────────────────────────────────

  const handleCopy = () => {
    Clipboard.setString(projectLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // ── Share via WhatsApp ─────────────────────────────────────────────────────

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      `${t("projectShare.title")}: ${projectName}\n${projectLink}`
    );
    Linking.openURL(`whatsapp://send?text=${msg}`).catch(() =>
      Alert.alert(t("common.error"), t("common.tryAgain"))
    );
  };

  // ── Share via Email ────────────────────────────────────────────────────────

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`${t("projectShare.title")}: ${projectName}`);
    const body    = encodeURIComponent(
      `${t("projectShare.linkDesc")}\n\n${projectLink}`
    );
    Linking.openURL(`mailto:?subject=${subject}&body=${body}`).catch(() =>
      Alert.alert(t("common.error"), t("common.tryAgain"))
    );
  };

  // ── Share via native sheet ─────────────────────────────────────────────────

  const handleShareMore = async () => {
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      // expo-sharing needs a file URI; for a plain URL we use the system share via Linking
    }
    // Fallback: use React Native Share
    try {
      const { Share } = require("react-native");
      await Share.share({
        message: `${projectName}\n${projectLink}`,
        url: projectLink,
        title: projectName ?? "snapSite",
      });
    } catch {
      Alert.alert(t("common.error"), t("common.tryAgain"));
    }
  };

  // ── Invite by email ────────────────────────────────────────────────────────

  const onInvite = async (data: FormValues) => {
    // TODO: call API to send invitation
    await new Promise((r) => setTimeout(r, 600));
    setInviteSent(true);
    reset();
    setTimeout(() => setInviteSent(false), 3000);
  };

  // ── Share channel button ───────────────────────────────────────────────────

  const ChannelBtn = ({
    icon,
    label,
    color,
    onPress,
  }: {
    icon: string;
    label: string;
    color: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[S.channelBtn, { backgroundColor: color + "14", borderColor: color + "30" }]}
      activeOpacity={0.7}
    >
      <View style={[S.channelIcon, { backgroundColor: color }]}>
        <MaterialIcons name={icon as any} size={20} color="#fff" />
      </View>
      <Text style={[S.channelLabel, { color: colors.foreground }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
    >
      <ModalRoot>
        <ModalHeader
          title={t("projectShare.title")}
          subtitle={projectName ?? ""}
          onClose={() => router.back()}
        />

        <ModalBody>
          <ScrollView
            contentContainerStyle={S.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Link section ── */}
            <Text style={[S.sectionLabel, { color: colors.muted }]}>
              {t("projectShare.linkSection")}
            </Text>
            <View style={[S.linkBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text
                style={[S.linkText, { color: colors.muted }]}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {projectLink}
              </Text>
              <TouchableOpacity
                onPress={handleCopy}
                style={[
                  S.copyBtn,
                  {
                    backgroundColor: copied ? colors.success + "18" : colors.primary + "14",
                    borderColor:     copied ? colors.success        : colors.primary,
                  },
                ]}
                activeOpacity={0.8}
              >
                <MaterialIcons
                  name={copied ? "check" : "content-copy"}
                  size={16}
                  color={copied ? colors.success : colors.primary}
                />
                <Text style={[S.copyBtnText, { color: copied ? colors.success : colors.primary }]}>
                  {copied ? t("projectShare.copied") : t("projectShare.copy")}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={[S.linkDesc, { color: colors.muted }]}>
              {t("projectShare.linkDesc")}
            </Text>

            {/* ── Share channels ── */}
            <Text style={[S.sectionLabel, { color: colors.muted }]}>
              {t("projectShare.shareVia")}
            </Text>
            <View style={S.channelRow}>
              <ChannelBtn
                icon="chat"
                label={t("projectShare.shareWhatsApp")}
                color="#25D366"
                onPress={handleWhatsApp}
              />
              <ChannelBtn
                icon="email"
                label={t("projectShare.shareEmail")}
                color="#2563EB"
                onPress={handleEmailShare}
              />
              <ChannelBtn
                icon="share"
                label={t("projectShare.shareMore")}
                color="#8B5CF6"
                onPress={handleShareMore}
              />
            </View>

            {/* ── Invite by email ── */}
            <Text style={[S.sectionLabel, { color: colors.muted }]}>
              {t("projectShare.inviteSection")}
            </Text>

            {inviteSent && (
              <View style={[S.successBanner, { backgroundColor: colors.success + "14", borderColor: colors.success + "30" }]}>
                <MaterialIcons name="check-circle" size={16} color={colors.success} />
                <Text style={[S.successText, { color: colors.success }]}>
                  {t("projectShare.inviteSent")}
                </Text>
              </View>
            )}

            <View style={S.inviteRow}>
              <View style={{ flex: 1 }}>
                <AppInput
                  name="email"
                  control={control}
                  placeholder={t("projectShare.invitePlaceholder")}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="send"
                  onSubmitEditing={handleSubmit(onInvite)}
                />
              </View>
              <TouchableOpacity
                onPress={handleSubmit(onInvite)}
                disabled={!isValid}
                style={[
                  S.inviteBtn,
                  { backgroundColor: isValid ? colors.primary : colors.border },
                ]}
                activeOpacity={0.8}
              >
                <MaterialIcons name="send" size={20} color={isValid ? "#fff" : colors.muted} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </ModalBody>
      </ModalRoot>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  body: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
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
  linkBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  linkText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  copyBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  linkDesc: {
    fontSize: 12,
    marginTop: -4,
  },
  channelRow: {
    flexDirection: "row",
    gap: 10,
  },
  channelBtn: {
    flex: 1,
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  channelIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  channelLabel: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  inviteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  inviteBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  successText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
