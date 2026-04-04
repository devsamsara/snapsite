/**
 * modals/project-contacts.tsx
 *
 * Modal — Gestión de contactos del proyecto (clientes y proveedores).
 *
 * Funcionalidades:
 *   - Lista de contactos con avatar, nombre, rol, teléfono, email
 *   - Acciones rápidas: llamar, enviar email, eliminar
 *   - Formulario de añadir contacto (Zod + react-hook-form + AppInput)
 *   - Panel expandible de añadir
 *
 * Params recibidos:
 *   - projectId: string
 *   - projectName: string
 */
import React, { useState } from "react";
import {
  Alert,
  Animated,
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
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ModalBody, ModalHeader, ModalRoot } from "@/components/ui/modal-layout";
import { AppInput } from "@/components/ui/app-input";
import { useColors } from "@/hooks/use-colors";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Contact {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  initials: string;
  color: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

const MOCK_CONTACTS: Contact[] = [
  { id: "1", name: "Carlos Martínez", role: "Cliente", phone: "+34 612 345 678", email: "carlos@empresa.com", initials: "CM", color: "#2563EB" },
  { id: "2", name: "Ana García",      role: "Proveedora", phone: "+34 698 765 432", email: "ana@proveedora.es", initials: "AG", color: "#10B981" },
];

// ─── Zod schema ───────────────────────────────────────────────────────────────

function buildSchema(t: (k: string) => string) {
  return z.object({
    name:  z.string().min(2, t("projectContacts.errorNameMin")),
    role:  z.string().min(1, t("projectContacts.errorRole")),
    phone: z
      .string()
      .regex(/^[+\d\s\-().]{7,20}$/, t("projectContacts.errorPhone"))
      .or(z.literal("")),
    email: z
      .string()
      .email(t("projectContacts.errorEmail"))
      .or(z.literal("")),
  });
}

type FormValues = { name: string; role: string; phone: string; email: string };

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProjectContactsModal() {
  const { t }   = useTranslation();
  const router  = useRouter();
  const colors  = useColors();

  const { projectId, projectName } =
    useLocalSearchParams<{ projectId: string; projectName: string }>();

  const [contacts, setContacts] = useState<Contact[]>(MOCK_CONTACTS);
  const [showForm, setShowForm] = useState(false);

  const schema = buildSchema(t);

  const { control, handleSubmit, reset, formState: { isValid } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: { name: "", role: "", phone: "", email: "" },
      mode: "onChange",
    });

  const onAddContact = (data: FormValues) => {
    const colorIndex = contacts.length % AVATAR_COLORS.length;
    const newContact: Contact = {
      id:       Date.now().toString(),
      name:     data.name,
      role:     data.role,
      phone:    data.phone,
      email:    data.email,
      initials: getInitials(data.name),
      color:    AVATAR_COLORS[colorIndex],
    };
    setContacts((prev) => [...prev, newContact]);
    reset();
    setShowForm(false);
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() =>
      Alert.alert(t("common.error"), t("common.tryAgain"))
    );
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`).catch(() =>
      Alert.alert(t("common.error"), t("common.tryAgain"))
    );
  };

  const handleRemove = (contact: Contact) => {
    Alert.alert(
      t("projectContacts.removeConfirm"),
      t("projectContacts.removeMsg"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("projectContacts.remove"),
          style: "destructive",
          onPress: () =>
            setContacts((prev) => prev.filter((c) => c.id !== contact.id)),
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
    >
      <ModalRoot>
        <ModalHeader
          title={t("projectContacts.title")}
          subtitle={projectName ?? ""}
          onClose={() => router.back()}
        />

        <ModalBody>
          <ScrollView
            contentContainerStyle={S.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Add button ── */}
            <TouchableOpacity
              onPress={() => setShowForm((v) => !v)}
              style={[
                S.addToggle,
                {
                  backgroundColor: showForm ? colors.primary + "12" : colors.primary,
                  borderColor: colors.primary,
                },
              ]}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name={showForm ? "close" : "person-add"}
                size={18}
                color={showForm ? colors.primary : "#fff"}
              />
              <Text
                style={[
                  S.addToggleText,
                  { color: showForm ? colors.primary : "#fff" },
                ]}
              >
                {showForm ? t("common.cancel") : t("projectContacts.add")}
              </Text>
            </TouchableOpacity>

            {/* ── Add form ── */}
            {showForm && (
              <View
                style={[
                  S.formBox,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Text style={[S.formTitle, { color: colors.foreground }]}>
                  {t("projectContacts.addTitle")}
                </Text>

                <AppInput
                  name="name"
                  control={control}
                  label={t("projectContacts.name")}
                  placeholder={t("projectContacts.namePlaceholder")}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
                <AppInput
                  name="role"
                  control={control}
                  label={t("projectContacts.role")}
                  placeholder={t("projectContacts.rolePlaceholder")}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
                <AppInput
                  name="phone"
                  control={control}
                  label={t("projectContacts.phone")}
                  placeholder={t("projectContacts.phonePlaceholder")}
                  keyboardType="phone-pad"
                  returnKeyType="next"
                />
                <AppInput
                  name="email"
                  control={control}
                  label={t("projectContacts.email")}
                  placeholder={t("projectContacts.emailPlaceholder")}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit(onAddContact)}
                />

                <TouchableOpacity
                  onPress={handleSubmit(onAddContact)}
                  disabled={!isValid}
                  style={[
                    S.saveBtn,
                    { backgroundColor: isValid ? colors.primary : colors.border },
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={[S.saveBtnText, { color: isValid ? "#fff" : colors.muted }]}>
                    {t("projectContacts.save")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── Contacts list ── */}
            {contacts.length === 0 ? (
              <View style={S.emptyBox}>
                <MaterialIcons name="contacts" size={40} color={colors.muted} />
                <Text style={[S.emptyTitle, { color: colors.foreground }]}>
                  {t("projectContacts.empty")}
                </Text>
                <Text style={[S.emptyDesc, { color: colors.muted }]}>
                  {t("projectContacts.emptyDesc")}
                </Text>
              </View>
            ) : (
              <View style={S.list}>
                {contacts.map((contact) => (
                  <View
                    key={contact.id}
                    style={[
                      S.contactCard,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                  >
                    {/* Avatar + info */}
                    <View style={S.contactMain}>
                      <View
                        style={[
                          S.avatar,
                          { backgroundColor: contact.color + "20", borderColor: contact.color + "40" },
                        ]}
                      >
                        <Text style={[S.avatarText, { color: contact.color }]}>
                          {contact.initials}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[S.contactName, { color: colors.foreground }]}>
                          {contact.name}
                        </Text>
                        <View
                          style={[
                            S.roleBadge,
                            { backgroundColor: colors.primary + "14" },
                          ]}
                        >
                          <Text style={[S.roleText, { color: colors.primary }]}>
                            {contact.role}
                          </Text>
                        </View>
                      </View>
                      {/* Remove */}
                      <TouchableOpacity
                        onPress={() => handleRemove(contact)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <MaterialIcons name="delete-outline" size={20} color={colors.error} />
                      </TouchableOpacity>
                    </View>

                    {/* Actions */}
                    <View style={[S.contactActions, { borderTopColor: colors.border }]}>
                      {!!contact.phone && (
                        <TouchableOpacity
                          onPress={() => handleCall(contact.phone)}
                          style={[S.actionBtn, { borderColor: colors.border }]}
                          activeOpacity={0.7}
                        >
                          <MaterialIcons name="phone" size={15} color={colors.success} />
                          <Text style={[S.actionBtnText, { color: colors.success }]}>
                            {t("projectContacts.call")}
                          </Text>
                        </TouchableOpacity>
                      )}
                      {!!contact.email && (
                        <TouchableOpacity
                          onPress={() => handleEmail(contact.email)}
                          style={[S.actionBtn, { borderColor: colors.border }]}
                          activeOpacity={0.7}
                        >
                          <MaterialIcons name="email" size={15} color={colors.primary} />
                          <Text style={[S.actionBtnText, { color: colors.primary }]}>
                            {t("projectContacts.mail")}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
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
    gap: 16,
  },
  addToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  addToggleText: {
    fontSize: 15,
    fontWeight: "700",
  },
  formBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 4,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },
  saveBtn: {
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: "center",
  },
  list: {
    gap: 12,
  },
  contactCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  contactMain: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 15,
    fontWeight: "800",
  },
  contactName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  roleBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 11,
    fontWeight: "700",
  },
  contactActions: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
