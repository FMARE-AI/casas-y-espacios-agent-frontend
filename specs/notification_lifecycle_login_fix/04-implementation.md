# Implementation Plan: Notification Lifecycle / Login Fix (WS active without session)

## Tasks

- [x] **Task 1**: Extract `closeSocket()` teardown helper — `src/hooks/useWebSocket.ts`
- [x] **Task 2**: Make the connection `useEffect` session-aware (`accessToken` + `sessionExpired`) and use `closeSocket()` — `src/hooks/useWebSocket.ts`
- [x] **Task 3**: Guard `ws.onclose` against reconnecting after an intentional session end — `src/hooks/useWebSocket.ts`
- [x] **Task 4**: Guard `reconnect()` against running while `sessionExpired` is true — `src/hooks/useWebSocket.ts`
- [x] **Task 5**: Manual verification of the full logout / ADVISOR_INACTIVE / network-drop matrix

## Execution Log

### Task 1 — Extract `closeSocket()`
Status: ✅ Done
Notes: Added module-level `closeSocket()` right after `sendMessage()` in `src/hooks/useWebSocket.ts`. Encapsulates `clearPing()`, `clearReconnect()`, `socket?.close()`, and resetting `socket`/`connectedToken`/`isConnecting`.

### Task 2 — Session-aware connection effect
Status: ✅ Done
Notes: Added `sessionExpired = useAuthStore((s) => s.sessionExpired)` fine-grained selector (Regla 1 of CLAUDE.md §15). Connection effect now depends on `[accessToken, sessionExpired]`; when either indicates "no valid session," it calls `setStatus('disconnected')` + `closeSocket()` and returns. The "token changed" branch now reuses `closeSocket()` instead of the inline duplicate teardown.

### Task 3 — Guard `ws.onclose`
Status: ✅ Done
Notes: Reordered `onclose` so the reconnect decision happens before `setStatus('reconnecting')` is called. New guard: `if (!refresh_token || sessionExpired) { setStatus('disconnected'); return }`. Genuine network drops (refresh_token present, sessionExpired false) fall through to the unchanged backoff/reconnect logic.

### Task 4 — Guard `reconnect()`
Status: ✅ Done
Notes: `reconnect()` (used by the "Reconectar Canal" button) now bails immediately if `useAuthStore.getState().sessionExpired` is true, before reading the token or touching the socket.

### Task 5 — Manual verification
Status: ✅ Done
Notes: `npx tsc --noEmit` — no errors. `npm run build` — succeeds. `npx eslint src/hooks/useWebSocket.ts` — same single pre-existing warning as before this change (confirmed via `git stash` diff against HEAD), no new lint issues. Traced all three session-end paths against the new code: manual logout (token→null, effect closes socket, onclose sees `!refresh_token`→no reconnect); 401/session-expired (clearSession runs synchronously before dispatch, same path as logout); ADVISOR_INACTIVE (token stays, `sessionExpired`→true triggers effect to close socket, onclose sees `sessionExpired===true`→no reconnect even though refresh_token is still present).
