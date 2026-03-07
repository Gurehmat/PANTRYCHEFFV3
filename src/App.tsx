import { useEffect, useState, lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from './lib/supabaseClient';
import Layout from './components/Layout';
import SectionErrorBoundary from './components/common/SectionErrorBoundary';
import PageLoader from './components/common/PageLoader';

const Dashboard = lazy(() => import('./components/Dashboard'));
const PantryPage = lazy(() => import('./components/PantryPage'));
const RecipesPage = lazy(() => import('./components/RecipesPage'));
const ShoppingListPage = lazy(() => import('./components/ShoppingListPage'));
const FavoritesPage = lazy(() => import('./components/FavoritesPage'));
const RecipeDetailPage = lazy(() => import('./components/RecipeDetailPage'));
const RecipeGenerator = lazy(() => import('./components/RecipeGenerator'));
const LandingPage = lazy(() => import('./components/LandingPage'));
const SignInPage = lazy(() => import('./components/SignInPage'));
const SignUpPage = lazy(() => import('./components/SignUpPage'));
const ForgotPasswordPage = lazy(() => import('./components/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./components/ResetPasswordPage'));

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRecoveryMode, setIsRecoveryMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;

    // Check URL for recovery marker
    const searchParams = new URLSearchParams(window.location.search);
    const isRecovery = searchParams.get('type') === 'recovery';

    if (isRecovery) {
      // Clean the URL after reading — replace with reset password route
      // Use setTimeout to let Supabase auto-exchange the code first
      setTimeout(() => {
        window.history.replaceState(null, '', window.location.pathname + '#/auth/reset-password');
      }, 1000);
      return true;
    }

    return false;
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, s) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
        setSession(s);
        return;
      }

      if (event === 'SIGNED_OUT') {
        setIsRecoveryMode(false);
      }

      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>
    );
  }

  return (
    <Router>
      {isRecoveryMode ? (
        <Routes>
          <Route
            path="/auth/reset-password"
            element={
              <Suspense fallback={<PageLoader />}>
                <ResetPasswordPage onRecoveryComplete={() => setIsRecoveryMode(false)} />
              </Suspense>
            }
          />
          <Route path="*" element={<Navigate to="/auth/reset-password" replace />} />
        </Routes>
      ) : !session ? (
        <Routes>
          <Route
            path="/"
            element={
              <Suspense fallback={<PageLoader />}>
                <LandingPage />
              </Suspense>
            }
          />
          <Route path="/auth" element={<Navigate to="/auth/signin" replace />} />
          <Route
            path="/auth/signin"
            element={
              <Suspense fallback={<PageLoader />}>
                <SignInPage />
              </Suspense>
            }
          />
          <Route
            path="/auth/signup"
            element={
              <Suspense fallback={<PageLoader />}>
                <SignUpPage />
              </Suspense>
            }
          />
          <Route
            path="/auth/forgot-password"
            element={
              <Suspense fallback={<PageLoader />}>
                <ForgotPasswordPage />
              </Suspense>
            }
          />
          <Route path="/auth/reset-password" element={<Navigate to="/auth/signin" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      ) : (
        <Layout>
          <Routes>
            <Route
              path="/"
              element={
                <SectionErrorBoundary sectionName="Dashboard">
                  <Suspense fallback={<PageLoader />}>
                    <Dashboard />
                  </Suspense>
                </SectionErrorBoundary>
              }
            />
            <Route
              path="/home"
              element={
                <Suspense fallback={<PageLoader />}>
                  <LandingPage />
                </Suspense>
              }
            />
            <Route
              path="/pantry"
              element={
                <SectionErrorBoundary sectionName="Pantry">
                  <Suspense fallback={<PageLoader />}>
                    <PantryPage />
                  </Suspense>
                </SectionErrorBoundary>
              }
            />
            <Route
              path="/recipes"
              element={
                <SectionErrorBoundary sectionName="Recipes">
                  <Suspense fallback={<PageLoader />}>
                    <RecipesPage />
                  </Suspense>
                </SectionErrorBoundary>
              }
            />
            <Route
              path="/recipes/:id"
              element={
                <Suspense fallback={<PageLoader />}>
                  <RecipeDetailPage />
                </Suspense>
              }
            />
            <Route
              path="/generator"
              element={
                <Suspense fallback={<PageLoader />}>
                  <RecipeGenerator />
                </Suspense>
              }
            />
            <Route
              path="/shopping-list"
              element={
                <SectionErrorBoundary sectionName="ShoppingList">
                  <Suspense fallback={<PageLoader />}>
                    <ShoppingListPage />
                  </Suspense>
                </SectionErrorBoundary>
              }
            />
            <Route
              path="/favorites"
              element={
                <SectionErrorBoundary sectionName="Favorites">
                  <Suspense fallback={<PageLoader />}>
                    <FavoritesPage />
                  </Suspense>
                </SectionErrorBoundary>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      )}
    </Router>
  );
}

export default App;
