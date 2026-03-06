import { useEffect, useState } from 'react'
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import Layout from './components/Layout'
import SignInPage from './components/SignInPage'
import SignUpPage from './components/SignUpPage'
import ForgotPasswordPage from './components/ForgotPasswordPage'
import ResetPasswordPage from './components/ResetPasswordPage'
import Dashboard from './components/Dashboard'
import PantryPage from './components/PantryPage'
import RecipesPage from './components/RecipesPage'
import RecipeDetailPage from './components/RecipeDetailPage'
import RecipeGenerator from './components/RecipeGenerator'
import ShoppingListPage from './components/ShoppingListPage'
import FavoritesPage from './components/FavoritesPage'
import LandingPage from './components/LandingPage'

const RECOVERY_FLAG_KEY = 'pantrychef_expecting_recovery'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authEvent, setAuthEvent] = useState(null)

  useEffect(() => {
    // If URL has code= or type=recovery (in query or hash), set flag so we keep showing reset-password after exchange
    if (typeof window !== 'undefined') {
      const q = window.location.search
      const h = window.location.hash
      if (q.includes('code=') || q.includes('type=recovery') || h.includes('code=') || h.includes('type=recovery')) {
        sessionStorage.setItem(RECOVERY_FLAG_KEY, '1')
      }
    }

    // Timeout so mobile/slow networks don't stick on "Loading..." if getSession hangs (e.g. storage issues)
    const loadTimeout = setTimeout(() => setLoading(false), 6000)

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session)
        setLoading(false)
      })
      .catch(() => {
        setSession(null)
        setLoading(false)
      })
      .finally(() => clearTimeout(loadTimeout))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setAuthEvent(event)
    })

    return () => {
      clearTimeout(loadTimeout)
      subscription?.unsubscribe()
    }
  }, [])

  const [recoveryTimedOut, setRecoveryTimedOut] = useState(false)

  // Define these before the recovery effect so the effect's dependency array can reference them (avoids TDZ error).
  const hasRecoveryFlag =
    typeof window !== 'undefined' && !!sessionStorage.getItem(RECOVERY_FLAG_KEY)
  const hasRecoveryCodeInUrl =
    typeof window !== 'undefined' &&
    (window.location.search.includes('code=') ||
      window.location.search.includes('type=recovery') ||
      window.location.hash.includes('code=') ||
      window.location.hash.includes('type=recovery'))
  const isRecoverySession =
    authEvent === 'PASSWORD_RECOVERY' ||
    (!!session && hasRecoveryFlag) ||
    hasRecoveryCodeInUrl
  const recoveryReady = isRecoverySession && !!session

  // When stuck on "Confirming..." (recovery URL but no session), manually exchange the code for a session.
  useEffect(() => {
    if (!(isRecoverySession && !session) || recoveryTimedOut) return

    const getCodeFromUrl = () => {
      const params = new URLSearchParams(window.location.search)
      let code = params.get('code')
      if (code) return code
      const hash = window.location.hash
      const hashParams = new URLSearchParams(hash.split('?')[1] || '')
      return hashParams.get('code')
    }

    const code = getCodeFromUrl()
    if (code) {
      supabase.auth
        .exchangeCodeForSession(code)
        .then(({ data }) => {
          const session = data?.session
          if (session) {
            setSession(session)
            setAuthEvent('PASSWORD_RECOVERY')
            const base = window.location.origin + window.location.pathname
            window.history.replaceState(null, '', base + '#/auth/reset-password')
          } else {
            setRecoveryTimedOut(true)
          }
        })
        .catch(() => setRecoveryTimedOut(true))
      return
    }

    const t = setTimeout(() => {
      setRecoveryTimedOut(true)
      if (typeof window !== 'undefined') sessionStorage.removeItem(RECOVERY_FLAG_KEY)
    }, 12000)
    return () => clearTimeout(t)
  }, [isRecoverySession, session, recoveryTimedOut])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>
  }

  return (
    <Router>
      {isRecoverySession && !session ? (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-amber-50 to-orange-50 p-4">
          {recoveryTimedOut ? (
            <>
              <p className="text-gray-700 font-medium">Reset link expired or invalid</p>
              <p className="text-sm text-gray-500 text-center">Please request a new password reset link.</p>
              <a
                href="#/auth/forgot-password"
                className="mt-2 text-orange-600 font-medium hover:underline"
              >
                Request new link →
              </a>
            </>
          ) : (
            <>
              <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
              <p className="text-gray-600">Confirming your reset link…</p>
              <p className="text-sm text-gray-500">If this takes more than a few seconds, your link may have expired.</p>
            </>
          )}
        </div>
      ) : recoveryReady ? (
        <Routes>
          <Route path="/auth/reset-password" element={<ResetPasswordPage recoveryFlagKey={RECOVERY_FLAG_KEY} />} />
          <Route path="*" element={<Navigate to="/auth/reset-password" replace />} />
        </Routes>
      ) : !session ? (
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<Navigate to="/auth/signin" replace />} />
          <Route path="/auth/signin" element={<SignInPage />} />
          <Route path="/auth/signup" element={<SignUpPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage recoveryFlagKey={RECOVERY_FLAG_KEY} />} />
          <Route path="/auth/reset-password" element={<Navigate to="/auth/signin" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      ) : (
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/home" element={<LandingPage />} />
            <Route path="/pantry" element={<PantryPage />} />
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/recipes/:id" element={<RecipeDetailPage />} />
            <Route path="/generator" element={<RecipeGenerator />} />
            <Route path="/shopping-list" element={<ShoppingListPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      )}
    </Router>
  )
}

export default App
