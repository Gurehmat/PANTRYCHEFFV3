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

    // Check if we're returning from a password reset email click
    const hasRecoveryFlag = sessionStorage.getItem('password_recovery_pending') === '1';
    const urlHasCode =
      window.location.search.includes('code=') || window.location.hash.includes('code=');

    // Also check if we're already in active recovery mode (page was refreshed during recovery)
    const activeRecovery = sessionStorage.getItem('recovery_mode_active') === '1';

    if (hasRecoveryFlag && urlHasCode) {
      // This is a recovery redirect — activate recovery mode
      sessionStorage.removeItem('password_recovery_pending');
      sessionStorage.setItem('recovery_mode_active', '1');

      // Clean the URL after a short delay to let Supabase auto-exchange the code first
      setTimeout(() => {
        window.history.replaceState(null, '', window.location.pathname + '#/auth/reset-password');
      }, 500);

      return true;
    }

    return activeRecovery;
  });

  useEffect(() => {
    const loadTimeout = window.setTimeout(() => setLoading(false), 6000);

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, s) => {
      // If PASSWORD_RECOVERY fires (may or may not happen depending on timing), activate recovery mode
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('recovery_mode_active', '1');
          window.location.hash = '#/auth/reset-password';
        }
        setSession(s);
        return;
      }

      if (event === 'SIGNED_OUT') {
        setIsRecoveryMode(false);
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('recovery_mode_active');
          sessionStorage.removeItem('password_recovery_pending');
        }
      }

      // If in recovery mode, still update session but don't let the router send to dashboard
      setSession(s);
    });

    return () => {
      window.clearTimeout(loadTimeout);
      subscription?.unsubscribe();
    };
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
                <ResetPasswordPage
                  onRecoveryComplete={() => {
                    setIsRecoveryMode(false);
                    if (typeof window !== 'undefined') {
                      sessionStorage.removeItem('recovery_mode_active');
                      sessionStorage.removeItem('password_recovery_pending');
                    }
                  }}
                />
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
