import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FormScreen } from '@/components/ui/form-screen';
import { HeroHeader } from '@/components/ui/hero-header';
import { Button } from '@/components/ui/button';
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
        latitude: Number.parseFloat(params.latitude),
        longitude: Number.parseFloat(params.longitude),
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
    <FormScreen
      title={t('createProject.detailsTitle')}
      onBack={() => router.back()}
      hero={
        <HeroHeader
          icon="pencil.and.outline"
          subtitle={t('createProject.almostReadySubtitle')}
        />
      }
      footer={
        <Button
          title={t('createProject.createButton')}
          onPress={handleSubmit(onSubmit)}
          isLoading={isLoading}
          size="lg"
        />
      }
    >
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

          </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  form:     { width: '100%' },
  row:      { flexDirection: 'row' },
});
