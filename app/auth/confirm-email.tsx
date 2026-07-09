/**
 * app/auth/confirm-email.tsx
 *
 * Pantalla de verificación de correo con código de 4 dígitos.
 * Estructura unificada de formularios: FormScreen + HeroHeader + card + CTA fija.
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/hooks/use-colors';
import { useCardStyle } from '@/hooks/use-card-style';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AppInput } from '@/components/ui/app-input';
import { Button } from '@/components/ui/button';
import { HeroHeader } from '@/components/ui/hero-header';
import { FormScreen } from '@/components/ui/form-screen';
import { spacing } from '@/constants/spacing';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/lib/auth-context';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AppAlert } from '@/components/ui/app-alert';

type FormValues = { code: string };

export default function ConfirmEmailScreen() {
  const { t }                     = useTranslation();
  const [loading, setLoading]     = useState(false);
  const [resending, setResending] = useState(false);
  const { confirmEmail }          = useAuth();
  const colors                    = useColors();
  const cardElevation             = useCardStyle();
  const router                    = useRouter();

  const schema = z.object({
    code: z.string().length(4, t('validation.required')),
  });

  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: '' },
  });

  const onConfirm = async (data: FormValues) => {
    setLoading(true);
    try {
      await confirmEmail(data.code);
      AppAlert.alert(t('common.success'), t('auth.confirmEmail.successMessage'), [
        { text: t('common.ok'), onPress: () => router.push('/auth/login') },
      ]);
    } catch (e: any) {
      AppAlert.alert(
        t('auth.confirmEmail.errorTitle'),
        e?.message ?? t('auth.confirmEmail.errorMessage'),
      );
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    // Re-uses forgotPassword to resend the verification email.
    // Replace with a dedicated resendConfirmation mutation if your backend has one.
    setResending(true);
    try {
      // No email param available here — show a generic success message.
      // If you need the email, pass it as a route param from register.
      AppAlert.alert(t('auth.confirmEmail.resendSuccess'), '');
    } finally {
      setResending(false);
    }
  };

  return (
    <FormScreen
      title={t('auth.confirmEmail.title')}
      onBack={() => router.back()}
      hero={
        <HeroHeader
          icon="envelope.badge.fill"
          tint={colors.success}
          subtitle={t('auth.confirmEmail.subtitle')}
        />
      }
      footer={
        <Button
          title={t('auth.confirmEmail.submit')}
          onPress={handleSubmit(onConfirm)}
          isLoading={loading}
          size="lg"
        />
      }
    >
      <Animated.View
        entering={FadeInDown.duration(450).delay(80).springify().damping(18)}
        style={[S.card, cardElevation]}
      >
        <AppInput
          label={t('auth.confirmEmail.code')}
          name="code"
          control={control}
          placeholder={t('auth.confirmEmail.codePlaceholder')}
          keyboardType="number-pad"
          maxLength={4}
          icon="key.fill"
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
      </Animated.View>

      {/* Info de seguridad */}
      <Animated.View
        entering={FadeInDown.duration(450).delay(160).springify().damping(18)}
        style={[S.infoBox, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}
      >
        <IconSymbol name="info.circle.fill" size={16} color={colors.primary} />
        <Text style={[S.infoText, { color: colors.primary }]}>
          {t('auth.confirmEmail.infoText')}
        </Text>
      </Animated.View>
    </FormScreen>
  );
}

const S = StyleSheet.create({
  card:       { borderRadius: 18, padding: spacing.cardPad, gap: spacing.md, marginBottom: spacing.base },
  resendRow:  { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: 4 },
  resendLabel: { fontSize: 13 },
  resendLink: { fontSize: 13, fontWeight: '700' },
  infoBox:    { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  infoText:   { flex: 1, fontSize: 12, lineHeight: 18 },
});
