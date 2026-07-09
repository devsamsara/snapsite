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
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StyleProp,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";

// ─── ModalHeader ──────────────────────────────────────────────────────────────

interface ModalHeaderProps {
  /** Título principal del modal */
  title: string;
  /** Subtítulo o descripción opcional */
  subtitle?: string;
  /** Callback al presionar el botón de cierre (X) */
  onClose?: () => void;
  /** Ocultar el botón de cierre (útil cuando el footer ya tiene Cancelar) */
  hideClose?: boolean;
  /** Estilos adicionales para el contenedor del header */
  style?: StyleProp<ViewStyle>;
}

export function ModalHeader({
  title,
  subtitle,
  onClose,
  hideClose = false,
  style,
}: ModalHeaderProps) {
  const colors = useColors();

  return (
    // zIndex + backgroundColor garantizan que el header siempre quede
    // encima del ScrollView del ModalBody cuando el usuario hace scroll.
    <View
      style={[
        S.header,
        { backgroundColor: colors.background, borderBottomColor: colors.border },
        style,
      ]}
    >
      {/* Drag pill — siempre visible, indica que el modal es deslizable */}


      {/* Title row */}
      <View style={S.titleRow}>
        <View style={S.titleBlock}>
          <Text style={[S.title, { color: colors.foreground }]} numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[S.subtitle, { color: colors.muted }]} numberOfLines={3}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {!hideClose && onClose ? (
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={[
              S.closeBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <MaterialIcons name="close" size={18} color={colors.muted} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

// ─── ModalBody ────────────────────────────────────────────────────────────────

interface ModalBodyProps {
  children: React.ReactNode;
  /** Si true, envuelve el contenido en un ScrollView (default: false) */
  scrollable?: boolean;
  /** Estilos adicionales para el contenedor */
  style?: StyleProp<ViewStyle>;
  /** Padding horizontal (default: 20) */
  paddingH?: number;
}

export function ModalBody({
  children,
  scrollable = false,
  style,
  paddingH = 20,
}: ModalBodyProps) {
  const colors = useColors();

  if (scrollable) {
    return (
      <ScrollView
        style={[S.body, style]}
        contentContainerStyle={[S.bodyContent, { paddingHorizontal: paddingH }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        // bounces:false evita que el rebote superior superponga el contenido
        // sobre el ModalHeader en iOS
        bounces={false}
        overScrollMode="never"
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View style={[S.body, { paddingHorizontal: paddingH }, style]}>
      {children}
    </View>
  );
}

// ─── ModalFooter ──────────────────────────────────────────────────────────────

interface ModalFooterProps {
  children: React.ReactNode;
  /** Estilos adicionales para el contenedor */
  style?: StyleProp<ViewStyle>;
  /** Padding horizontal (default: 20) */
  paddingH?: number;
  /** Si true, los botones se colocan en fila horizontal (default: false = columna) */
  row?: boolean;
}

export function ModalFooter({
  children,
  style,
  paddingH = 20,
  row = false,
}: ModalFooterProps) {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
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
          flexDirection: row ? "row" : "column",
          gap: row ? 8 : 10,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ─── ModalRoot ────────────────────────────────────────────────────────────────
// Wrapper raíz que aplica el color de fondo del tema y ocupa toda la pantalla.

interface ModalRootProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function ModalRoot({ children, style }: ModalRootProps) {
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
    paddingBottom: 16,
    // zIndex asegura que el header quede siempre encima del ScrollView
    zIndex: 10,
    // Borde inferior sutil para separar visualmente el header del body
    // (el color se inyecta en runtime con colors.border)
    borderBottomWidth: StyleSheet.hairlineWidth,
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
    marginTop: 14
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

  // ModalBody
  body: {
    flex: 1,
    // overflow:hidden en el contenedor evita que el ScrollView
    // pinte fuera de sus límites y tape el header
    overflow: 'hidden',
  },
  bodyContent: {
    paddingBottom: 8,
    flexGrow: 1,
  },

  // ModalFooter
  footer: {
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
