# Referencia de servicios API

Todos los servicios viven en `src/services/` y se importan desde `src/services/index.ts`.
Todos los endpoints devuelven `{ "data": { ... } }` — los servicios ya extraen `data.data`.

## Base URL

```
Desarrollo:   VITE_API_URL=http://localhost:8000
Producción:   configurado en Vercel por ambiente
```

## Autenticación

Todas las llamadas incluyen automáticamente el header:

```
Authorization: Bearer <supabase-jwt>
```

Inyectado por el interceptor de Axios en `src/lib/axios.ts`. No hay que hacer nada en los servicios o componentes.

---

## conversationsService

```typescript
import { conversationsService } from '../services'
```

### `list(params?)`

Lista conversaciones con filtros opcionales.

```typescript
const result = await conversationsService.list({
  status: 'escalada',   // 'activa' | 'escalada' | 'cerrada'
  channel: 'whatsapp',
  limit: 20,
  offset: 0,
})
// result: PaginatedConversations
// { conversations: Conversation[], total: number, limit: number, offset: number }
```

**GET** `/api/v1/panel/conversations`

---

### `getById(id)`

Retorna una conversación con sus mensajes más recientes.

```typescript
const result = await conversationsService.getById('conv-uuid')
// result: { conversation: Conversation, messages: Message[], total_messages: number }
```

**GET** `/api/v1/panel/conversations/{id}`

---

### `getMessages(id, params?)`

Paginación de mensajes de una conversación.

```typescript
const result = await conversationsService.getMessages('conv-uuid', {
  limit: 50,
  offset: 0,
})
// result: PaginatedMessages
// { messages: Message[], total: number, limit: number, offset: number }
```

**GET** `/api/v1/panel/conversations/{id}/messages`

---

### `replyText(id, text)`

Envía un mensaje de texto en nombre del asesor.

```typescript
const result = await conversationsService.replyText('conv-uuid', 'Hola, ¿en qué le ayudo?')
// result: { message: Message }
```

**POST** `/api/v1/panel/conversations/{id}/reply`

---

### `replyMedia(id, file)`

Envía un archivo (imagen, documento, video).

```typescript
const result = await conversationsService.replyMedia('conv-uuid', file)
// result: { message: Message }
```

**POST** `/api/v1/panel/conversations/{id}/reply/media` — `multipart/form-data`

---

### `replyAudio(id, blob)`

Envía un audio grabado (WebM).

```typescript
const result = await conversationsService.replyAudio('conv-uuid', audioBlob)
// result: { message: Message }
```

**POST** `/api/v1/panel/conversations/{id}/reply/audio` — `multipart/form-data`

---

### `assign(id)`

Asigna la conversación escalada al asesor autenticado.

```typescript
const result = await conversationsService.assign('conv-uuid')
// result: { escalation: object }
```

**PATCH** `/api/v1/panel/conversations/{id}/assign`

---

### `returnToBot(id)`

Devuelve el control de la conversación al bot de IA.

```typescript
const result = await conversationsService.returnToBot('conv-uuid')
// result: { conversation: Conversation }
```

**PATCH** `/api/v1/panel/conversations/{id}/return-bot`

---

## advisorsService

```typescript
import { advisorsService } from '../services'
```

### `getMe()`

Retorna los datos del asesor autenticado.

```typescript
const { advisor } = await advisorsService.getMe()
// advisor: Advisor
```

**GET** `/api/v1/panel/advisors/me`

---

### `updateMe(payload)`

Actualiza nombre o contraseña del asesor autenticado.

```typescript
const { advisor } = await advisorsService.updateMe({
  full_name: 'Juan Pérez',
  current_password: 'actual',
  new_password: 'nueva',
})
```

**PATCH** `/api/v1/panel/advisors/me`

---

### `updateAvailability(status)`

Cambia el estado de disponibilidad del asesor autenticado.

```typescript
const result = await advisorsService.updateAvailability('available')
// status: 'available' | 'break' | 'offline'
// result: { availability_status: AvailabilityStatus }
```

**PATCH** `/api/v1/panel/advisors/me/availability`

---

### `list(params?)` *(solo admin)*

Lista todos los asesores con filtros opcionales.

```typescript
const { advisors } = await advisorsService.list({
  role: 'asesor',
  area: 'comercial',
  is_active: true,
})
```

**GET** `/api/v1/panel/advisors`

---

### `create(payload)` *(solo admin)*

Crea un nuevo asesor.

```typescript
const { advisor } = await advisorsService.create({
  email: 'asesor@empresa.com',
  password: 'temporal123',
  full_name: 'Ana García',
  role: 'asesor',
  area: 'comercial',
  max_conversations: 5,
})
```

**POST** `/api/v1/panel/advisors`

---

### `update(id, payload)` *(solo admin)*

Actualiza un asesor existente.

```typescript
const { advisor } = await advisorsService.update('advisor-uuid', {
  max_conversations: 8,
  is_active: false,
})
```

**PATCH** `/api/v1/panel/advisors/{id}`

---

## alertsService

```typescript
import { alertsService } from '../services'
```

### `list(params?)` *(solo admin)*

Lista alertas de comportamiento con filtros opcionales.

```typescript
const result = await alertsService.list({
  reviewed: false,
  advisor_id: 'advisor-uuid',
  limit: 20,
  offset: 0,
})
// result: PaginatedAlerts
// { alerts: BehaviorAlert[], total: number }
```

**GET** `/api/v1/panel/behavior-alerts`

---

### `markReviewed(id)` *(solo admin)*

Marca una alerta como revisada por el admin autenticado.

```typescript
const { alert } = await alertsService.markReviewed('alert-uuid')
```

**PATCH** `/api/v1/panel/behavior-alerts/{id}/review`

---

## schedulesService

```typescript
import { schedulesService } from '../services'
```

### `list()`

Lista todos los horarios de atención configurados.

```typescript
const { schedules } = await schedulesService.list()
// schedules: AdvisorSchedule[]
```

**GET** `/api/v1/panel/schedules`

---

### `create(payload)`

Crea un nuevo horario de atención.

```typescript
const { schedule } = await schedulesService.create({
  label: 'Horario comercial',
  start_time: '08:00',
  end_time: '18:00',
  days_of_week: [1, 2, 3, 4, 5], // 0=domingo, 6=sábado
})
```

**POST** `/api/v1/panel/schedules`

---

### `update(id, payload)`

Actualiza un horario existente.

```typescript
const { schedule } = await schedulesService.update('schedule-uuid', {
  is_active: false,
})
```

**PATCH** `/api/v1/panel/schedules/{id}`

---

### `delete(id)`

Elimina un horario.

```typescript
await schedulesService.delete('schedule-uuid')
```

**DELETE** `/api/v1/panel/schedules/{id}`

---

## Eventos WebSocket

*(Implementación pendiente en FE-10 — `src/hooks/useWebSocket.ts`)*

WebSocket base URL: `VITE_WS_BASE_URL`

| Evento | Tipo de datos | Acción esperada en UI |
|---|---|---|
| `escalation.new` | `WSEscalationNew` | Nueva card en bandeja + toast |
| `escalation.assigned` | `{ conversation_id, advisor_id }` | Actualizar card en bandeja |
| `message.new` | `WSMessageNew` | Agregar mensaje al feed del chat |
| `conversation.returned` | `{ conversation_id }` | Actualizar estado del chat |
| `advisor.connected` | `WSAdvisorStatusChanged` | Indicador en bandeja |
| `advisor.disconnected` | `WSAdvisorStatusChanged` | Indicador en bandeja |
| `behavior.alert` | `WSBehaviorAlert` | Badge admin + lista alertas |
| `advisor.status_changed` | `WSAdvisorStatusChanged` | Indicador disponibilidad sidebar |

---

## Modelos de datos

Ver `src/types/index.ts` para la definición completa de todos los tipos.

### Conversation

```typescript
{
  id: string
  status: 'activa' | 'escalada' | 'cerrada'
  bot_activo: boolean
  channel: string
  last_activity: string          // ISO timestamp
  client: Client
  escalation: Escalation | null
}
```

### Message

```typescript
{
  id: string
  wam_id: string | null
  direction: 'inbound' | 'outbound_bot' | 'outbound_advisor'
  msg_type: 'text' | 'image' | 'video' | 'document' | 'audio'
  content: string | null
  media_url: string | null
  timestamp: string              // ISO timestamp
  delivered_via: string
}
```

### Advisor

```typescript
{
  id: string
  email: string
  full_name: string
  role: 'asesor' | 'admin'
  area: 'administrativa' | 'comercial' | 'ambas'
  max_conversations: number
  active_conversations: number
  availability_status: 'available' | 'break' | 'offline'
  is_active: boolean
}
```
