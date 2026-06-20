# Spec: ScheduleManager — Intervalos de Inactividad

## Problem

Los asesores no tienen forma de configurar sus intervalos de inactividad recurrentes desde la UI. El job `availability_checker.py` del backend ya puede marcarlos como "En descanso" durante los intervalos guardados en `advisor_schedules`, pero no existe ningún componente frontend para gestionar esos registros.

## Goals

- Mostrar la lista de intervalos del asesor autenticado en su PerfilPage
- Permitir crear un nuevo intervalo (label, hora inicio, hora fin, días de la semana)
- Permitir activar/desactivar cada intervalo con toggle (optimistic update)
- Permitir eliminar un intervalo con confirmación previa
- Mostrar estado vacío cuando no hay intervalos configurados
- Mostrar skeleton mientras los datos cargan

## Non-Goals

- Editar un intervalo existente (solo crear/borrar/toggle)
- Visualizar en tiempo real el efecto del intervalo sobre el estado del asesor
- Configurar intervalos de otros asesores (solo el propio)
- Validación de solapamiento entre intervalos (lo gestiona el backend)

## Expected Behavior

1. Al entrar a PerfilPage, `schedulesService.list()` carga los intervalos del asesor.
2. Durante la carga se muestra un skeleton de 2 ítems.
3. Cada ítem muestra: nombre, rango horario en monospace, píldoras de días (azul = activo, gris = inactivo), toggle on/off y botón eliminar.
4. Clicar "Agregar intervalo" abre un modal con campos: nombre, hora inicio, hora fin, checkboxes de días (L M X J V S D).
5. El modal valida: nombre no vacío, horas en formato HH:MM, fin > inicio, al menos un día seleccionado.
6. Al guardar, el nuevo intervalo aparece al final de la lista sin recargar.
7. El toggle hace optimistic update y revierte silenciosamente si el PATCH falla.
8. Clicar el ícono de basura abre un modal de confirmación pequeño. Al confirmar, el ítem desaparece de la lista.
9. Si la lista está vacía (y no cargando), se muestra un mensaje descriptivo.

## Constraints

- Usar `schedulesService` de `src/services/schedules.ts` — no llamar directamente a `apiClient`.
- Usar el tipo `AdvisorSchedule` de `src/types/index.ts` sin modificarlo.
- Código en inglés; strings de UI en español. (CLAUDE.md §3.12)
- Sin comentarios salvo que el WHY no sea obvio.
- No usar `pip install` ni modificar dependencias del backend.
- Validación con Zod + react-hook-form, igual que el formulario de contraseña en PerfilPage.

## Priority

Medium — completa la PerfilPage; los intervalos son funcionalidad activa del job de disponibilidad.
