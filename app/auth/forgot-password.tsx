/**
 * app/auth/forgot-password.tsx
 *
 * Pantalla de recuperación de contraseña.
 * Estructura unificada de formularios: FormScreen + HeroHeader + card + CTA fija.
 */
import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/hooks/use-colors';
import { useCardStyle } from '@/hooks/use-card-style';
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

type FormValues = { email: string };

export default function ForgotPasswordScreen() {
  const { t }                 = useTranslation();
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const { forgotPassword }    = useAuth();
  const colors                = useColors();
  const cardElevation         = useCardStyle();
  const router                = useRouter();

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
      AppAlert.alert(
        t('auth.forgotPassword.errorTitle'),
        e?.message ?? t('auth.forgotPassword.errorMessage'),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormScreen
      title={t('auth.forgotPassword.title')}
      onBack={() => router.back()}
      hero={
        <HeroHeader
          key={sent ? 'sent' : 'form'}
          icon={sent ? 'checkmark.circle.fill' : 'lock.rotation'}
          tint={sent ? colors.success : colors.primary}
          title={sent ? t('auth.forgotPassword.titleSent') : undefined}
          subtitle={
            sent
              ? t('auth.forgotPassword.subtitleSent', { email: getValues('email') })
              : t('auth.forgotPassword.subtitle')
          }
        />
      }
      footer={
        sent ? (
          <Button
            title={t('auth.forgotPassword.backToLogin')}
            onPress={() => router.push('/auth/login')}
            size="lg"
          />
        ) : (
          <Button
            title={t('auth.forgotPassword.submit')}
            onPress={handleSubmit(onSubmit)}
            isLoading={loading}
            size="lg"
          />
        )
      }
    >
      {!sent ? (
        <Animated.View
          entering={FadeInDown.duration(450).delay(80).springify().damping(18)}
          style={[S.card, cardElevation]}
        >
          <AppInput
            label={t('auth.forgotPassword.email')}
            name="email"
            control={control}
            placeholder={t('auth.forgotPassword.emailPlaceholder')}
            icon="envelope.fill"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </Animated.View>
      ) : (
        <Animated.View
          entering={FadeInDown.duration(450).delay(80).springify().damping(18)}
        >
          <Button
            title={t('auth.forgotPassword.resend')}
            onPress={handleSubmit(onSubmit)}
            isLoading={loading}
            variant="ghost"
            size="md"
          />
        </Animated.View>
      )}
    </FormScreen>
  );
}

const S = StyleSheet.create({
  card: { borderRadius: 18, padding: spacing.cardPad, gap: spacing.md },
});
