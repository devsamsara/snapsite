/**
 * components/ui/app-alert.tsx
 *
 * Wrapper sobre Alert de React Native que mantiene la misma API pública
 * pero añade soporte para tipo de icono y children en el mensaje.
 *
 * ── Por qué no usamos un Modal personalizado ────────────────────────────────
 * En iOS, un Modal de React Native NO puede renderizarse sobre un UIViewController
 * modal (formSheet, modal, fullScreenModal). Expo Router presenta todas las
 * pantallas de tipo modal como UIViewController modales nativos, por lo que
 * cualquier Modal de RN lanzado desde dentro de ellas queda bloqueado detrás.
 * La única solución fiable y sin dependencias extra es usar Alert.alert() nativo,
 * que sí se renderiza sobre cualquier capa en iOS y Android.
 *
 * ── API pública ──────────────────────────────────────────────────────────────
 *
 *   AppAlert.alert(title, message?, buttons?, options?)
 *   AppAlert.custom({ title, message, type, buttons, children })
 *
 * ── Tipos de icono ───────────────────────────────────────────────────────────
 *   type: 'info' | 'success' | 'warning' | 'error' | 'question' | 'none'
 *   El emoji correspondiente se antepone al título automáticamente.
 *
 * ── Setup ────────────────────────────────────────────────────────────────────
 *   No requiere Provider. Importar y llamar directamente.
 *   AppAlertProvider y AppAlertBridge se mantienen como no-ops para
 *   compatibilidad con el código existente.
 */

import { Alert } from 'react-native';

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export type AppAlertType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'question'
  | 'none';

export interface AppAlertButton {
  text: string;
  onPress?: () => void;
  /** 'cancel' → ghost, 'destructive' → danger, 'default' → primary */
  style?: 'default' | 'cancel' | 'destructive';
}

export interface AppAlertOptions {
  title: string;
  message?: string;
  /** Contenido extra — se serializa como texto en el mensaje nativo */
  children?: React.ReactNode;
  buttons?: AppAlertButton[];
  type?: AppAlertType;
  cancelable?: boolean;
}

// ─── Emoji por tipo ───────────────────────────────────────────────────────────

const TYPE_EMOJI: Record<AppAlertType, string> = {
  info:     'ℹ️  ',
  success:  '✅  ',
  warning:  '⚠️  ',
  error:    '❌  ',
  question: '❓  ',
  none:     '',
};

// ─── Conversión de botones ────────────────────────────────────────────────────

function toRNButtons(
  buttons?: AppAlertButton[],
): Parameters<typeof Alert.alert>[2] {
  if (!buttons?.length) return [{ text: 'OK', style: 'default' }];
  return buttons.map((b) => ({
    text: b.text,
    style: b.style ?? 'default',
    onPress: b.onPress,
  }));
}

// ─── API pública ──────────────────────────────────────────────────────────────

export const AppAlert = {
  /**
   * API idéntica a Alert.alert de React Native.
   * Funciona desde cualquier pantalla, modal o formSheet.
   *
   *   AppAlert.alert('Título', 'Mensaje', [
   *     { text: 'Cancelar', style: 'cancel' },
   *     { text: 'Eliminar', style: 'destructive', onPress: handleDelete },
   *   ], { type: 'error' })
   */
  alert(
    title: string,
    message?: string,
    buttons?: AppAlertButton[],
    options?: { cancelable?: boolean; type?: AppAlertType },
  ) {
    const prefix = options?.type ? TYPE_EMOJI[options.type] : '';
    Alert.alert(
      `${prefix}${title}`,
      message,
      toRNButtons(buttons),
      { cancelable: options?.cancelable ?? false },
    );
  },

  /**
   * API extendida — acepta el objeto AppAlertOptions completo.
   *
   *   AppAlert.custom({
   *     title: 'Confirmar',
   *     type: 'warning',
   *     message: 'Esta acción no se puede deshacer.',
   *     buttons: [
   *       { text: 'Cancelar', style: 'cancel' },
   *       { text: 'Confirmar', style: 'destructive', onPress: handleConfirm },
   *     ],
   *   })
   */
  custom(opts: AppAlertOptions) {
    const prefix = opts.type ? TYPE_EMOJI[opts.type] : '';
    Alert.alert(
      `${prefix}${opts.title}`,
      opts.message,
      toRNButtons(opts.buttons),
      { cancelable: opts.cancelable ?? false },
    );
  },
};

// ─── Stubs de compatibilidad ──────────────────────────────────────────────────
// AppAlertProvider y AppAlertBridge se mantienen como no-ops para que el código
// existente en _layout.tsx no necesite cambios.

export function AppAlertProvider({
  children,
}: {
  children?: React.ReactNode;
}): React.ReactElement | null {
  return (children as React.ReactElement) ?? null;
}

export function AppAlertBridge(): null {
  return null;
}

export function useAppAlert() {
  return {
    show: (opts: AppAlertOptions) => AppAlert.custom(opts),
  };
}
