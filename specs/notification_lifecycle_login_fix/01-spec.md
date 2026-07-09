# Spec: Notification Lifecycle / Login Fix (WS active without session)

## Root-cause investigation (read before anything else)

Investigated where `useWebSocket` is mounted and how the connection
lifecycle reacts to logout / token becoming null.

### Where `useWebSocket` is mounted

Confirmed via full-repo grep — `useWebSocket()` is called in exactly four
places, all of them inside the authenticated route tree:

- `src/components/layout/ProtectedRoute.tsx:20` (base connection, per the
  documented design)
- `src/pages/BandejaPage.tsx:390`
- `src/pages/ChatPage.tsx:516`
- `src/components/gestion/BehaviorAlertsPanel.tsx:125`

`App.tsx` renders `LoginPage` only inside `PublicRoute`, which never renders
`ProtectedRoute` or any of the above. **Hypothesis (a) — a rogue mount point
outside `ProtectedRoute` — is ruled out.** There is no code path that mounts
`useWebSocket` while `/login` is showing.

### Actual root cause: the connection `useEffect` never closes the socket when the token disappears

`src/hooks/useWebSocket.ts`, lines 452-473:

```ts
useEffect(() => {
  if (!accessToken) {
    setStatus('disconnected')
    return                       // <-- early return, socket is NOT closed here
  }

  // Socket already open for this token — nothing to do
  if (socket && connectedToken === accessToken) return

  // Token changed — tear down old socket and reconnect
  if (socket) {
    clearPing()
    clearReconnect()
    socket.close()
    socket = null
    connectedToken = null
    isConnecting = false
  }

  connect(accessToken)
}, [accessToken])
```

This effect has **no cleanup function at all** (no `return () => {...}`), and
the `if (!accessToken)` branch — which is exactly the branch that runs when
`clearSession()` sets `token: null` on logout — does not call `socket.close()`.
The teardown-and-reconnect logic only runs when `accessToken` transitions
from one truthy value to a *different* truthy value (line "Token changed").
A transition from truthy → falsy (logout) never reaches that branch.

**Consequence:** on logout, the previously open `WebSocket` (module-level
singleton `socket` in the same file) is left open and fully functional,
still authenticated with the now-invalidated access token. It keeps
receiving every event the backend pushes to it — including `escalation.new`
— for as long as the browser-side connection stays alive (until the server
closes it, e.g. on AT expiry, or a network drop triggers `onclose`).

The `escalation.new` handler reads `useAuthStore.getState().advisor?.role`
to decide whether to skip the sound for admins. After `clearSession()`,
`advisor` is `null`, so `advisor?.role === 'admin'` evaluates to `false` —
meaning the zombie socket will play the sound for **any** advisor's old
session, admin or not, while the user sits on `/login` with no visible
session.

### Hypothesis (b) — "ghost session" from incomplete storage cleanup

Checked `authStore.ts` `clearSession()` (lines 89-109): it removes
`REFRESH_TOKEN_KEY`, `EXPIRES_AT_KEY`, `REMEMBER_KEY`, and the legacy token
key from **both** `localStorage` and `sessionStorage`, and calls
`supabase.auth.signOut()`. This part is correct — **no persisted-storage
leak was found.** The zombie-socket bug is not caused by storage residue;
it is caused purely by the missing `socket.close()` in the in-memory
connection effect described above. Hypothesis (b) as originally framed
(storage-based ghost session) is **not confirmed**; the actual mechanism is
an in-memory (module-singleton) leak, not a storage leak.

### Hypothesis (c) — AudioContext singleton replaying a buffered sound

Not the mechanism here — `playNotificationSound()` (lines 367-404)
synthesizes tones on demand via `AudioContext.createOscillator()`; it does
not buffer or queue sounds. Each play is triggered fresh by a live
`ws.onmessage` event. Ruled out as the cause, though the singleton
`AudioContext` itself is not implicated in the bug.

### Security implication — confirmed, must be flagged explicitly

This **is** a security-relevant lifecycle bug, not just UX: after a user
calls "logout," the backend's WS channel for that access token remains
open and actively authenticated on the client. If the access token is
short-lived this is a narrow window, but the client explicitly signals
"end this session" via `clearSession()` and the running WS connection does
not honor that signal — it fails **open** (stays connected) instead of
failing **closed** (disconnecting immediately). Per the project's
`security-expert` posture, session-ending actions should deterministically
tear down all live authenticated channels, not rely on the channel timing
out on its own.

## Problem

Visiting `/login` (a public route, no session) can still produce an
`escalation.new` notification sound. The cause is not that the WebSocket
connects while on `/login` — it never does. The cause is that logging out
does not close the previously-open authenticated WebSocket connection, so
a stale, still-open, still-authenticated socket keeps delivering events
and playing sounds in the background regardless of which route is
currently rendered, including public ones.

## Goals

- Calling `clearSession()` (logout, or any other flow that nulls the
  access token) must deterministically close the live WebSocket connection
  as part of that same action — not rely on the connection effect's
  "token changed to a new truthy value" branch, which never fires for a
  truthy → null transition.
- No WebSocket connection should remain open, and no notification sound
  should be able to fire, once there is no authenticated session
  (`token === null` in `authStore`).
- This must hold for every path that nulls the token: manual logout
  (`signOut()`), `session-expired` event (401 from the API), and the
  `ADVISOR_INACTIVE` blocked-session flow.

## Non-Goals

- Changing the reconnect/backoff logic for a session that is still valid
  (network drop while logged in) — that logic is correct and out of scope.
- Changing where `useWebSocket` is mounted — the mount points are already
  correctly scoped to `ProtectedRoute` and its authenticated children.
- Auditing/fixing `authStore.clearSession()`'s storage cleanup — investigated
  and confirmed correct; no changes needed there.
- Server-side token revocation/blacklisting — out of scope for this
  frontend-only fix; the fix targets the client-side connection lifecycle.

## Expected Behavior

1. Advisor is logged in, WS connected, on `/` (Bandeja).
2. Advisor clicks "Cerrar sesión" (`signOut()` → `clearSession()` →
   `navigate('/login')`).
3. Immediately (synchronously with the logout action, not dependent on a
   future re-render with a different truthy token): the WebSocket
   connection is closed, `socket` singleton is nulled, ping/reconnect
   timers are cleared.
4. While on `/login`, no `escalation.new`, `message.new`, or any other WS
   event can be received or trigger a sound, because there is no open
   connection.
5. Logging back in opens a fresh connection with the new token, as it does
   today.
6. The same guarantee holds when session ends via `session-expired`
   (401) or `ADVISOR_INACTIVE`, not just manual logout.

## Constraints

- Fix must live in the WS connection lifecycle
  (`src/hooks/useWebSocket.ts`) and/or `authStore.clearSession()` — per
  project rule (§15, Regla 4) there must still be exactly one WebSocket
  singleton; the fix must not introduce a second connection path.
- Must not violate Regla 1-5 in `CLAUDE.md` §15 (no full store as a hook
  dependency, no store values written-and-depended-on in the same effect,
  `useAuth`'s empty deps array must stay untouched).
- Must not regress reconnect-with-backoff for genuine network drops while
  a session is still valid.

## Priority

High — flagged by the user as having a security implication (a
should-be-invalidated session token keeps authenticating a live channel).
Should be treated with the same "fail secure" rigor as other auth flows in
this project.
