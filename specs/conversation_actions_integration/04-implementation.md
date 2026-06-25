# Implementation Plan: Conversation Actions Integration

## Tasks

- [x] **Task 1**: Implementar `assign()`, `returnToBot()`, `close()` en `conversationsService` — `src/services/conversations.ts`
- [x] **Task 2**: Agregar helpers de error y extender los tres handlers en `ChatPage` — `src/pages/ChatPage.tsx`
- [x] **Task 3**: TypeScript check — `npx tsc --noEmit`

## Execution Log

### Task 1 — conversationsService HTTP stubs
Status: ✅ Done
Notes: Tipos AssignResponse/ReturnToBotResponse/CloseResponse añadidos. Tres stubs reemplazados por llamadas Axios reales.

### Task 2 — ChatPage error handling
Status: ✅ Done
Notes: Helpers extractErrorCode/extractErrorMessage/getGlobalErrorMessage añadidos. handleTake corregido (MAX_CONVERSATIONS_REACHED usa msg del backend, añadido CONVERSATION_NOT_ESCALATED). handleReturnBot cierra modal en éxito y error, maneja BOT_ALREADY_ACTIVE. handleClose maneja ALREADY_CLOSED sin navegar.

### Task 3 — TypeScript check
Status: ✅ Done
Notes: npx tsc --noEmit sin errores.
