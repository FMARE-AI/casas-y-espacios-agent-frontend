# Spec: Auth Integration

## Problem

The frontend currently uses hardcoded mock credentials and a fake session to simulate authentication. There is no real validation of users against the database, no JWT issued by Supabase, and no advisor profile loaded from the backend. This blocks all real backend integration: every API call would fail because the JWT is not valid.

The feature connects Supabase Auth (already installed) to the real sign-in flow and loads the advisor profile from the backend via `GET /advisors/me`.

## Goals

- Replace mock `signIn` with `supabase.auth.signInWithPassword` — real Supabase credentials.
- After a successful sign-in, call `GET /advisors/me` to load the real advisor profile (role, area, name, etc.) into `authStore`.
- Detect `must_change_password = true` on the advisor profile and redirect to `/first-login`.
- Connect `FirstLoginPage` to call `supabase.auth.updateUser` and then `PATCH /advisors/me` to clear the flag.
- Wire `onAuthStateChange` to handle `TOKEN_REFRESHED` and `SIGNED_OUT` correctly.
- Update the Axios interceptor to read the JWT from `authStore` (not from `supabase.auth.getSession()`) and dispatch `session-expired` on 401.
- Handle `ADVISOR_INACTIVE` (403) on `GET /advisors/me` → sign out + show message.

## Non-Goals

- Does NOT change the Supabase client configuration (`src/lib/supabase.ts`).
- Does NOT add a password-reset flow (forgot password). Only handles first-login forced change.
- Does NOT change other pages or services beyond the three specified files (`useAuth.ts`, `axios.ts`, `authStore.ts`) and the already-existing `FirstLoginPage.tsx`.
- Does NOT remove the mock login path yet — it should remain for development fallback until the team has real test credentials.
- Does NOT change the `ProtectedRoute` or WebSocket logic.

## Expected Behavior

**Normal login:**
1. Advisor enters real email + password → `supabase.auth.signInWithPassword` is called.
2. On success, `GET /advisors/me` is called with the JWT from the new session.
3. The advisor profile is stored in `authStore`. Role and area are derived from it.
4. `ProtectedRoute` passes → user enters the panel.

**First login:**
1. Same flow as above, but `GET /advisors/me` returns `must_change_password: true`.
2. `authStore.setFirstLogin(true)` is called.
3. `ProtectedRoute` redirects to `/first-login`.
4. Advisor sets a new password → `supabase.auth.updateUser({ password })` is called.
5. On success, `PATCH /advisors/me` is called with `{ must_change_password: false }`.
6. `authStore.setFirstLogin(false)` → navigate to `/`.

**Inactive account:**
1. Sign-in with Supabase succeeds (Supabase does not know about `is_active`).
2. `GET /advisors/me` returns 403 `ADVISOR_INACTIVE`.
3. `supabase.auth.signOut()` is called immediately.
4. Error message "Tu cuenta está desactivada. Contacta a un administrador." is shown on the login page.

**Token refresh:**
1. Supabase silently refreshes the token.
2. `TOKEN_REFRESHED` event fires → `authStore.setSession(session)` is called.
3. The Axios interceptor reads the fresh token from the store on the next request.

**Session expiry / 401:**
1. Backend returns 401.
2. Axios interceptor fires `window.dispatchEvent(new CustomEvent('session-expired'))`.
3. `useAuth`'s `session-expired` listener calls `authStore.setSessionExpired(true)`.
4. `SessionExpiredModal` is shown.

**Sign out:**
1. `SIGNED_OUT` event fires → `authStore.reset()` → navigate to `/login`.

## Constraints

- The Axios interceptor **must read the token from `authStore` synchronously** (via `useAuthStore.getState().session?.access_token`), not via `supabase.auth.getSession()` which is async and adds latency to every request.
- `onAuthStateChange` must not be added to the `deps` array of the `useEffect` — keep it empty (Regla 3 in CLAUDE.md).
- `must_change_password` is not currently in the `Advisor` TypeScript type or in the `GET /advisors/me` API response spec. This must be confirmed before implementation.
- Mock login path (`asesor@mock.com` / `admin@mock.com`) stays during the transition period.
- All writes to `authStore` inside effects use `useAuthStore.getState()` — no reactive selector in deps (Regla 1 and 2 in CLAUDE.md).

## Priority

**High** — This is the blocker for all other backend integration work. No other feature can be connected to the real backend until the JWT is real.
