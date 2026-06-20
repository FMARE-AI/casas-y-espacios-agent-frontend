# Design: ScheduleManager

## Overview

Se crea `ScheduleManager` como componente autocontenido que se monta debajo de la card de información personal en `PerfilPage`. Gestiona su propio ciclo de vida: carga inicial, CRUD de intervalos y modales. No comparte estado con `PerfilPage`. Utiliza `schedulesService` existente y el tipo `AdvisorSchedule` sin modificaciones.

## Components

### New / Modified Files

| File | Role | Change type |
|------|------|-------------|
| `src/components/perfil/ScheduleManager.tsx` | Componente completo de gestión de intervalos | Create |
| `src/pages/PerfilPage.tsx` | Importar y montar `<ScheduleManager />` | Modify |

### Key Abstractions

**`ScheduleManager` (default export)**
- Responsibility: renderizar la card de intervalos con lista, modales y acciones CRUD
- Inputs: ninguno (props vacías)
- Outputs: JSX; side effects vía `schedulesService`

**`ScheduleFormModal`** (sub-componente interno, no exportado)
- Responsibility: formulario de creación con validación Zod + react-hook-form
- Inputs: `onClose: () => void`, `onCreated: (s: AdvisorSchedule) => void`
- Outputs: JSX; llama `schedulesService.create()` en submit

**`DeleteConfirmModal`** (sub-componente interno, no exportado)
- Responsibility: modal de confirmación de borrado
- Inputs: `onConfirm: () => void`, `onCancel: () => void`, `isDeleting: boolean`
- Outputs: JSX

**Schema Zod** (`scheduleSchema`)
```typescript
const scheduleSchema = z.object({
  label: z.string().min(1, 'Nombre requerido').max(50),
  startTime: z.string().regex(/^([0-1]\d|2[0-3]):[0-5]\d$/, 'Formato inválido'),
  endTime: z.string().regex(/^([0-1]\d|2[0-3]):[0-5]\d$/, 'Formato inválido'),
  daysOfWeek: z.array(z.number().min(1).max(7)).min(1, 'Selecciona al menos un día'),
}).refine(
  data => data.startTime < data.endTime,
  { message: 'La hora de fin debe ser mayor que la de inicio', path: ['endTime'] }
)
type ScheduleFormData = z.infer<typeof scheduleSchema>
```

**Constante `DAYS`**
```typescript
const DAYS = [
  { value: 1, label: 'L' },
  { value: 2, label: 'M' },
  { value: 3, label: 'X' },
  { value: 4, label: 'J' },
  { value: 5, label: 'V' },
  { value: 6, label: 'S' },
  { value: 7, label: 'D' },
]
```

### Data Flow

**Carga inicial:**
1. `ScheduleManager` monta → `useEffect` llama `schedulesService.list()`
2. `isLoading = true` → skeleton visible
3. `.then(r => setSchedules(r.schedules))` → lista renderizada
4. `.finally(() => setIsLoading(false))` → skeleton oculto

**Crear intervalo:**
1. Usuario pulsa "Agregar intervalo" → `setShowModal(true)`
2. `ScheduleFormModal` aparece sobre pantalla
3. Usuario completa campos y pulsa "Guardar"
4. `handleSubmit` valida con Zod → si errores, muestra inline
5. `schedulesService.create(payload)` → recibe `{ schedule }`
6. `setSchedules(prev => [...prev, schedule])` → ítem aparece al final
7. `setShowModal(false)` → modal cierra
8. Si falla: `toast.error(...)`, modal permanece abierto

**Toggle activo/inactivo:**
1. Usuario pulsa toggle de un ítem
2. Optimistic update inmediato: `setSchedules` invierte `is_active`
3. `schedulesService.update(id, { is_active })` en background
4. Si éxito: `setSchedules` con valor confirmado del servidor
5. Si falla: `setSchedules` revierte el valor original, sin toast (silencioso)

**Eliminar:**
1. Usuario pulsa ícono basura → `setDeletingId(schedule.id)`
2. `DeleteConfirmModal` aparece
3. Usuario confirma → `handleDelete(deletingId)`
4. `setIsDeleting(true)` → botón deshabilitado con spinner
5. `schedulesService.delete(id)` → elimina en servidor
6. Si éxito: `setSchedules(prev => prev.filter(s => s.id !== id))` + `setDeletingId(null)`
7. Si falla: `toast.error(...)`, `setDeletingId(null)`, ítem permanece

### API / Interface Contracts

Usa `schedulesService` existente — sin cambios:
- `list()` → `Promise<{ schedules: AdvisorSchedule[] }>`
- `create(payload)` → `Promise<{ schedule: AdvisorSchedule }>`
- `update(id, { is_active })` → `Promise<{ schedule: AdvisorSchedule }>`
- `delete(id)` → `Promise<void>`

### Edge Cases & Error Handling

- **Lista vacía + no cargando** → estado vacío con texto descriptivo (`id="schedules-empty"`)
- **Error en list()** → `.catch(() => {})` silencioso; lista queda vacía (no crash)
- **Error en create()** → `toast.error`, modal permanece abierto
- **Error en toggle** → reversión silenciosa del estado (UI vuelve al valor anterior)
- **Error en delete()** → `toast.error`, modal cierra, ítem permanece en lista
- **`daysOfWeek` vacío en submit** → bloqueado por Zod antes del request

## Open Questions for Implementation

Ninguna.
