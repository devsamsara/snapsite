/**
 * components/ui/app-alert.tsx
 *
 * Reemplaza Alert.alert de React Native con un componente completamente
 * personalizado que sigue el sistema de diseño de snapsite.
 *
 * ── API idéntica a Alert.alert ───────────────────────────────────────────────
 *
 *   AppAlert.alert(title, message?, buttons?, options?)
 *
 * ── Uso con children (body extendible) ──────────────────────────────────────
 *
 *   AppAlert.custom({
 *     title: 'Confirmar',
 *     message: 'Descripción opcional',
 *     children: <MiContenidoPersonalizado />,
 *     buttons: [
 *       { text: 'Cancelar', style: 'cancel' },
 *       { text: 'Confirmar', style: 'destructive', onPress: handleConfirm },
 *     ],
 *   })
 *
 * ── Variantes de icono ───────────────────────────────────────────────────────
 *
 *   type: 'info' | 'success' | 'warning' | 'error' | 'question' | 'none'
 *
 * ── Setup (una sola vez en _layout.tsx) ─────────────────────────────────────
 *
 *   import { AppAlertProvider } from '@/components/ui/app-alert';
 *   // Añadir <AppAlertProvider /> como último hijo de GestureHandlerRootView
 *
 * ── Tipado de botones (igual que AlertButton de React Native) ────────────────
 *
 *   interface AppAlertButton {
 *     text: string;
 *     onPress?: () => void;
 *     style?: 'default' | 'cancel' | 'destructive';
 *   }
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  BackHandler,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColors } from '@/hooks/use-colors';

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export type AppAlertType = 'info' | 'success' | 'warning' | 'error' | 'question' | 'none';

export interface AppAlertButton {
  text: string;
  onPress?: () => void;
  /** 'cancel' → ghost, 'destructive' → danger, 'default' → primary */
  style?: 'default' | 'cancel' | 'destructive';
}

export interface AppAlertOptions {
  title: string;
  message?: string;
  /** Contenido JSX que se renderiza entre el mensaje y los botones */
  children?: React.ReactNode;
  buttons?: AppAlertButton[];
  /** Tipo de alerta — determina el color e icono del encabezado */
  type?: AppAlertType;
  /** Si true, tocar el backdrop cierra el alert (default: false) */
  cancelable?: boolean;
}

// ─── Contexto interno ─────────────────────────────────────────────────────────

interface AlertContextValue {
  show: (opts: AppAlertOptions) => void;
}

const AlertContext = createContext<AlertContextValue | null>(null);

// ─── Configuración de tipos ───────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  AppAlertType,
  { icon: React.ComponentProps<typeof MaterialIcons>['name']; color: (c: ReturnType<typeof useColors>) => string } | null
> = {
  info:     { icon: 'info',              color: c => c.primary },
  success:  { icon: 'check-circle',      color: c => c.success },
  warning:  { icon: 'warning',           color: c => c.warning },
  error:    { icon: 'error',             color: c => c.error },
  question: { icon: 'help',              color: c => c.primary },
  none:     null,
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppAlertProvider({ children }: { children?: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [opts, setOpts] = useState<AppAlertOptions>({ title: '' });
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const colors = useColors();

  const show = useCallback((options: AppAlertOptions) => {
    setOpts(options);
    setVisible(true);
    scaleAnim.setValue(0.88);
    opacityAnim.setValue(0);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 18,
        stiffness: 260,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const dismiss = useCallback((btn?: AppAlertButton) => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.92,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      btn?.onPress?.();
    });
  }, []);

  // ── Botones por defecto si no se pasan ──────────────────────────────────────
  const buttons: AppAlertButton[] = opts.buttons?.length
    ? opts.buttons
    : [{ text: 'OK', style: 'default' }];

  // ── Colores de botón por estilo ─────────────────────────────────────────────
  const btnBg = (style?: AppAlertButton['style']) => {
    switch (style) {
      case 'destructive': return colors.error;
      case 'cancel':      return colors.surface;
      default:            return colors.primary;
    }
  };
  const btnText = (style?: AppAlertButton['style']) => {
    switch (style) {
      case 'cancel': return colors.foreground;
      default:       return '#FFFFFF';
    }
  };
  const btnBorder = (style?: AppAlertButton['style']) =>
    style === 'cancel' ? colors.border : 'transparent';

  // ── Icono de tipo ───────────────────────────────────────────────────────────
  const typeConf = opts.type ? TYPE_CONFIG[opts.type] : null;
  const iconColor = typeConf ? typeConf.color(colors) : colors.primary;

  // ── Layout: botones en fila si son 2, en columna si son 3+ ─────────────────
  const btnRow = buttons.length === 2;

  return (
    <AlertContext.Provider value={{ show }}>
      {children}

      <Modal
        transparent
        visible={visible}
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => {
          if (opts.cancelable) dismiss();
        }}
      >
        {/* Backdrop */}
        <TouchableWithoutFeedback
          onPress={() => { if (opts.cancelable) dismiss(); }}
        >
          <View style={S.backdrop} />
        </TouchableWithoutFeedback>

        {/* Card */}
        <View style={S.centeredView} pointerEvents="box-none">
          <Animated.View
            style={[
              S.card,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
              },
            ]}
          >
            {/* ── Icono de tipo ── */}
            {typeConf && (
              <View style={S.iconWrap}>
                <MaterialIcons name={typeConf.icon} size={32} color={iconColor} />
              </View>
            )}

            {/* ── Título ── */}
            <Text style={[S.title, { color: colors.foreground }]}>
              {opts.title}
            </Text>

            {/* ── Mensaje ── */}
            {!!opts.message && (
              <Text style={[S.message, { color: colors.muted }]}>
                {opts.message}
              </Text>
            )}

            {/* ── Children (body extendible) ── */}
            {opts.children ? (
              <View style={S.childrenWrap}>
                {opts.children}
              </View>
            ) : null}

            {/* ── Separador ── */}
            <View style={[S.divider, { backgroundColor: colors.border }]} />

            {/* ── Botones ── */}
            <View style={[S.btnRow, { flexDirection: btnRow ? 'row' : 'column', gap: 8 }]}>
              {buttons.map((btn, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => dismiss(btn)}
                  style={({ pressed }) => [
                    S.btn,
                    btnRow && S.btnFlex,
                    {
                      backgroundColor: btnBg(btn.style),
                      borderColor: btnBorder(btn.style),
                      borderWidth: btn.style === 'cancel' ? 1 : 0,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[S.btnText, { color: btnText(btn.style) }]}
                    numberOfLines={1}
                  >
                    {btn.text}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
}

// ─── Hook interno ─────────────────────────────────────────────────────────────

function useAppAlertContext(): AlertContextValue {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('[AppAlert] AppAlertProvider not found in tree');
  return ctx;
}

// ─── Referencia global (permite llamar AppAlert.alert sin hook) ───────────────

let _globalShow: ((opts: AppAlertOptions) => void) | null = null;

/** Componente puente que conecta el contexto con la referencia global */
export function AppAlertBridge() {
  const { show } = useAppAlertContext();
  _globalShow = show;
  return null;
}

// ─── API pública estática ─────────────────────────────────────────────────────

export const AppAlert = {
  /**
   * API idéntica a Alert.alert de React Native.
   *
   *   AppAlert.alert('Título', 'Mensaje', [
   *     { text: 'Cancelar', style: 'cancel' },
   *     { text: 'Eliminar', style: 'destructive', onPress: handleDelete },
   *   ])
   */
  alert(
    title: string,
    message?: string,
    buttons?: AppAlertButton[],
    options?: { cancelable?: boolean; type?: AppAlertType },
  ) {
    if (!_globalShow) {
      console.warn('[AppAlert] AppAlertProvider not mounted. Falling back to Alert.alert');
      // Fallback seguro si el provider no está montado
      const { Alert } = require('react-native');
      Alert.alert(title, message, buttons as any);
      return;
    }
    _globalShow({ title, message, buttons, cancelable: options?.cancelable, type: options?.type });
  },

  /**
   * API extendida con soporte para children y tipo de icono.
   *
   *   AppAlert.custom({
   *     title: 'Confirmar',
   *     type: 'warning',
   *     children: <MiComponente />,
   *     buttons: [{ text: 'OK' }],
   *   })
   */
  custom(opts: AppAlertOptions) {
    if (!_globalShow) {
      console.warn('[AppAlert] AppAlertProvider not mounted.');
      return;
    }
    _globalShow(opts);
  },
};

// ─── Hook (alternativa reactiva para usar dentro de componentes) ──────────────

export function useAppAlert() {
  return useAppAlertContext();
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = Math.min(SCREEN_W - 48, 340);

const S = StyleSheet.create({
  // Backdrop semitransparente
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  // Centrado del card
  centeredView: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Card principal
  card: {
    width: CARD_W,
    borderRadius: 20,
    borderWidth: 1,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
    // Sombra iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    // Elevación Android
    elevation: 12,
  },
  // Icono de tipo — solo el icono, sin fondo relleno
  iconWrap: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  // Textos
  title: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 6,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 4,
  },
  // Área de children
  childrenWrap: {
    width: '100%',
    marginTop: 12,
  },
  // Separador
  divider: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
    marginTop: 18,
    marginBottom: 14,
  },
  // Botones
  btnRow: {
    width: '100%',
  },
  btn: {
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  btnFlex: {
    flex: 1,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
