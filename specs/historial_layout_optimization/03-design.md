# Design: Optimización Responsiva de Historial Cerrados

## Overview
El diseño modifica la estructura de clases del layout principal en `HistorialPage.tsx` para eliminar las limitaciones estáticas de ancho (`max-w-5xl`) y alineación a la izquierda (`items-start`), permitiendo que el contenido se estire para ocupar todo el ancho disponible de la pantalla de manera fluida y responsiva.

## Components

### New / Modified Files
| File | Role | Change type |
|------|------|-------------|
| `src/pages/HistorialPage.tsx` | Vista del Historial de Conversaciones Cerradas | Modify |

### Key Abstractions

#### `src/pages/HistorialPage.tsx`
- **Layout contenedor principal**: Cambiar la clase del elemento `<section>` de `flex-1 flex flex-col items-start p-4 md:p-6 space-y-4` a `flex-1 flex flex-col p-4 md:p-6 space-y-4`. Eliminar `items-start` permite que los elementos hijos con `w-full` se estiren a lo largo de todo el eje transversal (ancho del contenedor).
- **Esqueleto de carga (`TableSkeleton`)**: Cambiar `max-w-5xl w-full` por `w-full` en el contenedor del skeleton para que se adapte al ancho dinámico durante la carga.
- **Cabecera (Header)**: Eliminar `max-w-5xl` del contenedor del título y del botón de exportación CSV.
- **Panel de Filtros (Filters)**: Eliminar `max-w-5xl` del panel que contiene la búsqueda y los selectores de línea/fecha.
- **Tabla de Resultados**: Eliminar `max-w-5xl` del contenedor con `overflow-x-auto` para que la tabla ocupe todo el ancho disponible en la pantalla y se auto-ajuste proporcionalmente.

## Data Flow
El flujo de datos sigue siendo idéntico al actual. La única diferencia es visual: el navegador calcula el layout basado en el ancho completo del viewport (`w-full`) en lugar de restringirlo a `1024px` (`max-w-5xl`).

## Edge Cases & Error Handling
- **Pantallas Ultra-Wide**: En pantallas muy grandes, la tabla se estira en su totalidad. Las columnas de texto largo como "Cliente" y "Motivo / Resolución" tienen propiedades `truncate` y `max-w` aplicadas que previenen distorsiones.
- **Dispositivos Móviles**: Se mantiene la propiedad `overflow-x-auto` en el envoltorio de la tabla para asegurar que en pantallas móviles o pantallas muy pequeñas se pueda hacer scroll horizontal de la tabla sin romper el diseño del Sidebar o del canvas principal.
