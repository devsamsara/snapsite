/**
 * app/auth/register.tsx
 *
 * Pantalla de registro en 2 pasos.
 * Adapta colores (dark/light) y estilo de card (flat/elevated).
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

export default function RegisterScreen() {
  const [step, setStep]     = useState(1);
  const [loading, setLoading] = useState(false);
  const colors              = useColors();
  const cardElevation       = useCardStyle();
  const router              = useRouter();
  const insets              = useSafeAreaInsets();

  const step1Form = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: { companyName: '', industry: '', companySize: '' },
  });

  const step2Form = useForm<Step2Values>({
    resolver: zodResolver(step2Schema),
    defaultValues: { fullName: '', email: '', password: '' },
  });

  const nextStep = step1Form.handleSubmit(() => setStep(2));

  const onRegister = step2Form.handleSubmit(async (_data) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('¡Cuenta creada!', 'Verifica tu correo para activar la cuenta.', [
        { text: 'OK', onPress: () => router.push('/auth/confirm-email') },
      ]);
    }, 1500);
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[S.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[
          S.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Nav superior */}
        <View style={S.topNav}>
          <TouchableOpacity
            onPress={() => (step === 1 ? router.back() : setStep(1))}
            style={[S.backBtn, { backgroundColor: colors.surface }]}
          >
            <IconSymbol name="chevron.left" size={20} color={colors.foreground} />
          </TouchableOpacity>

          {/* Barra de progreso */}
          <View style={S.progressWrapper}>
            <View style={[S.progressTrack, { backgroundColor: colors.border }]}>
              <View
                style={[
                  S.progressFill,
                  { width: `${(step / 2) * 100}%`, backgroundColor: colors.primary },
                ]}
              />
            </View>
            <Text style={[S.stepLabel, { color: colors.muted }]}>
              Paso {step} de 2
            </Text>
          </View>
        </View>

        {/* Encabezado */}
        <View style={S.header}>
          <Text style={[S.title, { color: colors.foreground }]}>
            {step === 1 ? 'Tu empresa' : 'Tu cuenta'}
          </Text>
          <Text style={[S.subtitle, { color: colors.muted }]}>
            {step === 1
              ? 'Cuéntanos sobre tu negocio para personalizar tu experiencia.'
              : 'Completa tus datos personales para finalizar.'}
          </Text>
        </View>

        {/* Formulario */}
        <View style={[S.card, cardElevation]}>
          {step === 1 && (
            <Animated.View entering={FadeInRight} exiting={FadeOutLeft}>
              <AppInput
                label="Nombre de la empresa"
                name="companyName"
                control={step1Form.control}
                placeholder="Ej: Constructora Sol"
                icon="building.2.fill"
              />
              <AppInput
                label="Industria"
                name="industry"
                control={step1Form.control}
                placeholder="Ej: Construcción, Techos, Pintura"
                icon="briefcase.fill"
              />
              <AppInput
                label="Tamaño de la empresa"
                name="companySize"
                control={step1Form.control}
                placeholder="Ej: 1–10 empleados"
                icon="person.3.fill"
              />
              <Button
                title="Siguiente"
                onPress={nextStep}
                size="lg"
                rightIcon="arrow-forward"
              />
            </Animated.View>
          )}

          {step === 2 && (
            <Animated.View entering={FadeInRight} exiting={FadeOutLeft}>
              <AppInput
                label="Nombre completo"
                name="fullName"
                control={step2Form.control}
                placeholder="Juan Pérez"
                icon="person.fill"
              />
              <AppInput
                label="Correo electrónico"
                name="email"
                control={step2Form.control}
                placeholder="juan@empresa.com"
                icon="envelope.fill"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <AppInput
                label="Contraseña"
                name="password"
                control={step2Form.control}
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

        {/* Footer */}
        {step === 1 && (
          <View style={S.footer}>
            <Text style={[S.footerText, { color: colors.muted }]}>
              ¿Ya tienes cuenta?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={[S.footerLink, { color: colors.primary }]}>
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
  container:       { flex: 1 },
  scrollContent:   { paddingHorizontal: 24 },
  topNav:          { flexDirection: 'row', alignItems: 'center', marginBottom: 28, gap: 16 },
  backBtn:         { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  progressWrapper: { flex: 1 },
  progressTrack:   { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  progressFill:    { height: '100%', borderRadius: 3 },
  stepLabel:       { fontSize: 12, fontWeight: '600' },
  header:          { marginBottom: 24 },
  title:           { fontSize: 30, fontWeight: '800', marginBottom: 8 },
  subtitle:        { fontSize: 15, lineHeight: 22 },
  card:            { borderRadius: 20, padding: 24, marginBottom: 16 },
  hint:            { fontSize: 12, marginTop: -8, marginBottom: 20, paddingHorizontal: 2 },
  footer:          { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  footerText:      { fontSize: 14 },
  footerLink:      { fontSize: 14, fontWeight: '700' },
});
