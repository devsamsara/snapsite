/**
 * components/ui/modal-layout.tsx
 *
 * Componentes de layout para pantallas modales (Stack.Screen presentation:formSheet
 * o fullScreenModal). Garantizan homogeneidad visual en todos los modales del proyecto.
 *
 * Uso típico:
 * ─────────────────────────────────────────────────────────────────────────────
 *   <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
 *     <ModalHeader
 *       title="Título"
 *       subtitle="Descripción opcional"
 *       onClose={router.back}
 *     />
 *     <ModalBody>
 *       {... contenido scrollable o estático ...}
 *     </ModalBody>
 *     <ModalFooter>
 *       <Button title="Confirmar" onPress={handleConfirm} />
 *       <Button title="Cancelar"  onPress={router.back}  variant="ghost" />
 *     </ModalFooter>
 *   </KeyboardAvoidingView>
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Estructura visual:
 *
 *   ┌─────────────────────────────────┐
 *   │  ────  (drag pill)              │  ← siempre presente
 *   │  Título                    [✕]  │  ← ModalHeader
 *   │  Subtítulo                      │
 *   ├─────────────────────────────────┤
 *   │                                 │
 *   │  Contenido (scroll o estático)  │  ← ModalBody
 *   │                                 │
 *   ├─────────────────────────────────┤
 *   │  [  Acción principal  ]         │  ← ModalFooter
 *   │  [  Acción secundaria ]         │
 *   └─────────────────────────────────┘
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StyleProp,
  ViewStyle,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { PressableScale } from "./pressable-scale";
import { HeroBackdrop } from "./hero-backdrop";
import { useColors } from "@/hooks/use-colors";
import { spacing } from "@/constants/spacing";

interface ModalHeaderProps {
  title: string;
  subtitle?: string;
  onClose?: () => void;
  hideClose?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ModalHeader({
  title,
  subtitle,
  onClose,
  hideClose = false,
  style,
}: Readonly<ModalHeaderProps>) {
  const colors = useColors();

  return (
    <View style={[S.header, { backgroundColor: colors.background }, style]}>
      <HeroBackdrop height={140} />
      <View style={[S.pill, { backgroundColor: colors.border }]} />

      <View style={S.titleRow}>
        <View style={S.titleBlock}>
          <Text
            style={[S.title, { color: colors.foreground }]}
            numberOfLines={2}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[S.subtitle, { color: colors.muted }]}
              numberOfLines={3}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {!hideClose && onClose ? (
          <PressableScale
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={[
              S.closeBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            pressedScale={0.88}
            haptic
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <MaterialIcons name="close" size={18} color={colors.muted} />
          </PressableScale>
        ) : null}
      </View>
    </View>
  );
}

interface ModalBodyProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  paddingH?: number;
}

export function ModalBody({
  children,
  scrollable = false,
  style,
  paddingH = 20,
}: Readonly<ModalBodyProps>) {
  const colors = useColors();
  if (scrollable) {
    return (
      <View style={S.bodyShadowWrapper}>
        <ScrollView
          style={[S.body,  style]}
          contentContainerStyle={[
            S.bodyContent,
            { paddingHorizontal: paddingH },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
        >
          <Animated.View
            entering={FadeInUp.duration(320).springify().damping(18)}
          >
            {children}
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={S.bodyShadowWrapper}>
      <View style={[S.body, { paddingHorizontal: paddingH }, style]}>
        <Animated.View
          style={S.flex1}
          entering={FadeInUp.duration(320).springify().damping(18)}
        >
          {children}
        </Animated.View>
      </View>
    </View>
  );
}

// ─── ModalFooter ──────────────────────────────────────────────────────────────

interface ModalFooterProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  paddingH?: number;
  row?: boolean;
}

export function ModalFooter({
  children,
  style,
  paddingH = 20,
  row = false,
}: Readonly<ModalFooterProps>) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 16) + 8;

  return (
    <View
      style={[
        S.footer,
        {
          paddingHorizontal: paddingH,
          paddingBottom: bottomPad,
          borderTopColor: colors.border,
          backgroundColor: colors.background,
          flexDirection: row ? 'row' : 'column',
          gap: row ? 8 : 10,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

interface ModalRootProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function ModalRoot({ children, style }: Readonly<ModalRootProps>) {
  const colors = useColors();
  return (
    <View style={[S.root, { backgroundColor: colors.background }, style]}>
      {children}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  // ModalRoot
  root: {
    flex: 1,
  },

  // ModalHeader
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    // zIndex asegura que el header quede siempre encima del ScrollView
    zIndex: 10,
    // Recorta el HeroBackdrop a los límites del header (que además son los
    // del propio sheet, con esquinas redondeadas del sistema en iOS)
    overflow: "hidden",
  },
  pill: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 18,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 26,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },

  bodyShadowWrapper: {
    flex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  body: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: spacing.xl,
    overflow: 'hidden',
  },
  bodyContent: {
    paddingBottom: 8,
    flexGrow: 1,
  },

  footer: {
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },

  flex1: { flex: 1 },
});
