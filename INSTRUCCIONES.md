# Invitaciones Digitales - Brenda & Arturo

Sistema de gestión de invitaciones digitales para boda con confirmación de asistencia y panel de administración.

## Características

- Página principal elegante con información de la boda
- Sistema de invitaciones con códigos únicos
- Confirmación de asistencia individual
- Gestión de número de pases por invitado
- Panel de administración con estadísticas detalladas
- Asignación de invitados a mesas con drag and drop
- Gestión dinámica de mesas (crear/eliminar)
- 15 mesas precargadas
- Diseño minimalista y responsive

## Acceso al Panel de Administración

Accede al panel administrativo visitando:
```
/admin
```

En el panel puedes:
- Ver estadísticas detalladas (confirmados, no confirmados, pases, ocupación)
- Gestionar invitados (crear, editar, eliminar)
- Crear y eliminar mesas
- Asignar invitados a mesas mediante drag and drop
- Monitorear la ocupación de mesas en tiempo real

## Agregar Invitados

Puedes agregar invitados de dos formas:

### 1. Desde el Panel de Administración
Accede a `/admin`, ve a "Gestionar Invitados" y haz clic en "Agregar Invitado"

### 2. Desde SQL (Supabase Console)
```sql
INSERT INTO invitados (nombre_completo, codigo_unico, pases_maximos)
VALUES
  ('Juan Pérez García', 'JP2024', 2),
  ('María López Rodríguez', 'ML2024', 4),
  ('Carlos Sánchez Martínez', 'CS2024', 1),
  ('Ana Torres Fernández', 'AT2024', 3);
```

## Estructura de URLs

- `/` - Página principal con información de la boda
- `/invitacion/[CODIGO]` - Página de confirmación individual
- `/admin` - Panel de administración

Ejemplos:
- `/invitacion/JP2024`
- `/admin`

## Base de Datos

### Tabla: invitados

- `id`: UUID único del invitado
- `nombre_completo`: Nombre completo del invitado
- `codigo_unico`: Código único para acceder (en mayúsculas)
- `pases_maximos`: Número máximo de pases asignados
- `pases_confirmados`: Número de pases que usará
- `confirmado`: Estado de confirmación (true/false)
- `mesa_id`: ID de la mesa asignada (nullable)
- `created_at`: Fecha de creación
- `updated_at`: Última actualización

### Tabla: mesas

- `id`: UUID único de la mesa
- `numero`: Número de la mesa (único)
- `capacidad`: Número máximo de personas (default 8)
- `created_at`: Fecha de creación
- `updated_at`: Última actualización

## Personalización

Para personalizar la boda, edita los siguientes archivos:

- `src/components/HomePage.tsx` - Información de la boda (fecha, hora, lugar)
- `index.html` - Título de la página
- `src/index.css` - Estilos y fuentes

## Códigos de Ejemplo

Los códigos de invitación sugeridos pueden seguir patrones como:
- Iniciales + año: `BA2024`
- Iniciales del invitado + número: `JPG001`
- Cualquier código único que prefieras

Los códigos se convierten automáticamente a mayúsculas.

## Gestión de Mesas

- **Crear mesa**: En el panel de administración, ve a "Asignar Mesas" y usa el campo "Agregar Mesa"
- **Asignar invitados**: Arrastra invitados desde la columna izquierda a las mesas
- **Desasignar invitados**: Haz clic en la X al lado del nombre del invitado en la mesa
- **Eliminar mesa**: Haz clic en el ícono de basura en la esquina de la mesa

## Datos de Prueba

Se incluye un archivo `ejemplo-datos.sql` con datos de prueba que puedes ejecutar en la consola SQL de Supabase.
