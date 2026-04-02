import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/use-colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AppInput } from '@/components/ui/app-input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const confirmEmailSchema = z.object({
  code: z.string().length(4, 'El código debe tener 4 dígitos'),
});

type ConfirmEmailFormValues = z.infer<typeof confirmEmailSchema>;

export default function ConfirmEmailScreen() {
  const [loading, setLoading] = useState(false);
  const colors = useColors();
  const router = useRouter();

  const { control, handleSubmit, formState: { errors } } = useForm<ConfirmEmailFormValues>({
    resolver: zodResolver(confirmEmailSchema),
    defaultValues: {
      code: '',
    }
  });

  const handleConfirm = async (data: ConfirmEmailFormValues) => {
    setLoading(true);
    // Simular confirmación
    setTimeout(() => {
      setLoading(false);
      Alert.alert('¡Cuenta Confirmada!', 'Tu correo ha sido verificado con éxito.', [
        { text: 'Ir al Login', onPress: () => router.push('/auth/login') }
      ]);
    }, 1500);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: colors.success + '20' }]}>
            <IconSymbol name="envelope.fill" size={40} color={colors.success} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Verifica tu correo</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Hemos enviado un código de 4 dígitos a tu correo electrónico</Text>
        </View>

        <View style={styles.form}>
          <AppInput
            label="Código de Verificación"
            name="code"
            control={control}
            placeholder="1234"
            keyboardType="number-pad"
            maxLength={4}
            style={styles.codeInput}
          />

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleSubmit(handleConfirm)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Confirmar Código</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.resendButton}>
            <Text style={{ color: colors.primary, fontWeight: '600' }}>Reenviar código</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 24, paddingTop: 60 },
  backButton: { marginBottom: 32 },
  header: { alignItems: 'center', marginBottom: 40 },
  iconContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  form: { width: '100%' },
  codeInput: { textAlign: 'center', letterSpacing: 10, fontSize: 24, fontWeight: '700' },
  button: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  resendButton: { marginTop: 24, alignSelf: 'center' },
});
