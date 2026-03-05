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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setAuthEvent(event)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>
  }

  // When user lands from "reset password" email link: show only the set-new-password page
  const isRecoverySession =
    authEvent === 'PASSWORD_RECOVERY' ||
    (!!session && typeof window !== 'undefined' && !!sessionStorage.getItem(RECOVERY_FLAG_KEY))

  return (
    <Router>
      {isRecoverySession ? (
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
