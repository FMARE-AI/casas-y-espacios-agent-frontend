# Technical Design: Connect GET /conversations (TASK-3)

## Proposed Changes

### 1. Types Update (`src/types/index.ts`)
Add `wait_seconds?: number | null` to the `Escalation` interface.
Define the `DashboardMetrics` interface matching the backend schema:
```typescript
export interface DashboardMetrics {
  activas: number
  escaladas: number
  en_atencion: number
  tiempo_promedio_min: number
  bot_ok_pct: number
  capacidad_actual: number
  capacidad_total: number
}
```

### 2. Service Integrations

#### `src/services/conversations.ts`
Implement `conversationsService.list()`:
```typescript
import apiClient from '../lib/axios'
...
  async list(params?: ConversationListParams): Promise<PaginatedConversations> {
    const { data } = await apiClient.get('/api/v1/panel/conversations/', { params })
    return data.data
  },
```

#### `src/services/metrics.ts`
Implement `metricsService.getMetrics()`:
```typescript
import apiClient from '../lib/axios'
import type { DashboardMetrics } from '../types'

export const metricsService = {
  async getMetrics(): Promise<{ metrics: DashboardMetrics }> {
    const { data } = await apiClient.get('/api/v1/panel/metrics')
    return data.data
  },
}
```

### 3. Component Updates

#### `src/components/bandeja/ConversationCard.tsx`
Update `getVariant` to evaluate `escalation.wait_seconds` returned by the server:
```typescript
function getVariant(conversation: Conversation, now: number): CardVariant {
  if (conversation.status === 'activa') return 'C'

  if (conversation.status === 'escalada') {
    const hasAdvisor = !!conversation.escalation?.advisor
    if (hasAdvisor) return 'B'

    const waitSeconds = conversation.escalation?.wait_seconds !== undefined && conversation.escalation?.wait_seconds !== null
      ? conversation.escalation.wait_seconds
      : (conversation.escalation?.escalated_at
        ? Math.floor((now - new Date(conversation.escalation.escalated_at).getTime()) / 1000)
        : 0)
    
    return waitSeconds >= 900 ? 'A2' : 'A'
  }

  return 'C'
}
```

#### `src/components/bandeja/FilterBar.tsx`
Change the select channel option values to lowercase (`"administrativa"`, `"comercial"`) and maps properly:
```tsx
        <select
          value={activeChannel || ''}
          onChange={(e) => onChannelChange(e.target.value || null)}
          className="bg-[#2E2E2B] ... "
        >
          <option value="">Todos los Canales</option>
          <option value="administrativa">Administrativa</option>
          <option value="comercial">Comercial</option>
        </select>
```

#### `src/components/bandeja/MetricsDashboard.tsx`
Update `MetricsDashboard` to accept `metrics` prop and render the values:
```tsx
interface MetricsDashboardProps {
  metrics: DashboardMetrics | null
}

export function MetricsDashboard({ metrics }: MetricsDashboardProps) {
  if (!metrics) {
    // Render skeleton or loading state
    return <div id="admin-metrics-panel" className="...">Cargando métricas...</div>
  }
  const capacity = `${metrics.capacidad_actual}/${metrics.capacidad_total}`
  ...
}
```

### 4. Page Integration (`src/pages/BandejaPage.tsx`)
- Read Zustand store `advisor` and `role` using granular selectors.
- Fetch active advisor profile (`advisorsService.getMe()`) on mount and update Zustand store.
- Fetch dashboard metrics (`metricsService.getMetrics()`) in `loadConversations` and `refreshCounts` if `role === 'admin'`.
- Pass metrics state to `<MetricsDashboard />`.
- Clean up any local mock filter code.
- Combine and trigger correct state updates when `statusFilter` or `channelFilter` change.
