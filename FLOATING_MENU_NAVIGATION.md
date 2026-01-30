# Sistema de Navegación con Menú Flotante - FieldCam

## Resumen

Se ha rediseñado completamente el sistema de navegación de FieldCam, reemplazando el tab bar tradicional por un **menú flotante** en la parte inferior con transiciones tipo **switch/segmented control**, similar a la app Cámara de iOS.

## Características Principales

### 1. **Menú Flotante**

El menú flotante tiene las siguientes características de diseño:

**Posicionamiento:**
- **Posición**: Absoluta en la parte inferior de la pantalla
- **Margen inferior**: `insets.bottom + 16px` (respeta el safe area)
- **Margen horizontal**: `16px` a cada lado
- **Elevación**: Flotante sobre el contenido con sombra suave

**Estilo Visual:**
- **Background**: Color de superficie (`colors.surface`)
- **Border radius**: `24px` (muy redondeado)
- **Padding vertical**: `12px`
- **Padding horizontal**: `8px`
- **Sombra**: Sombra sutil con `shadowOpacity: 0.15` y `shadowRadius: 12`
- **Borde**: `1px` con color de borde del tema
- **Elevation** (Android): `8` para sombra nativa

### 2. **Elementos del Menú**

Cada elemento del menú incluye:

**Componentes:**
- **Icono**: SF Symbol de 24pt
- **Etiqueta**: Texto de 11pt debajo del icono
- **Background activo**: Fondo con color primario al 15% de opacidad
- **Border radius**: `16px` para el elemento activo

**Estados:**

**Activo:**
- Icono: Color primario (`colors.primary`)
- Texto: Color primario, peso `600` (semibold)
- Background: `colors.primary + '15'` (primario al 15%)

**Inactivo:**
- Icono: Color muted (`colors.muted`)
- Texto: Color muted, peso `500` (medium)
- Background: Transparente

### 3. **Transiciones de Pantalla**

Las transiciones entre pantallas utilizan un efecto de **fade in/out** que simula el comportamiento de un switch:

**Secuencia de Animación:**
1. **Fade Out**: La pantalla actual se desvanece (150ms)
2. **Cambio Instantáneo**: Se cambia el componente activo
3. **Fade In**: La nueva pantalla aparece (150ms)

**Duración Total**: 300ms (150ms + 150ms)

**Configuración:**
```typescript
Animated.sequence([
  Animated.timing(fadeAnim, {
    toValue: 0,
    duration: 150,
    useNativeDriver: true,
  }),
  Animated.parallel([
    Animated.timing(slideAnim, {
      toValue: activeIndex * SCREEN_WIDTH,
      duration: 0,
      useNativeDriver: true,
    }),
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }),
  ]),
]).start();
```

### 4. **Tabs Disponibles**

El menú incluye 4 opciones principales:

| Tab | Título | Icono | Componente |
|-----|--------|-------|------------|
| `home` | Home | `house.fill` | HomeScreen |
| `projects` | Projects | `photo.stack.fill` | ProjectsScreen |
| `camera` | Camera | `camera.fill` | CameraScreen |
| `profile` | Profile | `person.fill` | ProfileScreen |

## Archivos Modificados

### 1. `/app/(tabs)/_layout.tsx` (REDISEÑADO COMPLETAMENTE)

**Antes:**
- Usaba el componente `<Tabs>` de Expo Router
- Tab bar tradicional en la parte inferior
- Transiciones estándar de React Navigation

**Después:**
- Componente personalizado con estado local
- Menú flotante con diseño personalizado
- Transiciones animadas con `Animated` API
- Renderizado condicional de componentes

**Cambios Clave:**
```typescript
// Estado para el tab activo
const [activeTab, setActiveTab] = useState<TabName>('home');

// Animaciones
const fadeAnim = useRef(new Animated.Value(1)).current;

// Renderizado del componente activo
const ActiveComponent = tabs[activeIndex].component;
```

### 2. Pantallas Ajustadas para el Menú Flotante

Todas las pantallas han sido ajustadas para evitar que el contenido se oculte detrás del menú flotante:

#### `/app/(tabs)/index.tsx` (Home)
- **ScrollView**: `paddingBottom: 120`
- **FAB**: Reposicionado a `bottom: 120, right: 24`

#### `/app/(tabs)/projects.tsx` (Projects)
- **FlatList**: `paddingBottom: 120`

#### `/app/(tabs)/profile.tsx` (Profile)
- **ScrollView**: `contentContainerStyle={{ paddingBottom: 120 }}`

#### `/app/(tabs)/camera.tsx` (Camera)
- **View**: `paddingBottom: 100`

### 3. `/hooks/use-notifications.ts` (CORREGIDO)

**Error Arreglado:**
```typescript
// Antes (incorrecto)
Notifications.removeNotificationSubscription(notificationListener.current);

// Después (correcto)
notificationListener.current.remove();
```

## Ventajas del Nuevo Diseño

### 1. **Estética Moderna**
- Diseño más limpio y minimalista
- Menú flotante que no ocupa toda la anchura
- Sombras y bordes redondeados siguiendo tendencias actuales

### 2. **Mejor Experiencia de Usuario**
- Transiciones suaves y fluidas
- Feedback visual claro del tab activo
- Fácil acceso con el pulgar (ergonomía móvil)

### 3. **Consistencia con iOS**
- Similar a la app Cámara de iOS
- Transiciones tipo segmented control
- Respeta los safe areas

### 4. **Flexibilidad**
- Fácil agregar o quitar tabs
- Personalizable con diferentes estilos
- Independiente del sistema de routing

## Consideraciones de Diseño

### Safe Area

El menú respeta el safe area inferior del dispositivo:
```typescript
bottom: insets.bottom + 16
```

Esto asegura que:
- En iPhone con notch: El menú está por encima del área del gesto home
- En iPhone sin notch: El menú tiene un margen apropiado
- En Android: El menú respeta los botones de navegación

### Padding del Contenido

Todas las pantallas tienen padding inferior de **100-120px** para:
- Evitar que el contenido se oculte detrás del menú
- Permitir scroll completo del contenido
- Mantener el último elemento visible

### Rendimiento

Las animaciones utilizan `useNativeDriver: true` para:
- Ejecutarse en el hilo nativo
- 60 FPS consistentes
- No bloquear el hilo de JavaScript

## Personalización

### Cambiar Colores del Menú

```typescript
// En _layout.tsx
backgroundColor: colors.surface,  // Fondo del menú
borderColor: colors.border,       // Borde del menú

// Tab activo
backgroundColor: colors.primary + '15',  // Fondo del tab activo
color: colors.primary,                   // Color del icono y texto
```

### Cambiar Duración de Transiciones

```typescript
// Fade out
duration: 150,  // Cambiar a 200 para transición más lenta

// Fade in
duration: 150,  // Cambiar a 200 para transición más lenta
```

### Cambiar Posición del Menú

```typescript
// Actual: Inferior
bottom: insets.bottom + 16,

// Superior (no recomendado)
top: insets.top + 16,

// Más margen
bottom: insets.bottom + 24,
```

### Agregar Nuevos Tabs

```typescript
const tabs: Tab[] = [
  // ... tabs existentes
  { 
    name: 'settings', 
    title: 'Settings', 
    icon: 'gear', 
    component: SettingsScreen 
  },
];
```

## Limitaciones y Consideraciones

### 1. **Navegación Profunda**

El sistema actual no soporta navegación profunda (deep linking) directamente. Para implementarlo:
- Usar Expo Router en conjunto con el estado local
- Sincronizar el estado del tab con la URL

### 2. **Historial de Navegación**

Al cambiar de tab, no se mantiene el historial de navegación dentro de cada tab. Soluciones:
- Implementar un stack navigator por cada tab
- Usar React Navigation con custom tab bar

### 3. **Animaciones Complejas**

Las transiciones actuales son fade in/out. Para transiciones más complejas:
- Implementar slide horizontal
- Agregar spring animations
- Usar `react-native-reanimated` para animaciones más avanzadas

## Próximos Pasos

### Mejoras Sugeridas

1. **Haptic Feedback**
   - Agregar vibración al cambiar de tab
   - Usar `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)`

2. **Badge Notifications**
   - Agregar badges en los iconos (ej: número de notificaciones)
   - Mostrar dot indicator para nuevos contenidos

3. **Gestos**
   - Implementar swipe horizontal entre tabs
   - Usar `react-native-gesture-handler`

4. **Persistencia**
   - Guardar el último tab visitado
   - Restaurar al abrir la app

5. **Animaciones Avanzadas**
   - Transiciones más elaboradas
   - Parallax effects
   - Shared element transitions

## Recursos

- [React Native Animated API](https://reactnative.dev/docs/animated)
- [iOS Human Interface Guidelines - Tab Bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- [Safe Area Context](https://github.com/th3rdwave/react-native-safe-area-context)
- [Expo Haptics](https://docs.expo.dev/versions/latest/sdk/haptics/)

---

**Última actualización**: Enero 2024
**Versión**: 2.0.0
