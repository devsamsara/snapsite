import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { AppInput } from '@/components/ui/app-input';
import { BlurView } from 'expo-blur';

const projectSchema = z.object({
  name: z.string().min(3, 'El nombre del proyecto debe tener al menos 3 caracteres'),
  address: z.string().min(5, 'La dirección es requerida'),
  city: z.string().min(2, 'La ciudad es requerida'),
  postalCode: z.string().min(4, 'El código postal es requerido'),
  notes: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export default function CreateProjectDetailsScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams<{ latitude: string, longitude: string, address: string }>();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      address: params.address || '',
      city: '',
      postalCode: '',
      notes: '',
    }
  });

  const onSubmit = async (data: ProjectFormValues) => {
    setLoading(true);
    try {
      // Simulate saving project
      const newProject = {
        id: Math.random().toString(36).substr(2, 9),
        ...data,
        latitude: parseFloat(params.latitude),
        longitude: parseFloat(params.longitude),
        image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=300&h=300&fit=crop',
      };

      console.log('Project Created:', newProject);
      
      setTimeout(() => {
        setLoading(false);
        Alert.alert('¡Éxito!', 'El proyecto ha sido creado correctamente.', [
          { text: 'Ir al Home', onPress: () => router.dismissAll() }
        ]);
      }, 1500);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'No se pudo crear el proyecto.');
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
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Detalles del Proyecto</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.infoSection}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
              <IconSymbol name="pencil.and.outline" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>Casi listo</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>Completa la información final para crear tu nuevo proyecto.</Text>
          </View>

          <View style={styles.form}>
            <AppInput
              label="Nombre del Proyecto"
              name="name"
              control={control}
              placeholder="Ej: Renovación Oficina Central"
              icon="tag.fill"
            />

            <AppInput
              label="Dirección"
              name="address"
              control={control}
              placeholder="Calle y número"
              icon="location.fill"
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <AppInput
                  label="Ciudad"
                  name="city"
                  control={control}
                  placeholder="Ej: Madrid"
                  icon="building.fill"
                />
              </View>
              <View style={{ width: 120 }}>
                <AppInput
                  label="C.P."
                  name="postalCode"
                  control={control}
                  placeholder="28001"
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <AppInput
              label="Notas (Opcional)"
              name="notes"
              control={control}
              placeholder="Detalles adicionales..."
              icon="text.bubble.fill"
              multiline
              numberOfLines={3}
              style={{ height: 100, textAlignVertical: 'top', paddingTop: 12 }}
            />

            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveButtonText}>Crear Proyecto</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 24,
  },
  infoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
  },
  saveButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
