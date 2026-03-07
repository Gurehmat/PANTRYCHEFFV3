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

const RECOVERY_FLAG_KEY = 'pantrychef_expecting_recovery';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authEvent, setAuthEvent] = useState<AuthChangeEvent | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const q = window.location.search;
      const h = window.location.hash;
      if (q.includes('type=recovery') || h.includes('type=recovery')) {
        sessionStorage.setItem(RECOVERY_FLAG_KEY, '1');
      }
    }

    const loadTimeout = setTimeout(() => setLoading(false), 6000);

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
      .finally(() => clearTimeout(loadTimeout));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setAuthEvent(event);
    });

    return () => {
      clearTimeout(loadTimeout);
      subscription?.unsubscribe();
    };
  }, []);

  const [recoveryTimedOut, setRecoveryTimedOut] = useState(false);

  const hasRecoveryFlag =
    typeof window !== 'undefined' && !!sessionStorage.getItem(RECOVERY_FLAG_KEY);
  const hasRecoveryTypeInUrl =
    typeof window !== 'undefined' &&
    (window.location.search.includes('type=recovery') ||
      window.location.hash.includes('type=recovery'));
  const hasCodeInUrl =
    typeof window !== 'undefined' &&
    (window.location.search.includes('code=') || window.location.hash.includes('code='));
  const isRecoverySession =
    authEvent === 'PASSWORD_RECOVERY' ||
    (!!session && hasRecoveryFlag) ||
    hasRecoveryTypeInUrl ||
    (hasRecoveryFlag && hasCodeInUrl);
  const recoveryReady = isRecoverySession && !!session;

  useEffect(() => {
    if (!(isRecoverySession && !session) || recoveryTimedOut) return;

    const getCodeFromUrl = (): string | null => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      if (code) return code;
      const hash = window.location.hash;
      const hashParams = new URLSearchParams(hash.split('?')[1] || '');
      return hashParams.get('code');
    };

    const code = getCodeFromUrl();
    if (code) {
      supabase.auth
        .exchangeCodeForSession(code)
        .then(({ data }) => {
          const s = data?.session;
          if (s) {
            setSession(s);
            setAuthEvent('PASSWORD_RECOVERY');
            const base = window.location.origin + window.location.pathname;
            window.history.replaceState(null, '', base + '#/auth/reset-password');
          } else {
            setRecoveryTimedOut(true);
          }
        })
        .catch(() => setRecoveryTimedOut(true));
      return;
    }

    const t = setTimeout(() => {
      setRecoveryTimedOut(true);
      if (typeof window !== 'undefined') sessionStorage.removeItem(RECOVERY_FLAG_KEY);
    }, 12000);
    return () => clearTimeout(t);
  }, [isRecoverySession, session, recoveryTimedOut]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>
    );
  }

  return (
    <Router>
      {isRecoverySession && !session ? (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-amber-50 to-orange-50 p-4">
          {recoveryTimedOut ? (
            <>
              <p className="text-gray-700 font-medium">Reset link expired or invalid</p>
              <p className="text-sm text-gray-500 text-center">
                Please request a new password reset link.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    sessionStorage.removeItem(RECOVERY_FLAG_KEY);
                    window.location.hash = '#/auth/forgot-password';
                  }
                }}
                className="mt-2 text-orange-600 font-medium hover:underline"
              >
                Request new link →
              </button>
            </>
          ) : (
            <>
              <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
              <p className="text-gray-600">Confirming your reset link…</p>
              <p className="text-sm text-gray-500">
                If this takes more than a few seconds, your link may have expired.
              </p>
            </>
          )}
        </div>
      ) : recoveryReady ? (
        <Routes>
          <Route
            path="/auth/reset-password"
            element={
              <Suspense fallback={<PageLoader />}>
                <ResetPasswordPage recoveryFlagKey={RECOVERY_FLAG_KEY} />
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
                <ForgotPasswordPage recoveryFlagKey={RECOVERY_FLAG_KEY} />
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
