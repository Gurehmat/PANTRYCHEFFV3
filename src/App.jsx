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

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>
  }

  if (!session) {
    return <Auth />
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pantry" element={<PantryPage />} />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/recipes/:id" element={<RecipeDetailPage />} />
          <Route path="/generator" element={<RecipeGenerator />} />
          <Route path="/shopping-list" element={<ShoppingListPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
