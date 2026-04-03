/**
 * app/auth/login.tsx
 *
 * Pantalla de inicio de sesión.
 * Adapta colores (dark/light) y estilo de card (flat/elevated)
 * usando useColors() y useCardStyle() del sistema de diseño.
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
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { useColors } from '@/hooks/use-colors';
import { useCardStyle } from '@/hooks/use-card-style';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AppInput } from '@/components/ui/app-input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as z from 'zod';

const loginSchema = z.object({
  username: z.string().min(1, 'El usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const { signIn }            = useAuth();
  const colors                = useColors();
  const cardElevation         = useCardStyle();
  const router                = useRouter();
  const insets                = useSafeAreaInsets();

  const { control, handleSubmit } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const onLogin = async (data: LoginFormValues) => {
    setLoading(true);
    const success = await signIn(data.username, data.password);
    setLoading(false);
    if (!success) {
      Alert.alert('Error', 'Usuario o contraseña incorrectos. Prueba con juan / juan');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[S.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[
          S.scrollContent,
          { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <View style={S.brand}>
          <View style={[S.logoCircle, { backgroundColor: colors.primary + '18' }]}>
            <IconSymbol name="camera.fill" size={40} color={colors.primary} />
          </View>
          <Text style={[S.appName, { color: colors.foreground }]}>SnapSite</Text>
          <Text style={[S.tagline, { color: colors.muted }]}>Gestión visual de obras</Text>
        </View>

        {/* Formulario */}
        <View style={[S.card, cardElevation]}>
          <Text style={[S.cardTitle, { color: colors.foreground }]}>Iniciar sesión</Text>

          <AppInput
            label="Usuario"
            name="username"
            control={control}
            placeholder="juan"
            icon="person.fill"
            autoCapitalize="none"
          />

          <AppInput
            label="Contraseña"
            name="password"
            control={control}
            placeholder="••••••••"
            icon="lock.fill"
            secureTextEntry
          />

          <TouchableOpacity
            onPress={() => router.push('/auth/forgot-password')}
            style={S.forgotRow}
          >
            <Text style={[S.forgotText, { color: colors.primary }]}>
              ¿Olvidaste tu contraseña?
            </Text>
          </TouchableOpacity>

          <Button
            title="Iniciar sesión"
            onPress={handleSubmit(onLogin)}
            isLoading={loading}
            size="lg"
          />
        </View>

        {/* Separador */}
        <View style={S.divider}>
          <View style={[S.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[S.dividerText, { color: colors.muted }]}>o</Text>
          <View style={[S.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        {/* Registro */}
        <View style={[S.registerCard, cardElevation]}>
          <Text style={[S.registerHint, { color: colors.muted }]}>
            ¿No tienes cuenta?
          </Text>
          <Button
            title="Crear cuenta gratis"
            onPress={() => router.push('/auth/register')}
            variant="secondary"
            size="md"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const S = StyleSheet.create({
  container:    { flex: 1 },
  scrollContent: { paddingHorizontal: 24 },
  // Brand
  brand:        { alignItems: 'center', marginBottom: 28 },
  logoCircle:   { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  appName:      { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  tagline:      { fontSize: 15, marginTop: 4 },
  // Card
  card:         { borderRadius: 20, padding: 24, marginBottom: 16 },
  cardTitle:    { fontSize: 22, fontWeight: '700', marginBottom: 20 },
  forgotRow:    { alignSelf: 'flex-end', marginTop: -4, marginBottom: 20 },
  forgotText:   { fontSize: 13, fontWeight: '600' },
  // Divider
  divider:      { flexDirection: 'row', alignItems: 'center', marginVertical: 8, gap: 12 },
  dividerLine:  { flex: 1, height: 1 },
  dividerText:  { fontSize: 13, fontWeight: '500' },
  // Register card
  registerCard: { borderRadius: 20, padding: 20, alignItems: 'center', gap: 12 },
  registerHint: { fontSize: 14 },
});
