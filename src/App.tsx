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

const RECOVERY_MODE_KEY = 'recovery_mode';

async function handleAuthRedirect(): Promise<void> {
  if (typeof window === 'undefined') return;

  // Check for code in query params
  const urlParams = new URLSearchParams(window.location.search);
  let code = urlParams.get('code');

  // Also check if code is embedded in the hash (e.g., #/auth/reset-password?code=XXX)
  if (!code && window.location.hash.includes('code=')) {
    const hashContent = window.location.hash.substring(1);
    const queryStart = hashContent.indexOf('?');
    const paramStr = queryStart >= 0 ? hashContent.substring(queryStart + 1) : hashContent;
    const hashParams = new URLSearchParams(paramStr);
    code = hashParams.get('code');
  }

  if (code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('Code exchange failed:', error);
      }
      // Clean the URL — remove the code parameter, set the hash to the reset password page
      window.history.replaceState(null, '', window.location.pathname + '#/auth/reset-password');
      // The onAuthStateChange listener will handle the PASSWORD_RECOVERY event after code exchange
    } catch (err) {
      console.error('Auth redirect handling failed:', err);
    }
  }
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRecoveryMode, setIsRecoveryMode] = useState(
    () => typeof window !== 'undefined' && sessionStorage.getItem(RECOVERY_MODE_KEY) === '1'
  );

  useEffect(() => {
    const loadTimeout = window.setTimeout(() => setLoading(false), 6000);

    // Set up listener FIRST so we catch PASSWORD_RECOVERY when exchangeCodeForSession runs
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, s) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
        setSession(s);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(RECOVERY_MODE_KEY, '1');
          window.location.hash = '#/auth/reset-password';
        }
        return;
      }

      // For other events, update session as normal but check recovery flag first
      if (typeof window !== 'undefined' && sessionStorage.getItem(RECOVERY_MODE_KEY) === '1') {
        // Still in recovery — don't redirect to dashboard
        return;
      }

      setSession(s);
    });

    async function init() {
      await handleAuthRedirect();

      supabase.auth
        .getSession()
        .then(({ data: { session: s } }) => {
          setSession(s);
          setLoading(false);
        })
        .catch(() => {
          setSession(null);
          setLoading(false);
        })
        .finally(() => {
          if (typeof window !== 'undefined') {
            window.clearTimeout(loadTimeout);
          }
        });
    }

    init();

    return () => {
      if (typeof window !== 'undefined') {
        window.clearTimeout(loadTimeout);
      }
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
                      sessionStorage.removeItem(RECOVERY_MODE_KEY);
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
