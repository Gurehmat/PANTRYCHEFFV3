import { useEffect, useState } from 'react'
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import Layout from './components/Layout'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import PantryPage from './components/PantryPage'
import RecipesPage from './components/RecipesPage'
import RecipeDetailPage from './components/RecipeDetailPage'
import RecipeGenerator from './components/RecipeGenerator'
import ShoppingListPage from './components/ShoppingListPage'
import FavoritesPage from './components/FavoritesPage'
import LandingPage from './components/LandingPage'

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

  return (
    <Router>
      {authEvent === 'PASSWORD_RECOVERY' ? (
        <Routes>
          <Route path="/auth" element={<Auth authEvent={authEvent} />} />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      ) : !session ? (
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      ) : (
        <Layout>
          {/* Protected Routes */}
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
