
import { PressableScale } from '@/components/ui/pressable-scale';
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import * as ImagePicker from 'expo-image-picker';
import { ScreenContainer } from "@/components/screen-container";
import { AppInput } from "@/components/ui/app-input";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ScreenHeader } from "@/components/ui/screen-header";
import { useColors } from "@/hooks/use-colors";
import { useCardStyle } from "@/hooks/use-card-style";
import { useAuth } from "@/lib/auth-context";
import { UserRole, UpdateUserDocument, UpdateUserPictureDocument, GetUploadUrlDocument, User } from '@/gql/graphql';
import { ensureFileUri } from '@/lib/upload-service';
import { apolloClient } from "@/lib/graphql-client";
import { AppAlert } from '@/components/ui/app-alert';

type FormValues = { name: string; email: string; phone?: string; role?: string; company?: string };

export default function EditProfileScreen() {
  const { t }     = useTranslation();
  const router    = useRouter();
  const colors    = useColors();
  const cardStyle = useCardStyle();
  const { user, updateUser }  = useAuth();

  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatarUrl ?? null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const isAdmin = user?.role === UserRole.Admin || user?.role === UserRole.Root;

  const schema = z.object({
    name: z.string().min(2, t('validation.minLength', { min: 2 })).max(60, t('validation.maxLength', { max: 60 })),
    email: z.string().min(1, t('validation.required')).email(t('validation.emailInvalid')),
    phone: z.string().max(20, t('validation.maxLength', { max: 20 })).optional().or(z.literal('')),
    role: z.string().max(50, t('validation.maxLength', { max: 50 })).optional().or(z.literal('')),
    company: z.string().max(80, t('validation.maxLength', { max: 80 })).optional().or(z.literal('')),
  });

  const {
    control,
    handleSubmit,
    formState: { isValid, isDirty, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:    user?.name || "",
      email:   user?.email || "",
      phone:   user?.phone || "",
      role:    user?.role || "",
      company: user?.company?.name || "",
    },
    mode: "onChange",
  });

  // ── Upload avatar to S3 (mismo patrón que project/[id] con ensureFileUri) ────
  const uploadAvatarToS3 = async (localUri: string): Promise<string> => {
    // Paso 0: normalizar URI a file:// igual que en project/[id]
    const safeUri = await ensureFileUri(localUri);

    const ext = safeUri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg',
      png: 'image/png', webp: 'image/webp',
      heic: 'image/heic', heif: 'image/heif',
    };
    const mimeType = mimeMap[ext] ?? 'image/jpeg';
    const fileName = `avatar_${user?.id}_${Date.now()}.${ext === 'jpeg' ? 'jpg' : ext}`;

    // Paso 1: obtener presigned URL del backend
    const { data: urlData } = await apolloClient.query({
      query: GetUploadUrlDocument,
      variables: { fileName, mimeType },
      fetchPolicy: 'no-cache',
    });
    if (!urlData?.getUploadUrl?.uploadUrl) throw new Error('No upload URL');
    const { uploadUrl, fileUrl } = urlData.getUploadUrl;

    // Paso 2: leer como blob con fetch (igual que upload-service)
    const localResponse = await fetch(safeUri);
    if (!localResponse.ok) throw new Error(`No se pudo leer el archivo: ${safeUri}`);
    const blob = await localResponse.blob();

    // Paso 3: PUT directo a S3
    const s3Response = await fetch(uploadUrl, {
      method: 'PUT',
      body: blob,
      headers: { 'Content-Type': mimeType },
    });
    if (!s3Response.ok) {
      const xml = await s3Response.text().catch(() => '');
      throw new Error(`S3 upload error ${s3Response.status}: ${xml}`);
    }

    return fileUrl;
  };

  // ── Pick and upload photo (camera or library) ────────────────────────────
  const pickAndUploadPhoto = async (source: 'camera' | 'library') => {
    let result: ImagePicker.ImagePickerResult;

    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (perm.status !== 'granted') {
        AppAlert.alert(t('common.permissionRequired'), t('editProfile.photoPermissionMessage'));
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        AppAlert.alert(t('common.permissionRequired'), t('editProfile.photoPermissionMessage'));
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
    }

    if (result.canceled || !result.assets?.[0]?.uri) return;

    const localUri = result.assets[0].uri;
    setAvatarUri(localUri);
    setUploadingPhoto(true);

    try {
      const remoteUrl = await uploadAvatarToS3(localUri);

      const { data: response } = await apolloClient.mutate({
        mutation: UpdateUserPictureDocument,
        variables: {
          userId: user!.id,
          picture: remoteUrl,
        },
      });

      if (response?.updateUserPicture) {
        updateUser({ ...user!, avatarUrl: response.updateUserPicture.avatarUrl ?? remoteUrl });
        setAvatarUri(remoteUrl);
      }
    } catch (err: any) {
      console.error('[EditProfile] Photo upload error:', err);
      AppAlert.alert(t('common.error'), err?.message ?? t('editProfile.photoUploadError'));
      setAvatarUri(user?.avatarUrl ?? null);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // ── Action sheet igual que el thumbnail del proyecto ──────────────────────
  const handleChangePhoto = () => {
    Haptics.selectionAsync();
    AppAlert.alert(t('editProfile.changePhoto'), t('editProfile.changePhotoDesc'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('addPhoto.takePhoto'), onPress: () => pickAndUploadPhoto('camera') },
      { text: t('addPhoto.selectGallery'), onPress: () => pickAndUploadPhoto('library') },
    ]);
  };

  // ── Save form ──────────────────────────────────────────────────────────────
  const onSave = async (data: FormValues) => {
    if (!user?.id) return;

    try {
      const { data: response, error: errors } = await apolloClient.mutate({
        mutation: UpdateUserDocument,
        variables: {
          updateUserId: user.id,
          input: {
            company: data.company,
            phone: data.phone,
            name: data.name,
            email: isAdmin ? data.email : undefined,
            role: isAdmin ? (data.role as UserRole) : undefined,
          },
        },
      });

      if (errors) throw new Error(errors.message);

      if (response?.updateUser) {
        updateUser(response.updateUser as User);
        AppAlert.alert(t('editProfile.successTitle'), t('editProfile.successMessage'), [
          { text: t('common.ok'), onPress: () => router.back() },
        ]);
      }
    } catch (error: any) {
      console.error("[EditProfile] Save error:", error);
      AppAlert.alert(t('common.error'), error.message || t('editProfile.errorSave'));
    }
  };

  return (
    <ScreenContainer className="p-0">
      <View style={{ flex: 1, backgroundColor: colors.background }}>

        {/* ── Header ── */}
        <ScreenHeader
          title={t('editProfile.title')}
          onBack={() => router.back()}
          withSafeArea={false}
          right={
            <PressableScale
              onPress={handleSubmit(onSave)}
              disabled={!isValid || !isDirty || isSubmitting}
              style={[
                S.saveBtn,
                {
                  backgroundColor: (!isValid || !isDirty || isSubmitting)
                    ? (isSubmitting ? colors.primary : colors.border)
                    : colors.primary
                },
                (!isValid || !isDirty) && !isSubmitting && { opacity: 0.5 }
              ]}
            >
              {isSubmitting ? (
                <View style={S.loadingContainer}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
              ) : (
                <Text
                  style={[
                    S.saveBtnTxt,
                    { color: (!isValid || !isDirty) ? colors.muted : "#FFFFFF" }
                  ]}
                >
                  {t('common.save')}
                </Text>
              )}
            </PressableScale>
          }
        />

        {/* ── Content ── */}
        <ScrollView
          contentContainerStyle={S.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* Foto de perfil — mismo patrón que el thumbnail del proyecto */}
          <View style={S.avatarSection}>
            <View style={S.avatarWrapper}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={S.avatarImage} />
              ) : (
                <View style={[S.avatarImage, S.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                  <IconSymbol name="person.fill" size={40} color="#FFFFFF" />
                </View>
              )}
              {/* Botón flotante igual que heroPhotoBtn */}
              <PressableScale
                onPress={handleChangePhoto}
                disabled={uploadingPhoto}
                style={[S.avatarPhotoBtn, { backgroundColor: colors.primary }]}
              >
                {uploadingPhoto ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <MaterialIcons name="add-a-photo" size={16} color="#FFF" />
                )}
              </PressableScale>
            </View>
          </View>

          {/* Sección: Información personal */}
          <Text style={[S.sectionLabel, { color: colors.muted }]}>
            {t('editProfile.personalInfo')}
          </Text>
          <View style={[S.card, cardStyle]}>
            <AppInput
              name="name"
              control={control}
              label={t('editProfile.name')}
              placeholder={t('editProfile.namePlaceholder')}
              icon="person"
              autoCapitalize="words"
              returnKeyType="next"
            />
            <AppInput
              name="email"
              control={control}
              label={t('editProfile.email')}
              placeholder={t('editProfile.emailPlaceholder')}
              icon="mail"
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              editable={isAdmin}
            />
            <AppInput
              name="phone"
              control={control}
              label={t('editProfile.phone')}
              placeholder={t('editProfile.phonePlaceholder')}
              icon="phone"
              keyboardType="phone-pad"
              returnKeyType="next"
            />
          </View>

          {/* Sección: Información profesional */}
          <Text style={[S.sectionLabel, { color: colors.muted }]}>
            {t('editProfile.professionalInfo')}
          </Text>
          <View style={[S.card, cardStyle]}>
            <AppInput
              name="role"
              control={control}
              label={t('editProfile.role')}
              placeholder={t('editProfile.rolePlaceholder')}
              icon="briefcase"
              returnKeyType="next"
              editable={isAdmin}
            />
            <AppInput
              name="company"
              control={control}
              label={t('editProfile.company')}
              placeholder={t('editProfile.companyPlaceholder')}
              icon="building"
              returnKeyType="done"
              onSubmitEditing={handleSubmit(onSave)}
              editable={isAdmin}
            />
          </View>

          {/* Sección: Opciones adicionales */}
          <Text style={[S.sectionLabel, { color: colors.muted }]}>
            {t('editProfile.additionalOptions')}
          </Text>
          <View style={[S.card, cardStyle, S.optionsCard]}>
            {/* Cambiar contraseña */}
            <PressableScale
              style={[S.optionRow, { borderBottomColor: colors.border }]}
            >
              <View style={S.optionLeft}>
                <IconSymbol name="lock.fill" size={20} color={colors.primary} />
                <Text style={[S.optionTxt, { color: colors.foreground }]}>
                  {t('editProfile.changePassword')}
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.muted} />
            </PressableScale>
          </View>

          <View style={{ height: 48 }} />
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  saveBtnTxt: { fontSize: 15, fontWeight: "700" },
  loadingContainer: { flexDirection: "row", alignItems: "center", gap: 6 },

  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },

  avatarSection: { alignItems: "center", marginBottom: 24 },
  avatarWrapper: {
    position: 'relative',
    width: 88,
    height: 88,
    marginBottom: 12,
  },
  avatarImage: {
    width: 88, height: 88, borderRadius: 44,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPhotoBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  sectionLabel: {
    fontSize: 11, fontWeight: "700",
    textTransform: "uppercase", letterSpacing: 0.6,
    marginBottom: 8, marginTop: 0,
  },
  card: {
    borderRadius: 16, padding: 16,
    marginBottom: 16, gap: 4,
  },
  optionsCard: { padding: 0, overflow: "hidden" },
  optionRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  optionTxt: { fontSize: 15, fontWeight: "600" },
});
