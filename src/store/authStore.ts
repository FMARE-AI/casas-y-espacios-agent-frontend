import { create } from 'zustand'
import type { Advisor, AdvisorRole } from '../types'
import { supabase } from '../lib/supabase'

// AT (access token) is NEVER persisted to any storage — memory only.
// This limits XSS blast radius: a stolen AT expires within minutes and
// cannot be extracted from disk. The RT (refresh token) is persisted to
// either localStorage (remember me) or sessionStorage (tab-only).
const REFRESH_TOKEN_KEY = 'panel_refresh_token'
const EXPIRES_AT_KEY = 'panel_expires_at'
const REMEMBER_KEY = 'panel_remember'
// Identifies the sign-in that the stored credentials belong to. Regenerated on
// every LOGIN (never on a token refresh), so tabs can tell "the session I am
// part of just rotated its token" apart from "somebody signed in as a different
// account in another tab".
const SESSION_ID_KEY = 'panel_session_id'

// Legacy key — read-only, cleared on next setSession to clean up old data.
const LEGACY_TOKEN_KEY = 'panel_token'

// Kept in sync with BANDEJA_STATUS_FILTER_KEY in pages/BandejaPage.tsx.
// Duplicated (not imported) to avoid a store -> page dependency.
const BANDEJA_STATUS_FILTER_KEY = 'bandeja_status_filter'

function getTokenStorage(): Storage {
  return getRememberPreference() ? localStorage : sessionStorage
}

// Whether this device was told to keep the session across browser restarts.
// Read by the login form so the checkbox comes up the way the user last left it
// instead of silently resetting to the default on every visit.
export function getRememberPreference(): boolean {
  try {
    // Absent means "never chosen", and the panel has always defaulted to
    // remembering. Only an explicit opt-out turns it off — reading an absent key
    // as false would silently downgrade every first-time visitor to a session
    // that dies with the browser.
    return localStorage.getItem(REMEMBER_KEY) !== 'false'
  } catch {
    return false
  }
}

// The sign-in THIS tab belongs to. Read once at module load, so a tab opened
// against an existing session (or a reload) picks up whatever is stored, and
// updated whenever this tab performs a login of its own.
let tabSessionId: string | null = readStoredSessionId()

function readStoredSessionId(): string | null {
  try {
    return localStorage.getItem(SESSION_ID_KEY)
  } catch {
    return null
  }
}

function startBrowserSession(): void {
  try {
    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`
    localStorage.setItem(SESSION_ID_KEY, id)
    tabSessionId = id
  } catch {
    // Storage unavailable — isSameBrowserSession() then compares null to null
    // and stays permissive, which matches the single-tab behaviour.
  }
}

// Whether the credentials currently in shared storage belong to the same sign-in
// this tab is part of. False means another tab signed in — possibly as a
// DIFFERENT advisor — and adopting its refresh token would leave this tab
// showing one user's data while authenticating as another.
export function isSameBrowserSession(): boolean {
  return readStoredSessionId() === tabSessionId
}

// Why a session ended, handed to the login screen. Only set when the session
// ended on its own — a deliberate logout has nothing to explain.
export interface SessionNotice {
  title: string
  message: string
}

const EXPIRED_NOTICE: SessionNotice = {
  title: 'Tu sesión ha expirado',
  message: 'Por seguridad, tu sesión se cerró automáticamente. Ingresa nuevamente para continuar.',
}

export interface SessionData {
  access_token: string
  refresh_token: string
  expires_in: number // seconds
  rememberMe?: boolean
}

interface AuthState {
  token: string | null
  refresh_token: string | null
  expires_at: number | null // timestamp in ms
  advisor: Advisor | null
  role: AdvisorRole | null
  isLoading: boolean
  isFirstLogin: boolean
  sessionExpired: boolean
  sessionNotice: SessionNotice | null
  error: string | null
  // Monotonic counter bumped every time a session ENDS (clearSession/reset).
  // Async work started under one session (most importantly an in-flight token
  // refresh) captures this value and compares it before applying its result, so
  // a response that lands after the user logged out can no longer tear down the
  // session that replaced it. Never bumped by setSession(): a token refresh
  // continues the same session rather than starting a new one.
  sessionEpoch: number

  setSession: (data: SessionData) => void
  clearSession: () => void
  setToken: (token: string | null) => void
  setAdvisor: (advisor: Advisor | null) => void
  setLoading: (loading: boolean) => void
  setFirstLogin: (value: boolean) => void
  setSessionExpired: (value: boolean) => void
  endSession: (notice?: SessionNotice) => void
  setError: (message: string | null) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  refresh_token: null,
  expires_at: null,
  advisor: null,
  role: null,
  isLoading: true,
  isFirstLogin: false,
  sessionExpired: false,
  sessionNotice: null,
  error: null,
  sessionEpoch: 0,

  setSession: (data) => {
    const expires_at = Date.now() + data.expires_in * 1000

    // Persist "remember me" preference so getTokenStorage() works after page reload.
    // rememberMe is only ever passed by a login; a token refresh leaves it
    // undefined, which is exactly how we tell the two apart — a refresh
    // continues the current sign-in, a login starts a new one.
    if (data.rememberMe !== undefined) {
      localStorage.setItem(REMEMBER_KEY, String(data.rememberMe))
      startBrowserSession()
    }
    const storage = getTokenStorage()
    storage.setItem(REFRESH_TOKEN_KEY, data.refresh_token)
    storage.setItem(EXPIRES_AT_KEY, String(expires_at))

    // Remove legacy AT from localStorage if it exists from a previous version.
    localStorage.removeItem(LEGACY_TOKEN_KEY)

    // Synchronize with Supabase client to authorize Storage uploads.
    // L-02: log only message, never the token object itself.
    supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    }).catch((err) => console.error('Supabase session sync failed:', {
      message: err?.message ?? 'unknown',
      code: err?.code ?? 'unknown',
    }))

    set({
      token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at,
      sessionExpired: false,
      sessionNotice: null,
    })
  },

  clearSession: () => {
    // REMEMBER_KEY is intentionally NOT removed here: it is a device preference,
    // not session state. Clearing it made the "Recordar sesión" checkbox forget
    // the user's choice on every logout.
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(EXPIRES_AT_KEY)
    localStorage.removeItem(LEGACY_TOKEN_KEY)
    sessionStorage.removeItem(REFRESH_TOKEN_KEY)
    sessionStorage.removeItem(EXPIRES_AT_KEY)
    sessionStorage.removeItem(BANDEJA_STATUS_FILTER_KEY)
    // scope 'local' revokes only THIS session's refresh token. The default
    // ('global') revokes every session of the user — fired-and-forgotten here,
    // it could land after a new login and kill the freshly issued tokens,
    // forcing the user to log in twice.
    supabase.auth.signOut({ scope: 'local' }).catch(() => {})
    set((state) => ({
      token: null,
      refresh_token: null,
      expires_at: null,
      advisor: null,
      role: null,
      isFirstLogin: false,
      sessionExpired: false,
      sessionNotice: null,
      error: null,
      sessionEpoch: state.sessionEpoch + 1,
    }))
  },

  setToken: (token) => {
    // AT is memory-only — no localStorage write.
    set({ token })
  },

  setAdvisor: (advisor) =>
    set((state) => {
      if (!advisor) {
        return { advisor: null, role: null }
      }
      if (!state.advisor) {
        return { advisor, role: advisor.role ?? null }
      }
      const mergedAdvisor = {
        ...state.advisor,
        ...advisor,
        role: advisor.role || state.advisor.role || 'asesor',
      } as Advisor
      return { advisor: mergedAdvisor, role: mergedAdvisor.role }
    }),

  setLoading: (isLoading) => set({ isLoading }),
  setFirstLogin: (isFirstLogin) => set({ isFirstLogin }),
  setSessionExpired: (sessionExpired) => set({ sessionExpired }),

  // The single way a session ends for a reason the user did not ask for
  // (expiry, inactivity, a deactivated account). Clearing the credentials is
  // what actually forces the login screen — ProtectedRoute redirects the moment
  // `token` is null — and the notice rides along so the login page can say why.
  //
  // This replaces a flag + title + message that each caller set on its own and
  // left a blocking modal to finish the sign-out. That split is why the same
  // event sometimes showed the modal and sometimes bounced straight to /login:
  // whichever ran first won. Ending the session in one step removes the race
  // and the extra click.
  endSession: (notice) => {
    get().clearSession()
    set({ sessionExpired: true, sessionNotice: notice ?? EXPIRED_NOTICE })
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('session-expired'))
    }
  },
  setError: (error) => set({ error }),

  reset: () => {
    // See clearSession(): the remember preference outlives the session.
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(EXPIRES_AT_KEY)
    localStorage.removeItem(LEGACY_TOKEN_KEY)
    sessionStorage.removeItem(REFRESH_TOKEN_KEY)
    sessionStorage.removeItem(EXPIRES_AT_KEY)
    sessionStorage.removeItem(BANDEJA_STATUS_FILTER_KEY)
    // scope 'local' — see clearSession() for why global revocation is unsafe.
    supabase.auth.signOut({ scope: 'local' }).catch(() => {})
    set((state) => ({
      token: null,
      refresh_token: null,
      expires_at: null,
      advisor: null,
      role: null,
      isFirstLogin: false,
      sessionExpired: false,
      sessionNotice: null,
      error: null,
      sessionEpoch: state.sessionEpoch + 1,
    }))
  },
}))

// Cross-tab refresh-token sync. The backend ROTATES the refresh token on every
// refresh, and Zustand state is per-tab: a second tab that refreshed while this
// one sat idle leaves this tab holding a token the server already invalidated.
// Using it earns a 401, which clearSession() used to turn into a logout for
// BOTH tabs, since the storage keys are shared.
//
// Only a NEW value is adopted. A removal is ignored on purpose: it can also come
// from a clearSession() racing with a fresh login in another tab, and adopting
// it would tear down the session that just started. The access token is not
// synced — it is memory-only and each tab's own copy stays valid until its own
// expiry.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== REFRESH_TOKEN_KEY || !event.newValue) return
    if (useAuthStore.getState().refresh_token === event.newValue) return

    // Only follow rotations from the sign-in this tab is part of. A different
    // sign-in in another tab may be a different advisor entirely, and adopting
    // its token would leave this tab rendering one user while acting as another.
    if (!isSameBrowserSession()) return

    const expires_at_str = localStorage.getItem(EXPIRES_AT_KEY)
    const expires_at =
      expires_at_str && !isNaN(Number(expires_at_str)) ? Number(expires_at_str) : null

    useAuthStore.setState(
      expires_at !== null
        ? { refresh_token: event.newValue, expires_at }
        : { refresh_token: event.newValue }
    )
  })
}

// AT is no longer stored — always returns null. Kept for backwards compat.
export const getStoredToken = (): string | null => null

export interface StoredSession {
  // AT is memory-only (C-02). On page reload it will be null and the axios
  // interceptor will refresh it automatically using the RT before the first request.
  access_token: null
  refresh_token: string
  expires_at: number // absolute timestamp in ms
}

export const getStoredSession = (): StoredSession | null => {
  // I-02: read from both storages — RT lives in whichever one was used at login.
  const refresh_token =
    localStorage.getItem(REFRESH_TOKEN_KEY) ||
    sessionStorage.getItem(REFRESH_TOKEN_KEY)

  if (!refresh_token) return null

  const expires_at_str =
    localStorage.getItem(EXPIRES_AT_KEY) ||
    sessionStorage.getItem(EXPIRES_AT_KEY)

  // H-01: Validate expires_at to prevent NaN and infinite login loops
  if (expires_at_str && isNaN(Number(expires_at_str))) {
    console.warn('Invalid expires_at in localStorage, clearing session')
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(EXPIRES_AT_KEY)
    localStorage.removeItem(REMEMBER_KEY)
    sessionStorage.removeItem(REFRESH_TOKEN_KEY)
    sessionStorage.removeItem(EXPIRES_AT_KEY)
    return null
  }

  return {
    access_token: null, // intentional — never persisted
    refresh_token,
    // expires_at: 0 forces an immediate refresh on the first intercepted request.
    expires_at: expires_at_str ? Number(expires_at_str) : 0,
  }
}
