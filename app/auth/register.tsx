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
import { useColors } from '@/hooks/use-colors';
import { useCardStyle } from '@/hooks/use-card-style';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AppInput } from '@/components/ui/app-input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as z from 'zod';

const step1Schema = z.object({
  companyName: z.string().min(2, 'Nombre requerido'),
  industry:    z.string().min(2, 'Industria requerida'),
  companySize: z.string().min(1, 'Tamaño requerido'),
});
const step2Schema = z.object({
  fullName: z.string().min(2, 'Nombre requerido'),
  email:    z.string().email('Correo inválido'),
  password: z.string()
    .min(10, 'Mínimo 10 caracteres')
    .regex(/[A-Z]/, 'Debe incluir una mayúscula')
    .regex(/[a-z]/, 'Debe incluir una minúscula'),
});

type Step1Values = z.infer<typeof step1Schema>;
type Step2Values = z.infer<typeof step2Schema>;

const TOTAL_STEPS = 2;

export default function RegisterScreen() {
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const colors                = useColors();
  const card                  = useCardStyle();
  const router                = useRouter();
  const insets                = useSafeAreaInsets();

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
      Alert.alert('¡Cuenta creada!', 'Verifica tu correo para activar la cuenta.', [
        { text: 'OK', onPress: () => router.push('/auth/confirm-email') },
      ]);
    }, 1500);
  });

  const stepTitles    = ['Tu empresa', 'Tu cuenta'];
  const stepSubtitles = [
    'Cuéntanos sobre tu negocio.',
    'Completa tus datos personales.',
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
              Paso {step} de {TOTAL_STEPS}
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
                label="Nombre de la empresa"
                name="companyName"
                control={step1.control}
                placeholder="Ej: Constructora Sol"
                icon="building.2.fill"
              />
              <AppInput
                label="Industria"
                name="industry"
                control={step1.control}
                placeholder="Ej: Construcción, Techos, Pintura"
                icon="briefcase.fill"
              />
              <AppInput
                label="Tamaño de la empresa"
                name="companySize"
                control={step1.control}
                placeholder="Ej: 1–10 empleados"
                icon="person.3.fill"
                keyboardType="numeric"
              />
              <Button
                title="Siguiente"
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
                label="Nombre completo"
                name="fullName"
                control={step2.control}
                placeholder="Juan Pérez"
                icon="person.fill"
              />
              <AppInput
                label="Correo electrónico"
                name="email"
                control={step2.control}
                placeholder="juan@empresa.com"
                icon="envelope.fill"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <AppInput
                label="Contraseña"
                name="password"
                control={step2.control}
                placeholder="Mínimo 10 caracteres"
                icon="lock.fill"
                secureTextEntry
              />
              <Text style={[S.hint, { color: colors.muted }]}>
                Mínimo 10 caracteres, una mayúscula y una minúscula.
              </Text>
              <Button
                title="Crear cuenta"
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
              ¿Ya tienes cuenta?{'  '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={[S.loginLink, { color: colors.primary }]}>
                Inicia sesión
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
  scroll:          { paddingHorizontal: 24 },
  backBtn:         { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  // Card
  card:            { borderRadius: 20, padding: 24, marginBottom: 24 },
  // Progreso (dentro del card)
  progressSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  dots:            { flexDirection: 'row', gap: 6 },
  dot:             { height: 8, width: 8, borderRadius: 4 },
  stepLabel:       { fontSize: 12, fontWeight: '600' },
  track:           { height: 3, borderRadius: 2, overflow: 'hidden', marginBottom: 20 },
  fill:            { height: '100%', borderRadius: 2 },
  // Título del paso
  stepTitle:       { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  stepSub:         { fontSize: 14, marginBottom: 20 },
  hint:            { fontSize: 12, marginTop: -8, marginBottom: 20, paddingHorizontal: 2 },
  // Footer
  loginRow:        { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginText:       { fontSize: 14 },
  loginLink:       { fontSize: 14, fontWeight: '700' },
});
