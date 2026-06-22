# Design: Selector de Disponibilidad

## Overview

Sección "Mi Disponibilidad" dentro de `PerfilPage.tsx`, insertada en el `div` de datos del advisor (misma columna que nombre, email y badges), después de los badges y separada por `border-t`. Requiere 3 cambios de soporte en tipos y servicio antes de modificar la página.

## Components

### New / Modified Files

| File | Role | Change type |
|------|------|-------------|
| `src/types/index.ts` | Agregar `status_until?: string \| null` a `Advisor` | Modify |
| `src/services/advisors.ts` | Extender `updateAvailability` para aceptar `minutesUntil` | Modify |
| `src/pages/PerfilPage.tsx` | Agregar sección Mi Disponibilidad, estado local, helpers | Modify |

### Key Abstractions

**Constantes (definidas a nivel de módulo en `PerfilPage.tsx`)**

```typescript
const STATUS_OPTIONS = [
  { value: 'available', label: 'Disponible', color: '#00D4AA',
    activeClass: 'bg-[#00D4AA]/15 border-[#00D4AA] text-[#00D4AA]' },
  { value: 'break',     label: 'En descanso', color: '#FFB84D',
    activeClass: 'bg-[#FFB84D]/15 border-[#FFB84D] text-[#FFB84D]' },
  { value: 'offline',   label: 'No disponible', color: '#FF5B5B',
    activeClass: 'bg-[#FF5B5B]/15 border-[#FF5B5B] text-[#FF5B5B]' },
] as const

const TIMER_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hora' },
  { value: null, label: 'Sin límite' },
]

const STATUS_LABELS: Record<AvailabilityStatus, string> = { ... }
const STATUS_COLORS: Record<AvailabilityStatus, string> = { ... }
```

**Helper `formatStatusUntil(statusUntil: string): string`**
- Usa `Intl.DateTimeFormat` con `timeZone: 'America/Bogota'`, `hour: '2-digit'`, `minute: '2-digit'`, `hour12: true`
- Devuelve ej. `"10:35 a. m."`

**Estado local en `PerfilPage`**
```typescript
const [selectedStatus, setSelectedStatus] = useState<AvailabilityStatus>(
  advisor?.availability_status ?? 'available'
)
const [selectedMinutes, setSelectedMinutes] = useState<number | null>(null)
const [isSavingStatus, setIsSavingStatus] = useState(false)
```

**`useEffect` de sincronización (deps: `[advisor]`)**
- Cuando `advisor` carga: `setSelectedStatus(advisor.availability_status)`
- Si `advisor.availability_status !== 'available'`: `setSelectedMinutes(15)` (default timer)
- Si `advisor.availability_status === 'available'`: `setSelectedMinutes(null)`

**`handleApplyStatus`**
```typescript
async function handleApplyStatus() {
  setIsSavingStatus(true)
  try {
    await advisorsService.updateAvailability(
      selectedStatus,
      selectedStatus === 'available' ? null : selectedMinutes
    )
  } catch {
    toast.error('No se pudo actualizar la disponibilidad')
  } finally {
    setIsSavingStatus(false)
  }
}
```

### Data Flow

1. `PerfilPage` monta → `loadProfile()` llama `advisorsService.getMe()` → `setAdvisor(fetched)`.
2. `useEffect([advisor])` sincroniza `selectedStatus` y `selectedMinutes` con el advisor cargado.
3. Usuario hace clic en pill → `setSelectedStatus` + lógica de default timer.
4. Usuario hace clic en botón de timer → `setSelectedMinutes`.
5. Usuario pulsa "Aplicar" → `handleApplyStatus` → `advisorsService.updateAvailability(status, minutes)`.
6. Backend actualiza BD y emite WS `advisor.status_changed`.
7. `useWebSocket` (ya activo en `ProtectedRoute`) recibe el evento y actualiza `wsStore.connectedAdvisors`.
8. `Sidebar` re-renderiza el dot con el nuevo estado.

### API / Interface Contracts

**`advisorsService.updateAvailability` (modificado)**
```typescript
async updateAvailability(
  status: AvailabilityStatus,
  minutesUntil?: number | null
): Promise<{ availability_status: AvailabilityStatus }>

// Body enviado al backend:
{ availability_status: status, minutes_until: minutesUntil ?? null }
```

**`Advisor` interface (modificado)**
```typescript
status_until?: string | null   // ISO datetime string o null
```

### Edge Cases & Error Handling

- `advisor` es `null` mientras carga → sección no se renderiza (está dentro del bloque `!isLoading`).
- `advisor.status_until` es `null` o `undefined` → no se muestra el texto "Disponible a las".
- `formatStatusUntil` recibe fecha inválida → devuelve `'--:--'` (try/catch interno).
- `updateAvailability` falla → `toast.error(...)`, `isSavingStatus = false`, no se actualiza estado local.
- `selectedStatus === 'available'` → el selector de timer no se renderiza; `minutesUntil = null` al aplicar.

## Open Questions for Implementation

- Ninguna.
