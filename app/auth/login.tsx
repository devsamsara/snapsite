/**
 * app/auth/login.tsx
 *
 * Diseño basado en el componente de referencia:
 *   - Logo grande centrado + título + subtítulo
 *   - Banner de error inline con icono
 *   - Inputs con icono y toggle de contraseña (AppInput)
 *   - Fila "Recuérdame" + "¿Olvidaste tu contraseña?"
 *   - Botón principal de login
 *   - Divider "o continúa con"
 *   - Botón de Google (visual, sin OAuth por ahora)
 *   - Footer "¿No tienes cuenta? Regístrate"
 */
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as z from 'zod';

import { useAuth } from '@/lib/auth-context';
import { useColors } from '@/hooks/use-colors';
import { AppInput } from '@/components/ui/app-input';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { HeroHeader } from '@/components/ui/hero-header';
import { spacing } from '@/constants/spacing';

type FormValues = { email: string; password: string };

export default function LoginScreen() {
  const { t }                       = useTranslation();
  const [loading, setLoading]       = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg]     = useState('');
  const { signIn }                  = useAuth();
  const colors                      = useColors();
  const router                      = useRouter();
  const insets                      = useSafeAreaInsets();

  const schema = z.object({
    // Accept a valid email OR a plain username (e.g. "tester")
    email:    z.string().min(1, t('validation.emailInvalid')),
    password: z.string().min(1, t('validation.passwordRequired')),
  });

  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onLogin = async (data: FormValues) => {
    setErrorMsg('');
    setLoading(true);
    try {
      await signIn(data.email, data.password);
    } catch (e: any) {
      setErrorMsg(e?.message ?? t('auth.login.errorMessage'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[S.root, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[
          S.scroll,
          { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header: logo + título + subtítulo ── */}
        <HeroHeader
          image={require('@/assets/images/icon.png')}
          title="SnapSite"
          subtitle={t('auth.login.subtitle')}
        />

        {/* ── Form ── */}
        <Animated.View
          entering={FadeInDown.duration(450).delay(80).springify().damping(18)}
          style={S.form}
        >

          {/* Error banner */}
          {!!errorMsg && (
            <View style={[S.errorBanner, { backgroundColor: colors.error + '18', borderRadius: 12 }]}>
              <IconSymbol name="exclamationmark.triangle.fill" size={18} color={colors.error} />
              <Text style={[S.errorText, { color: colors.error }]}>{errorMsg}</Text>
            </View>
          )}

          <AppInput
            label={t('auth.login.email')}
            name="email"
            control={control}
            placeholder="tu@email.com"
            icon="person.fill"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />

          <AppInput
            label={t('auth.login.password')}
            name="password"
            control={control}
            placeholder="••••••••"
            icon="lock.fill"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Recuérdame + ¿Olvidaste tu contraseña? */}
          <View style={S.optionsRow}>
            {/* Checkbox inline */}
            <Pressable style={S.checkboxRow} onPress={() => setRememberMe(!rememberMe)}>
              <View
                style={[
                  S.checkbox,
                  {
                    borderColor: rememberMe ? colors.primary : colors.border,
                    backgroundColor: rememberMe ? colors.primary : 'transparent',
                  },
                ]}
              >
                {rememberMe && (
                  <IconSymbol name="checkmark" size={12} color="#fff" />
                )}
              </View>
              <Text style={[S.checkboxLabel, { color: colors.muted }]}>
                {t('auth.login.rememberMe') || 'Recuérdame'}
              </Text>
            </Pressable>

            <TouchableOpacity onPress={() => router.push('/auth/forgot-password')}>
              <Text style={[S.forgotText, { color: colors.primary }]}>
                {t('auth.login.forgotPassword')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Botón principal */}
          <Button
            title={loading ? t('auth.login.loading') || 'Iniciando sesión...' : t('auth.login.submit')}
            onPress={handleSubmit(onLogin)}
            isLoading={loading}
            size="lg"
          />

          {/* Divider */}
          <View style={S.dividerRow}>
            <View style={[S.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[S.dividerText, { color: colors.muted }]}>
              {t('auth.login.orContinueWith') || 'o continúa con'}
            </Text>
            <View style={[S.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Botón Google */}
          <TouchableOpacity
            style={[S.googleBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            activeOpacity={0.75}
          >
            {/* Google "G" SVG inline como texto coloreado */}
            <Text style={S.googleLetter}>G</Text>
            <Text style={[S.googleLabel, { color: colors.foreground }]}>
              {t('auth.login.continueWithGoogle') || 'Continuar con Google'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Footer ── */}
        <Animated.View
          entering={FadeInDown.duration(450).delay(160).springify().damping(18)}
          style={S.footer}
        >
          <Text style={[S.footerText, { color: colors.muted }]}>
            {t('auth.login.noAccount')}
          </Text>
          <TouchableOpacity onPress={() => router.push('/auth/register')}>
            <Text style={[S.footerLink, { color: colors.primary }]}>
              {t('auth.login.register')}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const S = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { paddingHorizontal: spacing.lg, flexGrow: 1, justifyContent: 'center' },

  // Form
  form: {
    marginBottom: spacing.xl,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },

  // Options row
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: -4,
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
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
  },

  // Google button
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  googleLetter: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4285F4',
  },
  googleLabel: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
