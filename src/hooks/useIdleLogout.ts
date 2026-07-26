import { useEffect, useRef } from 'react'
import { useAuthStore } from '../store/authStore'

const IDLE_TIMEOUT_MS = 40 * 60 * 1000 // 40 minutes
// Polling instead of a single reset-on-every-event setTimeout: cheaper (no
// clearTimeout/setTimeout churn on every mousemove) and immune to the classic
// "forgot to clear the old timer" bug class.
const CHECK_INTERVAL_MS = 15 * 1000
// Only the localStorage write is throttled — updating a ref on every event is
// free, but serializing + writing to disk on every mousemove is not.
const ACTIVITY_WRITE_THROTTLE_MS = 1000
const STORAGE_KEY = 'panel_last_activity'

// No 'mousemove' listener needed beyond what's below; scroll/wheel/touch and
// key/mouse-down already cover real interaction without the extremely high
// event rate of mousemove.
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'wheel', 'scroll', 'touchstart'] as const

function readStoredActivity(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? Number(raw) : NaN
    return Number.isNaN(parsed) ? 0 : parsed
  } catch {
    // localStorage can throw (private browsing quota, disabled storage) —
    // cross-tab sync is a nice-to-have, never let it break the idle timer.
    return 0
  }
}

function writeStoredActivity(timestamp: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(timestamp))
  } catch {
    // see readStoredActivity()
  }
}

/**
 * Logs the user out after IDLE_TIMEOUT_MS of no interaction anywhere in the
 * panel. Shares the idle clock across tabs via localStorage so a user
 * actively working in one tab isn't logged out because a second, unattended
 * tab of the same panel went quiet.
 *
 * Deliberately does NOT call clearSession() itself — it only sets the same
 * blockedTitle/blockedMessage + sessionExpired flags already used for the
 * ADVISOR_INACTIVE case in axios.ts. SessionExpiredModal (rendered by
 * ProtectedRoute whenever sessionExpired is true) owns the actual sign-out +
 * redirect once the user acknowledges it. This keeps the idle timer's blast
 * radius limited to "show the existing modal" instead of reaching into
 * session/navigation state directly.
 */
export function useIdleLogout(): void {
  // 0 is a safe placeholder — the real timestamp is set inside the effect
  // below (its body is allowed to call Date.now(); the render path isn't).
  const lastActivityRef = useRef(0)
  const lastWriteRef = useRef(0)
  const firedRef = useRef(false)

  useEffect(() => {
    lastActivityRef.current = Date.now()

    const touch = () => {
      const now = Date.now()
      lastActivityRef.current = now
      if (now - lastWriteRef.current > ACTIVITY_WRITE_THROTTLE_MS) {
        lastWriteRef.current = now
        writeStoredActivity(now)
      }
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return
      const parsed = Number(e.newValue)
      if (!Number.isNaN(parsed) && parsed > lastActivityRef.current) {
        lastActivityRef.current = parsed
      }
    }

    // Seed from any cross-tab activity recorded before this tab/mount existed.
    const stored = readStoredActivity()
    if (stored > lastActivityRef.current) {
      lastActivityRef.current = stored
    }

    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, touch, { passive: true }))
    window.addEventListener('storage', handleStorage)

    const interval = setInterval(() => {
      const { token, refresh_token, sessionExpired } = useAuthStore.getState()

      // No active session — (re)arm the guard so it can fire again the next
      // time the user logs in. This hook is mounted once for the whole app
      // lifetime (see IdleLogoutGuard), so without this reset a single idle
      // logout would permanently disable the feature for every session after
      // it in the same tab.
      if (!token || !refresh_token) {
        firedRef.current = false
        return
      }

      if (firedRef.current || sessionExpired) return

      const idleFor = Date.now() - lastActivityRef.current
      if (idleFor >= IDLE_TIMEOUT_MS) {
        firedRef.current = true
        useAuthStore.getState().setBlockedModal(
          'Sesión cerrada por inactividad',
          'Por tu seguridad, cerramos tu sesión automáticamente tras 40 minutos sin actividad. Ingresa nuevamente para continuar.'
        )
        useAuthStore.getState().setSessionExpired(true)
      }
    }, CHECK_INTERVAL_MS)

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, touch))
      window.removeEventListener('storage', handleStorage)
      clearInterval(interval)
    }
  }, [])
}
