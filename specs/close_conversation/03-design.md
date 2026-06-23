# Design: Close Conversation

## Overview
We add a "Cerrar conversación" button to `ClientPanel` (visible only in `assigned` variant) that triggers a classification modal in `ChatPage`. The modal collects resolution metadata and calls `PATCH /conversations/{id}/close`. On success it navigates to the bandeja. `HistorialPage` is updated to display the new resolution fields. `types/index.ts` gains three new optional fields on `Conversation`.

---

## Components

### New / Modified Files
| File | Role | Change type |
|------|------|-------------|
| `src/types/index.ts` | Add `resolution_type`, `resolution_notes`, `closed_by` to `Conversation` | Modify |
| `src/services/conversations.ts` | Add `close()` method with mock fallback | Modify |
| `src/components/chat/ClientPanel.tsx` | Add `onCloseConversation?: () => void` prop; render close button when `variant === 'assigned'` | Modify |
| `src/pages/ChatPage.tsx` | Add state, `CloseConversationModal` component, `handleClose` function, wire `onCloseConversation` to panel | Modify |
| `src/pages/HistorialPage.tsx` | Update "Motivo / Resolución" column to use `resolution_type` (with `intent` fallback); update "Resolutor" to check `closed_by` | Modify |

---

## Key Abstractions

### `CloseConversationModal` (inside ChatPage.tsx)
A function component defined alongside `ReturnBotModal` in the same file.

```
Props:
  onConfirm(data: CloseData): void
  onCancel(): void
  isClosing: boolean

Internal state:
  resolutionType: string        // default 'otro'
  resolutionNotes: string       // default ''
  clientSatisfied: string       // default 'sin_confirmar'
```

The component owns its own selection state and passes the resolved payload up via `onConfirm`.

### `CloseData` (local type, not exported)
```typescript
interface CloseData {
  resolution_type: string
  resolution_notes: string | null
  client_satisfied: string
}
```
Used only internally between `CloseConversationModal` and `handleClose`.

### `RESOLUTION_OPTIONS` (module-level constant in ChatPage.tsx)
```typescript
const RESOLUTION_OPTIONS: { value: string; label: string }[]
```
8 entries as specified. Defined outside the component to avoid re-creation on render.

### `RESOLUTION_LABELS` (module-level constant in HistorialPage.tsx)
```typescript
const RESOLUTION_LABELS: Record<string, string>
```
Maps `resolution_type` values to short display strings.

---

## Data Flow

1. Advisor clicks "Cerrar conversación" in `ClientPanel` → `onCloseConversation()` called.
2. `ChatPage` sets `showCloseModal = true`.
3. Modal renders; advisor selects options.
4. Advisor clicks "Confirmar cierre" → modal calls `onConfirm({ resolution_type, resolution_notes, client_satisfied })`.
5. `handleClose(data)` in `ChatPage`:
   a. Sets `isClosing = true`.
   b. Calls `conversationsService.close(conversationId, data)`.
   c. On success: `setShowCloseModal(false)` → `navigate('/')`.
   d. On failure: `toast.error('No se pudo cerrar la conversación')`.
   e. `finally`: `setIsClosing(false)`.
6. `conversationsService.close()`:
   - Mock path (demo/conv-*): update mock conversation status to `'cerrada'`, return `{}`.
   - Real path: `PATCH /api/v1/panel/conversations/{id}/close` → return `data.data`.

---

## API / Interface Contracts

### New `Conversation` fields (types/index.ts)
```typescript
interface Conversation {
  // existing fields...
  resolution_type?: string | null
  resolution_notes?: string | null
  closed_by?: 'bot' | 'advisor' | null
}
```

### New service method (conversations.ts)
```typescript
async close(
  id: string,
  data: { resolution_type: string; resolution_notes: string | null; client_satisfied: string }
): Promise<object>
```

### New prop (ClientPanel.tsx)
```typescript
interface ClientPanelProps {
  // existing props...
  onCloseConversation?: () => void   // distinct from onClose (mobile panel close)
}
```

### ChatPage state additions
```typescript
const [showCloseModal, setShowCloseModal] = useState(false)
const [isClosing, setIsClosing] = useState(false)
```

---

## Edge Cases & Error Handling

| Case | Handling |
|------|----------|
| `conversationId` is undefined when close fires | `handleClose` guards with `if (!conversationId) return` |
| Network error on `close()` | `toast.error('No se pudo cerrar la conversación')`, modal stays open, button re-enabled |
| Demo / mock ID | Local mock update + navigate, no HTTP call |
| Admin opens chat (monitoring) | `variant === 'monitoring'` → button not rendered, `onCloseConversation` never called |
| `resolution_notes` empty string | Normalize to `null` before sending |
| Old conversations without `resolution_type` | HistorialPage falls back to `conv.intent` |

---

## Open Questions for Implementation
None.
