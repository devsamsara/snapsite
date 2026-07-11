import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { HeroBackdrop } from '@/components/ui/hero-backdrop';
import { useColors } from '@/hooks/use-colors';
import { useCardStyle } from '@/hooks/use-card-style';
import { useEffect, useState } from 'react';

import * as ImagePicker from 'expo-image-picker';

import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  DeleteCompanyDocument,
  DeleteUserDocument,
  GetUploadUrlDocument,
  UpdateUserDocument,
  UpdateUserPictureDocument,
  User,
  UserRole,
} from '@/gql/graphql';
import { useAuth } from '@/lib/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { PressableScale } from '@/components/ui/pressable-scale';
import { AppAlert } from '@/components/ui/app-alert';
import { BlurView } from 'expo-blur';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { apolloClient } from '@/lib/graphql-client';
import { ensureFileUri } from '@/lib/upload-service';
import * as Haptics from 'expo-haptics';
import { AppInput } from '@/components/ui/app-input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

type FormValues = {
  name: string;
  email: string;
  phone?: string;
  role?: string;
  company?: string;
};

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const colorScheme = useColorScheme();
  const { signOut, user, updateUser } = useAuth();

  const cardStyle = useCardStyle();

  const isOwner = user?.role === UserRole.Admin || user?.role === UserRole.Root;
  const isMember =
    user?.role === UserRole.Admin || user?.role === UserRole.User;

  const enterOpacity = useSharedValue(0);
  const enterScale = useSharedValue(1.06);
  const insets = useSafeAreaInsets();
  const isAdmin = user?.role === UserRole.Admin || user?.role === UserRole.Root;

  const schema = z.object({
    name: z
      .string()
      .min(2, t('validation.minLength', { min: 2 }))
      .max(60, t('validation.maxLength', { max: 60 })),
    email: z
      .string()
      .min(1, t('validation.required'))
      .email(t('validation.emailInvalid')),
    phone: z
      .string()
      .max(20, t('validation.maxLength', { max: 20 }))
      .optional()
      .or(z.literal('')),
    role: z
      .string()
      .max(50, t('validation.maxLength', { max: 50 }))
      .optional()
      .or(z.literal('')),
    company: z
      .string()
      .max(80, t('validation.maxLength', { max: 80 }))
      .optional()
      .or(z.literal('')),
  });

  const {
    control,
    handleSubmit,
    formState: { isValid, isDirty, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      role: user?.role || '',
      company: user?.company?.name || '',
    },
    mode: 'onChange',
  });
  const [avatarUri, setAvatarUri] = useState<string | null>(
    user?.avatarUrl ?? null
  );

  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const scrollY = useSharedValue(0);

  const stickyBarStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [110, 150],
      [0, 1],
      Extrapolation.CLAMP
    ),
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [110, 150],
          [-10, 0],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));
  useEffect(() => {
    enterOpacity.value = withTiming(1, {
      duration: 400,
      easing: Easing.out(Easing.quad),
    });
    enterScale.value = withSpring(1, {
      damping: 22,
      stiffness: 160,
      mass: 0.8,
    });
  }, []);

  const enterStyle = useAnimatedStyle(() => ({
    flex: 1,
    opacity: enterOpacity.value,
    transform: [{ scale: enterScale.value }],
  }));

  const Sl = ({ label }: { label: string }) => (
    <Text style={[S.sectionLabel, { color: colors.muted }]}>
      {label.toUpperCase()}
    </Text>
  );


  const handleBack = () => {
    if (router.canGoBack()) router.back();
  };

  // ── Upload avatar to S3 (mismo patrón que project/[id] con ensureFileUri) ────
  const uploadAvatarToS3 = async (localUri: string): Promise<string> => {
    // Paso 0: normalizar URI a file:// igual que en project/[id]
    const safeUri = await ensureFileUri(localUri);

    const ext = safeUri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      heic: 'image/heic',
      heif: 'image/heif',
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
    if (!localResponse.ok)
      throw new Error(`No se pudo leer el archivo: ${safeUri}`);
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
        AppAlert.alert(
          t('common.permissionRequired'),
          t('editProfile.photoPermissionMessage')
        );
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
        AppAlert.alert(
          t('common.permissionRequired'),
          t('editProfile.photoPermissionMessage')
        );
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
        updateUser({
          ...user!,
          avatarUrl: response.updateUserPicture.avatarUrl ?? remoteUrl,
        });
        setAvatarUri(remoteUrl);
      }
    } catch (err: any) {
      console.error('[EditProfile] Photo upload error:', err);
      AppAlert.alert(
        t('common.error'),
        err?.message ?? t('editProfile.photoUploadError')
      );
      setAvatarUri(user?.avatarUrl ?? null);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // ── Action sheet igual que el thumbnail del proyecto ──────────────────────
  const handleChangePhoto = () => {
    Haptics.selectionAsync();
    AppAlert.alert(
      t('editProfile.changePhoto'),
      t('editProfile.changePhotoDesc'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('addPhoto.takePhoto'),
          onPress: () => pickAndUploadPhoto('camera'),
        },
        {
          text: t('addPhoto.selectGallery'),
          onPress: () => pickAndUploadPhoto('library'),
        },
      ]
    );
  };

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
        AppAlert.alert(
          t('editProfile.successTitle'),
          t('editProfile.successMessage'),
          [{ text: t('common.ok'), onPress: () => router.back() }]
        );
      }
    } catch (error: any) {
      console.error('[EditProfile] Save error:', error);
      AppAlert.alert(
        t('common.error'),
        error.message || t('editProfile.errorSave')
      );
    }
  };


  return (
    <ScreenContainer edgeToEdge className="p-0">
      <Animated.View style={enterStyle} className="bg-background">
        <HeroBackdrop height={230 + insets.top} />
        <BlurView
          intensity={10}
          tint={colorScheme}
          style={[
            S.header,
            StyleSheet.absoluteFill,
            {
              paddingTop: insets.top + 20,
              zIndex: 1,
              height: 150,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
        >
          <PressableScale onPress={handleBack} style={[S.backBtn]}>
            <MaterialIcons
              name="arrow-back-ios-new"
              size={22}
              color={colors.foreground}
            />
          </PressableScale>
          <View style={S.headerTop}>
            <View style={S.flex1}>
              <Text style={[S.workspaceLabel, { color: colors.muted }]}>
                {t('editProfile.title')}
              </Text>
              <Text style={[S.workspaceName, { color: colors.foreground }]}>
                {t('editProfile.title')}
              </Text>
            </View>
          </View>
          <PressableScale
            onPress={handleSubmit(onSave)}
            disabled={!isValid || !isDirty || isSubmitting}
            style={[
              S.saveBtn,
              {
                backgroundColor:
                  !isValid || !isDirty || isSubmitting
                    ? isSubmitting
                      ? colors.primary
                      : colors.border
                    : colors.primary,
              },
              (!isValid || !isDirty) && !isSubmitting && { opacity: 0.5 },
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
                  { color: !isValid || !isDirty ? colors.muted : '#FFFFFF' },
                ]}
              >
                {t('common.save')}
              </Text>
            )}
          </PressableScale>
        </BlurView>

        <Animated.ScrollView
          // onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={S.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Avar section */}
          <View style={S.avatarSection}>
            <Sl label={t('accountDetails.sectionInfo')} />
            <View style={S.avatarWrapper}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={S.avatarImage} />
              ) : (
                <View
                  style={[
                    S.avatarImage,
                    S.avatarPlaceholder,
                    { backgroundColor: colors.primary },
                  ]}
                >
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

          {/*Seccion Info Personal*/}
          <View style={S.sectionTitleWrapper}>
            <Sl label={t('editProfile.personalInfo')} />
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
          </View>

          {/*Seccion Info profesional*/}
          <View style={S.sectionTitleWrapper}>
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
          </View>
        </Animated.ScrollView>
        <Animated.View
          style={[S.stickyBar, stickyBarStyle, { paddingTop: insets.top + 6 }]}
          pointerEvents="none"
        >
          {/* Fondo sólido (no blur): el texto tiene que leerse nítido, no
              difuminado contra un cristal esmerilado. */}
          <View style={[S.stickyGlass, { backgroundColor: colors.background }]}>
            <Text
              numberOfLines={1}
              style={[S.stickyTitle, { color: colors.foreground }]}
            >
              {t('settings.title')}
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  saveBtnTxt: { fontSize: 15, fontWeight: '700' },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  avatarWrapper: {
    position: 'relative',
    width: 88,
    height: 88,
    marginBottom: 12,
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
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
  flex1: { flex: 1 },
  flex1Ml3: { flex: 1, marginLeft: 12 },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginTop: -18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },

  // Header — jerarquía tipográfica marcada: eyebrow uppercase + nombre grande
  header: {
    paddingHorizontal: 74,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  workspaceLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  workspaceName: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  teamRow: { flexDirection: 'row', alignItems: 'center' },
  avatarsTouchable: { flexDirection: 'row', marginRight: 12 },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  headerAvatarMore: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: -8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarMoreText: { fontSize: 11, fontWeight: '600' },
  inviteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inviteBtnText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  // Scroll
  scrollContent: { paddingBottom: 120, paddingTop: 150 },

  // Sticky glass bar (aparece al colapsar el hero)
  stickyBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  stickyGlass: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  stickyTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },

  // Sections — breathing room amplio y títulos con más peso
  section: { marginTop: 28 },
  sectionTitleWrapper: { paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seeAllText: { fontSize: 14, fontWeight: '600' },
  horizontalListContent: { paddingHorizontal: 20, paddingVertical: 14 },

  // Status grid
  statusGrid: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statusCard: {
    width: '48%',
    aspectRatio: 1.5,
    borderRadius: 18,
    padding: 16,
    justifyContent: 'space-between',
  },
  statusCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusCardLabel: { fontSize: 16, fontWeight: '600' },
  statusIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCardCount: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },

  // Project card
  projectCardWrapper: { marginRight: 16, width: 300 },
  projectCard: { borderRadius: 18, padding: 16 },
  projectCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  statusBadgeText: { fontSize: 12, fontWeight: '600' },
  progressSection: { marginBottom: 12 },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 12, marginLeft: 6 },
  projectCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarRow: { flexDirection: 'row' },
  memberAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: { fontSize: 10, fontWeight: '600', color: '#FFFFFF' },

  // Image card
  imageCardWrapper: { marginRight: 12 },
  imageCardInner: { borderRadius: 12, overflow: 'hidden' },
  imageCardImg: { width: 140, height: 140 },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },

  // Location card
  locationCardWrapper: { marginRight: 16, width: 200 },
  locationCard: { borderRadius: 18, padding: 16 },
  locationCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  locationProjectsText: { fontSize: 12, marginLeft: 4 },
  profileCard: {
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    marginBottom: 4,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 11, marginTop: 2 },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 36,
    alignSelf: 'center',
  },
  // Avatar in account row
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700' },
  profileName: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  profileEmail: { fontSize: 13, marginTop: 2 },
  profileRole: { fontSize: 13, marginTop: 2 },

  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowTextBlock: { flex: 1, marginLeft: 16 },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  rowSublabel: { fontSize: 12, marginTop: 1 },
  cardStyleRow: { paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  segmentedControl: { flexDirection: 'row', gap: 8, marginLeft: 36 },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  segmentBtnText: { fontSize: 13, fontWeight: '700' },
  langPill: { flexDirection: 'row', borderRadius: 12, padding: 3 },
  langBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9 },
  langBtnText: { fontSize: 12, fontWeight: '600' },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footer: { alignItems: 'center', paddingTop: 24, paddingBottom: 8, gap: 4 },
  footerText: { fontSize: 12 },
  backBtn: {
    width: 32,
    height: 32,
  },
  listCard: { padding: 0, overflow: 'hidden' },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoLabel: { fontSize: 13, fontWeight: '500' },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    maxWidth: '55%',
    textAlign: 'right',
  },
  rowLast: { borderBottomWidth: 0 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  actionLabel: { fontSize: 15, fontWeight: '600' },
  actionSub: { fontSize: 12, marginTop: 2, maxWidth: 240 },
});
