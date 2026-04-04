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
import { useTranslation } from 'react-i18next';
import { useColors } from '@/hooks/use-colors';
import { useCardStyle } from '@/hooks/use-card-style';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AppInput } from '@/components/ui/app-input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/lib/auth-context';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as z from 'zod';

type FormValues = { email: string };

export default function ForgotPasswordScreen() {
  const { t }                   = useTranslation();
  const [loading, setLoading]   = useState(false);
  const [sent, setSent]         = useState(false);
  const { forgotPassword }      = useAuth();
  const colors                  = useColors();
  const cardElevation           = useCardStyle();
  const router                  = useRouter();
  const insets                  = useSafeAreaInsets();

  const schema = z.object({
    email: z.string().email(t('validation.emailInvalid')),
  });

  const { control, handleSubmit, getValues } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      await forgotPassword(data.email);
      setSent(true);
    } catch (e: any) {
      Alert.alert(
        t('auth.forgotPassword.errorTitle'),
        e?.message ?? t('auth.forgotPassword.errorMessage'),
      );
    } finally {
      setLoading(false);
    }
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
            {sent ? t('auth.forgotPassword.titleSent') : t('auth.forgotPassword.title')}
          </Text>
          <Text style={[S.subtitle, { color: colors.muted }]}>
            {sent
              ? t('auth.forgotPassword.subtitleSent', { email: getValues('email') })
              : t('auth.forgotPassword.subtitle')}
          </Text>
        </View>

        {/* Formulario / Confirmación */}
        {!sent ? (
          <View style={[S.card, cardElevation]}>
            <AppInput
              label={t('auth.forgotPassword.email')}
              name="email"
              control={control}
              placeholder={t('auth.forgotPassword.emailPlaceholder')}
              icon="envelope.fill"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Button
              title={t('auth.forgotPassword.submit')}
              onPress={handleSubmit(onSubmit)}
              isLoading={loading}
              size="lg"
            />
          </View>
        ) : (
          <View style={[S.card, cardElevation]}>
            <Button
              title={t('auth.forgotPassword.backToLogin')}
              onPress={() => router.push('/auth/login')}
              size="lg"
            />
            <Button
              title={t('auth.forgotPassword.resend')}
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
  content:   { flex: 1, paddingHorizontal: 16 },
  backBtn:   { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  header:    { alignItems: 'center', marginBottom: 24 },
  iconCircle: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title:     { fontSize: 24, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  subtitle:  { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  card:      { borderRadius: 16, padding: 16, gap: 12 },
  resendBtn: { marginTop: 4 },
});
