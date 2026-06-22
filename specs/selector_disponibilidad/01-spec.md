# Spec: Selector de Disponibilidad (PerfilPage)

## Problem

Los asesores no tienen forma directa de cambiar su estado de disponibilidad desde el panel web. Actualmente el campo `availability_status` solo cambia via el job automático de horarios. El asesor necesita poder declarar manualmente cuando está en descanso, no disponible, o volver a disponible — con la opción de configurar un timer de retorno automático.

## Goals

- Agregar una sección "Mi Disponibilidad" dentro de la card de información personal en `PerfilPage.tsx`, debajo de los badges de rol y área.
- Permitir al asesor seleccionar entre tres estados: `available`, `break`, `offline`.
- Permitir configurar un timer de retorno automático (15 min, 30 min, 1 hora) o elegir "Sin límite" para inactividad indefinida.
- Mostrar el estado actual con dot y texto coloreados según el estado real del advisor cargado desde BD.
- Mostrar "Disponible a las HH:MM" si hay un `status_until` activo.
- El botón "Aplicar" llama al backend y muestra spinner mientras guarda.

## Non-Goals

- No actualizar el dot del sidebar directamente desde este componente — eso ya lo hace el WS `advisor.status_changed` via `useWebSocket`.
- No crear un archivo nuevo — todo va dentro de `PerfilPage.tsx`.
- No manejar el timer en el frontend (el backend es responsable de revertir el estado al expirar).
- No agregar lógica adicional en `Sidebar.tsx`.

## Expected Behavior

1. El asesor abre "Mi Perfil Profesional".
2. Ve su estado actual (dot + texto coloreado) debajo de los badges.
3. Selecciona un pill: Disponible / En descanso / No disponible.
4. Si selecciona `break` o `offline`, aparece un selector de timer (15 min / 30 min / 1 hora / Sin límite).
   - Si selecciona `available`, el timer se oculta y `selectedMinutes` se limpia a `null`.
5. El texto informativo:
   - Con timer activo (≠ null) → verde: "✓ Volverás a Disponible automáticamente en X minutos"
   - Sin límite (null) → amarillo: "⚠️ Deberás activar tu disponibilidad manualmente..."
6. El asesor pulsa "Aplicar" → spinner aparece, se llama al backend, spinner desaparece.
7. El WS `advisor.status_changed` actualiza el dot del sidebar automáticamente.

## Constraints

- Solo modifica `src/pages/PerfilPage.tsx` (UI/estado/lógica) + `src/services/advisors.ts` (firma `updateAvailability`) + `src/types/index.ts` (campo `status_until`).
- No usar `date-fns-tz` (no está instalado). Usar alternativa con `date-fns@4.x` o `Intl`.
- `status_until` no existe en el tipo `Advisor` — hay que agregarlo como opcional.
- `advisorsService.updateAvailability` solo acepta `status` — hay que extender para aceptar `minutes_until: number | null`.
- Respetar todas las reglas de hooks de `CLAUDE.md` sección 15.
- `npx tsc --noEmit` sin errores al finalizar.

## Priority

Alta — está en la rama `feat/selector-disponibilidad` y es el único bloqueo para merge.
