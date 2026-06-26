# Spec: Conectar Historial de Conversaciones Cerradas

## Problem
La pantalla de historial de conversaciones cerradas (`HistorialPage.tsx`) presenta inconsistencias y falta de sincronización con los datos reales del backend:
1. Muestra el tipo de resolución/motivo en lugar de las notas reales de resolución (`resolution_notes`).
2. La columna "Motivo / Resolución" debe renombrarse a "Notas de resolución".
3. Falta la columna de si el cliente está satisfecho (`client_satisfied`) en la tabla y en la exportación CSV.
4. El resolutor de la conversación debe mapearse al campo `closed_by` devuelto por el backend.
5. El tipo TypeScript `Conversation` carece de los nuevos campos del backend.
6. Dado que las notas de resolución pueden ser textos largos, el usuario necesita una forma interactiva de ver el texto completo al posicionar el cursor (hover) o al hacer click.

## Goals
- Renombrar la columna "Motivo / Resolución" a "Notas de resolución" y mostrar `resolution_notes` (truncado a 60 caracteres por defecto, con title/tooltip y expandible al hacer click).
- Mapear correctamente el resolutor usando el campo `closed_by`:
  - `closed_by === 'bot'` -> "Bot" (en verde `#00D4AA`).
  - `closed_by === 'asesor'` -> Nombre del asesor (`escalation.advisor.full_name` o "—").
  - `closed_by === null` -> "—".
- Agregar una nueva columna "¿El cliente está satisfecho?" y traer el valor `client_satisfied`.
- Agregar un comentario `TODO` en el código explicando el bug del backend (donde `closed_at` puede venir como `null` y por lo tanto se usa `last_activity` como fallback).
- Actualizar el tipo `Conversation` en `src/types/index.ts` con los nuevos campos: `resolution_type`, `resolution_notes`, `client_satisfied`, `closed_by` y `closed_at`.
- Actualizar la exportación CSV para incluir las "Notas de resolución" y la satisfacción del cliente.
- Asegurar que compile de forma limpia sin errores de TypeScript.

## Non-Goals
- Crear una nueva pantalla desde cero.
- Modificar el flujo de datos del servicio de conversaciones (ya retorna los campos necesarios).

## Expected Behavior
- La tabla de historial y la exportación de CSV mostrarán información fidedigna y actualizada de la base de datos.
- Las notas de resolución largas se verán truncadas, pero al pasar el mouse por encima o hacer click en ellas, se podrá visualizar el texto completo.
- La columna de satisfacción del cliente mostrará los valores (`si`, `no`, `sin_confirmar`) según corresponda.

## Constraints
- Mantener la cohesión de estilos responsivos y el esquema de colores de la aplicación (Tailwind CSS).
- Compilación limpia con `npx tsc --noEmit`.

## Priority
High — Sincroniza la auditoría de conversaciones con los nuevos campos de negocio agregados al backend.
