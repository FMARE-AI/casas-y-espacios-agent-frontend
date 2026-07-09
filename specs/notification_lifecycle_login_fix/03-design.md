# Design: Notification Lifecycle / Login Fix (WS active without session)

## Overview

The connection lifecycle in `src/hooks/useWebSocket.ts` needs two coordinated
changes to fail closed when a session ends: (1) the connection `useEffect`
must actively close the module-singleton socket when there is no valid
session (`accessToken` falsy, or `sessionExpired === true`), not just stop
opening new ones; and (2) `ws.onclose` must stop scheduling an automatic
reconnect when the close was caused by an intentional session end, otherwise
the socket the effect just closed reopens itself seconds later via the
existing backoff/reconnect path. Both changes live in the same file — no
changes to `authStore.ts` are needed (per the Fase 2 decision to keep the
fix self-contained in the hook module, respecting Regla 4 of `CLAUDE.md` §15).

## Components

### New / Modified Files

| File | Role | Change type |
|------|------|-------------|
| `src/hooks/useWebSocket.ts` | Add `closeSocket()` teardown helper; make the connection effect session-aware (`accessToken` + `sessionExpired`); guard `ws.onclose` against reconnecting after an intentional session end; guard `reconnect()` the same way | Modify |

### Key Abstractions

**`closeSocket(): void`** — module-level helper, extracted from the
teardown block that already exists inline in the connection effect
(`clearPing(); clearReconnect(); socket?.close(); socket = null; connectedToken = null; isConnecting = false`).
Used by both branches of the connection effect (falsy-session branch and
token-changed branch) so there is exactly one place that closes the socket
— avoids duplicating teardown logic, per the note in `02-clarification.md`.

### Data Flow

**A. Connection effect (`useEffect`, `[accessToken, sessionExpired]`)**

```
sessionExpired = useAuthStore(s => s.sessionExpired)   // new fine-grained selector

if (!accessToken || sessionExpired) {
  setStatus('disconnected')
  closeSocket()
  return
}
if (socket && connectedToken === accessToken) return   // already connected, nothing to do
closeSocket()          // tear down any stale socket before opening a new one
connect(accessToken)
```

This effect only *reads* `sessionExpired` — it never writes to it, so this
does not violate Regla 2 of `CLAUDE.md` §15 (no loop risk: the value that
changes on each run, `sessionExpired`, is not set from inside this effect).

Covers every path that ends a session:
- Manual logout (`signOut()` → `clearSession()` → `accessToken` becomes `null` synchronously) → closes immediately.
- 401 / `session-expired` (axios interceptor calls `clearSession()` synchronously before dispatching the event) → `accessToken` already `null` → closes immediately.
- `ADVISOR_INACTIVE` (403) → `accessToken` stays non-null, but `sessionExpired` flips to `true` → closes immediately per the Q2 decision (fail-secure: socket must not stay open just because the blocking modal is up).

**B. `ws.onclose` — stop auto-reconnecting after an intentional session end**

Today, `onclose` unconditionally sets status to `reconnecting` and schedules
a retry (subject only to `event.code === 4001` and presence of
`refresh_token`). Problem: calling `socket.close()` from the connection
effect above still triggers this same real `onclose` handler asynchronously
a moment later. Without a guard, that handler would see a still-present
`refresh_token` (true for the `ADVISOR_INACTIVE` case, where the token is
intentionally kept until the user confirms) and reschedule a reconnect —
silently undoing the fix within one backoff cycle.

Fix: reorder the checks so the "should we retry" decision happens **before**
any status is set to `reconnecting`:

```
ws.onclose = (event) => {
  clearPing()
  isConnecting = false
  socket = null
  connectedToken = null

  if (event.code === 4001) {
    useWSStore.getState().setStatus('disconnected')
    useAuthStore.getState().setSessionExpired(true)
    return
  }

  const { refresh_token, sessionExpired } = useAuthStore.getState()
  if (!refresh_token || sessionExpired) {
    // Session intentionally ended (logout, or blocked pending confirmation) — do not reconnect.
    useWSStore.getState().setStatus('disconnected')
    return
  }

  useWSStore.getState().setStatus('reconnecting')
  // ...unchanged backoff + setTimeout(getValidToken().then(connect)) logic
}
```

Genuine network drops are unaffected: in that case `refresh_token` is
present and `sessionExpired` is `false`, so the existing reconnect path runs
exactly as it does today.

**C. `reconnect()` (manual "Reconectar" button in `WSStatusBanner`)**

Defense in depth for the theoretical case where the banner is reachable
while `sessionExpired` is `true` (in practice the blocking modal covers the
whole screen, but the banner is a separate DOM node not nested inside the
modal): add `if (useAuthStore.getState().sessionExpired) return` as the
first line, so a stray click can't force a connection open during a blocked
session.

### API / Interface Contracts

No public signatures change. `closeSocket()` is internal to
`useWebSocket.ts` (not exported). The `useWebSocket()` hook's returned
`{ reconnect, subscribeConversation, unsubscribeConversation }` shape is
unchanged.

### Edge Cases & Error Handling

- Logout while a reconnect backoff timer is already pending (e.g. user logs
  out during a network drop, mid-`reconnectTimeout`) → `closeSocket()` calls
  `clearReconnect()`, canceling the pending timer, so no stale reconnect
  fires after logout.
- `ADVISOR_INACTIVE` fires while the socket is already mid-reconnect
  (`isConnecting === true`, `socket === null`) → the connection effect still
  runs (`sessionExpired` becomes `true`), calls `closeSocket()` which is a
  no-op on the null socket but still clears the pending reconnect timeout —
  preventing the in-flight `connect()` call from completing into a live
  authenticated socket after the block.
- Re-login after `ADVISOR_INACTIVE` is resolved by an admin: user confirms
  the modal → `clearSession()` sets `sessionExpired: false` and `token: null`
  → user logs in again with a fresh `accessToken` → effect fires (`accessToken`
  changed) → normal `connect()` path, unaffected by this change.
- `event.code === 4001` (invalid/expired JWT from the server's perspective)
  keeps its existing dedicated branch — unaffected by the new guard, still
  sets `sessionExpired = true` (which will also be picked up by the
  connection effect if it re-runs, but the code is already fully torn down
  by this point).

## Open Questions for Implementation

None — all ambiguities resolved in `02-clarification.md`; the `onclose`
race identified during design has a concrete fix folded into this document.
