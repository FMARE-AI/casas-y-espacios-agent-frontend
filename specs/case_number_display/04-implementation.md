# Implementation Plan: Número de Caso en Bandeja e Historial

## Tasks

- [x] **Task 1**: Declarar `case_number` en el tipo `Conversation` — `src/types/index.ts`
- [x] **Task 2**: Crear componente compartido `CaseNumberTag` — `src/components/shared/CaseNumberTag.tsx`
- [x] **Task 3**: Integrar en la tarjeta de bandeja — `src/components/bandeja/ConversationCard.tsx`
- [x] **Task 4**: Integrar como columna en el historial — `src/pages/HistorialPage.tsx`
- [x] **Task 5**: Manejo de errores en el copiado al portapapeles — `src/components/shared/CaseNumberTag.tsx`

## Execution Log

### Task 1 — Declarar `case_number` en el tipo
Status: ✅ Done
Notes: Agregado `case_number: string | null` a la interfaz `Conversation`. El campo ya lo devuelve el backend (`docs/panel_api_reference.md`); solo faltaba en el contrato TypeScript del frontend — sin esto, `conversation.case_number` habría sido un error de tipo.

### Task 2 — Componente `CaseNumberTag`
Status: ✅ Done
Notes: Componente nuevo en `components/shared/` (mismo criterio de ubicación que `EscalationToast`, `SessionExpiredModal`). Sin `null` renderiza `—` en tono secundario y sin botón. Con valor, renderiza un `<button>` `font-mono` que copia al portapapeles y muestra un tooltip "Copiado" con `absolute -top-6`, usando estado local `copied` + `setTimeout(1500)` — mismo patrón visual que el tooltip "Límite alcanzado" ya existente en `ConversationCard.tsx`. Se evitó deliberadamente el componente `ui/tooltip.tsx` (base-ui) porque requiere un `TooltipPrimitive.Provider` que no está montado en `App.tsx` (ver `02-clarification.md` Q3).

### Task 3 — Integración en `ConversationCard`
Status: ✅ Done
Notes: `<CaseNumberTag caseNumber={conversation.case_number} className="text-[10px]" />` insertado inmediatamente debajo del `<h3>` del nombre del cliente, antes de los bloques de "Motivo" y del preview del último mensaje — así el dato secundario no se intercala entre contenido de mayor jerarquía.

### Task 4 — Integración en `HistorialPage`
Status: ✅ Done
Notes: Nueva columna `<th>N° de Caso</th>` entre "Cliente" y "Línea"; celda correspondiente con `<CaseNumberTag caseNumber={conv.case_number} className="text-xs" />`. Ajustado `colSpan` de la fila de estado vacío ("No se encontraron conversaciones cerradas") de `7` a `8` para que siga ocupando el ancho completo de la tabla con la columna nueva.

### Task 5 — Manejo de errores en el copiado
Status: ✅ Done
Notes: `handleCopy` envuelto en `try/catch` alrededor del `await navigator.clipboard.writeText(...)` — un rechazo (contexto no seguro, permiso denegado) ya no queda como unhandled promise rejection; simplemente no se activa el tooltip "Copiado". Ver `02-clarification.md` Q8 y `03-design.md` (Edge Cases).

## Verification
- `npx tsc --noEmit` — limpio, sin errores (exit code 0).
- `npx eslint` sobre los 4 archivos tocados/creados — limpio, sin warnings.
- Revisión manual del layout: el tooltip "Copiado" se posiciona en `absolute`, y el contenedor de la tabla en `HistorialPage` solo tiene `overflow-x-auto` (no `overflow-y`), por lo que no lo recorta verticalmente.

**No verificado end-to-end en navegador** (no se levantó `npm run dev` con datos reales del backend en este entorno) — pendiente que quien apruebe el PR confirme visualmente:
1. Que el número de caso en la tarjeta no compite visualmente con el nombre del cliente ni el último mensaje (criterio de aceptación explícito).
2. Que el tooltip "Copiado" se ve correctamente posicionado tanto en la tarjeta como en la fila de la tabla.
3. Que conversaciones con `case_number: null` (datos anteriores al despliegue del campo en backend) muestran `—` sin romper el layout.

## Final Check
- ✅ Coincide con `03-design.md`: mismos archivos, misma forma del componente, mismo manejo de `null` y de errores de portapapeles.
- ✅ Sigue los patrones de `CLAUDE.md`: código en inglés (identificadores, comentarios), sin comentarios que expliquen el qué, componente compartido en `components/shared/` reutilizado en dos consumidores en vez de duplicar lógica, sin abstracciones nuevas más allá de lo necesario (no se tocó el store global, no se agregó dependencia nueva).
