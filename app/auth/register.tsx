/**
 * app/auth/register.tsx — barra de progreso dentro del card
 *
 * La barra de progreso aparece en la parte superior del card del formulario,
 * no en el header. El header solo tiene el botón de volver.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/hooks/use-colors';
import { useCardStyle } from '@/hooks/use-card-style';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AppInput } from '@/components/ui/app-input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as z from 'zod';

type Step1Values = { companyName: string; industry: string; companySize: string };
type Step2Values = { fullName: string; email: string; password: string };

const TOTAL_STEPS = 2;

export default function RegisterScreen() {
  const { t }                 = useTranslation();
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const colors                = useColors();
  const card                  = useCardStyle();
  const router                = useRouter();
  const insets                = useSafeAreaInsets();

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

  const step1 = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: { companyName: '', industry: '', companySize: '' },
  });
  const step2 = useForm<Step2Values>({
    resolver: zodResolver(step2Schema),
    defaultValues: { fullName: '', email: '', password: '' },
  });

  const goNext    = step1.handleSubmit(() => setStep(2));
  const onRegister = step2.handleSubmit(async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert(t('auth.register.successTitle'), t('auth.register.successMessage'), [
        { text: t('common.ok'), onPress: () => router.replace('/onboarding') },
      ]);
    }, 1500);
  });

  const stepTitles    = [t('auth.register.step1Title'), t('auth.register.step2Title')];
  const stepSubtitles = [
    t('auth.register.step1Subtitle'),
    t('auth.register.step2Subtitle'),
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[S.root, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[
          S.scroll,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header mínimo: solo botón volver */}
        <TouchableOpacity
          onPress={() => (step === 1 ? router.back() : setStep(1))}
          style={[S.backBtn, { backgroundColor: colors.surface }]}
        >
          <IconSymbol name="chevron.left" size={20} color={colors.foreground} />
        </TouchableOpacity>

        {/* Card del formulario */}
        <View style={[S.card, card]}>

          {/* ── Barra de progreso dentro del card ── */}
          <View style={S.progressSection}>
            {/* Puntos de paso */}
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
                {
                  width: `${(step / TOTAL_STEPS) * 100}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>

          {/* Título del paso */}
          <Text style={[S.stepTitle, { color: colors.foreground }]}>
            {stepTitles[step - 1]}
          </Text>
          <Text style={[S.stepSub, { color: colors.muted }]}>
            {stepSubtitles[step - 1]}
          </Text>

          {/* Campos del paso 1 */}
          {step === 1 && (
            <Animated.View entering={FadeInRight} exiting={FadeOutLeft}>
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
              <Button
                title={t('auth.register.next')}
                onPress={goNext}
                size="lg"
                rightIcon="arrow-forward"
              />
            </Animated.View>
          )}

          {/* Campos del paso 2 */}
          {step === 2 && (
            <Animated.View entering={FadeInRight} exiting={FadeOutLeft}>
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
              <Button
                title={t('auth.register.createAccount')}
                onPress={onRegister}
                isLoading={loading}
                size="lg"
              />
            </Animated.View>
          )}
        </View>

        {/* Enlace a login — solo en paso 1 */}
        {step === 1 && (
          <View style={S.loginRow}>
            <Text style={[S.loginText, { color: colors.muted }]}>
              {t('auth.register.hasAccount')}{'  '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={[S.loginLink, { color: colors.primary }]}>
                {t('auth.register.login')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const S = StyleSheet.create({
  root:            { flex: 1 },
  scroll:          { paddingHorizontal: 16 },
  backBtn:         { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  // Card
  card:            { borderRadius: 16, padding: 16, marginBottom: 16 },
  // Progreso (dentro del card)
  progressSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dots:            { flexDirection: 'row', gap: 6 },
  dot:             { height: 8, width: 8, borderRadius: 4 },
  stepLabel:       { fontSize: 12, fontWeight: '600' },
  track:           { height: 3, borderRadius: 2, overflow: 'hidden', marginBottom: 16 },
  fill:            { height: '100%', borderRadius: 2 },
  // Título del paso
  stepTitle:       { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  stepSub:         { fontSize: 14, marginBottom: 16 },
  hint:            { fontSize: 12, marginTop: -8, marginBottom: 16, paddingHorizontal: 2 },
  // Footer
  loginRow:        { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginText:       { fontSize: 14 },
  loginLink:       { fontSize: 14, fontWeight: '700' },
});
