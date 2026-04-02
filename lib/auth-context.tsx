import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';

interface AuthContextType {
  user: string | null;
  signIn: (user: string, pass: string) => Promise<boolean>;
  signOut: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Simular carga inicial
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!user && !inAuthGroup) {
      // Redirigir al login si no hay usuario y no estamos en el grupo de auth
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      // Redirigir al home si hay usuario y estamos en el grupo de auth
      router.replace('/(tabs)');
    }
  }, [user, segments, isLoading]);

  const signIn = async (username: string, pass: string) => {
    // Usuario de prueba solicitado: juan / juan
    if (username.toLowerCase() === 'juan' && pass === 'juan') {
      setUser('Juan');
      return true;
    }
    return false;
  };

  const signOut = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
