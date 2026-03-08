import { useLocation, useParams } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';
import { useRecipeStore } from '../store/recipeStore';

type RouteMetaEntry =
  | { title: string; description: string | null; noindex?: boolean }
  | ((params: Record<string, string>) => { title: string; description: string | null });

const ROUTE_META: Record<string, RouteMetaEntry> = {
  '/': {
    title: 'PantryCheff – AI Pantry Tracker & Recipe Generator From Ingredients You Have',
    description:
      'Track your pantry, get recipes from ingredients you have, reduce food waste. AI pantry scanner and ingredient-based recipe finder.',
  },
  '/home': {
    title: 'Home',
    description: 'PantryCheff home – AI pantry tracker and recipe generator.',
  },
  '/pantry': {
    title: 'My Pantry',
    description:
      'Manage your pantry ingredients and track what you have. Add items manually or scan with AI.',
  },
  '/recipes': {
    title: 'Recipes',
    description: 'Browse recipes sorted by what you can make with your current pantry ingredients.',
  },
  '/recipes/:id': (params) => {
    return { title: params.id ?? 'Recipe', description: null };
  },
  '/generator': {
    title: 'Magic Recipe Generator',
    description: 'Generate a unique recipe from your pantry ingredients with AI.',
  },
  '/shopping-list': {
    title: 'Shopping List',
    description: 'Your grocery list – add missing ingredients from recipes.',
  },
  '/favorites': {
    title: 'Favorites',
    description: 'Your saved favorite recipes.',
  },
  '/auth/signin': { title: 'Sign In', description: null, noindex: true },
  '/auth/signup': { title: 'Sign Up', description: null, noindex: true },
  '/auth/forgot-password': { title: 'Forgot Password', description: null, noindex: true },
  '/auth/reset-password': { title: 'Reset Password', description: null, noindex: true },
};

function getMetaForPath(
  pathname: string,
  params: Record<string, string | undefined>
): {
  title: string;
  description: string | null;
  noindex?: boolean;
} {
  const exact = ROUTE_META[pathname];
  if (exact) {
    const resolved = typeof exact === 'function' ? exact(params as Record<string, string>) : exact;
    return 'noindex' in exact
      ? { ...resolved, noindex: (exact as { noindex?: boolean }).noindex }
      : resolved;
  }
  if (pathname.startsWith('/recipes/') && params.id) {
    const fn = ROUTE_META['/recipes/:id'];
    if (typeof fn === 'function') return fn({ id: params.id });
  }
  return { title: 'PantryCheff', description: null };
}

export default function RouteMeta() {
  const location = useLocation();
  const params = useParams();
  const pathname = location.pathname;
  const recipeId = pathname.startsWith('/recipes/') ? params.id : null;
  const recipes = useRecipeStore((s) => s.recipes);
  const recipeTitle = recipeId ? (recipes.find((r) => r.id === recipeId)?.title ?? null) : null;

  const meta = getMetaForPath(pathname, params as Record<string, string | undefined>);
  const title =
    pathname.startsWith('/recipes/') && recipeTitle ? `${recipeTitle} | PantryCheff` : meta.title;
  usePageMeta(title, meta.description, { noindex: meta.noindex });

  return null;
}
