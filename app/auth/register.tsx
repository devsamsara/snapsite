import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/use-colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AppInput } from '@/components/ui/app-input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Esquema de validación con Zod
const registerSchema = z.object({
  // Paso 1: Datos de la Empresa (Estilo CompanyCam)
  companyName: z.string().min(2, 'El nombre de la empresa es muy corto'),
  industry: z.string().min(1, 'La industria es requerida'),
  companySize: z.string().min(1, 'El tamaño de la empresa es requerido'),
  
  // Paso 2: Datos del Usuario
  fullName: z.string().min(3, 'El nombre completo es requerido'),
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(10, 'La contraseña debe tener al menos 10 caracteres')
    .regex(/[A-Z]/, 'Debe incluir una mayúscula')
    .regex(/[a-z]/, 'Debe incluir una minúscula'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const colors = useColors();
  const router = useRouter();

  const { control, handleSubmit, trigger, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    defaultValues: {
      companyName: '',
      industry: '',
      companySize: '',
      fullName: '',
      email: '',
      password: '',
    }
  });

  const nextStep = async () => {
    const fieldsToValidate = step === 1 
      ? ['companyName', 'industry', 'companySize'] 
      : ['fullName', 'email', 'password'];
    
    const isValid = await trigger(fieldsToValidate as any);
    if (isValid) {
      if (step < 2) setStep(step + 1);
      else handleSubmit(onRegister)();
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
    else router.back();
  };

  const onRegister = async (data: RegisterFormValues) => {
    setLoading(true);
    // Simular registro de empresa y usuario
    setTimeout(() => {
      setLoading(false);
      router.push('/auth/confirm-email');
    }, 2000);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.topNav}>
          <TouchableOpacity onPress={prevStep} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View style={[styles.progressFill, { width: `${(step / 2) * 100}%`, backgroundColor: colors.primary }]} />
            </View>
            <Text style={[styles.stepText, { color: colors.muted }]}>Paso {step} de 2</Text>
          </View>
        </View>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {step === 1 ? 'Tu Empresa' : 'Crea tu Cuenta'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {step === 1 
              ? 'Cuéntanos sobre tu negocio para personalizar tu experiencia.' 
              : 'Completa tus datos personales para finalizar.'}
          </Text>
        </View>

        <View style={styles.form}>
          {step === 1 && (
            <Animated.View entering={FadeInRight} exiting={FadeOutLeft}>
              <AppInput
                label="Nombre de la Empresa"
                name="companyName"
                control={control}
                placeholder="Ej: Constructora Sol"
                icon="building.2.fill"
              />
              <AppInput
                label="Industria"
                name="industry"
                control={control}
                placeholder="Ej: Construcción, Techos, Pintura"
                icon="briefcase.fill"
              />
              <AppInput
                label="Tamaño de la Empresa"
                name="companySize"
                control={control}
                placeholder="Ej: 1-10 empleados"
                icon="person.3.fill"
              />
            </Animated.View>
          )}

          {step === 2 && (
            <Animated.View entering={FadeInRight} exiting={FadeOutLeft}>
              <AppInput
                label="Nombre Completo"
                name="fullName"
                control={control}
                placeholder="Juan Pérez"
                icon="person.fill"
              />
              <AppInput
                label="Correo Electrónico"
                name="email"
                control={control}
                placeholder="juan@empresa.com"
                icon="envelope.fill"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <AppInput
                label="Contraseña"
                name="password"
                control={control}
                placeholder="Mínimo 10 caracteres"
                icon="lock.fill"
                secureTextEntry
              />
              <Text style={[styles.hint, { color: colors.muted }]}>
                La contraseña debe tener al menos 10 caracteres, una mayúscula y una minúscula.
              </Text>
            </Animated.View>
          )}

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={nextStep}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>
                {step === 1 ? 'Siguiente' : 'Crear Cuenta'}
              </Text>
            )}
          </TouchableOpacity>

          {step === 1 && (
            <View style={styles.footer}>
              <Text style={{ color: colors.muted }}>¿Ya tienes cuenta? </Text>
              <TouchableOpacity onPress={() => router.push('/auth/login')}>
                <Text style={{ color: colors.primary, fontWeight: '700' }}>Inicia Sesión</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  topNav: { flexDirection: 'row', alignItems: 'center', marginBottom: 32, gap: 16 },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  progressContainer: { flex: 1 },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: '100%', borderRadius: 3 },
  stepText: { fontSize: 12, fontWeight: '600' },
  header: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 16, lineHeight: 24 },
  form: { width: '100%' },
  button: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  buttonText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  hint: { fontSize: 12, marginTop: -12, marginBottom: 20, paddingHorizontal: 4 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
});
