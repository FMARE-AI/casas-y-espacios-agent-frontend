# Clarifications: Priority Badge en Bandeja

## Questions & Answers

**Q1: The ticket says "Depende del campo `priority` que debe agregar backend al schema y al payload de listado" — does backend actually still need to add it?**
A: No. `docs/panel_api_reference.md` already documents `priority` in the `GET /conversations/` list response (line 171: `"priority": "alta"`) and in two WebSocket payloads (`escalation.new`'s `conversation_priority`, `message.new`'s `conversation_priority`, and the dedicated `conversation.priority_updated` event). The ticket's assumption is outdated — the field is already part of the documented contract. The frontend type will still treat it as optional/nullable (`priority?: ConversationPriority | null`) so nothing breaks if the live payload hasn't caught up with the docs yet.

**Q2: Should this ticket include real-time sync via `conversation.priority_updated`, even though the ticket says "sin lógica de filtrado adicional"?**
A: Yes (user confirmed). Real-time sync is not filtering logic — it's freshness of the same badge. The API docs explicitly instruct implementers to use this event for exactly this purpose ("Client implementation note: use this event to update the inbox badge/sort order in real time"). Implemented via the same `useWebSocket.ts` central-handler + `BandejaPage.tsx`-reload pattern already used for `escalation.assigned`, `conversation.returned`, etc. — no new architecture, two extra files.

**Q3: What are the exact color mappings?**
A: Reusing the existing palette already established in `ConversationCard.tsx` / `BandejaPage.tsx` rather than inventing new colors:
- `baja` → gray (`#8B8FA8`, the codebase's existing neutral/muted tone — used for offline/closed states)
- `media` → blue (`#01A4E3`, the codebase's primary accent)
- `alta` → orange (`#FFB84D`, already used for "break"/at-limit warnings)
- `critica` → red (`#FF5B5B`, already used for escalated/urgent states)

**Q4: Where does the badge render on the card, and does it show for closed (`cerrada`) conversations too?**
A: In the existing top badge row of `ConversationCard.tsx` (alongside the status chip, client-type chip, channel chip, "Asignada a ti"). Shows for any status, including closed — priority is informational about the conversation's history, not tied to whether it's still open.

**Q5: Does the badge need a filter/sort scaffold left in place for the future task?**
A: No — per the ticket's explicit non-goal, no `FilterBar.tsx` changes, no sort-order changes. Confirmed no existing priority scaffolding in `FilterBar.tsx` already.

## Open Decisions
None. All requirements resolved.

---

## Revision (2026-07-20)

**Q6: Client says the badge should only show for `alta`/`critica` — does the underlying `priority` type/data model need to change too?**
A: No. `Conversation.priority` stays `ConversationPriority | null` with all four values, and `handleConversationPriorityUpdated` in `BandejaPage.tsx` keeps patching local state for *any* incoming value (including `baja`/`media`). Only `ConversationCard.tsx`'s render condition changes to `priority === 'alta' || priority === 'critica'`. Reasoning: a future filter-by-priority task will want the real value on every card, not just the two currently displayed — narrowing the data model now would mean redoing this later.

**Q7: Exact positioning and the "don't overlap with 'Asignada a ti'" constraint — the ticket leaves this to be defined at implementation time. What's the actual collision risk, and how is it resolved?**
A: Checked the current card layout (`ConversationCard.tsx`) before deciding. The top header row is `flex justify-between`: a **left** cluster (status chip, client-type chip, channel chip, and — only for the assigned advisor — "Asignada a ti"), and a **right** cluster (unread-count bubble + elapsed-time text, both in normal document flow, inset by the card's `p-4` padding). "Asignada a ti" itself sits on the *left*, so it has no natural collision with a right-corner badge — the real collision risk is with the right cluster's own content (unread badge / elapsed time), which the ticket didn't explicitly name but is the actual thing occupying that corner today.

Resolution: render the priority badge as an `absolute`-positioned overlay pinned to `-top-2 -right-2` on the card's outer `relative` container — i.e. poking slightly *outside* the card's border, above and to the right of the in-flow right-cluster content (which starts inset at `padding-top: 1rem`). This keeps it structurally separate from both clusters (doesn't participate in the flex layout, so it can't displace/compress anything), gives it `z-10` so it renders above any content that ever wraps close to that corner (long chip rows on narrow cards, "Asignada a ti" included), and a `shadow-md` + border matching the card's border color for a visually distinct "flag" look instead of blending into whatever's directly behind it.

**Q8: Should `alta`/`critica` badges use the same subtle `/15`-opacity chip style as the original design, or something more prominent?**
A: More prominent — solid background instead of the `/15`-opacity treatment used for the other chips. The whole point of narrowing visibility to two tiers is to make the badge command attention when it does appear (client: "el objetivo... es llamar la atención exactamente cuando importa"). Subtle styling would undercut that. `alta` uses solid `#FFB84D` with dark text (`#1D1D1B`) for contrast — white-on-orange reads poorly; `critica` uses solid `#FF5B5B` with white text, matching the existing "CRÍTICO" A2 status chip already in this file for the same red.
