/**
 * app/auth/register.tsx
 *
 * LÓGICA: 100% original preservada (step1 empresa, step2 cuenta, signUp, zod, etc.)
 * ESTILO: basado en el componente de referencia:
 *   - Header fijo fuera del scroll: botón atrás 44×44, título+subtítulo
 *   - Step indicator (2 puntos + línea conectora) visible cuando step === 2
 *   - Slides container con Animated.Value translateX (300ms)
 *   - Form footer con términos de servicio + footer "¿Ya tienes cuenta?"
 */
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import RNAnimated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/hooks/use-colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AppInput } from '@/components/ui/app-input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/lib/auth-context';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as z from 'zod';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Tipos originales ─────────────────────────────────────────────────────────
type Step1Values = { companyName: string; industry: string; companySize: string };
type Step2Values = { fullName: string; email: string; password: string };

const TOTAL_STEPS = 2;

export default function RegisterScreen() {
  const { t }                 = useTranslation();
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const colors                = useColors();
  const router                = useRouter();
  const insets                = useSafeAreaInsets();

  // Animación de slide (estilo referencia)
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateToStep = (targetStep: number) => {
    Animated.timing(slideAnim, {
      toValue: -(targetStep - 1) * SCREEN_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setStep(targetStep);
  };

  // ─── Schemas originales ───────────────────────────────────────────────────
  const step1Schema = z.object({
    companyName: z.string().min(2, t('validation.companyRequired')),
    industry:    z.string().min(2, t('validation.industryRequired')),
    companySize: z.string().min(1, t('validation.sizeRequired')),
  });
  const step2Schema = z.object({
    fullName: z.string().min(2, t('validation.nameRequired')),
    email:    z.string().email(t('validation.emailInvalid')),
    password: z.string()
      .min(10, t('validation.passwordMin', { min: 10 }))
      .regex(/[A-Z]/, t('validation.passwordUppercase'))
      .regex(/[a-z]/, t('validation.passwordLowercase')),
  });

  const { signUp } = useAuth();

  const step1 = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: { companyName: '', industry: '', companySize: '' },
  });
  const step2 = useForm<Step2Values>({
    resolver: zodResolver(step2Schema),
    defaultValues: { fullName: '', email: '', password: '' },
  });

  // ─── Handlers originales ──────────────────────────────────────────────────
  const goNext = step1.handleSubmit(() => animateToStep(2));

  const onRegister = step2.handleSubmit(async (data) => {
    setLoading(true);
    try {
      await signUp(data.fullName, data.email, data.password);
      // signUp navigates to /onboarding automatically on success
    } catch (e: any) {
      Alert.alert(
        t('auth.register.errorTitle'),
        e?.message ?? t('auth.register.errorMessage'),
      );
    } finally {
      setLoading(false);
    }
  });

  const handleBack = () => {
    if (step === 2) {
      animateToStep(1);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/auth/login');
    }
  };

  const stepTitles    = [t('auth.register.step1Title'), t('auth.register.step2Title')];
  const stepSubtitles = [t('auth.register.step1Subtitle'), t('auth.register.step2Subtitle')];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[S.root, { backgroundColor: colors.background }]}
    >
      {/* ── Header fijo (estilo referencia) ── */}
      <View style={[S.headerContainer, { paddingTop: insets.top + 12 }]}>
        {/* Botón atrás 44×44 */}
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

        {/* Título + subtítulo */}
        <View style={S.header}>
          <Text style={[S.title, { color: colors.foreground }]}>
            {stepTitles[step - 1]}
          </Text>
          <Text style={[S.subtitle, { color: colors.muted }]}>
            {stepSubtitles[step - 1]}
          </Text>
        </View>

        {/* Step indicator — solo visible en step 2 */}
        {step === 2 && (
          <View style={S.stepIndicator}>
            <View style={[S.stepDot, { backgroundColor: step === 1 ? colors.primary : colors.border }]} />
            <View style={[S.stepLine, { backgroundColor: step === 2 ? colors.primary : colors.border }]} />
            <View style={[S.stepDot, { backgroundColor: step === 2 ? colors.primary : colors.border }]} />
          </View>
        )}
      </View>

      {/* ── Slides container animado (estilo referencia) ── */}
      <Animated.View style={[S.slidesContainer, { transform: [{ translateX: slideAnim }] }]}>

        {/* ── Slide 1: Empresa ── */}
        <ScrollView
          style={S.slide}
          contentContainerStyle={[S.slideContent, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={S.formContainer}>
            <View style={S.formFields}>
              {/* Barra de progreso original (dentro del contenido) */}
              <View style={S.progressSection}>
                <View style={S.dots}>
                  {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        S.dot,
                        i + 1 === step
                          ? { backgroundColor: colors.primary, width: 20 }
                          : i + 1 < step
                          ? { backgroundColor: colors.primary, opacity: 0.4 }
                          : { backgroundColor: colors.border },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[S.stepLabel, { color: colors.muted }]}>
                  {t('auth.register.step', { current: step, total: TOTAL_STEPS })}
                </Text>
              </View>

              {/* Barra lineal fina */}
              <View style={[S.track, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    S.fill,
                    { width: `${(step / TOTAL_STEPS) * 100}%`, backgroundColor: colors.primary },
                  ]}
                />
              </View>

              {/* Campos paso 1 — lógica original */}
              <RNAnimated.View entering={FadeInRight} exiting={FadeOutLeft}>
                <AppInput
                  label={t('auth.register.companyName')}
                  name="companyName"
                  control={step1.control}
                  placeholder={t('auth.register.companyNamePlaceholder')}
                  icon="building.2.fill"
                />
                <AppInput
                  label={t('auth.register.industry')}
                  name="industry"
                  control={step1.control}
                  placeholder={t('auth.register.industryPlaceholder')}
                  icon="briefcase.fill"
                />
                <AppInput
                  label={t('auth.register.companySize')}
                  name="companySize"
                  control={step1.control}
                  placeholder={t('auth.register.companySizePlaceholder')}
                  icon="person.3.fill"
                  keyboardType="numeric"
                />
              </RNAnimated.View>
            </View>

            {/* Form footer con botón + términos + footer login */}
            <View style={S.formFooter}>
              <Button
                title={t('auth.register.next')}
                onPress={goNext}
                size="lg"
                rightIcon="arrow-forward"
              />

              <View style={S.terms}>
                <Text style={[S.termsText, { color: colors.muted }]}>{t('auth.register.terms')}</Text>
                <Pressable onPress={() => router.push('/modals/terms-modal')}>
                  <Text style={[S.termsLink, { color: colors.primary }]}>{t('auth.register.termsLink')}</Text>
                </Pressable>
                <Text style={[S.termsText, { color: colors.muted }]}>{t('auth.register.and')}</Text>
                <TouchableOpacity onPress={() => router.push('/modals/privacy-modal')}>
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

        {/* ── Slide 2: Cuenta ── */}
        <ScrollView
          style={S.slide}
          contentContainerStyle={[S.slideContent, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={S.formContainer}>
            <View style={S.formFields}>
              {/* Campos paso 2 — lógica original */}
              <RNAnimated.View entering={FadeInRight} exiting={FadeOutLeft}>
                <AppInput
                  label={t('auth.register.fullName')}
                  name="fullName"
                  control={step2.control}
                  placeholder={t('auth.register.fullNamePlaceholder')}
                  icon="person.fill"
                />
                <AppInput
                  label={t('auth.register.email')}
                  name="email"
                  control={step2.control}
                  placeholder={t('auth.register.emailPlaceholder')}
                  icon="envelope.fill"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <AppInput
                  label={t('auth.register.password')}
                  name="password"
                  control={step2.control}
                  placeholder={t('auth.register.passwordPlaceholder')}
                  icon="lock.fill"
                  secureTextEntry
                />
                <Text style={[S.hint, { color: colors.muted }]}>
                  {t('auth.register.passwordHint')}
                </Text>
              </RNAnimated.View>
            </View>

            <View style={S.formFooter}>
              <Button
                title={t('auth.register.createAccount')}
                onPress={onRegister}
                isLoading={loading}
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

  // Header fijo (estilo referencia)
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
  header: {
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

  // Step indicator (estilo referencia)
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

  // Slides (estilo referencia)
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

  // Barra de progreso original (dentro del contenido)
  progressSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dots:            { flexDirection: 'row', gap: 6 },
  dot:             { height: 8, width: 8, borderRadius: 4 },
  stepLabel:       { fontSize: 12, fontWeight: '600' },
  track:           { height: 3, borderRadius: 2, overflow: 'hidden', marginBottom: 16 },
  fill:            { height: '100%', borderRadius: 2 },

  // Hint contraseña
  hint: { fontSize: 12, marginTop: -8, marginBottom: 16, paddingHorizontal: 2 },

  // Form footer (estilo referencia)
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
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: '700' },
});
