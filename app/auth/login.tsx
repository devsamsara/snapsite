/**
 * app/auth/login.tsx — diseño minimalista
 *
 * Un solo card centrado con los inputs y el botón.
 * Logo pequeño arriba, enlace de registro abajo como texto simple.
 */
import React, {useState} from 'react';
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
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth-context';
import { useColors } from '@/hooks/use-colors';
import { useCardStyle } from '@/hooks/use-card-style';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AppInput } from '@/components/ui/app-input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as z from 'zod';
// ONBOARDING_DONE_KEY is managed exclusively by auth-context (signUp) and onboarding.tsx

type FormValues = { email: string; password: string };
// Accepts a valid email OR a plain username (min 1 char)

export default function LoginScreen() {
  const { t }                 = useTranslation();
  const [loading, setLoading] = useState(false);
  const { signIn }            = useAuth();
  const colors                = useColors();
  const card                  = useCardStyle();
  const router                = useRouter();
  const insets                = useSafeAreaInsets();

  const schema = z.object({
    // Accept a valid email OR a plain username (e.g. "juan")
    email: z.string().min(1, t('validation.emailInvalid')),
    password: z.string().min(1, t('validation.passwordRequired')),
  });

  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onLogin = async (data: FormValues) => {
    setLoading(true);
    try {
      await signIn(data.email, data.password);
    } catch (e: any) {
      Alert.alert(t('auth.login.errorTitle'), e?.message ?? t('auth.login.errorMessage'));
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
          { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo pequeño */}
        <View style={S.logoWrap}>
          <View style={[S.logoBox, { backgroundColor: colors.primary + '15' }]}>
            <IconSymbol name="camera.fill" size={32} color={colors.primary} />
          </View>
          <Text style={[S.appName, { color: colors.foreground }]}>SnapSite</Text>
        </View>

        {/* Card único */}
        <View style={[S.card, card]}>
          <Text style={[S.cardTitle, { color: colors.foreground }]}>
            {t('auth.login.title')}
          </Text>
          <Text style={[S.cardSub, { color: colors.muted }]}>
            {t('auth.login.subtitle')}
          </Text>

          <View style={S.fields}>
            <AppInput
              label={t('auth.login.email')}
              name="email"
              control={control}
              placeholder={t('auth.login.emailPlaceholder')}
              icon="person.fill"
              autoCapitalize="none"
            />
            <AppInput
              label={t('auth.login.password')}
              name="password"
              control={control}
              placeholder={t('auth.login.passwordPlaceholder')}
              icon="lock.fill"
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            onPress={() => router.push('/auth/forgot-password')}
            style={S.forgotRow}
          >
            <Text style={[S.forgotText, { color: colors.primary }]}>
              {t('auth.login.forgotPassword')}
            </Text>
          </TouchableOpacity>

          <Button
            title={t('auth.login.submit')}
            onPress={handleSubmit(onLogin)}
            isLoading={loading}
            size="lg"
          />
        </View>

        {/* Enlace de registro — texto simple, sin card */}
        <View style={S.registerRow}>
          <Text style={[S.registerText, { color: colors.muted }]}>
            {t('auth.login.noAccount')}{'  '}
          </Text>
          <TouchableOpacity onPress={() => router.push('/auth/register')}>
            <Text style={[S.registerLink, { color: colors.primary }]}>
              {t('auth.login.register')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const S = StyleSheet.create({
  root:         { flex: 1 },
  scroll:       { paddingHorizontal: 16 },
  // Logo
  logoWrap:     { alignItems: 'center', marginBottom: 32, gap: 8 },
  logoBox:      { width: 60, height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  appName:      { fontSize: 20, fontWeight: '700', letterSpacing: 0.2 },
  // Card
  card:         { borderRadius: 16, padding: 16, marginBottom: 16 },
  cardTitle:    { fontSize: 22, fontWeight: '700' },
  cardSub:      { fontSize: 14, marginTop: 4, marginBottom: 16 },
  fields:       { gap: 0 },
  forgotRow:    { alignSelf: 'flex-end', marginBottom: 16, marginTop: -8 },
  forgotText:   { fontSize: 13, fontWeight: '600' },
  // Registro
  registerRow:  { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  registerText: { fontSize: 14 },
  registerLink: { fontSize: 14, fontWeight: '700' },
});
