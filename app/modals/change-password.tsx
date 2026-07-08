import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
import { AppAlert } from '@/components/ui/app-alert';
import { apolloClient } from '@/lib/graphql-client';
import { ChangePasswordDocument } from '@/gql/graphql';

export default function ChangePasswordModal() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const colors = useColors();
  const cardElevation = useCardStyle();
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
      const { data: result, errors } = await apolloClient.mutate({
        mutation: ChangePasswordDocument,
        variables: {
          input: {
            currentPassword: data.currentPassword,
            newPassword: data.newPassword,
          },
        },
      });

      if (errors?.length || !result?.changePassword) {
        throw new Error(errors?.[0]?.message ?? t('changePassword.errorMessage'));
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[S.container, { backgroundColor: colors.background }]}
    >
      <View style={[S.header, { borderBottomColor: colors.border, paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[S.backBtn, { backgroundColor: colors.surface }]}
        >
          <IconSymbol name="chevron.left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[S.headerTitle, { color: colors.foreground }]}>
          {t('changePassword.title')}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          S.content,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={S.intro}>
          <View style={[S.iconCircle, { backgroundColor: colors.primary + '18' }]}>
            <IconSymbol name="lock.rotation" size={44} color={colors.primary} />
          </View>
          <Text style={[S.subtitle, { color: colors.muted }]}>
            {t('changePassword.subtitle')}
          </Text>
        </View>

        <View style={[S.card, cardElevation]}>
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
          <Button
            title={t('changePassword.submit')}
            onPress={handleSubmit(onSubmit)}
            isLoading={loading}
            size="lg"
            style={S.submitBtn}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { paddingHorizontal: 16, paddingTop: 24 },
  intro: { alignItems: 'center', marginBottom: 32 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
  card: { borderRadius: 16, padding: 16, gap: 16 },
  submitBtn: { marginTop: 8 },
});
