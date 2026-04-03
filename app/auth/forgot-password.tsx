/**
 * app/auth/forgot-password.tsx
 *
 * Pantalla de recuperación de contraseña.
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
} from 'react-native';
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

const schema = z.object({
  email: z.string().email('Correo inválido'),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const colors                = useColors();
  const cardElevation         = useCardStyle();
  const router                = useRouter();
  const insets                = useSafeAreaInsets();

  const { control, handleSubmit, getValues } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (_data: FormValues) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1500);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[S.container, { backgroundColor: colors.background }]}
    >
      <View style={[S.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}>

        {/* Back */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={[S.backBtn, { backgroundColor: colors.surface }]}
        >
          <IconSymbol name="chevron.left" size={20} color={colors.foreground} />
        </TouchableOpacity>

        {/* Icono + título */}
        <View style={S.header}>
          <View
            style={[
              S.iconCircle,
              { backgroundColor: sent ? colors.success + '18' : colors.primary + '18' },
            ]}
          >
            <IconSymbol
              name={sent ? "checkmark.circle.fill" : "lock.rotation"}
              size={44}
              color={sent ? colors.success : colors.primary}
            />
          </View>
          <Text style={[S.title, { color: colors.foreground }]}>
            {sent ? '¡Correo enviado!' : 'Recuperar contraseña'}
          </Text>
          <Text style={[S.subtitle, { color: colors.muted }]}>
            {sent
              ? `Hemos enviado un enlace de recuperación a ${getValues('email')}.`
              : 'Introduce tu correo y te enviaremos un enlace para restablecer tu contraseña.'}
          </Text>
        </View>

        {/* Formulario / Confirmación */}
        {!sent ? (
          <View style={[S.card, cardElevation]}>
            <AppInput
              label="Correo electrónico"
              name="email"
              control={control}
              placeholder="tu@empresa.com"
              icon="envelope.fill"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Button
              title="Enviar enlace"
              onPress={handleSubmit(onSubmit)}
              isLoading={loading}
              size="lg"
            />
          </View>
        ) : (
          <View style={[S.card, cardElevation]}>
            <Button
              title="Volver al inicio de sesión"
              onPress={() => router.push('/auth/login')}
              size="lg"
            />
            <Button
              title="Reenviar correo"
              onPress={handleSubmit(onSubmit)}
              variant="ghost"
              size="md"
              style={S.resendBtn}
            />
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1 },
  content:   { flex: 1, paddingHorizontal: 24 },
  backBtn:   { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
  header:    { alignItems: 'center', marginBottom: 28 },
  iconCircle: { width: 88, height: 88, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title:     { fontSize: 26, fontWeight: '800', marginBottom: 10, textAlign: 'center' },
  subtitle:  { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  card:      { borderRadius: 20, padding: 24, gap: 12 },
  resendBtn: { marginTop: 4 },
});
