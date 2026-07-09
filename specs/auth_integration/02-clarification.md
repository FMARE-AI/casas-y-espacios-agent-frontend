# Clarifications: Auth Integration

## Questions & Answers

**Q1: Does `GET /advisors/me` return `must_change_password`? What backend changes are needed?**
A: The backend must be updated to include this field. In `app/api/v1/panel/schemas.py`, add `must_change_password: bool` to `AdvisorResponse`. In the `GET /advisors/me` endpoint, include `must_change_password` in the Supabase SELECT. In `src/types/index.ts`, add `must_change_password: boolean` to the `Advisor` type.

**Q2: How does `PATCH /advisors/me` clear the `must_change_password` flag?**
A: Extend `UpdateMeRequest` in `schemas.py` with `must_change_password: Optional[bool] = None`. The endpoint validates that only `false` is accepted (setting to `true` raises 400). The frontend flow in `FirstLoginPage.tsx` is:
1. `supabase.auth.updateUser({ password: nueva })`
2. `PATCH /advisors/me { must_change_password: false }`
3. `authStore.setAdvisor({ ...advisor, must_change_password: false })`
4. `navigate('/')`

**Q3: Keep mock login during transition?**
A: **Remove completely.** The admin already exists in Supabase Auth with real credentials. Keeping mocks would mask real integration errors. Use the real admin credentials going forward.

**Q4: Should `isLoading` be set explicitly during `signIn`?**
A: Yes. `setLoading(true)` at the start of `signIn`, `setLoading(false)` in the `finally` block. This prevents any intermediate state where the user has a session but no advisor. Add an `error` field and `setError` method to `authStore` to surface login errors. The pseudocode:
```
signIn:
  setLoading(true)
  try:
    supabase.auth.signInWithPassword → session
    authStore.setSession(session)         ← must come BEFORE getMe()
    GET /advisors/me → advisor            ← interceptor reads token from store
    authStore.setAdvisor(advisor)
    if must_change_password → setFirstLogin(true), navigate('/first-login')
    else → navigate('/')
  catch ADVISOR_INACTIVE:
    supabase.auth.signOut()
    authStore.setError('Tu cuenta está desactivada…')
  catch other:
    authStore.setError(error.message)
  finally:
    setLoading(false)
```

**Critical ordering note from Q4:** `authStore.setSession` must be called *before* `GET /advisors/me`, so the Axios interceptor (which reads from `authStore.getState().session`) has the token available when the profile request is made.

## Open Decisions

None — all ambiguities resolved.

## Prerequisites (backend changes, separate repo)

These changes must land in the FastAPI backend before the frontend can work end-to-end:

1. `app/api/v1/panel/schemas.py`: Add `must_change_password: bool` to `AdvisorResponse` and `must_change_password: Optional[bool] = None` to `UpdateMeRequest`.
2. `app/api/v1/panel/advisors.py`: Include `must_change_password` in the `GET /advisors/me` SELECT. Add validation in `PATCH /advisors/me` to reject `must_change_password: true`.
