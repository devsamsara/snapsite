/**
 * components/ui/form-screen.tsx
 *
 * Contenedor único para TODAS las pantallas de formulario de la app.
 * Impone la misma estructura, espaciado y comportamiento de teclado:
 *
 *   ┌──────────────────────────────────┐
 *   │ [←]        Título                │  ← ScreenHeader (44pt)
 *   ├──────────────────────────────────┤
 *   │   (HeroHeader opcional)          │
 *   │   ┌────────────────────────┐     │
 *   │   │  campos (children)     │     │  ← scroll, padding 20
 *   │   └────────────────────────┘     │
 *   ├──────────────────────────────────┤
 *   │ [ CTA principal ]  (footer)      │  ← fija, safe area inferior
 *   └──────────────────────────────────┘
 *
 * Presentacional puro: navegación y submit llegan por props.
 *
 * `withSafeArea`:
 *   - true  (default) → pantallas push / fullScreenModal
 *   - false           → sheets (presentation:'modal'/'formSheet'), donde el
 *                       sistema ya deja la tarjeta bajo el status bar
 */

import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenHeader } from "./screen-header";
import { HeroBackdrop } from "./hero-backdrop";
import { useColors } from "@/hooks/use-colors";
import { spacing } from "@/constants/spacing";

export interface FormScreenProps {
  title: string;
  onBack: () => void;
  /** Nodo bajo el header y antes de los campos (típicamente <HeroHeader/>). */
  hero?: React.ReactNode;
  /** CTA principal fija al fondo (típicamente <Button/>). */
  footer?: React.ReactNode;
  /** Acción derecha del header (p. ej. botón Guardar). */
  right?: React.ReactNode;
  /** false para sheets (presentation 'modal'/'formSheet'). Default: true. */
  withSafeArea?: boolean;
  /**
   * Mismo velo de gradiente decorativo (HeroBackdrop) que Home/Proyectos/
   * Ajustes y el resto de modals. Opt-in (default: false) porque FormScreen
   * también lo usan pantallas push normales (forgot-password, confirm-email,
   * create-project-details) que no deben cambiar de aspecto sin pedirlo.
   */
  showHeroBackdrop?: boolean;
  children: React.ReactNode;
}

export function FormScreen({
  title,
  onBack,
  hero,
  footer,
  right,
  withSafeArea = true,
  showHeroBackdrop = false,
  children,
}: FormScreenProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[S.root, { backgroundColor: colors.background }]}>
      {showHeroBackdrop ? <HeroBackdrop height={340} /> : null}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={S.flex}
      >
        <ScreenHeader
          title={title}
          onBack={onBack}
          right={right}
          withSafeArea={withSafeArea}
        />

        <ScrollView
          contentContainerStyle={[
            S.content,
            { paddingBottom: (footer ? 16 : insets.bottom + 32) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {hero}
          <Animated.View entering={FadeInUp.duration(380).springify().damping(18)}>
            {children}
          </Animated.View>
        </ScrollView>

        {footer ? (
          <View
            style={[
              S.footer,
              {
                borderTopColor: colors.border,
                paddingBottom: Math.max(insets.bottom, 16) + 8,
              },
            ]}
          >
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    flexGrow: 1,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.base - 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
});
