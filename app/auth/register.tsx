/**
 * app/auth/register.tsx
 *
 * Estilo basado en el componente de referencia:
 *   - Botón atrás en header
 *   - Título + subtítulo por paso
 *   - Step indicator (puntos + línea) cuando isAdmin = true
 *   - Slide horizontal animado entre pasos
 *   - Step 1: checkbox "¿Eres admin?", nickname, email, password, confirmPassword
 *   - Step 2 (solo admin): companyName, companyEmail, companyPhone, companyAddress
 *   - Términos de servicio + Política de privacidad
 *   - Footer "¿Ya tienes cuenta? Inicia sesión"
 *
 * Funcionalidades originales preservadas:
 *   - Validación con react-hook-form + zod
 *   - signUp() del auth-context
 *   - Navegación a /(tabs) tras registro
 */
import React, { useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as z from 'zod';

import { useAuth } from '@/lib/auth-context';
import { useColors } from '@/hooks/use-colors';
import { AppInput } from '@/components/ui/app-input';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type FormValues = {
  nickname:        string;
  email:           string;
  password:        string;
  confirmPassword: string;
  isAdmin:         boolean;
  companyName:     string;
  companyEmail:    string;
  companyPhone:    string;
  companyAddress:  string;
};

export default function RegisterScreen() {
  const { t }                         = useTranslation();
  const colors                        = useColors();
  const router                        = useRouter();
  const insets                        = useSafeAreaInsets();
  const { signUp }                    = useAuth();

  const [currentStep, setCurrentStep] = useState(0);
  const [isAdmin, setIsAdmin]         = useState(false);
  const [isLoading, setIsLoading]     = useState(false);
  const slideAnim                     = useRef(new Animated.Value(0)).current;

  const step1Schema = z.object({
    nickname:        z.string().min(2, t('validation.nicknameRequired') || 'Mínimo 2 caracteres'),
    email:           z.string().email(t('validation.emailInvalid') || 'Email inválido'),
    password:        z.string().min(6, t('validation.passwordMin', { min: 6 }) || 'Mínimo 6 caracteres'),
    confirmPassword: z.string().min(1, t('validation.confirmRequired') || 'Confirma tu contraseña'),
  }).refine(d => d.password === d.confirmPassword, {
    message: t('validation.passwordMismatch') || 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

  const step2Schema = z.object({
    companyName:    z.string().min(2, t('validation.companyRequired') || 'Requerido'),
    companyEmail:   z.string().email(t('validation.emailInvalid') || 'Email inválido'),
    companyPhone:   z.string().min(6, t('validation.phoneRequired') || 'Requerido'),
    companyAddress: z.string().min(4, t('validation.addressRequired') || 'Requerido'),
  });

  const {
    control,
    getValues,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      nickname: '', email: '', password: '', confirmPassword: '',
      isAdmin: false,
      companyName: '', companyEmail: '', companyPhone: '', companyAddress: '',
    },
  });

  const animateToStep = (step: number) => {
    Animated.timing(slideAnim, {
      toValue: -step * SCREEN_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setCurrentStep(step);
  };

  const handleAdminToggle = () => {
    const next = !isAdmin;
    setIsAdmin(next);
    setValue('isAdmin', next);
  };

  const handleNext = async () => {
    clearErrors(['nickname', 'email', 'password', 'confirmPassword']);
    const values = getValues();
    const result = step1Schema.safeParse(values);
    if (!result.success) {
      result.error.issues.forEach(issue => {
        const field = issue.path[0] as keyof FormValues;
        setError(field, { message: issue.message });
      });
      return;
    }
    if (isAdmin) {
      animateToStep(1);
    } else {
      await onSubmit({ ...values, isAdmin: false });
    }
  };

  const handleStep2Submit = async () => {
    clearErrors(['companyName', 'companyEmail', 'companyPhone', 'companyAddress']);
    const values = getValues();
    const result = step2Schema.safeParse(values);
    if (!result.success) {
      result.error.issues.forEach(issue => {
        const field = issue.path[0] as keyof FormValues;
        setError(field, { message: issue.message });
      });
      return;
    }
    await onSubmit({ ...values, isAdmin: true });
  };

  const handleBack = () => {
    if (currentStep === 1) {
      animateToStep(0);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/auth/login');
    }
  };

  const onSubmit = async (form: FormValues) => {
    setIsLoading(true);
    try {
      await signUp(form.nickname, form.email, form.password);
    } catch (e: any) {
      Alert.alert(
        t('auth.register.errorTitle'),
        e?.message ?? t('auth.register.errorMessage'),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonLabel = () => {
    if (isLoading) return t('auth.register.creating');
    return isAdmin ? t('auth.register.continue') : t('auth.register.createAccount');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[S.root, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={[S.headerContainer, { paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            S.backButton,
            { backgroundColor: colors.surface, borderRadius: 10 },
            pressed && { opacity: 0.7 },
          ]}
        >
          <IconSymbol name="chevron.left" size={22} color={colors.foreground} />
        </Pressable>

        <View style={S.headerText}>
          <Text style={[S.title, { color: colors.foreground }]}>
            {currentStep === 0 ? t('auth.register.step1Title') : t('auth.register.step2Title')}
          </Text>
          <Text style={[S.subtitle, { color: colors.muted }]}>
            {currentStep === 0 ? t('auth.register.step1Subtitle') : t('auth.register.step2Subtitle')}
          </Text>
        </View>

        {isAdmin && (
          <View style={S.stepIndicator}>
            <View style={[S.stepDot, { backgroundColor: currentStep === 0 ? colors.primary : colors.border }]} />
            <View style={[S.stepLine, { backgroundColor: currentStep === 1 ? colors.primary : colors.border }]} />
            <View style={[S.stepDot, { backgroundColor: currentStep === 1 ? colors.primary : colors.border }]} />
          </View>
        )}
      </View>

      {/* Slides */}
      <Animated.View style={[S.slidesContainer, { transform: [{ translateX: slideAnim }] }]}>

        {/* Step 1 */}
        <ScrollView
          style={S.slide}
          contentContainerStyle={[S.slideContent, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={S.formContainer}>
            <View style={S.formFields}>

              <Pressable style={[S.checkboxRow, S.adminCheckbox]} onPress={handleAdminToggle}>
                <View style={[
                  S.checkbox,
                  {
                    borderColor: isAdmin ? colors.primary : colors.border,
                    backgroundColor: isAdmin ? colors.primary : 'transparent',
                  },
                ]}>
                  {isAdmin && <IconSymbol name="checkmark" size={12} color="#fff" />}
                </View>
                <Text style={[S.checkboxLabel, { color: colors.foreground }]}>
                  {t('auth.register.isAdmin')}
                </Text>
              </Pressable>

              <Controller control={control} name="nickname" render={() => (
                <AppInput
                  label={t('auth.register.nickname')}
                  name="nickname"
                  control={control}
                  placeholder={t('auth.register.nicknamePlaceholder')}
                  icon="person.fill"
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={errors.nickname?.message}
                />
              )} />

              <Controller control={control} name="email" render={() => (
                <AppInput
                  label={t('auth.register.email')}
                  name="email"
                  control={control}
                  placeholder={t('auth.register.emailPlaceholder')}
                  icon="envelope.fill"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={errors.email?.message}
                />
              )} />

              <Controller control={control} name="password" render={() => (
                <AppInput
                  label={t('auth.register.password')}
                  name="password"
                  control={control}
                  placeholder={t('auth.register.passwordPlaceholder')}
                  icon="lock.fill"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={errors.password?.message}
                />
              )} />

              <Controller control={control} name="confirmPassword" render={() => (
                <AppInput
                  label={t('auth.register.confirmPassword')}
                  name="confirmPassword"
                  control={control}
                  placeholder={t('auth.register.confirmPasswordPlaceholder')}
                  icon="lock.fill"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={errors.confirmPassword?.message}
                />
              )} />
            </View>

            <View style={S.formFooter}>
              <Button
                title={getButtonLabel()}
                onPress={handleNext}
                isLoading={isLoading && !isAdmin}
                size="lg"
              />

              <View style={S.terms}>
                <Text style={[S.termsText, { color: colors.muted }]}>{t('auth.register.terms')}</Text>
                <TouchableOpacity onPress={() => router.push('/terms' as never)}>
                  <Text style={[S.termsLink, { color: colors.primary }]}>{t('auth.register.termsLink')}</Text>
                </TouchableOpacity>
                <Text style={[S.termsText, { color: colors.muted }]}>{t('auth.register.and')}</Text>
                <TouchableOpacity onPress={() => router.push('/privacy' as never)}>
                  <Text style={[S.termsLink, { color: colors.primary }]}>{t('auth.register.privacyLink')}</Text>
                </TouchableOpacity>
              </View>

              <View style={S.footer}>
                <Text style={[S.footerText, { color: colors.muted }]}>{t('auth.register.hasAccount')}</Text>
                <TouchableOpacity onPress={() => router.push('/auth/login')}>
                  <Text style={[S.footerLink, { color: colors.primary }]}>{t('auth.register.login')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Step 2 — empresa (solo admin) */}
        <ScrollView
          style={S.slide}
          contentContainerStyle={[S.slideContent, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={S.formContainer}>
            <View style={S.formFields}>

              <Controller control={control} name="companyName" render={() => (
                <AppInput
                  label={t('auth.register.companyName')}
                  name="companyName"
                  control={control}
                  placeholder={t('auth.register.companyNamePlaceholder')}
                  icon="building.2.fill"
                  error={errors.companyName?.message}
                />
              )} />

              <Controller control={control} name="companyEmail" render={() => (
                <AppInput
                  label={t('auth.register.companyEmail')}
                  name="companyEmail"
                  control={control}
                  placeholder={t('auth.register.companyEmailPlaceholder')}
                  icon="envelope.fill"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={errors.companyEmail?.message}
                />
              )} />

              <Controller control={control} name="companyPhone" render={() => (
                <AppInput
                  label={t('auth.register.companyPhone')}
                  name="companyPhone"
                  control={control}
                  placeholder={t('auth.register.companyPhonePlaceholder')}
                  icon="phone.fill"
                  keyboardType="phone-pad"
                  error={errors.companyPhone?.message}
                />
              )} />

              <Controller control={control} name="companyAddress" render={() => (
                <AppInput
                  label={t('auth.register.companyAddress')}
                  name="companyAddress"
                  control={control}
                  placeholder={t('auth.register.companyAddressPlaceholder')}
                  icon="map.fill"
                  error={errors.companyAddress?.message}
                />
              )} />
            </View>

            <View style={S.formFooter}>
              <Button
                title={isLoading ? t('auth.register.creating') : t('auth.register.createAccount')}
                onPress={handleStep2Submit}
                isLoading={isLoading}
                size="lg"
              />
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },

  headerContainer: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },

  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stepLine: {
    width: 40,
    height: 2,
    marginHorizontal: 6,
  },

  slidesContainer: {
    flex: 1,
    flexDirection: 'row',
    width: SCREEN_WIDTH * 2,
  },
  slide: {
    width: SCREEN_WIDTH,
  },
  slideContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },

  formContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  formFields: {
    flex: 1,
  },

  adminCheckbox: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '500',
  },

  formFooter: {
    paddingTop: 16,
  },
  terms: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 14,
    gap: 2,
  },
  termsText: {
    fontSize: 12,
    lineHeight: 18,
  },
  termsLink: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    paddingTop: 16,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
