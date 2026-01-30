# SnapSite - Diseño de Interfaz Móvil

## Visión General

SnapSite es una aplicación de documentación de proyectos para contratistas y equipos de campo. Permite capturar, organizar y compartir fotos y videos de sitios de trabajo con anotaciones, líneas de tiempo y comunicación integrada. El diseño sigue estándares modernos de iOS con colores agradables y una experiencia intuitiva.

---

## Paleta de Colores

### Colores Principales
- **Primario**: `#2563EB` (Azul vibrante) - Acciones principales, botones
- **Secundario**: `#10B981` (Verde esmeralda) - Estados positivos, éxito
- **Acento**: `#F59E0B` (Ámbar) - Advertencias, destacados
- **Fondo**: `#FFFFFF` (Blanco) - Modo claro
- **Fondo Oscuro**: `#0F172A` (Azul oscuro) - Modo oscuro
- **Superficie**: `#F8FAFC` (Gris claro) - Tarjetas, superficies elevadas
- **Texto Principal**: `#1E293B` (Gris oscuro) - Texto principal
- **Texto Secundario**: `#64748B` (Gris medio) - Texto secundario
- **Borde**: `#E2E8F0` (Gris muy claro) - Divisores, bordes

---

## Lista de Pantallas

### 1. **Home (Inicio)**
- **Propósito**: Pantalla principal con acceso rápido a proyectos recientes
- **Contenido**:
  - Encabezado con saludo y botón de perfil
  - Búsqueda rápida de proyectos
  - Sección "Proyectos Recientes" con tarjetas de proyecto
  - Botón flotante de acción (+) para crear nuevo proyecto
  - Barra de navegación inferior con 4 pestañas

### 2. **Projects (Proyectos)**
- **Propósito**: Lista completa de todos los proyectos
- **Contenido**:
  - Barra de búsqueda y filtros
  - Lista de proyectos con información resumida (nombre, fecha, estado)
  - Indicador de progreso visual para cada proyecto
  - Opción para crear nuevo proyecto
  - Pull-to-refresh

### 3. **Project Detail (Detalle del Proyecto)**
- **Propósito**: Vista detallada de un proyecto específico
- **Contenido**:
  - Encabezado con nombre del proyecto y estado
  - Tabs: "Galería", "Línea de Tiempo", "Equipo", "Notas"
  - **Tab Galería**: Grid de fotos/videos con opción de ver en detalle
  - **Tab Línea de Tiempo**: Cronología de eventos y cambios
  - **Tab Equipo**: Miembros del proyecto y colaboradores
  - **Tab Notas**: Documentos y anotaciones del proyecto

### 4. **Photo Capture (Captura de Foto)**
- **Propósito**: Capturar fotos/videos del sitio de trabajo
- **Contenido**:
  - Vista previa en vivo de cámara
  - Botones de captura (foto/video)
  - Acceso a galería del dispositivo
  - Opciones de flash, cambio de cámara
  - Botón para agregar anotaciones antes de guardar

### 5. **Photo Annotation (Anotación de Foto)**
- **Propósito**: Agregar anotaciones, dibujos y medidas a fotos
- **Contenido**:
  - Vista de foto capturada
  - Herramientas de dibujo (lápiz, línea, círculo, rectángulo)
  - Selector de color para anotaciones
  - Herramienta de texto
  - Botones: Deshacer, Rehacer, Guardar

### 6. **Photo Detail (Detalle de Foto)**
- **Propósito**: Ver foto en detalle con información y comentarios
- **Contenido**:
  - Foto en pantalla completa
  - Metadatos: fecha, hora, ubicación, proyecto
  - Sección de comentarios con opción de agregar
  - Menciones (@) a miembros del equipo
  - Opciones de editar, compartir, eliminar

### 7. **Team Communication (Comunicación del Equipo)**
- **Propósito**: Comunicación centralizada dentro del proyecto
- **Contenido**:
  - Chat de proyecto
  - Menciones recientes
  - Notificaciones de cambios en el proyecto
  - Opción de enviar mensajes y fotos directamente

### 8. **Profile (Perfil)**
- **Propósito**: Configuración y información del usuario
- **Contenido**:
  - Foto de perfil y nombre del usuario
  - Información de contacto
  - Preferencias de notificaciones
  - Configuración de tema (claro/oscuro)
  - Opción de cerrar sesión

### 9. **Settings (Configuración)**
- **Propósito**: Configuraciones de la aplicación
- **Contenido**:
  - Notificaciones
  - Privacidad
  - Almacenamiento
  - Acerca de
  - Soporte

---

## Flujos de Usuario Principales

### Flujo 1: Crear Nuevo Proyecto
1. Usuario toca botón "+" en Home
2. Ingresa nombre del proyecto, descripción, ubicación
3. Selecciona miembros del equipo para invitar
4. Confirma y se crea el proyecto
5. Se redirige a pantalla de detalle del proyecto

### Flujo 2: Capturar y Documentar Foto
1. Usuario toca botón de cámara en tab de Proyectos
2. Captura foto o video
3. Opcionalmente agrega anotaciones (dibujos, texto, medidas)
4. Selecciona proyecto destino
5. Agrega descripción y etiquetas
6. Guarda - foto se sincroniza con el proyecto

### Flujo 3: Revisar Progreso del Proyecto
1. Usuario abre un proyecto
2. Navega a tab "Línea de Tiempo"
3. Ve cronología de todas las fotos y cambios
4. Puede hacer clic en cualquier foto para ver detalles
5. Lee comentarios del equipo y actualizaciones

### Flujo 4: Comunicación del Equipo
1. Usuario abre un proyecto
2. Navega a tab "Equipo" o "Notas"
3. Puede mencionar a miembros específicos (@nombre)
4. Recibe notificaciones de nuevos comentarios
5. Responde en tiempo real

---

## Componentes Clave

### Componentes de UI
- **Botón Primario**: Azul vibrante, redondeado (12px), con feedback de presión
- **Botón Secundario**: Borde azul, fondo transparente
- **Tarjeta de Proyecto**: Sombra suave, borde gris claro, redondeado (16px)
- **Tarjeta de Foto**: Imagen con overlay de información
- **Chip de Etiqueta**: Fondo gris claro, texto pequeño
- **Avatar de Usuario**: Circular, 40px por defecto
- **Input de Texto**: Borde gris claro, padding generoso

### Patrones de Interacción
- **Feedback Háptico**: En botones primarios, cambios de estado
- **Animaciones Sutiles**: Transiciones suaves entre pantallas
- **Pull-to-Refresh**: En listas de proyectos y fotos
- **Swipe Actions**: Deslizar para eliminar o archivar

---

## Consideraciones de Diseño

- **Orientación**: Retrato (9:16) - Optimizado para una sola mano
- **Tipografía**: Sistema de fuentes nativas (SF Pro Display en iOS)
- **Espaciado**: Múltiplos de 4px (4, 8, 12, 16, 24, 32)
- **Accesibilidad**: Contraste suficiente, tamaños de toque mínimo 44x44px
- **Dark Mode**: Soporte completo con colores adaptados
- **Rendimiento**: Lazy loading de imágenes, virtualización de listas
