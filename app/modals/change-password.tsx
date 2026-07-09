import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCardStyle } from '@/hooks/use-card-style';
import { AppInput } from '@/components/ui/app-input';
import { Button } from '@/components/ui/button';
import { HeroHeader } from '@/components/ui/hero-header';
import { FormScreen } from '@/components/ui/form-screen';
import { spacing } from '@/constants/spacing';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AppAlert } from '@/components/ui/app-alert';
import { apolloClient } from '@/lib/graphql-client';
import { ChangePasswordDocument } from '@/gql/graphql';

export default function ChangePasswordModal() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const cardElevation = useCardStyle();
  const router = useRouter();

  const schema = z.object({
    currentPassword: z.string().min(1, t('changePassword.validation.required')),
    newPassword: z.string().min(6, t('changePassword.validation.minLength')),
    confirmPassword: z.string().min(1, t('changePassword.validation.required')),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: t('changePassword.validation.mismatch'),
    path: ['confirmPassword'],
  });

  type FormValues = z.infer<typeof schema>;

  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const { data: result, error } = await apolloClient.mutate({
        mutation: ChangePasswordDocument,
        variables: {
          input: {
            currentPassword: data.currentPassword,
            newPassword: data.newPassword,
          },
        },
      });

      if (error || !result?.changePassword) {
        throw error ?? new Error(t('changePassword.errorMessage'));
      }

      AppAlert.alert(
        t('changePassword.successTitle'),
        t('changePassword.successMessage'),
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e: any) {
      AppAlert.alert(
        t('changePassword.errorTitle'),
        e?.message ?? t('changePassword.errorMessage')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    // Sheet ('modal'): sin safe area propia — el sistema ya baja la tarjeta
    <FormScreen
      title={t('changePassword.title')}
      onBack={() => router.back()}
      withSafeArea={false}
      hero={
        <HeroHeader
          icon="lock.rotation"
          subtitle={t('changePassword.subtitle')}
        />
      }
      footer={
        <Button
          title={t('changePassword.submit')}
          onPress={handleSubmit(onSubmit)}
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
            label={t('changePassword.currentPassword')}
            name="currentPassword"
            control={control}
            placeholder="••••••••"
            icon="lock.fill"
            secureTextEntry
          />
          <AppInput
            label={t('changePassword.newPassword')}
            name="newPassword"
            control={control}
            placeholder="••••••••"
            icon="lock.fill"
            secureTextEntry
          />
          <AppInput
            label={t('changePassword.confirmPassword')}
            name="confirmPassword"
            control={control}
            placeholder="••••••••"
            icon="lock.fill"
            secureTextEntry
          />
          </Animated.View>
    </FormScreen>
  );
}

const S = StyleSheet.create({
  card: { borderRadius: 18, padding: spacing.cardPad, gap: spacing.base },
});
