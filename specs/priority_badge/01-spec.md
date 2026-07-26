# Spec: Priority Badge en Bandeja

## Problem
Advisors currently have no way to see, at a glance in the inbox, which conversations are more urgent than others. Every conversation card looks the same regardless of the client's tone/urgency, so an advisor has to open each chat to know if it deserves attention sooner.

## Goals
- Show a visual priority badge (baja/media/alta/crítica) on each conversation card in the inbox.
- Use color coding to make urgency scannable at a glance: gray (baja), blue (media), orange (alta), red (crítica).
- Keep the badge in sync in real time when the bot raises a conversation's priority while the advisor is looking at the inbox.

## Non-Goals
- Filtering or sorting the inbox by priority — explicitly deferred to a future task once the client defines the criteria.
- Any UI for manually setting/changing priority — per the API reference, priority is set exclusively by the bot (`evaluate_priority` node); there is no endpoint or panel action to change it.
- Showing/syncing priority anywhere outside the inbox cards (e.g. the chat page header) — out of scope for this ticket.

## Expected Behavior

### 1. Badge Rendering
Each `ConversationCard` shows a small colored badge for `conversation.priority`, alongside the existing status/channel/client-type chips:
- `baja` → gray
- `media` → blue
- `alta` → orange
- `critica` → red

### 2. Null Handling
If `conversation.priority` is `null`, no badge is rendered for that card — the rest of the card layout is unaffected (no gap, no broken alignment).

### 3. Real-Time Sync
Per `docs/panel_api_reference.md`, the backend already documents a `conversation.priority_updated` WebSocket event ("Client implementation note: use this event to update the inbox badge/sort order in real time"), broadcast to **all connected advisors** whenever the bot raises a conversation's priority. The inbox should consume this event so an already-open bandeja reflects a priority bump without requiring a manual refresh.

## Constraints
- `priority` field already exists in the documented `GET /conversations/` response schema (`docs/panel_api_reference.md` line 171) — this is not a "backend needs to add it" situation like the ticket assumed; it is presumably already available. Confirm ambiguity in clarification.
- Valid values are `baja` / `media` / `alta` / `critica` (no accent on `critica` per the documented WS payloads) — match these exact string keys when reading the field; accented labels are fine for the on-screen text.
- Priority only ever increases — no need to design for a "downgrade" case.
- No filtering logic, no FilterBar changes.

## Priority
Medium — visibility improvement for advisor triage, not a blocking gap.

---

## Revision (2026-07-20): scope narrowed to alta/crítica only

The client refined the requirement after seeing the first version. Superseding Goals §2 and Expected Behavior §1 above:

### Updated Goals
- Show the badge **only** for `alta` and `critica` — `baja`/`media` render nothing. Rationale (client's own words): ~80% of conversations run normally, and a badge on every card (even a muted gray one) trains advisors to ignore it. The badge should interrupt only when it's actually actionable.
- Badge sits in the **top-right corner of the card** as a corner overlay, without displacing or compressing existing content (client name, last message, timestamp).
- Must not visually collide with other card badges (explicitly named: "Asignada a ti") — z-index and spacing to be decided at implementation time (client's phrasing explicitly delegates this).
- Real-time sync requirement unchanged: `conversation.priority_updated` still patches the card's `priority` in local state with no refetch, no page reload.

### Still true from the original spec
- Non-goals unchanged (no filtering, no manual priority UI, no chat-page sync).
- `priority` can still be `baja`/`media`/`null` in the data — the type and the WS handler keep tracking all four/null values. Only the *render* condition in `ConversationCard.tsx` changes. This matters if a future filter task needs the real value even when today's UI doesn't display it.
- Color mapping for the two now-visible tiers carries over from the original spec: orange (`alta`), red (`critica`).
