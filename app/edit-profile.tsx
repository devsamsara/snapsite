/**
 * app/edit-profile.tsx
 *
 * Pantalla de edición de perfil.
 * Validación: Zod + react-hook-form
 * Inputs: AppInput (no TextInput nativo)
 * Tema: dark/light mode via useColors
 */
import React from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ScreenContainer } from "@/components/screen-container";
import { AppInput } from "@/components/ui/app-input";
import { Button } from "@/components/ui/button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useCardStyle } from "@/hooks/use-card-style";

// ─── Schema ───────────────────────────────────────────────────────────────────
const schema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(60, "Máximo 60 caracteres"),
  email: z
    .string()
    .min(1, "El email es obligatorio")
    .email("Introduce un email válido"),
  phone: z
    .string()
    .max(20, "Máximo 20 caracteres")
    .optional()
    .or(z.literal("")),
  role: z
    .string()
    .max(50, "Máximo 50 caracteres")
    .optional()
    .or(z.literal("")),
  company: z
    .string()
    .max(80, "Máximo 80 caracteres")
    .optional()
    .or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

// ─── Component ────────────────────────────────────────────────────────────────
export default function EditProfileScreen() {
  const router    = useRouter();
  const colors    = useColors();
  const cardStyle = useCardStyle();

  const {
    control,
    handleSubmit,
    formState: { isValid, isDirty, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:    "John Doe",
      email:   "john@example.com",
      phone:   "+1 (555) 123-4567",
      role:    "Project Manager",
      company: "FieldCam Inc.",
    },
    mode: "onChange",
  });

  const onSave = async (data: FormValues) => {
    // TODO: llamar a la API (tRPC) para guardar los cambios
    console.log("Saving profile:", data);
    Alert.alert("Éxito", "Perfil actualizado correctamente", [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  const handleChangePhoto = () => {
    Alert.alert("Cambiar Foto", "El selector de fotos se implementará aquí");
  };

  return (
    <ScreenContainer className="p-0">
      <View style={{ flex: 1, backgroundColor: colors.background }}>

        {/* ── Header ── */}
        <View style={[S.header, { borderBottomColor: colors.border }]}>
          <View style={S.headerLeft}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[S.backBtn, { backgroundColor: colors.surface }]}
            >
              <IconSymbol name="chevron.left" size={20} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[S.headerTitle, { color: colors.foreground }]}>
              Editar Perfil
            </Text>
          </View>

          <Button
            title="Guardar"
            onPress={handleSubmit(onSave)}
            variant="primary"
            size="sm"
            loading={isSubmitting}
            disabled={!isValid || !isDirty}
          />
        </View>

        {/* ── Content ── */}
        <ScrollView
          contentContainerStyle={S.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* Foto de perfil */}
          <View style={S.avatarSection}>
            <View style={[S.avatar, { backgroundColor: colors.primary }]}>
              <IconSymbol name="person.fill" size={48} color="#FFFFFF" />
            </View>
            <TouchableOpacity onPress={handleChangePhoto} style={S.changePhotoBtn}>
              <Text style={[S.changePhotoTxt, { color: colors.primary }]}>
                Cambiar Foto
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sección: Información personal */}
          <Text style={[S.sectionLabel, { color: colors.muted }]}>
            Información Personal
          </Text>
          <View style={[S.card, cardStyle]}>
            <AppInput
              name="name"
              control={control}
              label="Nombre completo"
              placeholder="Tu nombre"
              icon="person"
              autoCapitalize="words"
              returnKeyType="next"
            />
            <AppInput
              name="email"
              control={control}
              label="Email"
              placeholder="tu@email.com"
              icon="mail"
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />
            <AppInput
              name="phone"
              control={control}
              label="Teléfono"
              placeholder="+34 600 000 000"
              icon="phone"
              keyboardType="phone-pad"
              returnKeyType="next"
            />
          </View>

          {/* Sección: Información profesional */}
          <Text style={[S.sectionLabel, { color: colors.muted }]}>
            Información Profesional
          </Text>
          <View style={[S.card, cardStyle]}>
            <AppInput
              name="role"
              control={control}
              label="Cargo"
              placeholder="Ej: Project Manager"
              icon="briefcase"
              returnKeyType="next"
            />
            <AppInput
              name="company"
              control={control}
              label="Empresa"
              placeholder="Nombre de tu empresa"
              icon="building"
              returnKeyType="done"
              onSubmitEditing={handleSubmit(onSave)}
            />
          </View>

          {/* Sección: Opciones adicionales */}
          <Text style={[S.sectionLabel, { color: colors.muted }]}>
            Opciones Adicionales
          </Text>
          <View style={[S.card, cardStyle, S.optionsCard]}>
            {/* Cambiar contraseña */}
            <TouchableOpacity
              style={[S.optionRow, { borderBottomColor: colors.border }]}
              activeOpacity={0.7}
            >
              <View style={S.optionLeft}>
                <IconSymbol name="lock.fill" size={20} color={colors.primary} />
                <Text style={[S.optionTxt, { color: colors.foreground }]}>
                  Cambiar Contraseña
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.muted} />
            </TouchableOpacity>

            {/* Eliminar cuenta */}
            <TouchableOpacity style={S.optionRow} activeOpacity={0.7}>
              <View style={S.optionLeft}>
                <IconSymbol name="trash.fill" size={20} color={colors.error} />
                <Text style={[S.optionTxt, { color: colors.error }]}>
                  Eliminar Cuenta
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.muted} />
            </TouchableOpacity>
          </View>

          <View style={{ height: 48 }} />
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 24, fontWeight: "700" },

  scrollContent: { paddingHorizontal: 20, paddingTop: 24 },

  avatarSection: { alignItems: "center", marginBottom: 32 },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  changePhotoBtn: { paddingVertical: 4 },
  changePhotoTxt: { fontSize: 15, fontWeight: "600" },

  sectionLabel: {
    fontSize: 12, fontWeight: "600",
    textTransform: "uppercase", letterSpacing: 0.5,
    marginBottom: 10, marginTop: 4,
  },
  card: {
    borderRadius: 16, padding: 16,
    marginBottom: 24, gap: 4,
  },
  optionsCard: { padding: 0, overflow: "hidden" },
  optionRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  optionTxt: { fontSize: 15, fontWeight: "600" },
});
