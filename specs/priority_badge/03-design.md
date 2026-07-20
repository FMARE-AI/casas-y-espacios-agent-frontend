# Design: Priority Badge en Bandeja

## Overview
Add a colored priority badge to each `ConversationCard`, sourced from the conversation's `priority` field, with real-time updates via the documented `conversation.priority_updated` WebSocket event.

## Components

### New / Modified Files

| File | Role | Change type |
|------|------|-------------|
| `src/types/index.ts` | Add `ConversationPriority` union type, `priority` field on `Conversation`, `WSConversationPriorityUpdated` WS payload type. | Modify |
| `src/components/bandeja/ConversationCard.tsx` | Render the priority badge in the existing top badge row when `priority` is non-null. | Modify |
| `src/hooks/useWebSocket.ts` | Add `onConversationPriorityUpdated` handler slot + `conversation.priority_updated` switch case. | Modify |
| `src/pages/BandejaPage.tsx` | Register the handler; patch the matching conversation's `priority` in local state (no full reload). | Modify |

### Key Abstractions

```typescript
export type ConversationPriority = 'baja' | 'media' | 'alta' | 'critica'

// Conversation interface addition:
priority: ConversationPriority | null

// New WS payload type:
export interface WSConversationPriorityUpdated {
  conversation_id: string
  priority: ConversationPriority
  updated_by: 'bot'
}
```

### Badge Component (inline in `ConversationCard.tsx`, no new file)
A small color-coded map, same shape as the existing `CLIENT_TYPE_LABELS`/`ESCALATION_REASON_LABELS` constants in that file:

```typescript
const PRIORITY_STYLES: Record<ConversationPriority, string> = {
  baja: 'bg-[#8B8FA8]/15 text-[#8B8FA8]',
  media: 'bg-[#01A4E3]/15 text-[#01A4E3]',
  alta: 'bg-[#FFB84D]/15 text-[#FFB84D]',
  critica: 'bg-[#FF5B5B]/15 text-[#FF5B5B]',
}

const PRIORITY_LABELS: Record<ConversationPriority, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  critica: 'Crítica',
}
```

Rendered conditionally right next to the existing chips:
```tsx
{conversation.priority && (
  <span className={`${PRIORITY_STYLES[conversation.priority]} text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider`}>
    {PRIORITY_LABELS[conversation.priority]}
  </span>
)}
```
Matches the existing chip classes exactly (`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider`) already used for the status/client-type/channel chips in this card — no new visual language introduced.

### Data Flow
1. **Initial load**: `conversationsService.list()` returns `priority` on each conversation (per the documented schema) — flows straight into `Conversation` state, no transformation needed.
2. **Real-time update**: Bot raises priority mid-conversation → backend emits `conversation.priority_updated` to all connected advisors → `useWebSocket.ts` central handler receives it → calls `_handlers.onConversationPriorityUpdated` if registered.
3. **BandejaPage patch**: `handleConversationPriorityUpdated(data)` does a targeted `setConversations` map — updates only the matching card's `priority` field, same pattern already used by `handleMessageNew` for `last_message`/`unread_count` (as opposed to the full-reload pattern used by `handleEscalationAssigned` etc., which is needed there because cards appear/disappear — not the case here, since priority changes never add/remove a card from the current filtered view).

### API / Interface Contracts
No new REST calls — `priority` rides along on the existing `GET /conversations/` response. WS event schema per `docs/panel_api_reference.md` (`conversation.priority_updated`):
```json
{
  "event": "conversation.priority_updated",
  "data": { "conversation_id": "...", "priority": "alta", "updated_by": "bot" }
}
```

### Edge Cases & Error Handling
- `priority: null` → no badge, no layout gap (conditional render, not a fixed-width slot).
- `conversation.priority_updated` for a conversation not currently in the loaded/filtered list → `.map()` no-ops silently, nothing to patch.
- Unknown/unexpected priority string from backend → `PRIORITY_STYLES[priority]` would be `undefined`, producing an unstyled badge with the raw string as its label rather than crashing. Acceptable fallback; the four documented values are the only ones the bot emits.

## Open Questions for Implementation
None.

---

## Revision (2026-07-20): visibility narrowed, corner-overlay positioning

Supersedes the "Badge Component" section above. See `02-clarification.md` Q6–Q8 for the reasoning.

### Updated styles — solid background, two tiers only
```typescript
const PRIORITY_BADGE_STYLES: Record<'alta' | 'critica', string> = {
  alta:    'bg-[#FFB84D] text-[#1D1D1B]',
  critica: 'bg-[#FF5B5B] text-white',
}

const PRIORITY_BADGE_LABELS: Record<'alta' | 'critica', string> = {
  alta:    'Alta',
  critica: 'Crítica',
}
```
`baja`/`media` are dropped from the render-time maps entirely (no dead style entries) — the render condition itself excludes them, so there's nothing to look up for those values.

### Updated markup — absolute corner overlay, not part of the chip row
Removed from the top-left chip cluster (the badge no longer lives among the status/client-type/channel/"Asignada a ti" chips). Added as a sibling of `.space-y-2.5` and `.space-y-2.mt-4` inside the outer card `<div>` (which is already `relative`, so no new positioning context needed):

```tsx
{(conversation.priority === 'alta' || conversation.priority === 'critica') && (
  <span
    className={`absolute -top-2 -right-2 z-10 ${PRIORITY_BADGE_STYLES[conversation.priority]} text-[9px] font-black px-2 py-1 rounded uppercase tracking-wider shadow-md border border-[#252522]`}
  >
    {PRIORITY_BADGE_LABELS[conversation.priority]}
  </span>
)}
```
- `absolute -top-2 -right-2`: pins to the card's top-right corner, poking slightly outside the border — doesn't occupy flex/flow space, so it can't displace or compress the client name / last message / timestamp (constraint from the revised spec).
- `z-10`: renders above the in-flow right-cluster content (unread badge, elapsed time) and above the left cluster's chips if they ever wrap wide enough to approach that corner on a narrow card — this is the concrete answer to "coexist without overlapping."
- `border border-[#252522]`: matches the card's own background color, giving the badge a slight "cutout" edge against whatever sits behind it instead of blending flush.

### Data Flow, API contracts, edge cases
Unchanged from the original design — only the render condition and visual treatment changed. The WS-driven state patch in `BandejaPage.tsx` still runs for every priority value; `ConversationCard.tsx` simply chooses not to render anything for `baja`/`media`/`null`.

## Open Questions for Implementation
None.
