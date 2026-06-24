# Design: Auth Integration

## Overview

The current auth layer uses a mock bypass (hardcoded credentials, fake session) that makes every real API call fail. This design replaces it with the real flow: Supabase Auth issues the JWT → `GET /advisors/me` loads the full profile → `authStore` becomes the single source of truth. The Axios interceptor is also updated to read the token synchronously from the store instead of async from Supabase. No new components, no routing changes — only the data layer connecting.

---

## Components

### New / Modified Files

| File | Role | Change type |
|------|------|-------------|
| `src/types/index.ts` | Add `must_change_password: boolean` to `Advisor` | Modify |
| `src/store/authStore.ts` | Add `error: string \| null` + `setError` | Modify |
| `src/lib/axios.ts` | Sync interceptor reads token from `authStore.getState()` | Modify |
| `src/services/advisors.ts` | Add `must_change_password?: boolean` to `updateMe` payload | Modify |
| `src/hooks/useAuth.ts` | Full rewrite: remove mocks, wire real sign-in + profile load | Modify |
| `src/pages/FirstLoginPage.tsx` | Add `PATCH /advisors/me` after password change | Modify |

---

## Key Abstractions

### `authStore` additions

New fields:
- `error: string | null` — login error message (not a session error — that's `sessionExpired`).

New methods:
- `setError(message: string | null): void` — sets the `error` field.

`reset()` must clear `error` as well.

### `signIn(email, password)` in `useAuth.ts`

The core function. Replaces the current mock + real `signIn`. Responsibilities:
1. Set `isLoading(true)`, clear `error`.
2. Call `supabase.auth.signInWithPassword`.
3. On Supabase error → `setError(error.message)`, return.
4. Set session in store (`setSession(data.session)`) — **before** calling `getMe()`.
5. Call `advisorsService.getMe()`.
6. On 403 `ADVISOR_INACTIVE` → `supabase.auth.signOut()`, `setError('Tu cuenta está desactivada. Contacta a un administrador.')`, return.
7. On other `getMe()` errors → `supabase.auth.signOut()`, `setError(error.message)`, return.
8. `setAdvisor(advisor)`.
9. If `advisor.must_change_password` → `setFirstLogin(true)`, `navigate('/first-login')`.
10. Else → `navigate('/')`.
11. `finally`: `setLoading(false)`.

### `useEffect` in `useAuth.ts` (session restoration + auth events)

Runs once on mount (`deps: []`).

**Step A — Page refresh restoration:**
- Call `supabase.auth.getSession()`.
- If `session` exists: `setSession(session)`, call `getMe()`.
  - On success: `setAdvisor`, check `must_change_password`.
  - On any failure: call `supabase.auth.signOut()` (triggers SIGNED_OUT → redirect to login).
- `setLoading(false)` always in `finally`.

**Step B — Ongoing auth events (`onAuthStateChange`):**
- `TOKEN_REFRESHED`: `setSession(session)`.
- `SIGNED_OUT`: `reset()` + `navigate('/login')`.
- `SIGNED_IN`: **ignored** — handled by `signIn()` directly; handling it here would double-call `getMe()`.
- Other events: ignored.

**Step C — Session-expired listener:**
- `window.addEventListener('session-expired', ...)` → `setSessionExpired(true)`.

### Axios interceptor (sync token read)

Replace async `supabase.auth.getSession()` with synchronous `useAuthStore.getState().session?.access_token`.

```ts
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().session?.access_token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

The interceptor is now synchronous — no async overhead on every request. This works because `setSession` is always called before any API call that needs auth:
- During `signIn`: `setSession` → then `getMe()`.
- During page refresh: `setSession` → then `getMe()`.
- During token refresh: `TOKEN_REFRESHED` → `setSession` → next request reads new token.

### `advisorsService.updateMe` extension

Add `must_change_password?: boolean` to the payload type. No other changes to this file.

### `FirstLoginPage.tsx` changes

In `onSubmit`, after `supabase.auth.updateUser({ password })` succeeds:
1. Call `advisorsService.updateMe({ must_change_password: false })`.
2. On success: `authStore.setAdvisor({ ...advisor, must_change_password: false })`, `authStore.setFirstLogin(false)`, `navigate('/')`.
3. On error: re-throw so `react-hook-form`'s error handling shows it.

---

## Data Flow

### Normal login

```
LoginPage → signIn(email, pwd)
  → supabase.auth.signInWithPassword            [Supabase Auth]
  ← { data: { session }, error }
  → authStore.setSession(session)               [store: token available]
  → advisorsService.getMe()                     [FastAPI — /advisors/me]
    → Axios interceptor reads token from store  [sync, no async]
  ← { advisor }
  → authStore.setAdvisor(advisor)
  → navigate('/')
  ← ProtectedRoute renders panel
```

### First login

```
... same as above up to setAdvisor ...
  advisor.must_change_password = true
  → authStore.setFirstLogin(true)
  → navigate('/first-login')
  ← FirstLoginRoute renders FirstLoginPage

FirstLoginPage.onSubmit(newPassword)
  → supabase.auth.updateUser({ password: newPassword })  [Supabase Auth]
  → advisorsService.updateMe({ must_change_password: false })  [FastAPI]
  → authStore.setAdvisor({ ...advisor, must_change_password: false })
  → authStore.setFirstLogin(false)
  → navigate('/')
```

### Page refresh (session restoration)

```
App mounts → AuthInit mounts → useAuth useEffect runs
  → supabase.auth.getSession()
  ← { session } (persisted by Supabase in localStorage)
  → authStore.setSession(session)
  → advisorsService.getMe()
  ← { advisor }
  → authStore.setAdvisor(advisor)
  → authStore.setLoading(false)
  ← ProtectedRoute renders panel (no redirect to login)
```

### Token refresh (automatic)

```
Supabase SDK silently refreshes the JWT
  → onAuthStateChange fires: event = 'TOKEN_REFRESHED', session = new session
  → authStore.setSession(session)       [store now has new token]
  ← next Axios request reads new token from store
```

### Inactive account

```
LoginPage → signIn(email, pwd)
  → supabase.auth.signInWithPassword    [succeeds — Supabase doesn't know is_active]
  → authStore.setSession(session)
  → advisorsService.getMe()             [FastAPI returns 403 ADVISOR_INACTIVE]
  → supabase.auth.signOut()
  → authStore.setError('Tu cuenta está desactivada…')
  ← LoginPage shows error banner
```

---

## API / Interface Contracts

### `authStore` additions (new shape)

```ts
interface AuthState {
  // existing fields...
  error: string | null       // NEW
  setError: (msg: string | null) => void  // NEW
  reset: () => void          // updated: also clears error
}
```

### `Advisor` type addition

```ts
interface Advisor {
  // existing fields...
  must_change_password: boolean   // NEW
}
```

### `advisorsService.updateMe` payload

```ts
updateMe(payload: {
  full_name?: string
  current_password?: string
  new_password?: string
  avatar_url?: string
  must_change_password?: boolean   // NEW
}): Promise<{ advisor: Advisor }>
```

---

## Edge Cases & Error Handling

| Scenario | Handling |
|---|---|
| Wrong email/password | Supabase returns error → `setError(error.message)` → LoginPage shows banner |
| Supabase Auth down | `signInWithPassword` throws → `setError` → banner |
| `GET /advisors/me` 403 ADVISOR_INACTIVE | Sign out + descriptive error message |
| `GET /advisors/me` fails on page refresh | `supabase.auth.signOut()` → SIGNED_OUT → redirect to login |
| 401 from any endpoint during session | Axios interceptor → `session-expired` event → `SessionExpiredModal` |
| `PATCH /advisors/me` fails in FirstLoginPage | Password was already changed in Supabase — show error, user can retry the PATCH or will be forced back to first-login on next refresh |
| `TOKEN_REFRESHED` fires before any request | `setSession` ensures store has the fresh token for the next Axios call |
| Mock token (`mock-token-*`) used with real Axios interceptor | Mocks are removed entirely — this scenario no longer exists |

---

## Open Questions for Implementation

None. All decisions are resolved.
