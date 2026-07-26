import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from 'next-themes'
// Self-hosted variable font (all weights 100-900 in one file per subset).
// Respects the existing CSP (font-src 'self') — no Google Fonts <link>.
import '@fontsource-variable/inter'
import './index.css'
import App from './App.tsx'
import { registerApiToastBridge } from './lib/apiToastBridge'

registerApiToastBridge()

if (import.meta.env.MODE !== 'production') {
  Promise.all([
    import('./store/authStore'),
    import('./store/wsStore'),
    import('./store/toastStore'),
  ]).then(([{ useAuthStore }, { useWSStore }, { useToastStore }]) => {
    type DebugWindow = Window & { __auth: typeof useAuthStore; __ws: typeof useWSStore; __toast: typeof useToastStore }
    const w = window as unknown as DebugWindow
    w.__auth = useAuthStore
    w.__ws = useWSStore
    w.__toast = useToastStore
  })
}

// The panel is dark-only: forcedTheme guarantees `.dark` lands on <html>
// regardless of system preference or a stale localStorage value, which is what
// activates the `dark:` variants in components/ui/*.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" disableTransitionOnChange>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
