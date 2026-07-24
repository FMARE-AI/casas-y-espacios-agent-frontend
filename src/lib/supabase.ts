// Supabase singleton client.
// Import from here throughout the application.
// Never instantiate createClient outside of this file.

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required. ' +
    'Check your .env file'
  )
}

// The panel owns the session lifecycle: the axios interceptor refreshes the
// token via the backend and authStore.setSession() re-syncs the fresh pair
// into this client on every rotation. supabase-js must NOT refresh on its own:
// Supabase refresh tokens are single-use — a second refresher racing over the
// same token trips reuse detection, which revokes the whole session and shows
// a false "sesión expirada". persistSession is off for the same reason: a
// stale copy resurrected from localStorage would retry the consumed token.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
})
