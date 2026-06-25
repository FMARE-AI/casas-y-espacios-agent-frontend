# Implementation Plan: Connect GET /conversations/{id} (TASK-4)

## Task List

- [x] **Task 1: Add types**
  - Add `transcription?: string | null` to the `Message` type in `src/types/index.ts`.
- [x] **Task 2: Implement service endpoints**
  - Complete the implementation of `conversationsService.getById` and `conversationsService.getMessages` in `src/services/conversations.ts`.
- [x] **Task 3: Refine ChatPage.tsx variant and scroll logic**
  - Update `getChatVariant` in `src/pages/ChatPage.tsx` according to specifications.
  - Implement scroll height capture and restoration in `loadMoreMessages`.
- [x] **Task 4: Update MessageBubble.tsx rendering**
  - Refine `AudioBubble` to render audio player using `media_url`.
  - Add a collapsible disclosure section or button to view transcription. Do NOT show transcription in standard text bubble content.
  - Refine `ImageBubble`, `VideoBubble`, and `DocumentBubble` to render tags correctly using `media_url`.
- [x] **Task 5: Compile check**
  - Run `npx tsc --noEmit` and fix any TypeScript compiler errors.

## Log of Execution
- **2026-06-25:** Added `transcription` to `Message` type definition in `src/types/index.ts`.
- **2026-06-25:** Implemented `getById` and `getMessages` in `src/services/conversations.ts` using `apiClient`.
- **2026-06-25:** Updated scroll layout transition logic inside `ChatPage.tsx`'s `loadMoreMessages` to properly compute scrollHeight height offsets.
- **2026-06-25:** Overhauled `AudioBubble` in `MessageBubble.tsx` to display standard audio elements and hide Whisper audio note transcriptions inside a premium, native `<details>` toggle.
- **2026-06-25:** Verified project compiles cleanly under `npx tsc --noEmit`.
