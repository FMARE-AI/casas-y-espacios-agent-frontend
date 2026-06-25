# Spec: Connect GET /conversations (TASK-3)

## Problem
The "Bandeja de Entrada" (Inbox) page currently uses mock data and filters conversations locally. The metrics and active limits are also hardcoded or estimated client-side. We need to connect the inbox tray to the real backend endpoints (`GET /api/v1/panel/conversations/`, `GET /api/v1/panel/advisors/me`, and `GET /api/v1/panel/metrics` for admin) so that the frontend accurately reflects the state of the backend database in real-time.

## Goals
1. Implement `conversationsService.list()` in `src/services/conversations.ts` to call `GET /api/v1/panel/conversations/`.
2. Connect `BandejaPage.tsx` to retrieve:
   - Advisor details on mount (`GET /api/v1/panel/advisors/me`) to know `active_conversations` and `max_conversations`.
   - Conversations using the real service with active filters (`status` and `channel`).
3. Correctly determine conversation card variants (A, A2, B, C) in `src/components/bandeja/ConversationCard.tsx` using `status`, `escalation`, and `wait_seconds`.
4. Render admin dashboard metrics using the actual `GET /api/v1/panel/metrics` API when the user is an admin.
5. Filter by `status=mine` by default for advisors.
6. Support proper query mapping for status and channel (including converting channel values to lowercase e.g. `administrativa`, `comercial`).
7. Ensure clean compilation via `npx tsc --noEmit`.

## Non-Goals
- Does not implement other actions in `conversationsService` (like `replyText`, `assign`, etc.), which are part of future tasks.
- Does not change the layout structure of the inbox tray itself, only connects it to real data.

## Constraints
- Do not filter conversations locally on the client; always re-request from the server when filters change.
- Follow Zustand Rules: read store values using fine selectors, and do not use the whole store object in effects/callbacks.
- Always use the `apiClient` instance (from `src/lib/axios.ts`) which automatically attaches the JWT auth token.
