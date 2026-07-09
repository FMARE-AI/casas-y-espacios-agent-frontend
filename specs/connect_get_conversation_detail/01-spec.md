# Spec: Connect GET /conversations/{id} (TASK-4)

## Problem
Currently, the chat interface is disconnected from the backend API. The pages and components (like `ChatPage.tsx`, `MessageBubble.tsx`, and `MessageFeed.tsx`) either use mock logic, throw "NOT IMPLEMENTED" errors, or do not accurately display the dynamic states (variants) and message types. We need to integrate the client-side chat view with the backend's conversation details and paginated message history.

## Goals
1. Implement `conversationsService.getById(id)` in `src/services/conversations.ts` to fetch conversation detail, client info, and the first 50 messages using `GET /api/v1/panel/conversations/{id}?limit=50&offset=0`.
2. Implement `conversationsService.getMessages(id, params)` to support pulling older messages during infinite scrolling using `GET /api/v1/panel/conversations/{id}/messages`.
3. Add `transcription: string | null` to the `Message` type in `src/types/index.ts`.
4. Determine the chat variant (`assigned`, `unassigned`, `bot`, `monitoring`) accurately according to `bot_activo`, `escalation` info, and advisor role.
5. Render messages properly based on `msg_type` and `direction` as defined in `docs/panel_api_reference.md`:
   - `text`: Plain text bubble.
   - `audio`: Audio player using `media_url`. Must NOT display transcription as message content. Optionally show a collapsible transcript toggle hidden by default.
   - `image`: Display `<img src={media_url} />`.
   - `video`: Display `<video src={media_url} controls />`.
   - `document`: Download link pointing to `media_url`.
6. Implement infinite scroll upward when scrolling to the top of the message feed, prepending older messages while preserving scroll position.
7. Ensure `npx tsc --noEmit` compiles without any errors.

## Non-Goals
- Changing message send/reply APIs (`replyText`, `replyMedia`, `replyAudio`), which are reserved for a future task (TASK-6).
- Changing assignments or handover triggers (`assign`, `returnToBot`, `close`), which are reserved for another task (TASK-5).

## Constraints
- Use the central `apiClient` which handles auth tokens.
- Follow Zustand store guidelines (granular selectors).
- Do NOT display audio transcription as the main text content of the message.
- Always use the provided `media_url` (which is a signed Supabase URL valid for 1 year) directly for rendering image/audio/video/document tags.
