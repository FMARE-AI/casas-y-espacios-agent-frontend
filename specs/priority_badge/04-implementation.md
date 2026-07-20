# Implementation Plan: Priority Badge en Bandeja

## Tasks

- [x] **Task 1**: Update Types — `src/types/index.ts`
- [x] **Task 2**: Render Badge — `src/components/bandeja/ConversationCard.tsx`
- [x] **Task 3**: Update WebSocket Hook — `src/hooks/useWebSocket.ts`
- [x] **Task 4**: Register Handler in `BandejaPage.tsx`

## Execution Log

### Task 1 — Update Types
Status: ✅ Done
Notes: Added `ConversationPriority = 'baja' | 'media' | 'alta' | 'critica'`, `priority: ConversationPriority | null` on `Conversation`, and `WSConversationPriorityUpdated` (`conversation_id`, `priority`, `updated_by: 'bot'`) per the documented WS payload.

### Task 2 — Render Badge
Status: ✅ Done
Notes: Added `PRIORITY_STYLES`/`PRIORITY_LABELS` maps to `ConversationCard.tsx`, reusing the existing palette (gray `#8B8FA8` / blue `#01A4E3` / orange `#FFB84D` / red `#FF5B5B`) already used elsewhere in the card for other states. Badge rendered conditionally in the existing top chip row using the same chip classes as the status/client-type/channel chips — `null` priority renders nothing, no layout gap.

### Task 3 — Update WebSocket Hook
Status: ✅ Done
Notes: Added `onConversationPriorityUpdated` to `WSHandlers`, registered/cleaned up in the hook's effect (same pattern as the other handlers), and added the `conversation.priority_updated` switch case that forwards to the registered handler.

### Task 4 — Register Handler in BandejaPage
Status: ✅ Done
Notes: `handleConversationPriorityUpdated` does a targeted `setConversations` map patch on the matching card's `priority` field — no full reload, since a priority bump never adds/removes a card from the current filtered view (same reasoning `handleMessageNew` already uses for `last_message`/`unread_count`, as opposed to the full-reload pattern used for events that change list membership).

## Verification
`tsc -b`, `eslint` (all 4 touched files), `vitest run` (41/41 passing, no regressions), and `vite build` — all clean. The `priority` field added to `Conversation` is non-optional but caused no compile errors, so no other code constructs a bare `Conversation` object that would need updating.

**Not yet exercisable end-to-end:** whether the live backend actually returns `priority` on `GET /conversations/` and emits `conversation.priority_updated` can't be confirmed from this environment — verify against a real payload once available. If the field is genuinely absent from a live response, the `priority: null` fallback path (no badge) is exactly what handles that gracefully.

## Revision (2026-07-20): visibility narrowed to alta/crítica, corner positioning

Client refined the requirement after the first pass — see `01-spec.md` and `03-design.md` Revision sections for the full reasoning (visual fatigue from showing every tier; corner-overlay layout instead of inline chip).

- [x] **Task 5**: Rework badge in `ConversationCard.tsx` — restrict to `alta`/`critica`, reposition as absolute top-right corner overlay, switch to solid-background styling.

### Task 5 — Rework Badge
Status: ✅ Done
Notes: Removed the badge from the top-left chip cluster. Replaced `PRIORITY_STYLES`/`PRIORITY_LABELS` (all 4 tiers, `/15`-opacity) with `PRIORITY_BADGE_STYLES`/`PRIORITY_BADGE_LABELS` (2 tiers only, solid background — `alta`: `#FFB84D` bg / `#1D1D1B` text, `critica`: `#FF5B5B` bg / white text). Badge is now `absolute -top-2 -right-2 z-10` on the card's outer container, with a `border-[#252522]` matching the card background for a cutout edge, and `shadow-md` for corner lift. `baja`/`media`/`null` render nothing — same as before, just a stricter condition. `Conversation.priority` and the WS patch handler in `BandejaPage.tsx` are untouched: they still track all 4 values + null, only the render condition changed.
