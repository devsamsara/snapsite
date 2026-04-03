/**
 * app/auth/login.tsx — diseño minimalista
 *
 * Un solo card centrado con los inputs y el botón.
 * Logo pequeño arriba, enlace de registro abajo como texto simple.
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

type FormValues = { username: string; password: string };

export default function LoginScreen() {
  const { t }                 = useTranslation();
  const [loading, setLoading] = useState(false);
  const { signIn }            = useAuth();
  const colors                = useColors();
  const card                  = useCardStyle();
  const router                = useRouter();
  const insets                = useSafeAreaInsets();

  const schema = z.object({
    username: z.string().min(1, t('validation.usernameRequired')),
    password: z.string().min(1, t('validation.passwordRequired')),
  });

  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '' },
  });

  const onLogin = async (data: FormValues) => {
    setLoading(true);
    const ok = await signIn(data.username, data.password);
    setLoading(false);
    if (!ok) Alert.alert(t('auth.login.errorTitle'), t('auth.login.errorMessage'));
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
              label={t('auth.login.username')}
              name="username"
              control={control}
              placeholder={t('auth.login.usernamePlaceholder')}
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
  scroll:       { paddingHorizontal: 24 },
  // Logo
  logoWrap:     { alignItems: 'center', marginBottom: 36, gap: 10 },
  logoBox:      { width: 60, height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  appName:      { fontSize: 20, fontWeight: '700', letterSpacing: 0.2 },
  // Card
  card:         { borderRadius: 20, padding: 24, marginBottom: 24 },
  cardTitle:    { fontSize: 22, fontWeight: '700' },
  cardSub:      { fontSize: 14, marginTop: 4, marginBottom: 20 },
  fields:       { gap: 0 },
  forgotRow:    { alignSelf: 'flex-end', marginBottom: 20, marginTop: -4 },
  forgotText:   { fontSize: 13, fontWeight: '600' },
  // Registro
  registerRow:  { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  registerText: { fontSize: 14 },
  registerLink: { fontSize: 14, fontWeight: '700' },
});
