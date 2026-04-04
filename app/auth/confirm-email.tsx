/**
 * app/auth/confirm-email.tsx
 *
 * Pantalla de verificación de correo con código de 4 dígitos.
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
import { zodResolver } from '@hookform/resolvers/zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as z from 'zod';

type FormValues = { code: string };

export default function ConfirmEmailScreen() {
  const { t }                   = useTranslation();
  const [loading, setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const colors                  = useColors();
  const cardElevation           = useCardStyle();
  const router                  = useRouter();
  const insets                  = useSafeAreaInsets();

  const schema = z.object({
    code: z.string().length(4, t('validation.required')),
  });

  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: '' },
  });

  const onConfirm = async (_data: FormValues) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert(t('common.success'), t('auth.confirmEmail.submit'), [
        { text: t('common.ok'), onPress: () => router.push('/auth/login') },
      ]);
    }, 1500);
  };

  const onResend = () => {
    setResending(true);
    setTimeout(() => {
      setResending(false);
      Alert.alert(t('auth.confirmEmail.resend'), t('common.ok'));
    }, 1200);
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
          <View style={[S.iconCircle, { backgroundColor: colors.success + '18' }]}>
            <IconSymbol name="envelope.badge.fill" size={44} color={colors.success} />
          </View>
          <Text style={[S.title, { color: colors.foreground }]}>{t('auth.confirmEmail.title')}</Text>
          <Text style={[S.subtitle, { color: colors.muted }]}>
            {t('auth.confirmEmail.subtitle')}
          </Text>
        </View>

        {/* Card con el input */}
        <View style={[S.card, cardElevation]}>
          <AppInput
            label={t('auth.confirmEmail.code')}
            name="code"
            control={control}
            placeholder={t('auth.confirmEmail.codePlaceholder')}
            keyboardType="number-pad"
            maxLength={4}
            icon="key.fill"
          />

          <Button
            title={t('auth.confirmEmail.submit')}
            onPress={handleSubmit(onConfirm)}
            isLoading={loading}
            size="lg"
          />

          <View style={S.resendRow}>
            <Text style={[S.resendLabel, { color: colors.muted }]}>
              {t('auth.confirmEmail.noCode')}{' '}
            </Text>
            <TouchableOpacity onPress={onResend} disabled={resending}>
              <Text style={[S.resendLink, { color: colors.primary, opacity: resending ? 0.5 : 1 }]}>
                {resending ? t('auth.confirmEmail.resending') : t('auth.confirmEmail.resend')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info de seguridad */}
        <View style={[S.infoBox, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
          <IconSymbol name="info.circle.fill" size={16} color={colors.primary} />
          <Text style={[S.infoText, { color: colors.primary }]}>
            {t('auth.confirmEmail.infoText')}
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const S = StyleSheet.create({
  container:  { flex: 1 },
  content:    { flex: 1, paddingHorizontal: 16 },
  backBtn:    { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  header:     { alignItems: 'center', marginBottom: 24 },
  iconCircle: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title:      { fontSize: 24, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  subtitle:   { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  card:       { borderRadius: 16, padding: 16, gap: 12, marginBottom: 16 },
  resendRow:  { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: 4 },
  resendLabel: { fontSize: 13 },
  resendLink: { fontSize: 13, fontWeight: '700' },
  infoBox:    { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  infoText:   { flex: 1, fontSize: 12, lineHeight: 18 },
});
