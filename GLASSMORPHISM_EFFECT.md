# Efecto Glassmorphism en el Menú Flotante - Snapsite

## Resumen

Se ha implementado un efecto **glassmorphism** (cristal transparente) en el menú flotante de navegación, similar al diseño de los switches y controles modernos de iOS. Este efecto proporciona una apariencia elegante, moderna y semi-transparente que se adapta perfectamente a los modos claro y oscuro.

## Características del Efecto Glassmorphism

### 1. **BlurView Component**

El efecto se logra utilizando el componente `BlurView` de `expo-blur`:

```typescript
<BlurView
  intensity={colorScheme === 'dark' ? 80 : 60}
  tint={colorScheme === 'dark' ? 'dark' : 'light'}
  style={{
    borderRadius: 24,
    overflow: 'hidden',
    // ... más estilos
  }}
>
```

**Parámetros:**
- **intensity**: Intensidad del blur (60 en modo claro, 80 en modo oscuro)
- **tint**: Tinte del blur ('light' o 'dark' según el tema)
- **overflow**: 'hidden' para mantener el border radius

### 2. **Background Semi-Transparente**

El fondo utiliza colores RGBA con transparencia:

**Modo Claro:**
```typescript
backgroundColor: 'rgba(248, 250, 252, 0.8)'  // 80% opacidad
```

**Modo Oscuro:**
```typescript
backgroundColor: 'rgba(30, 41, 59, 0.7)'  // 70% opacidad
```

### 3. **Borde Sutil**

El borde también utiliza transparencia para un efecto más suave:

**Modo Claro:**
```typescript
borderColor: 'rgba(0, 0, 0, 0.05)'  // Negro al 5%
```

**Modo Oscuro:**
```typescript
borderColor: 'rgba(255, 255, 255, 0.1)'  // Blanco al 10%
```

### 4. **Sombra Adaptativa**

La sombra se ajusta según el tema:

**Modo Claro:**
```typescript
shadowOpacity: 0.2
shadowRadius: 16
```

**Modo Oscuro:**
```typescript
shadowOpacity: 0.4
shadowRadius: 16
```

## Feedback Visual al Hacer Click

### Estados de los Botones

Cada botón del menú tiene tres estados visuales:

#### 1. **Estado Normal (Inactivo)**
- Background: Transparente
- Icono y texto: Color muted
- Sin transformación

#### 2. **Estado Activo**
- Background con color primario semi-transparente:
  - Modo claro: `rgba(37, 99, 235, 0.15)` (15% opacidad)
  - Modo oscuro: `rgba(59, 130, 246, 0.25)` (25% opacidad)
- Icono y texto: Color primario
- Peso de fuente: 600 (semibold)

#### 3. **Estado Presionado (onPressIn)**
- Background con overlay semi-transparente:
  - Modo claro: `rgba(0, 0, 0, 0.04)` (4% opacidad)
  - Modo oscuro: `rgba(255, 255, 255, 0.08)` (8% opacidad)
- Transformación: `scale: 0.95` (efecto de hundimiento)
- Icono y texto: Color muted

### Implementación del Feedback

```typescript
const [pressedTab, setPressedTab] = useState<TabName | null>(null);

<TouchableOpacity
  onPressIn={() => setPressedTab(tab.name)}
  onPressOut={() => setPressedTab(null)}
  onPress={() => handleTabPress(tab.name)}
  style={{
    backgroundColor: isActive 
      ? colorScheme === 'dark'
        ? 'rgba(59, 130, 246, 0.25)'
        : 'rgba(37, 99, 235, 0.15)'
      : isPressed
      ? colorScheme === 'dark'
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(0, 0, 0, 0.04)'
      : 'transparent',
    transform: [{ scale: isPressed ? 0.95 : 1 }],
  }}
  activeOpacity={1}
>
```

## Cambios en el Menú

### Tabs Eliminados

Se ha eliminado el tab de **Profile** del menú flotante, dejando solo:

1. **Home** - `house.fill`
2. **Projects** - `photo.stack.fill`
3. **Camera** - `camera.fill`

El componente ProfileScreen sigue disponible para navegación directa desde otras pantallas (como Settings).

### Ajustes de Tamaño

**Iconos:**
- Tamaño aumentado a **26pt** (antes 24pt)
- Mayor visibilidad y mejor proporción

**Padding:**
- Vertical: **10px** (antes 8px)
- Horizontal: **6px** (antes 4px)
- Mayor área táctil

**Border Radius:**
- Botones: **18px** (antes 16px)
- Menú: **24px** (sin cambios)

## Comparación Visual

### Antes (Sin Glassmorphism)

```
┌─────────────────────────────────────┐
│  [Home] [Projects] [Camera] [Profile]│  ← Fondo sólido
└─────────────────────────────────────┘
```

- Fondo opaco (`colors.surface`)
- Sin efecto blur
- Borde sólido
- Sombra básica

### Después (Con Glassmorphism)

```
┌─────────────────────────────────┐
│ ░[Home]░ [Projects] [Camera]░ │  ← Fondo semi-transparente con blur
└─────────────────────────────────┘
```

- Fondo semi-transparente (70-80% opacidad)
- Efecto blur del contenido detrás
- Borde sutil semi-transparente
- Sombra adaptativa al tema
- Feedback visual al presionar

## Ventajas del Efecto Glassmorphism

### 1. **Estética Moderna**
- Diseño actual y sofisticado
- Similar a iOS 15+ y macOS Big Sur+
- Apariencia premium

### 2. **Adaptabilidad**
- Se adapta al contenido detrás
- Funciona en modo claro y oscuro
- Respeta el contexto visual

### 3. **Jerarquía Visual**
- El menú "flota" sobre el contenido
- Separación clara entre UI y contenido
- Profundidad visual

### 4. **Legibilidad**
- El blur mantiene el contenido legible
- Los controles son claramente visibles
- No interfiere con el contenido

## Implementación Técnica

### Dependencias

```json
{
  "expo-blur": "^15.0.8"
}
```

### Instalación

```bash
pnpm add expo-blur
```

### Imports Necesarios

```typescript
import { BlurView } from "expo-blur";
import { useColorScheme } from "@/hooks/use-color-scheme";
```

### Estructura del Componente

```
BlurView (efecto blur + container)
  └── View (background semi-transparente + border)
       └── TouchableOpacity (botones con estados)
            ├── IconSymbol (icono)
            └── Text (etiqueta)
```

## Configuración y Personalización

### Ajustar Intensidad del Blur

```typescript
// Más blur (más opaco)
intensity={colorScheme === 'dark' ? 100 : 80}

// Menos blur (más transparente)
intensity={colorScheme === 'dark' ? 60 : 40}
```

### Ajustar Opacidad del Background

```typescript
// Más opaco
backgroundColor: 'rgba(248, 250, 252, 0.95)'  // 95%

// Más transparente
backgroundColor: 'rgba(248, 250, 252, 0.6)'   // 60%
```

### Ajustar Feedback al Presionar

```typescript
// Más pronunciado
transform: [{ scale: isPressed ? 0.90 : 1 }]

// Más sutil
transform: [{ scale: isPressed ? 0.97 : 1 }]
```

### Cambiar Color del Estado Activo

```typescript
// Más intenso
backgroundColor: 'rgba(37, 99, 235, 0.25)'  // 25%

// Más sutil
backgroundColor: 'rgba(37, 99, 235, 0.10)'  // 10%
```

## Consideraciones de Rendimiento

### Optimizaciones Aplicadas

1. **useNativeDriver**: Animaciones en el hilo nativo
2. **overflow: 'hidden'**: Evita re-renders innecesarios
3. **activeOpacity: 1**: Desactiva la animación por defecto de TouchableOpacity
4. **Estado local**: Feedback instantáneo sin re-renders globales

### Rendimiento en Dispositivos

**iOS:**
- Blur nativo optimizado
- 60 FPS consistentes
- Bajo consumo de batería

**Android:**
- Blur simulado con renderizado
- Puede variar según el dispositivo
- Considerar reducir intensity en dispositivos antiguos

**Web:**
- Blur CSS nativo (`backdrop-filter`)
- Excelente rendimiento
- Soporte en navegadores modernos

## Limitaciones y Consideraciones

### 1. **Soporte de Plataforma**

- **iOS**: Soporte completo y nativo
- **Android**: Soporte completo pero puede ser más pesado
- **Web**: Requiere navegadores modernos con soporte de `backdrop-filter`

### 2. **Contraste**

En fondos muy claros u oscuros, el efecto puede ser menos visible. Solución:
- Ajustar la opacidad del background
- Aumentar la intensidad del blur
- Agregar un overlay adicional

### 3. **Accesibilidad**

El contenido detrás del blur debe seguir siendo legible. Consideraciones:
- No colocar texto importante detrás del menú
- Mantener suficiente contraste
- Probar con diferentes fondos

## Próximos Pasos

### Mejoras Sugeridas

1. **Animación del Blur**
   - Animar la intensidad al cambiar de tab
   - Efecto de "respiración" sutil

2. **Haptic Feedback**
   - Vibración al presionar botones
   - Diferentes intensidades por estado

3. **Gestos Avanzados**
   - Long press para opciones adicionales
   - Swipe para cambiar tabs

4. **Variantes de Estilo**
   - Modo ultra-transparente
   - Modo sólido (sin blur)
   - Configuración por usuario

## Recursos

- [Expo Blur Documentation](https://docs.expo.dev/versions/latest/sdk/blur-view/)
- [Glassmorphism Design Trend](https://uxdesign.cc/glassmorphism-in-user-interfaces-1f39bb1308c9)
- [iOS Human Interface Guidelines - Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- [CSS Tricks - Glassmorphism](https://css-tricks.com/glassmorphism/)

---

**Última actualización**: Enero 2024
**Versión**: 2.1.0
