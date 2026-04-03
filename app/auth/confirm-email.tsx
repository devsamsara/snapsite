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
import { useColors } from '@/hooks/use-colors';
import { useCardStyle } from '@/hooks/use-card-style';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AppInput } from '@/components/ui/app-input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as z from 'zod';

const schema = z.object({
  code: z.string().length(4, 'El código debe tener 4 dígitos'),
});

type FormValues = z.infer<typeof schema>;

export default function ConfirmEmailScreen() {
  const [loading, setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const colors                  = useColors();
  const cardElevation           = useCardStyle();
  const router                  = useRouter();
  const insets                  = useSafeAreaInsets();

  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: '' },
  });

  const onConfirm = async (_data: FormValues) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('¡Cuenta confirmada!', 'Tu correo ha sido verificado con éxito.', [
        { text: 'Ir al login', onPress: () => router.push('/auth/login') },
      ]);
    }, 1500);
  };

  const onResend = () => {
    setResending(true);
    setTimeout(() => {
      setResending(false);
      Alert.alert('Código reenviado', 'Revisa tu bandeja de entrada.');
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
          <Text style={[S.title, { color: colors.foreground }]}>Verifica tu correo</Text>
          <Text style={[S.subtitle, { color: colors.muted }]}>
            Hemos enviado un código de 4 dígitos a tu correo electrónico. Introdúcelo a continuación.
          </Text>
        </View>

        {/* Card con el input */}
        <View style={[S.card, cardElevation]}>
          <AppInput
            label="Código de verificación"
            name="code"
            control={control}
            placeholder="1234"
            keyboardType="number-pad"
            maxLength={4}
            icon="key.fill"
          />

          <Button
            title="Confirmar código"
            onPress={handleSubmit(onConfirm)}
            isLoading={loading}
            size="lg"
          />

          <View style={S.resendRow}>
            <Text style={[S.resendLabel, { color: colors.muted }]}>
              ¿No recibiste el código?{' '}
            </Text>
            <TouchableOpacity onPress={onResend} disabled={resending}>
              <Text style={[S.resendLink, { color: colors.primary, opacity: resending ? 0.5 : 1 }]}>
                {resending ? 'Enviando…' : 'Reenviar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info de seguridad */}
        <View style={[S.infoBox, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
          <IconSymbol name="info.circle.fill" size={16} color={colors.primary} />
          <Text style={[S.infoText, { color: colors.primary }]}>
            El código expira en 15 minutos. Si no lo encuentras, revisa tu carpeta de spam.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const S = StyleSheet.create({
  container:  { flex: 1 },
  content:    { flex: 1, paddingHorizontal: 24 },
  backBtn:    { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
  header:     { alignItems: 'center', marginBottom: 28 },
  iconCircle: { width: 88, height: 88, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title:      { fontSize: 26, fontWeight: '800', marginBottom: 10, textAlign: 'center' },
  subtitle:   { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  card:       { borderRadius: 20, padding: 24, gap: 12, marginBottom: 16 },
  resendRow:  { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: 4 },
  resendLabel: { fontSize: 13 },
  resendLink: { fontSize: 13, fontWeight: '700' },
  infoBox:    { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 14, borderRadius: 14, borderWidth: 1 },
  infoText:   { flex: 1, fontSize: 12, lineHeight: 18 },
});
