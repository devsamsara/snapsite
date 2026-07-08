# Configuración de Push Notifications - Snapsite

## Resumen

Se ha implementado un sistema completo de notificaciones push en Snapsite utilizando `expo-notifications`. El sistema incluye:

- Solicitud de permisos de notificaciones
- Registro de tokens push
- Manejo de notificaciones en primer plano y segundo plano
- Notificaciones de prueba
- Integración con la pantalla de Settings

## Archivos Modificados y Creados

### 1. `/hooks/use-notifications.ts` (NUEVO)

Hook personalizado que maneja toda la lógica de notificaciones:

**Funcionalidades:**
- **Registro automático** de push tokens al montar el componente
- **Listeners** para notificaciones recibidas y respuestas del usuario
- **Configuración de canales** de Android con importancia máxima
- **Solicitud de permisos** en iOS y Android
- **Funciones auxiliares** para programar y cancelar notificaciones

**Exports:**
```typescript
export function useNotifications(): {
  expoPushToken: string;
  notification: Notifications.Notification | undefined;
}

export async function scheduleTestNotification(): Promise<void>
export async function cancelAllNotifications(): Promise<void>
```

**Configuración del Handler:**
```typescript
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,    // Mostrar alerta
    shouldPlaySound: true,    // Reproducir sonido
    shouldSetBadge: true,     // Actualizar badge
  }),
});
```

### 2. `/app.config.ts` (MODIFICADO)

Se agregó la configuración necesaria para notificaciones push:

**iOS:**
```typescript
ios: {
  infoPlist: {
    UIBackgroundModes: ["remote-notification"],
  },
}
```

**Plugin de Notificaciones:**
```typescript
[
  "expo-notifications",
  {
    icon: "./assets/images/icon.png",
    color: "#2563EB",
  },
]
```

**Android:**
- Ya incluye el permiso `POST_NOTIFICATIONS` en el array de permisos

### 3. `/app/settings.tsx` (MODIFICADO)

Integración completa de notificaciones en la pantalla de Settings:

**Nuevas Funciones:**

#### `handlePushNotificationsToggle(value: boolean)`
- Solicita permisos si no están otorgados
- Muestra alertas informativas al usuario
- Envía una notificación de prueba al activar
- Actualiza el estado local

#### `handleEmailNotificationsToggle(value: boolean)`
- Actualiza el estado de notificaciones por email
- Muestra confirmación al usuario
- Preparado para integración con backend

**Hook Integrado:**
```typescript
const { expoPushToken } = useNotifications();
```

El token se registra automáticamente y está disponible para enviarlo al backend.

## Flujo de Notificaciones

### Activación de Push Notifications

1. **Usuario activa el switch** en Settings
2. **Sistema verifica permisos** existentes
3. **Si no hay permisos**, solicita al usuario
4. **Si se otorgan permisos**:
   - Registra el token push
   - Muestra alerta de confirmación
   - Envía notificación de prueba en 2 segundos
5. **Si se deniegan permisos**:
   - Muestra alerta pidiendo activar en configuración del dispositivo
   - No cambia el estado del switch

### Desactivación de Push Notifications

1. **Usuario desactiva el switch**
2. **Sistema actualiza el estado**
3. **Muestra confirmación** al usuario
4. Las notificaciones dejan de mostrarse (lógica del backend)

### Recepción de Notificaciones

**App en Primer Plano:**
- La notificación se muestra como banner/alert
- Se reproduce sonido
- Se actualiza el badge
- Se ejecuta el listener `notificationListener`

**App en Segundo Plano:**
- La notificación aparece en el centro de notificaciones
- Al tocar, se abre la app
- Se ejecuta el listener `responseListener`

**App Cerrada:**
- La notificación aparece en el centro de notificaciones
- Al tocar, se abre la app
- Se ejecuta el listener `responseListener`

## Configuración de Canales (Android)

```typescript
await Notifications.setNotificationChannelAsync('default', {
  name: 'default',
  importance: Notifications.AndroidImportance.MAX,
  vibrationPattern: [0, 250, 250, 250],
  lightColor: '#2563EB',
});
```

**Características:**
- **Importancia**: Máxima (aparece como heads-up)
- **Vibración**: Patrón de 3 vibraciones de 250ms
- **Color LED**: Azul primario de Snapsite (#2563EB)

## Notificación de Prueba

Al activar las notificaciones push, se envía una notificación de prueba:

```typescript
{
  title: "Snapsite Notification",
  body: 'This is a test notification from Snapsite!',
  data: { data: 'goes here' },
  trigger: { seconds: 2 },
}
```

## Permisos Requeridos

### iOS
- **Permisos solicitados**: Alerts, Sounds, Badges
- **Configuración**: `UIBackgroundModes` con `remote-notification`
- **Solicitud**: Automática al activar el switch

### Android
- **Permiso**: `POST_NOTIFICATIONS` (Android 13+)
- **Configuración**: Ya incluido en `app.config.ts`
- **Solicitud**: Automática al activar el switch

## Integración con Backend

### Enviar Token al Backend

El token push está disponible en el hook:

```typescript
const { expoPushToken } = useNotifications();

// Enviar al backend cuando esté disponible
useEffect(() => {
  if (expoPushToken) {
    // TODO: Enviar token al backend
    // await api.updatePushToken(expoPushToken);
  }
}, [expoPushToken]);
```

### Enviar Notificaciones desde el Backend

Usar la API de Expo Push Notifications:

```bash
curl -H "Content-Type: application/json" \
     -X POST https://exp.host/--/api/v2/push/send \
     -d '{
       "to": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
       "title": "New Project Update",
       "body": "Office Renovation has 5 new photos",
       "data": {
         "projectId": "123",
         "screen": "project-detail"
       }
     }'
```

## Navegación desde Notificaciones

El listener de respuestas está preparado para manejar navegación:

```typescript
responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
  console.log('Notification tapped:', response);
  
  // TODO: Implementar navegación basada en datos
  const { projectId, screen } = response.notification.request.content.data;
  
  if (screen === 'project-detail' && projectId) {
    router.push(`/project/${projectId}`);
  }
});
```

## Testing

### Probar Notificaciones Locales

1. Abrir la app en un dispositivo físico
2. Ir a Settings
3. Activar "Push Notifications"
4. Aceptar los permisos
5. Esperar 2 segundos
6. Debería aparecer la notificación de prueba

### Probar Notificaciones Remotas

1. Obtener el `expoPushToken` de los logs
2. Usar la herramienta Expo Push Notification Tool:
   - https://expo.dev/notifications
3. Pegar el token y enviar una notificación de prueba

## Limitaciones y Consideraciones

### Simuladores
- **iOS Simulator**: No soporta notificaciones push
- **Android Emulator**: Soporta notificaciones push si tiene Google Play Services

### Dispositivos Físicos
- **Requerido** para testing completo de push notifications
- Asegurarse de que el dispositivo tenga conexión a internet

### Producción
- Para notificaciones push en producción, necesitas:
  - **iOS**: Certificado APNs (Apple Push Notification service)
  - **Android**: Configuración de FCM (Firebase Cloud Messaging)
  - Estos se configuran automáticamente con EAS Build

## Próximos Pasos

### Implementaciones Pendientes

1. **Persistencia de Preferencias**
   - Guardar estado de notificaciones en AsyncStorage
   - Sincronizar con backend

2. **Tipos de Notificaciones**
   - Notificaciones de nuevas fotos en proyectos
   - Notificaciones de comentarios/menciones
   - Notificaciones de cambios de estado de proyecto
   - Notificaciones de invitaciones a equipos

3. **Configuración Granular**
   - Permitir activar/desactivar tipos específicos de notificaciones
   - Horarios de no molestar
   - Frecuencia de notificaciones

4. **Navegación Inteligente**
   - Implementar navegación automática según tipo de notificación
   - Deep linking a pantallas específicas

5. **Badge Management**
   - Actualizar badge count con notificaciones no leídas
   - Limpiar badge al abrir la app

6. **Rich Notifications**
   - Imágenes en notificaciones (thumbnails de fotos)
   - Acciones rápidas (like, comment)
   - Notificaciones agrupadas por proyecto

## Recursos

- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo Push Notifications Guide](https://docs.expo.dev/push-notifications/overview/)
- [Apple Human Interface Guidelines - Notifications](https://developer.apple.com/design/human-interface-guidelines/notifications)
- [Android Notification Guidelines](https://developer.android.com/design/ui/mobile/guides/patterns/notifications)

---

**Última actualización**: Enero 2024
**Versión**: 1.0.0
