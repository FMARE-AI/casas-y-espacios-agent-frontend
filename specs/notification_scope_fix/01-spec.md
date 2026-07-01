# Spec: Notification Scope Fix (escalation.new sound)

## Root-cause investigation (read before anything else)

Investigated `src/hooks/useWebSocket.ts`, the `escalation.new` case of the
`ws.onmessage` switch (lines 234-253):

```ts
case 'escalation.new': {
  const escData = data as WSEscalationNew
  // Admin never sounds. Asesor always sounds — new escalation is actionable work.
  const isAdminOnEscalation = useAuthStore.getState().advisor?.role === 'admin'
  if (!isAdminOnEscalation) {
    playNotificationSound()
  }
  ...
}
```

Findings:

1. **The "admin never sounds" rule IS present and correct for `escalation.new`.**
   It uses the same `advisor?.role === 'admin'` check as `message.new`
   (line 205 of the same file). There is **no** inconsistency between the two
   event handlers on this specific point — the admin exclusion already works
   for both events today. This rules out one of the two hypotheses the user
   asked to check.

2. **There is no area/channel filter at all for `escalation.new`.** Unlike
   `message.new`, which gates the sound on `isMyConversation` (chat open OR
   conversation in `myAssignedConversationIds`, see lines 198-212), the
   `escalation.new` handler plays the sound for **every non-admin advisor
   connected to the socket**, regardless of:
   - the advisor's `area` (`administrativa` | `comercial` | `ambas`) vs. the
     escalation's `channel`
   - the advisor's capacity (`active_conversations` vs `max_conversations`)
   - the advisor's `availability_status`

   This is a bug of **absence of a filter**, not a bug of incorrect filter
   logic — there is no code path evaluating area/channel/capacity before
   calling `playNotificationSound()` in this branch.

3. Relevant types confirmed in `src/types/index.ts`:
   - `Advisor.area: 'administrativa' | 'comercial' | 'ambas'`
   - `Advisor.max_conversations` / `Advisor.active_conversations`
   - `Advisor.availability_status: 'available' | 'break' | 'offline'`
   - `WSEscalationNew: { conversation_id, advisor_id: string | null, reason, channel: string }`

4. No existing frontend helper compares `Advisor.area` against a
   conversation's `channel` (checked `BandejaPage.tsx` — channel filtering
   there is a UI filter dropdown, not an area-membership check). This
   comparison needs to be introduced from scratch.

## Problem

When a new escalation (`escalation.new`) arrives over the WebSocket, **every**
connected non-admin advisor hears the notification sound, even if the
escalation has nothing to do with them — wrong area, no capacity to take it,
or already assigned to a different advisor. This trains advisors to ignore
the sound (alert fatigue) and makes it useless as a "this needs you" signal.

## Goals

- The `escalation.new` sound should only play for advisors who could
  plausibly act on that escalation:
  - Advisor's `area` matches the escalation's `channel`, or advisor's
    `area === 'ambas'`.
  - Advisor has capacity to take a new conversation
    (`active_conversations < max_conversations`).
- Admins must never hear this sound, under any circumstance — this rule
  already works and must be preserved exactly as-is.
- The existing `EscalationToast` / `setPendingEscalation` behavior (visual
  toast) is out of scope for this fix unless the clarification phase
  determines it shares the same bug.

## Non-Goals

- Changing backend behavior — the fix is scoped to the frontend
  `escalation.new` handler in `useWebSocket.ts`. The backend already sends
  `channel` on every `escalation.new` event; no new backend field is assumed
  necessary unless clarification reveals otherwise.
- Reworking the `message.new` sound-gating logic (`isMyConversation`) —
  it is already correct and serves as the reference pattern.
- Changing how the visual toast decides what to display — only the sound
  trigger is addressed here, unless clarification says otherwise.

## Expected Behavior

Given advisor X with `area = 'administrativa'`, `max_conversations = 3`,
`active_conversations = 3` (at capacity):
- An `escalation.new` event with `channel = 'administrativa'` arrives →
  sound does NOT play (no capacity).

Given advisor Y with `area = 'comercial'`, `active_conversations = 1`,
`max_conversations = 3`:
- An `escalation.new` event with `channel = 'administrativa'` arrives →
  sound does NOT play (wrong area).
- An `escalation.new` event with `channel = 'comercial'` arrives →
  sound plays.

Given advisor Z with `area = 'ambas'`, capacity available:
- Any `channel` value → sound plays.

Given any advisor with `role = 'admin'`:
- Sound never plays for `escalation.new`, regardless of area/channel/capacity.

## Constraints

- Must reuse `useAuthStore.getState().advisor` (already used for the admin
  check) — no new store fields required unless clarification says otherwise.
- Must not regress the `message.new` sound path, `EscalationToast` display,
  or `BandejaPage` conversation list.
- Follows project rule: no comments needed beyond documenting non-obvious
  WHY, consistent with `CLAUDE.md` §9.

## Priority

High — this is a trust/usability bug (advisors get trained to ignore an
important sound) but not a security issue.
