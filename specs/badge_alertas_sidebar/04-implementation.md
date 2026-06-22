# Implementation Plan: Badge de Alertas en Sidebar

## Tasks

- [x] **Task 1: Actualizar wsStore.ts** — `src/store/wsStore.ts`
  - Agregar `setUnreadAlerts: (count: number) => void` a la interfaz `WSState`.
  - Agregar la implementación de `setUnreadAlerts` en `useWSStore`.
  - Validar que `decrementAlerts` tenga la lógica de `Math.max(0, ...)`.

- [x] **Task 2: Modificar Sidebar.tsx** — `src/components/layout/Sidebar.tsx`
  - Importar `alertsService` de `../../services/alerts`.
  - Leer `unreadAlerts` y `setUnreadAlerts` de `useWSStore`.
  - Implementar el hook `useEffect` para cargar las alertas iniciales sin revisar si `role === 'admin'`.
  - Actualizar `NavItem` para soportar formato `99+` en el badge.
  - Asignar `badge={unreadAlerts}` al ítem `/gestion` de "Gestión Asesores" e inicializar el de "Bandeja de Entrada" en `undefined`.
  - Documentar mediante comentarios el comportamiento y dónde se invoca `decrementAlerts`.

- [x] **Task 3: Compilación y validación** — Terminal / Proceso
  - Ejecutar `npx tsc --noEmit` para asegurar que el compilador de TypeScript no arroje ningún error.

## Execution Log

### Task 1 — Actualizar wsStore.ts
Status: ✅ Done
Notes: Se agregó `setUnreadAlerts` tanto a la interfaz `WSState` como a la implementación en `useWSStore`. Se verificó que `decrementAlerts` limite correctamente el conteo en 0.

### Task 2 — Modificar Sidebar.tsx
Status: ✅ Done
Notes: Se importó `alertsService`, se agregó el `useEffect` para consultar la carga inicial de alertas en BD con `reviewed: false` y `limit: 1`. Se actualizó `NavItem` para recortar y centrar el badge en `99+` cuando corresponda. Se movió el badge de "Bandeja de Entrada" a "Gestión Asesores" y se agregó el comentario descriptivo de `decrementAlerts`.

### Task 3 — Compilación y validación
Status: ✅ Done
Notes: Se ejecutó `npx tsc --noEmit` mediante cmd, finalizando sin ningún error de compilación. El tipado TypeScript es 100% correcto.
