/**
 * hooks/use-notifications.ts
 *
 * Gestión centralizada de notificaciones push para SnapSite.
 *
 * Responsabilidades:
 *  - Configurar el handler de notificaciones en foreground (una sola vez, a nivel módulo)
 *  - Exponer `useNotifications()` para escuchar notificaciones entrantes y taps
 *  - Exponer helpers puros para solicitar permisos, obtener el token y programar notificaciones
 *
 * Lo que NO hace este hook:
 *  - NO solicita permisos automáticamente al montarse (lo hace el onboarding o el toggle de Settings)
 *  - NO envía el token al backend (eso lo hace el caller con `registerPushToken`)
 */

import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { AppState, AppStateStatus, Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Constantes ──────────────────────────────────────────────────────────────

/** Clave AsyncStorage para persistir si el usuario ya ha decidido sobre las notificaciones. */
export const NOTIFICATIONS_ASKED_KEY = '@snapsite_notifications_asked';

/**
 * Clave AsyncStorage para persistir si el usuario ha desactivado las notificaciones
 * manualmente desde la app (independientemente del permiso del sistema).
 */
export const NOTIFICATIONS_DISABLED_KEY = '@snapsite_notifications_disabled';

// ─── Handler de foreground (se configura una sola vez a nivel módulo) ─────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: false,
    shouldShowList: false,
  }),
});

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type PushPermissionStatus = 'granted' | 'denied' | 'undetermined' | 'unavailable';

export interface NotificationHookResult {
  /** Última notificación recibida mientras la app estaba en foreground. */
  lastNotification: Notifications.Notification | null;
  /** Estado actual del permiso de notificaciones del sistema. */
  permissionStatus: PushPermissionStatus;
}

// ─── Hook principal ──────────────────────────────────────────────────────────

/**
 * Hook para escuchar notificaciones entrantes y taps.
 * NO solicita permisos ni obtiene el token — usa `requestPushPermission` para eso.
 */
export function useNotifications(): NotificationHookResult {
  const [lastNotification, setLastNotification] = useState<Notifications.Notification | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PushPermissionStatus>('undetermined');

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener     = useRef<Notifications.EventSubscription | null>(null);

  // Leer el estado inicial del permiso
  useEffect(() => {
    getPermissionStatus().then(setPermissionStatus);
  }, []);

  // Actualizar el estado del permiso cuando la app vuelve al foreground.
  // El usuario puede haber cambiado el permiso en los ajustes del sistema sin
  // que la app se haya enterado.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        getPermissionStatus().then(setPermissionStatus);
      }
    });
    return () => subscription.remove();
  }, []);

  // Listeners de notificaciones
  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setLastNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(_response => {
      // TODO: implementar deep-link según response.notification.request.content.data
      // Ejemplo:
      // const { projectId } = _response.notification.request.content.data;
      // if (projectId) router.push(`/project/${projectId}`);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return { lastNotification, permissionStatus };
}

// ─── Helpers puros (no hooks) ─────────────────────────────────────────────────

/**
 * Devuelve el estado actual del permiso de notificaciones del sistema.
 * Seguro de llamar en cualquier momento.
 */
export async function getPermissionStatus(): Promise<PushPermissionStatus> {
  if (!Constants.isDevice) return 'unavailable';
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status as PushPermissionStatus;
  } catch {
    return 'unavailable';
  }
}

/**
 * Solicita el permiso de notificaciones al sistema operativo.
 * Si ya fue concedido, no vuelve a preguntar al usuario.
 *
 * @returns El token Expo Push si el permiso fue concedido, o `null` si fue denegado.
 */
export async function requestPushPermission(): Promise<string | null> {
  if (!Constants.isDevice) {
    if (__DEV__) console.warn('[Notifications] Push notifications require a physical device.');
    return null;
  }

  // El canal de Android debe crearse antes de solicitar el permiso
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563EB',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  // Marcar que ya se le preguntó al usuario (para no volver a preguntar en el onboarding)
  await AsyncStorage.setItem(NOTIFICATIONS_ASKED_KEY, 'true').catch(() => {});

  if (finalStatus !== 'granted') {
    if (__DEV__) console.log('[Notifications] Permission denied by user.');
    return null;
  }

  return getExpoPushToken();
}

/**
 * Obtiene el token Expo Push del dispositivo sin solicitar permisos.
 * Requiere que el permiso ya haya sido concedido previamente.
 *
 * @returns El token string, o `null` si no está disponible.
 */
export async function getExpoPushToken(): Promise<string | null> {
  if (!Constants.isDevice) return null;
  try {
    const projectId: string | undefined = Constants.expoConfig?.extra?.eas?.projectId;
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data ?? null;
  } catch (error) {
    if (__DEV__) console.error('[Notifications] Error getting push token:', error);
    return null;
  }
}

/**
 * Devuelve si el usuario ha desactivado manualmente las notificaciones
 * desde la app (independientemente del permiso del sistema).
 */
export async function isNotificationsDisabledByUser(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(NOTIFICATIONS_DISABLED_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

/**
 * Persiste la preferencia del usuario sobre las notificaciones.
 * @param disabled `true` para desactivar, `false` para activar.
 */
export async function setNotificationsDisabledByUser(disabled: boolean): Promise<void> {
  try {
    if (disabled) {
      await AsyncStorage.setItem(NOTIFICATIONS_DISABLED_KEY, 'true');
    } else {
      await AsyncStorage.removeItem(NOTIFICATIONS_DISABLED_KEY);
    }
  } catch { /* ignore */ }
}

/**
 * Programa una notificación local de prueba para 2 segundos después.
 * Útil para verificar que las notificaciones funcionan correctamente.
 */
export async function scheduleTestNotification(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'SnapSite 📸',
      body: 'Las notificaciones están activadas correctamente.',
      data: {},
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
    },
  });
}

/**
 * Cancela todas las notificaciones programadas.
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
