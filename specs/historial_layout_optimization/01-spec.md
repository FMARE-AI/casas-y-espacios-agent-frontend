# Spec: Optimización Responsiva de Historial Cerrados

## Problem
La vista de "Historial Cerrados" (`HistorialPage.tsx`) tiene actualmente una restricción de ancho máximo de `max-w-5xl` (1024px) y alineación `items-start`. En pantallas de computadora medianas y grandes (ej. Full HD 1080p o resoluciones superiores), esto provoca que todo el contenido se comprima hacia el lado izquierdo, dejando una gran cantidad de espacio vacío e inutilizado en el lado derecho de la pantalla, lo cual degrada la estética y usabilidad en monitores de escritorio.

## Goals
- Hacer que la vista del "Historial Cerrados" sea completamente responsiva y aproveche óptimamente el ancho completo de cualquier monitor de computadora.
- Eliminar la limitación de ancho máximo `max-w-5xl` en todos los contenedores principales de la página (Header, panel de filtros, tabla y esqueleto de carga).
- Alinear el contenido de forma fluida a lo ancho del contenedor de la aplicación.
- Mantener la cohesión de diseño con las páginas de "Bandeja de Entrada" y "Gestión Asesores", las cuales ya ocupan todo el ancho disponible.

## Non-Goals
- Modificar el comportamiento de los filtros de la tabla o las funcionalidades de auditoría.
- Modificar los datos devueltos por el servicio de conversaciones o su estructuración de exportación CSV.

## Expected Behavior
- Al acceder a la página de Historial Cerrados, el listado de conversaciones, el panel de filtros y la barra de cabecera deben estirarse dinámicamente para ocupar el ancho disponible de la pantalla en cualquier resolución de monitor.
- La tabla de historial se adaptará y espaciará sus columnas de manera proporcional, manteniendo su scroll horizontal (`overflow-x-auto`) cuando la pantalla sea muy reducida (como en dispositivos móviles).
- En pantallas grandes, no quedará un margen vacío asimétrico a la derecha.

## Constraints
- La UI debe mantener la estética corporativa del proyecto (Tailwind CSS, fuentes, colores y bordes).
- No deben introducirse errores de TypeScript (`tsc --noEmit`).

## Priority
Medium — Mejora visual y de usabilidad altamente notable para asesores que utilizan monitores de escritorio.
