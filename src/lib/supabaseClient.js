import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase environment variables! Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        // Use PKCE so auth/recovery URLs use ?code= instead of putting tokens in the URL hash.
        // This avoids conflicts with HashRouter (which also uses the URL hash).
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
    },
})
