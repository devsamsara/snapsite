import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { AppInput } from '@/components/ui/app-input';
import { AppAlert } from '@/components/ui/app-alert';
import { useMutation } from '@apollo/client/react';
import { CreateProjectDocument, CurrentCompanyDocument } from '@/gql/graphql';

type ProjectFormValues = {
  name: string;
  location: string;
  city: string;
  postalCode: string;
  notes?: string;
};

export default function CreateProjectDetailsScreen() {
  const { t }  = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams<{
    latitude: string;
    longitude: string;
    address: string;
    city: string;
    postalCode: string;
  }>();
  const [loading, setLoading] = useState(false);
  const [createProject, {loading: isLoading, data: project}] = useMutation(CreateProjectDocument)

  const projectSchema = z.object({
    name:       z.string().min(3, t('validation.projectNameMin', { min: 3 })),
    location:    z.string().min(5, t('validation.addressRequired')),
    city:       z.string().min(2, t('validation.cityRequired')),
    postalCode: z.string().min(4, t('validation.postalCodeRequired')),
    notes:      z.string().optional(),
  });

  const { control, handleSubmit } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name:       '',
      location:    params.address    || '',
      city:       params.city       || '',
      postalCode: params.postalCode || '',
      notes:      '',
    },
  });

  const onSubmit = async (data: ProjectFormValues) => {
    setLoading(true);
    try {
      const newProject = {
        ...data,
        latitude:  parseFloat(params.latitude),
        longitude: parseFloat(params.longitude),
      };

      const res = await createProject({
        variables: {
          input: {
            description: newProject.notes,
            name: newProject.name,
            latitude: newProject.latitude,
            longitude: newProject.longitude,
            location: newProject.location,
          },
        },
        refetchQueries: [CurrentCompanyDocument],
      });

      const createdId = res.data?.createProject?.id;
      setLoading(false);

      setTimeout(() => {
        setLoading(false);
        router.replace({
          pathname: '/add-photos-prompt',
          params: {
            projectId: createdId,
            projectName: newProject.name,
          },
        });
      }, 1500);
    } catch (err: any) {
      setLoading(false);
      const msg =
        err?.graphQLErrors?.[0]?.message ??
        err?.message ??
        t('createProject.errorCreate');
      AppAlert.alert(
        t('common.error'),
        msg,
        [{ text: t('common.ok') }],
        { type: 'error' },
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {t('createProject.detailsTitle')}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.infoSection}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
              <IconSymbol name="pencil.and.outline" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {t('createProject.almostReady')}
            </Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              {t('createProject.almostReadySubtitle')}
            </Text>
          </View>

          <View style={styles.form}>
            <AppInput
              label={t('createProject.projectName')}
              name="name"
              control={control}
              placeholder={t('createProject.projectNamePlaceholder')}
              icon="tag.fill"
            />

            <AppInput
              label={t('createProject.address')}
              name="location"
              control={control}
              placeholder={t('createProject.addressPlaceholder')}
              icon="location.fill"
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <AppInput
                  label={t('createProject.city')}
                  name="city"
                  control={control}
                  placeholder={t('createProject.cityPlaceholder')}
                  icon="building.fill"
                />
              </View>
              <View style={{ width: 120 }}>
                <AppInput
                  label={t('createProject.postalCode')}
                  name="postalCode"
                  control={control}
                  placeholder={t('createProject.postalCodePlaceholder')}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <AppInput
              label={t('createProject.notes')}
              name="notes"
              control={control}
              placeholder={t('createProject.notesPlaceholder')}
              icon="text.bubble.fill"
            />

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveButtonText}>{t('createProject.createButton')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  content: { paddingHorizontal: 16 },
  infoSection: { alignItems: 'center', marginBottom: 24 },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  title:    { fontSize: 26, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  form:     { width: '100%' },
  row:      { flexDirection: 'row' },
  saveButton: {
    height: 54, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginTop: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  saveButtonText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
});
