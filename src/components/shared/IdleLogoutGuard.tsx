import { useIdleLogout } from '../../hooks/useIdleLogout'

// Mounted once, at the App root, next to <AuthInit /> — outliving route
// changes and every <ProtectedRoute> remount, so 40 minutes of inactivity is
// tracked across the whole session rather than reset on every navigation
// between the "any role" and "admin only" ProtectedRoute instances.
export default function IdleLogoutGuard() {
  useIdleLogout()
  return null
}
