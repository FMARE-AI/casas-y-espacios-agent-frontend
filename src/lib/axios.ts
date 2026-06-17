// Instancia de Axios con interceptores para el panel.
// Importar desde aquí en toda la aplicación.
// Nunca usar axios directamente en componentes o hooks.

import axios from 'axios'
import { supabase } from './supabase'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// Interceptor de request: agrega el JWT automáticamente
apiClient.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

// Interceptor de response: manejo centralizado de errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // El modal de sesión expirada se activa desde useAuth
      window.dispatchEvent(new CustomEvent('session-expired'))
    }
    return Promise.reject(error)
  }
)

export default apiClient
