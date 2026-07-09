# Contexto del Proyecto: Snapsite
Aplicación móvil desarrollada con React Native, Expo Router y NativeWind (Tailwind CSS v3).

## Documentación Crítica
Antes de realizar cualquier análisis o modificación, **DEBES leer el "graphify report"** para obtener el contexto completo, entender la estructura de componentes, el flujo de datos y el estado actual del proyecto.

## Objetivo Principal
Remodelación integral de la UI/UX hacia una estética premium, moderna, minimalista y cinematográfica. Se debe mantener intacta la arquitectura descrita en el graphify report, al mismo tiempo que se auditan y corrigen errores funcionales subyacentes.

## Reglas Estrictas de Modificación (¡CRÍTICO!)

### 1. Lógica y Corrección de Errores
- **Preservación:** NO alterar la arquitectura base de enrutamiento (Expo Router), la configuración de Apollo Client, ni los flujos de autenticación.
- **Corrección Proactiva:** DEBES detectar y corregir proactivamente cualquier error funcional, bugs lógicos en hooks (`useState`, `useEffect`), problemas de tipado estricto en TypeScript o mutaciones/consultas de GraphQL mal formadas.
- **Registro:** Documenta brevemente cada corrección funcional que realices para llevar un control.

### 2. Dirección de Arte y Estilo
- **Estética:** Diseño minimalista, limpio, sin ruido visual excesivo. Alto contraste para una apariencia profesional y cinematográfica.
- **Paleta de Colores:** Actualizar `theme.config.js` y `lib/_core/theme.ts` para usar colores profundos (ej. onyx/slate oscuro para modo oscuro) y acentos vibrantes pero elegantes.
- **Efectos:** Implementar efectos de *glassmorphism* (transparencias con desenfoque) en modales, menús y tarjetas flotantes utilizando utilidades de NativeWind.
- **Espaciado:** Maximizar la legibilidad con márgenes amplios (breathing room) y jerarquía visual clara.

### 3. Implementación Técnica
- Todas las modificaciones de estilo deben hacerse exclusivamente a través de clases de Tailwind (`className`).
- Respetar y potenciar el soporte para Dark Mode/Light Mode mediante las variantes de Tailwind.
- Si se requiere un componente visual nuevo, encapsularlo en `components/ui/` y mantenerlo como un componente presentacional (dumb component).