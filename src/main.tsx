import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
