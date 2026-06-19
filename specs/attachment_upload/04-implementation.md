# Implementation Plan: Attachment Upload

## Tasks

- [x] **Task 1**: Refactor state variables, types configuration (`FILE_TYPES`), and support custom string messages inside the error banner in [ChatInput.tsx](file:///C:/Users/Antho/Downloads/casas-y-espacios-agent-frontend/src/components/chat/ChatInput.tsx).
- [x] **Task 2**: Implement dropdown events (closing on escape/outside click), file picker activations, type check, size validation, and file previews.
- [x] **Task 3**: Integrate `replyMedia` inside `handleSend()` and apply UI disabling rules.
- [x] **Task 4**: Verify compile correctness with `npx tsc --noEmit`.

## Execution Log

### Task 1 — Setup Types & State Refactoring
Status: ✅ Completed
Notes: Removed old FileCategory states and introduced FILE_TYPES config and formatFileSize / getFileLabel / getFileType.

### Task 2 — Implement File Validation & Escape Listeners
Status: ✅ Completed
Notes: Outside click and escape key triggers closure of dropdown. File picked gets validated for limits (Image: 5MB, Document: 20MB, Video: 16MB).

### Task 3 — Integrate upload and UI Disabling
Status: ✅ Completed
Notes: Integrated replyMedia and sendTextMessage under handleSend. Bound textarea, attach button, and send button state rules.

### Task 4 — Verification
Status: ✅ Completed
Notes: Verified using npx tsc check and ensured compilation passes.

