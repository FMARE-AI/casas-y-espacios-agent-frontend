# Design: Número de Caso en Bandeja e Historial

## Overview
Se declara `case_number` en el tipo `Conversation` (ya lo devuelve el backend, solo faltaba en el contrato TypeScript del frontend). Se crea un componente compartido `CaseNumberTag` que renderiza el número (o `—` si es `null`) y maneja el copiado al portapapeles + tooltip de confirmación con estado local, sin dependencias nuevas. Se consume ese componente en `ConversationCard` (bajo el nombre del cliente) y en `HistorialPage` (columna nueva de la tabla).

## Components

### New / Modified Files

| File | Role | Change type |
|------|------|-------------|
| `src/types/index.ts` | Agregar `case_number: string \| null` a la interfaz `Conversation`. | Modify |
| `src/components/shared/CaseNumberTag.tsx` | Componente compartido: renderiza el número o `—`; copia al portapapeles al hacer clic; muestra tooltip "Copiado". | Create |
| `src/components/bandeja/ConversationCard.tsx` | Renderizar `<CaseNumberTag>` debajo del nombre del cliente. | Modify |
| `src/pages/HistorialPage.tsx` | Agregar columna "N° de Caso" (header + celda) entre "Cliente" y "Línea"; ajustar `colSpan` del estado vacío. | Modify |

### Key Abstractions

```typescript
interface CaseNumberTagProps {
  caseNumber: string | null
  className?: string  // permite a cada consumidor ajustar tamaño de texto sin duplicar lógica
}

function CaseNumberTag({ caseNumber, className }: CaseNumberTagProps): JSX.Element
```

Comportamiento interno:
- `caseNumber === null` → `<span>—</span>` en tono secundario, sin botón ni handler de clic.
- `caseNumber` presente → `<button>` en `font-mono`, tono secundario que se aclara en hover; `onClick` copia al portapapeles (con `try/catch`, ver `02-clarification.md` Q8) y activa un estado local `copied` por 1.5s, mostrando un `<span>` tooltip "Copiado" posicionado en `absolute` arriba del botón — mismo patrón que el tooltip de "Límite alcanzado" ya existente en `ConversationCard.tsx`.

### Data Flow
1. `conversationsService.list()` / `getById()` ya devuelven `case_number` en el payload (contrato documentado, sin cambios en `services/conversations.ts`).
2. El campo fluye sin transformación hacia `Conversation` en el estado de `BandejaPage`/`HistorialPage`.
3. `ConversationCard` y `HistorialPage` pasan `conversation.case_number` / `conv.case_number` directamente a `<CaseNumberTag>`.
4. Clic en el tag → `navigator.clipboard.writeText(caseNumber)` → éxito activa `copied=true` por 1.5s vía `setTimeout`; fallo se traga silenciosamente (no hay estado de error visible, ver Edge Cases).

### API / Interface Contracts
Sin cambios de API — `case_number` ya forma parte del contrato documentado en `docs/panel_api_reference.md` (`GET /conversations/`, `GET /conversations/{id}`). No se agregan llamadas nuevas.

### Edge Cases & Error Handling
- `case_number: null` → `—`, sin botón de copiar, sin error. (Criterio de aceptación explícito.)
- `navigator.clipboard.writeText()` rechaza la promesa (contexto no seguro / permiso denegado) → capturado en `try/catch`, no se muestra tooltip, no se rompe el render. Ver `02-clarification.md` Q8.
- Tabla dentro de un contenedor `overflow-x-auto` (`HistorialPage`) → el tooltip se posiciona con `absolute -top-6`; como el contenedor solo restringe overflow en el eje X (no en Y), el tooltip no queda recortado verticalmente.
- Múltiples tarjetas/filas copiando casi simultáneamente → cada `CaseNumberTag` tiene su propio estado `copied` local (no hay estado global compartido), así que no hay interferencia entre tooltips de distintas filas/tarjetas.

## Open Questions for Implementation
Ninguna.
