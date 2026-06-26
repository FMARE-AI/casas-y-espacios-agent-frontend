import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

if (import.meta.env.MODE !== 'production') {
  Promise.all([
    import('./store/authStore'),
    import('./store/wsStore'),
    import('./store/toastStore'),
  ]).then(([{ useAuthStore }, { useWSStore }, { useToastStore }]) => {
    ;(window as Window & { __auth: typeof useAuthStore; __ws: typeof useWSStore; __toast: typeof useToastStore }).__auth = useAuthStore
    ;(window as Window & { __auth: typeof useAuthStore; __ws: typeof useWSStore; __toast: typeof useToastStore }).__ws = useWSStore
    ;(window as Window & { __auth: typeof useAuthStore; __ws: typeof useWSStore; __toast: typeof useToastStore }).__toast = useToastStore
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
