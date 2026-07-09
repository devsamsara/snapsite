# Apple Design Guidelines - SnapSite Implementation

Este documento describe cómo se han aplicado los principios de diseño de Apple (Human Interface Guidelines) a la aplicación Snapsite.

## Espaciado y Layout

### Espaciado entre Iconos y Texto
Según las **Human Interface Guidelines de Apple**, el espaciado entre iconos y texto debe ser consistente y proporcionar suficiente respiro visual.

**Implementación en Snapsite:**
- **16px (marginLeft: 16)**: Para elementos de lista principales y navegación
  - Menús de configuración
  - Opciones de perfil
  - Items de navegación
  
- **12px (marginLeft: 12)**: Para inputs de búsqueda y campos de formulario
  - Barra de búsqueda en Projects
  - Campos de texto con iconos
  
- **8px (marginLeft: 8)**: Para botones y elementos compactos
  - Botones de acción (Take Photo, From Gallery)
  - Elementos dentro de botones
  
- **6px (marginLeft: 6)**: Para elementos muy pequeños y metadata
  - Contadores de fotos
  - Información secundaria

### Tamaños de Toque Mínimos
- **44x44 puntos**: Tamaño mínimo para todos los elementos interactivos
- **Botones circulares**: 40x40 puntos mínimo (usamos 40-48 puntos)
- **Botones de navegación**: 44 puntos de altura mínimo

### Espaciado de Contenedores
- **Padding horizontal de pantalla**: 24px (6 unidades de Tailwind)
- **Padding de tarjetas**: 16px (4 unidades)
- **Espaciado entre secciones**: 24px (6 unidades)
- **Espaciado entre elementos de lista**: 12px (3 unidades)

## Tipografía

### Jerarquía de Texto
- **Títulos de pantalla**: 34pt (text-3xl), Bold
- **Títulos de sección**: 28pt (text-2xl), Bold
- **Títulos de tarjeta**: 18pt (text-lg), Semibold
- **Cuerpo**: 16pt (text-base), Regular
- **Secundario**: 14pt (text-sm), Regular
- **Metadata**: 12pt (text-xs), Regular

### Fuentes del Sistema
Utilizamos las fuentes nativas del sistema para cada plataforma:
- **iOS**: SF Pro Display / SF Pro Text
- **Android**: Roboto
- **Web**: System UI stack

## Colores y Temas

### Modo Claro y Oscuro
La aplicación soporta completamente el modo oscuro siguiendo las especificaciones de Apple:

Paleta "Onyx & Indigo" (2026-07): base oscura profunda, modo claro muy limpio,
acento índigo eléctrico. Fuente de verdad: `theme.config.js`.

**Modo Claro:**
- Background: `#FCFCFD`
- Surface: `#FFFFFF`
- Foreground: `#0C0D12`
- Muted: `#5C6370`
- Border: `#E6E8EE`

**Modo Oscuro:**
- Background: `#0A0A0F`
- Surface: `#15151C`
- Foreground: `#F7F8FA`
- Muted: `#9BA1AE`
- Border: `#262832`

### Colores de Acento
- **Primary**: `#4F46E5` (light) / `#818CF8` (dark)
- **Success**: `#059669` (light) / `#34D399` (dark)
- **Warning**: `#D97706` (light) / `#FBBF24` (dark)
- **Error**: `#DC2626` (light) / `#F87171` (dark)

Tokens glassmorphism (`glass`, `glassBorder`, `scrim`) en `lib/_core/theme.ts`.

### Implementación del Modo Oscuro
```typescript
// En settings.tsx
const handleDarkModeToggle = (value: boolean) => {
  setDarkMode(value);
  setColorScheme(value ? "dark" : "light");
};
```

El cambio de tema es instantáneo y afecta a toda la aplicación gracias al `ThemeProvider`.

## Componentes

### Botones

#### Botón Primario
- Background: Color primario
- Texto: Blanco (#FFFFFF)
- Padding: 16px vertical, 24px horizontal
- Border radius: 12px (rounded-xl)
- Fuente: Semibold

#### Botón Secundario
- Background: Surface color
- Texto: Color primario
- Border: 1px solid border color
- Padding: 16px vertical, 24px horizontal
- Border radius: 12px (rounded-xl)
- Fuente: Semibold

#### Botón de Navegación
- Tamaño: 40x40 puntos
- Background: Surface color
- Border radius: 50% (circular)
- Icono: 20pt

### Tarjetas

#### Tarjeta Estándar
- Background: Surface color
- Border: 1px solid border color
- Border radius: 16px (rounded-2xl)
- Padding: 16px
- Sombra: Ninguna (flat design)

#### Tarjeta de Perfil
- Border radius: 16px (rounded-2xl)
- Padding: 24px
- Centrado verticalmente
- Avatar: 64-80 puntos

### Inputs

#### Campo de Texto
- Background: Surface color
- Border: 1px solid border color
- Border radius: 16px (rounded-2xl)
- Padding: 12px horizontal, 12px vertical
- Fuente: 16pt (evita zoom automático en iOS)
- Placeholder: Muted color

#### Barra de Búsqueda
- Background: Surface color
- Border: 1px solid border color
- Border radius: 12px (rounded-xl)
- Icono de búsqueda: 16pt
- Padding: 12px horizontal, 12px vertical
- Espaciado icono-texto: 12px

### Switches
- Colores nativos del sistema
- Track color (off): Border color
- Track color (on): Primary color
- Thumb color: Blanco (#FFFFFF)
- Tamaño: Estándar del sistema (51x31 en iOS)

## Navegación

### Header de Pantalla
- Padding top: 24px (safe area + 24px)
- Padding horizontal: 24px
- Padding bottom: 16px
- Border bottom: 1px solid border color

### Botón de Retroceso
- Posición: Izquierda del header
- Tamaño: 40x40 puntos
- Icono: chevron.left (20pt)
- Espaciado con título: 16px
- Background: Surface color

### Tabs de Navegación Inferior
- Altura: 49 puntos (estándar iOS)
- Iconos: 24pt
- Etiquetas: 10pt
- Color activo: Primary
- Color inactivo: Muted

## Animaciones y Transiciones

### Principios
- **Duración**: 200-300ms para transiciones rápidas
- **Easing**: ease-in-out para la mayoría de animaciones
- **Feedback háptico**: En acciones importantes (botones primarios, switches)

### Transiciones de Pantalla
- Push/Pop: Deslizamiento horizontal (iOS estándar)
- Modal: Deslizamiento vertical desde abajo
- Fade: Para overlays y alerts

## Accesibilidad

### Contraste
- Texto principal sobre fondo: Mínimo 4.5:1
- Texto grande sobre fondo: Mínimo 3:1
- Elementos interactivos: Mínimo 3:1

### Tamaños de Fuente Dinámicos
- Soporte para Dynamic Type de iOS
- Escalado de texto según preferencias del usuario

### VoiceOver / TalkBack
- Etiquetas descriptivas en todos los elementos interactivos
- Orden de navegación lógico
- Hints para acciones no obvias

## Iconografía

### SF Symbols (iOS)
Utilizamos SF Symbols para mantener consistencia con el ecosistema de Apple:
- **person.fill**: Usuario/Perfil
- **gear**: Configuración
- **camera.fill**: Cámara
- **photo.stack.fill**: Galería/Fotos
- **bell.fill**: Notificaciones
- **envelope.fill**: Email
- **moon.fill**: Modo oscuro
- **lock.fill**: Privacidad/Seguridad
- **chevron.right**: Navegación adelante
- **chevron.left**: Navegación atrás
- **trash.fill**: Eliminar
- **plus.circle.fill**: Agregar

### Tamaños de Iconos
- **Navegación principal**: 24pt
- **Botones de acción**: 20pt
- **Metadata**: 14-16pt
- **Iconos grandes (placeholders)**: 48-64pt

## Pantallas Implementadas

### 1. Home (index.tsx)
✅ Espaciado de iconos ajustado (6px para metadata)
✅ Tarjetas con border radius de 16px
✅ Botón flotante de acción
✅ Header con navegación a settings

### 2. Projects (projects.tsx)
✅ Espaciado de iconos ajustado (6px para metadata, 12px para búsqueda)
✅ Filtros con estados activos/inactivos
✅ Barra de búsqueda funcional

### 3. Profile (profile.tsx)
✅ Espaciado de iconos ajustado (16px para menú)
✅ Tarjeta de perfil centrada
✅ Estadísticas visuales

### 4. Camera (camera.tsx)
✅ Espaciado de iconos ajustado (8px para botones)
✅ Botones de acción primarios y secundarios
✅ Layout centrado

### 5. Settings (settings.tsx)
✅ **Modo oscuro funcional** con toggle
✅ Espaciado de iconos ajustado (16px para menú)
✅ Switches nativos
✅ Navegación a edit-profile
✅ Header con botón de retroceso (16px de margen)

### 6. Edit Profile (edit-profile.tsx) ✨ NUEVO
✅ Formulario completo con campos de texto
✅ Botón de guardar en header
✅ Cambio de foto de perfil
✅ Opciones adicionales (cambiar contraseña, eliminar cuenta)
✅ Espaciado consistente (16px entre iconos y texto)

## Mejores Prácticas Aplicadas

### 1. Consistencia
- Todos los espaciados siguen el sistema de 4px
- Colores definidos centralmente en theme.config.js
- Componentes reutilizables (ScreenContainer, IconSymbol)

### 2. Rendimiento
- Lazy loading de imágenes (preparado)
- Virtualización de listas con FlatList
- Optimización de re-renders con useMemo/useCallback

### 3. Mantenibilidad
- Código modular y componentes separados
- Hooks personalizados (useColors, useColorScheme)
- Documentación inline

### 4. Experiencia de Usuario
- Feedback visual inmediato
- Estados de carga claros
- Mensajes de error descriptivos
- Navegación intuitiva

## Próximos Pasos

### Implementaciones Pendientes
1. Persistencia del tema seleccionado (AsyncStorage)
2. Animaciones de transición entre pantallas
3. Feedback háptico en acciones importantes
4. Soporte completo para Dynamic Type
5. Pruebas de accesibilidad con VoiceOver

### Pantallas por Crear
1. Project Detail
2. Photo Annotation
3. Photo Detail
4. Team Communication
5. Privacy Settings
6. Storage Management
7. Help & Support
8. About

---

**Última actualización**: Enero 2024
**Versión de Guidelines**: iOS 17 / iPadOS 17
