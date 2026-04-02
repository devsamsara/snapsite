import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/use-colors';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const colors = useColors();
  const router = useRouter();

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    // Simular registro
    setTimeout(() => {
      setLoading(false);
      router.push('/auth/confirm-email');
    }, 1500);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Crear Cuenta</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Únete a la comunidad de Snapsite</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>Nombre Completo</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
              placeholder="Juan Pérez"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>Correo Electrónico</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
              placeholder="juan@ejemplo.com"
              placeholderTextColor={colors.muted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>Contraseña</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
              placeholder="••••••••"
              placeholderTextColor={colors.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Registrarse</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={{ color: colors.muted }}>¿Ya tienes cuenta? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>Inicia Sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 60 },
  backButton: { marginBottom: 32 },
  header: { marginBottom: 40 },
  title: { fontSize: 32, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 16 },
  form: { width: '100%' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { height: 56, borderRadius: 16, paddingHorizontal: 16, fontSize: 16, borderWidth: 1 },
  button: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
});
