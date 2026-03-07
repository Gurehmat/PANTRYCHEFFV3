# PantryCheff — Comprehensive Project Summary for Resume

Use this document to update your resume. All numbers, file names, and technical details are accurate to the codebase.

---

## 1. COMPLETE FEATURE LIST

Every user-facing feature with a one-line description:

**Authentication**
- **Email/password sign-up** — Create account with Supabase Auth; validation for password length and match.
- **Email/password sign-in** — Sign in with Supabase Auth; error display on failure.
- **Forgot password** — Request password reset; Supabase sends recovery email.
- **Password reset** — Reset password via email link; exchange code for session and redirect to reset form.
- **Session persistence** — Session restored on load; protected routes redirect unauthenticated users.
- **Sign out** — Clear session and redirect to landing.

**Pantry**
- **Pantry management (CRUD)** — Add, edit, delete pantry items with name, quantity, unit, expiry date (`pantryStore`, `PantryList`, `AddItemForm`).
- **AI fridge scanner** — Upload or capture photo; Supabase Edge Function calls Gemini multimodal API to identify ingredients; bulk add to pantry (`PantryScanner`, `scan-pantry`).
- **Expiry alerts** — Color-coded banner (red/orange/yellow) for expired, expiring today, or within 3 days; expandable list; dismissible per session (`ExpiryBanner`, `expiryChecker.ts`).
- **Dashboard pantry stats** — Total pantry items and “items expiring soon” with link to pantry (`PantryStats`).

**Recipes**
- **Recipe browser** — Browse recipes (from DB, seeded from JSON); sorted by match percentage (`RecipesPage`).
- **Recipe detail** — Full recipe view: image, ingredients (with match/missing), instructions, cooking time, favorites, “Add to Shopping List” for missing items (`RecipeDetailPage`).
- **Recipe match scoring** — Per-recipe match percentage and “can make” (≥80%); confidence-based matching (exact, partial, fuzzy) with normalized ingredients (`getRecipeMatches`, `recipeMatching.ts`).
- **Favorites** — Toggle favorite per recipe; list on Favorites page (`recipeStore.toggleFavorite`, `FavoritesPage`).
- **Seed database** — One-click seed of recipes from `public/data/recipes_with_images.json` (runtime fetch, not bundled) (`SeedButton`, `seedData.ts`).
- **Magic recipe generation (AI)** — Send current pantry to Edge Function; Gemini returns structured recipe (title, description, ingredients, instructions, cooking_time, missing_ingredients); optional “Regenerate” to bypass cache (`RecipeGenerator`, `generate-recipe`).
- **Smart substitutions (AI)** — For a recipe + missing ingredients + pantry, Gemini suggests substitutions; results shown on recipe detail (`getSubstitutions`, `generate-substitutions`).
- **Cook mode** — Full-screen step-by-step view: one instruction at a time, prev/next, ingredient checklist with checkboxes and strikethrough, “Close Cook Mode” (`CookMode.tsx`, “Start Cooking” on `RecipeDetailPage`).

**Shopping list**
- **Shopping list CRUD** — Add items (e.g. from recipe detail), toggle checked, delete (`shoppingListStore`, `ShoppingListPage`).
- **Add missing to list** — From recipe detail, add missing ingredients to shopping list with one click.

**AI and performance**
- **Response caching** — In-memory TTL cache (default 30 min) for generate-recipe and generate-substitutions; key = sorted pantry names or recipe title + sorted missing ingredients (`cache.ts`, `recipeService.ts`).
- **Rate limiting** — Client-side: 10 requests per 60s; “Try again in X seconds” and disabled buttons when limited (`rateLimiter.ts`, `recipeService`, RecipeGenerator, RecipeDetailPage, PantryScanner).
- **Regenerate (bypass cache)** — Button on RecipeGenerator invalidates cache for current pantry then calls generate-recipe again.

**UX and engineering**
- **Dashboard stats** — Four cards: total pantry items, items expiring soon, recipes you can make (80%+), recipes almost there (60–79%) (`PantryStats`, `getRecipeMatches`, `getExpiryAlerts`).
- **Lazy loading** — Route-level code splitting via `React.lazy()` for all page components (`App.tsx`).
- **Optimized images** — Lazy loading, placeholder, error fallback, no layout shift (`OptimizedImage.tsx`).
- **Error boundaries** — App-level `ErrorBoundary` and section-level `SectionErrorBoundary` with “Try again” / reload (`ErrorBoundary.tsx`, `SectionErrorBoundary.tsx`).
- **GitHub Pages deployment** — Base path `/PANTRYCHEFFV3/`; `gh-pages` deploy from `dist`.

---

## 2. TECHNICAL ARCHITECTURE

**Frontend**
- **Framework:** React 19.2 with React DOM 19.2.
- **Build:** Vite 7.3; `@vitejs/plugin-react` 5.1.
- **Routing:** React Router DOM 7.13; `HashRouter` (for GitHub Pages); public landing vs authenticated app routes.
- **Patterns:** Functional components and hooks; lazy-loaded route components; `memo()` on `RecipeCard`, `PantryItemRow`, `ShoppingListItemRow` to limit re-renders; `useMemo` for derived data (e.g. sorted/filtered recipes with match results on `RecipesPage`, dashboard stats on `PantryStats`).
- **Styling:** Tailwind CSS 4.x; utility-first; responsive (e.g. `md:`, `lg:`).
- **Icons:** Lucide React.

**State management**
- **Library:** Zustand 5.0.
- **Stores (3):** `pantryStore` (pantry CRUD, bulk add from scan), `recipeStore` (recipes, favorites, fetch), `shoppingListStore` (shopping list CRUD). Each store: state (list, loading, error), actions (fetch, add, update, delete, etc.), and `clearError`. No persistence to localStorage; data from Supabase.
- **Pattern:** Single `create<StoreType>()` per store; async actions call Supabase then `set()`; errors normalized via `handleError`/`getErrorMessage` and logged with `logger`.

**Backend**
- **Service:** Supabase (BaaS).
- **Database:** PostgreSQL; tables: `pantry_items`, `recipes`, `shopping_list`, `favorites`. Migrations in `supabase/migrations/` (init schema, cooking_time, image_url/description, shopping/favorites, FK cascade).
- **Auth:** Supabase Auth (email/password); sign-in, sign-up, forgot password, reset via recovery link; `onAuthStateChange` and session in React state; protected routes by session.

**AI integration**
- **Model:** Google Gemini (Gemini 2.0 Flash for text; Gemini 2.0 Flash Lite for image in scan-pantry). API key only in Supabase Edge Functions (env `GEMINI_API_KEY`), never in frontend.
- **Invocation:** Frontend calls `supabase.functions.invoke('function-name', { body, headers })` with `VITE_SUPABASE_ANON_KEY` in Authorization. No direct Gemini calls from the client.

**Serverless (Edge Functions)**
- **Runtime:** Deno (Supabase Edge Functions).
- **Functions (4):**
  1. **generate-recipe** — Input: `pantryItems`. Uses `gemini-2.0-flash`; prompt asks for JSON (title, description, ingredients, instructions, cooking_time, missing_ingredients). Strips markdown fences, parses JSON, validates shape (`isRecipeShape`). Returns 400 on validation/AI errors; rate limit and timeout handled.
  2. **generate-substitutions** — Input: `recipeTitle`, `missingIngredients`, `pantryItems`. Same model; prompt for JSON array of `{ missing, substitution, reason }`. Validates with `isSubstitutionShape`.
  3. **scan-pantry** — Input: `image` (base64). Calls Gemini REST `gemini-2.0-flash-lite:generateContent` with multimodal (text prompt + inline image). Asks for JSON array of `{ name, quantity, unit }`. Strips markdown, parses, returns array. Not cached (each image unique).
  4. **delete-account** — Uses `SUPABASE_SERVICE_ROLE_KEY`; gets user from JWT; deletes from `pantry_items`, `shopping_list`, `favorites`; then `auth.admin.deleteUser(userId)`.

**Security**
- **RLS:** All four tables have RLS enabled; policies restrict SELECT/INSERT/UPDATE/DELETE to `auth.uid() = user_id`.
- **API key:** Gemini key only in Edge Function secrets; frontend only has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- **Auth flow:** Recovery flow handles `type=recovery` and `code=` in URL; exchanges code for session; redirects to reset-password.

---

## 3. TECHNOLOGIES USED

**Languages**
- TypeScript 5.9 (strict mode; `src/` only for app code).
- SQL (Supabase migrations).
- HTML/CSS (via JSX and Tailwind).

**Frontend frameworks/libraries**
- react 19.2.0
- react-dom 19.2.0
- react-router-dom 7.13.0
- zustand 5.0.11
- lucide-react 0.563.0
- tailwindcss 4.1.18
- @tailwindcss/postcss 4.1.18
- autoprefixer 10.4.24
- postcss 8.5.6

**Backend/database**
- @supabase/supabase-js 2.95.3
- Supabase (PostgreSQL, Auth, Edge Functions on Deno)

**AI/ML**
- Google Gemini (gemini-2.0-flash, gemini-2.0-flash-lite)
- @google/generative-ai 0.24.1 (used in Edge Functions via esm.sh 0.1.3 in generate-recipe/generate-substitutions)

**Testing**
- vitest 4.0.18
- @vitest/coverage-v8 4.0.18
- @vitest/ui 4.0.18
- @testing-library/react 16.3.2
- @testing-library/jest-dom 6.9.1
- @testing-library/user-event 14.6.1
- jsdom 28.1.0
- msw 2.12.10 (integration tests)

**DevOps/CI**
- GitHub Actions (`.github/workflows/ci.yml`): jobs lint, typecheck, test, build (build depends on first three).
- Node 20; `npm ci`; `npm run lint`, `npm run format:check`, `npx tsc --noEmit`, `npm run test:run`, `npm run build`.
- gh-pages 6.3.0 (deploy).
- supabase CLI 2.76.15 (dev).

**Build tools**
- vite 7.3.1
- @vitejs/plugin-react 5.1.1
- dotenv 17.3.1

**Code quality**
- eslint 9.39.1 with @eslint/js, typescript-eslint 8.56.1, eslint-plugin-react, react-hooks, react-refresh, eslint-config-prettier.
- prettier 3.8.1
- husky 9.1.7
- lint-staged 16.3.2 (eslint --fix + prettier --write on `*.{ts,tsx}`).

**Types**
- @types/react 19.2.7
- @types/react-dom 19.2.3

---

## 4. ENGINEERING PRACTICES

**Testing**
- **Total tests:** 154 (13 test files).
- **Unit:** Vitest; store tests (pantryStore, recipeStore, shoppingListStore), recipeService (generateRecipe, getSubstitutions with mocked Supabase and cache/rateLimiter), recipeMatching (51 tests: normalize, getMatchStatus, getRecipeMatches, confidence, qualifiers, plurals, canMake, edge cases, large arrays), cache (10), rateLimiter (8), expiryChecker (10).
- **Component:** SignInPage, SignUpPage, AddItemForm, ShoppingListPage, RecipeCard (with mocked recipeStore).
- **Integration:** MSW; pantryFlow (add pantry item, appears in list), shoppingListFlow (add item to list), favoritesFlow (toggleFavorite, error handling).
- **Setup:** `src/test/setup.ts` (jest-dom, seedData mock); `src/test/mocks/server.ts`, `handlers.ts` for MSW.
- **Coverage:** `vitest run --coverage` with @vitest/coverage-v8.

**TypeScript**
- **Strict:** `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `forceConsistentCasingInFileNames` in `tsconfig.json`.
- **Custom types:** `src/types/database.ts` (PantryItem, Recipe, RecipeIngredient, ShoppingListItem, FavoriteRecipe), `src/types/ai.ts` (GeminiRecipeResponse, GeminiSubstitution, GeminiScanResultItem, EdgeFunctionResponse), `src/types/matching.ts` (IngredientMatch, MatchResult), `src/types/store.ts` (PantryStore, RecipeStore, ShoppingListStore), `src/types/seed.ts` (SeedRecipe); re-exported from `src/types/index.ts`. No `any` in production code (eslint warn on explicit any).

**CI/CD**
- **Pipeline:** On push/PR to `main`: lint (eslint + format:check), typecheck (tsc --noEmit), test (vitest run), build (vite build). Build job `needs: [lint, typecheck, test]`.

**Linting and formatting**
- **ESLint:** Flat config; TypeScript recommended, React and React Hooks recommended, react-refresh, no-unused-vars (args/vars ignore pattern `^_`), no-explicit-any warn, Prettier disables conflicting rules.
- **Prettier:** Applied to `src/`.
- **Pre-commit:** Husky `prepare`; lint-staged runs `eslint --fix` and `prettier --write` on staged `*.ts,*.tsx`.

**Error handling**
- **Custom errors:** `AppError`, `NetworkError`, `AuthError`, `AIError`, `ValidationError` in `src/utils/errors.ts` (code, statusCode, context). `handleError(unknown)` normalizes to AppError; `getErrorMessage()` returns user-facing strings.
- **Stores:** All async actions catch, call `handleError`/`getErrorMessage`, set `error` in state, and `logger.error(SOURCE, message, { error })`.
- **Error boundaries:** Root `ErrorBoundary` (reload page); `SectionErrorBoundary` (section name, optional fallback, “Try again” reset). Section boundary logs via `logger.error`.
- **Retry:** `withRetry()` in `src/utils/retry.ts` (exponential backoff, max 3 retries, retries on network/5xx). Used where needed (e.g. optional for critical paths); stores do not use retry by default.

**Logging**
- **Utility:** `src/utils/logger.ts`; `logger.info/warn/error/debug(source, message, context?)`. Format: `[timestamp] [LEVEL] [source] message {context}`.
- **Dev vs prod:** In production, `info` and `debug` are no-ops; only `warn` and `error` output.

**Performance**
- **Code splitting:** All route components lazy-loaded (`React.lazy`); Suspense with `PageLoader` in App.
- **Manual chunks (Vite):** `react-vendor` (react, react-dom), `supabase`, `router` (react-router-dom) in `vite.config.ts`.
- **Memoization:** `memo(RecipeCardInner)`, `memo(PantryItemRow)`, `memo(ShoppingListItemRow)`; `useMemo` for sorted/filtered recipes with match results and for dashboard stats.
- **Bundle optimization:** Recipe seed data moved out of bundle: `recipes_with_images.json` in `public/data/`; fetched at runtime via `fetchSeedRecipes()` in `seedData.ts`; RecipesPage chunk reduced from ~3,572 kB to ~8 kB.
- **Images:** `OptimizedImage` with `loading="lazy"`, placeholder, error fallback, opacity transition to avoid layout shift.
- **Recipe matching:** Set-based pantry lookup O(P + R) instead of O(P × R) in `recipeMatching.ts`.

**Caching**
- **In-memory cache:** `ResponseCache` in `src/utils/cache.ts`; `get/set/invalidate/clear`, `generateKey(...args)` (deterministic, sorts arrays). TTL default 30 min. Used in `recipeService` for generate-recipe (key = sorted pantry names) and generate-substitutions (key = recipe title + sorted missing ingredients). Scan-pantry not cached.

**Rate limiting**
- **Client-side:** `RateLimiter` in `src/utils/rateLimiter.ts`; sliding window (e.g. 10 requests per 60s); `canMakeRequest()`, `recordRequest()`, `getTimeUntilNextSlot()`, `getRemainingRequests()`. Singleton `aiRateLimiter`. Applied in `recipeService` before each AI call; UI disables buttons and shows “Try again in X seconds” with 1s interval countdown.

---

## 5. ALGORITHM DETAILS (Recipe Matching)

**Location:** `src/utils/recipeMatching.ts`; types in `src/types/matching.ts`.

**Approach**
- **Set-based lookup:** Build a `Set` of normalized pantry tokens (full normalized names plus per-word tokens) in O(P × w). For each recipe ingredient, O(1) membership checks and substring/word passes over the set. Overall **time O(P + R)** (with constant-time lookups), **space O(P × w + R)**.
- **Functions:** `normalize(str)`, `buildPantryLookup(pantryItems)`, `computeIngredientMatch(recipeIngredient, pantrySet, pantryItems)`, `getRecipeMatches(pantryItems, recipe)` → `MatchResult`, `getMatchStatus(recipeIngredients, pantryItems)` → legacy `MatchStatus` (implemented via getRecipeMatches).

**Normalization**
- Lowercase, trim, remove non-alphanumeric (keep spaces).
- Remove qualifier words: fresh, dried, ground, chopped, diced, minced, sliced, organic, frozen, canned, raw, cooked, grated, crushed, whole, extra, virgin, low, reduced, fat, sodium.
- Plural → singular via regex list: tomatoes→tomato, potatoes→potato, eggs→egg, onions→onion, etc. (about 22 patterns).

**Match types and confidence**
- **Exact (100):** Normalized recipe ingredient equals a pantry token.
- **Partial (80):** Pantry contains recipe token or recipe contains pantry token (e.g. “diced tomatoes” vs “tomato”); or a recipe word is in the pantry set.
- **Fuzzy (50–70):** Word overlap (e.g. word includes key or key includes word); score 60 or 80 depending on full word match.
- **None (0):** No match; ingredient goes to `missingIngredients`.

**Output**
- `MatchResult`: recipeId, recipeTitle, matchedIngredients (array of IngredientMatch), missingIngredients, matchPercentage (0–100), canMake (true if matchPercentage ≥ 80).
- `IngredientMatch`: recipeIngredient, pantryMatch (or null), confidence (0–100), matchType ('exact'|'partial'|'fuzzy'|'none').

**Tests**
- **51 tests** in `src/utils/__tests__/recipeMatching.test.ts`: normalize (null, empty, case, trim, special chars, plurals), getMatchStatus (structure, exact, case-insensitive, substring, empty pantry/ingredients, partial, duplicates, no match, score rounding, null inputs, pantry undefined name, tomato/tomatoes, preserve original strings), getRecipeMatches (MatchResult shape, IngredientMatch shape, exact 100, partial 80, no match, canMake true/false at 80%, qualifier removal, plural handling, matchType, empty/undefined/single-char, large arrays 150 pantry / 120 ingredients, agreement with getMatchStatus, fuzzy range).

---

## 6. AI INTEGRATION DETAILS

**1. Magic Recipe Generation (`generate-recipe`)**
- **What it does:** Returns one recipe (title, description, ingredients, instructions, cooking_time, missing_ingredients) from current pantry items.
- **Model:** Gemini 2.0 Flash (text); `genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })`.
- **Prompt:** “You are a master chef. Based on these pantry items: [list]. Suggest a creative and delicious recipe. Return ONLY a valid JSON object with this structure: { title, description, ingredients, instructions, cooking_time, missing_ingredients }. Do not include markdown formatting or backticks.”
- **Parsing:** `response.text()` → strip ```json and ``` → `JSON.parse` → `isRecipeShape(recipe)` (title string, ingredients array, instructions array). If instructions is string, convert to single-element array.
- **Errors:** Invalid JSON → 400 AI_INVALID_RESPONSE. Wrong shape → 400 AI_INVALID_STRUCTURE. Rate limit / timeout → 400 with user-friendly message. GEMINI_API_KEY unset → 400 CONFIG.

**2. Smart Substitutions (`generate-substitutions`)**
- **What it does:** Returns up to 3 substitutions per missing ingredient (missing, substitution, reason) given recipe title, missing ingredients, and pantry.
- **Model:** Same Gemini 2.0 Flash.
- **Prompt:** “The user wants to cook “[recipeTitle]”. They are missing: [list]. They have in pantry: [list]. Suggest 3 practical substitutions. Prioritize pantry items. Return ONLY a valid JSON array of { missing, substitution, reason }. No markdown.”
- **Parsing:** Strip markdown → parse → `isSubstitutionShape(arr)` (array of objects with missing, substitution, reason).
- **Errors:** Same pattern as generate-recipe (validation, rate limit, timeout).

**3. Fridge Scanner (`scan-pantry`)**
- **What it does:** Accepts base64 image; returns JSON array of { name, quantity, unit } for identified ingredients.
- **Model:** Gemini 2.0 Flash Lite (multimodal); called via REST `generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent`.
- **Payload:** `contents[0].parts`: [ { text: “Analyze this image... List every food ingredient... Return purely a JSON array of objects with name, quantity, unit...” }, { inline_data: { mime_type: 'image/jpeg', data: image } } ]. generationConfig: temperature 0.4, topK 32, topP 1, maxOutputTokens 1024.
- **Parsing:** Extract text from `candidates[0].content.parts[0].text`; strip markdown; `JSON.parse`; assert Array.isArray.
- **Errors:** 429 → rate limit message; 5xx → AI_SERVER_ERROR; invalid JSON → AI_INVALID_RESPONSE; non-array → AI_INVALID_STRUCTURE. Not cached.

**Frontend**
- **recipeService.ts:** Before each AI call: check `aiRateLimiter.canMakeRequest()`; if false, throw with “Try again in X seconds”. For generate-recipe and getSubstitutions, check `responseCache.get(key)` first; on miss call Edge Function, then `responseCache.set(key, data)` and `aiRateLimiter.recordRequest()`. Scan-pantry not cached; rate limiter still applied in PantryScanner before invoke and recordRequest after success.

---

## 7. METRICS AND NUMBERS

- **Total lines of code (src TS/TSX):** ~7,000 (measured: 6,989 lines in `src` for `.ts` and `.tsx`).
- **React components (TSX):** 25+ (pages, shared components, common/, dashboard/, recipes/; excludes test files).
- **Number of tests:** 154 across 16 test files (unit: stores, services, utils; component: SignIn, SignUp, AddItemForm, ShoppingListPage, RecipeCard; integration: pantry, shopping list, favorites).
- **Edge Functions:** 4 (generate-recipe, generate-substitutions, scan-pantry, delete-account).
- **TypeScript type definition files:** 6 under `src/types/` (database, ai, store, matching, seed, index); multiple interfaces and types per file.
- **Zustand stores:** 3 (pantryStore, recipeStore, shoppingListStore).
- **Database tables with RLS:** 4 (pantry_items, recipes, shopping_list, favorites); each with full CRUD policies per user.
- **RecipesPage chunk size:** ~8.39 kB (gzip ~3.2 kB) after moving recipe seed data to `public/data/` and runtime fetch. **Before optimization:** RecipesPage chunk was ~3,572 kB (recipe JSON in bundle). **Reduction:** ~99.8% chunk size reduction for that route.
- **Main bundle (index):** ~202 kB gzip; vendor chunks: react-vendor, supabase ~170 kB gzip, router ~47 kB gzip.
- **Recipe matching tests:** 51 (normalize, getMatchStatus, getRecipeMatches, confidence, qualifiers, plurals, edge cases, large arrays).

---

## 8. KEY DESIGN DECISIONS

1. **Supabase Edge Functions for all Gemini calls** — Keeps Gemini API key off the client and allows validation, retries, and consistent error codes on the server. Enables future server-side rate limiting or caching at the edge.

2. **Zustand over Redux** — One store per domain (pantry, recipes, shopping list) with minimal boilerplate. Fits async CRUD and error state without middleware; no global reducer tree.

3. **Set-based recipe matching with normalization** — O(P + R) lookup and deterministic keys (normalized + qualifier/plural rules) so “fresh basil” and “basil” match. Confidence levels (exact/partial/fuzzy) support “can make” (≥80%) and “almost there” (60–79%) for UX and dashboard stats.

4. **Recipe seed data outside the bundle** — Moving `recipes_with_images.json` to `public/data/` and fetching at runtime (with base path for GitHub Pages) reduced RecipesPage chunk from ~3.5 MB to ~8 KB and avoided loading large JSON in tests (mock fetch/seedData instead).

5. **Client-side rate limiting and response cache** — Protects against accidental API abuse and improves repeat usage (same pantry → cached recipe). Regenerate button invalidates cache for that key so users can force a fresh result.

6. **HashRouter for GitHub Pages** — Allows the app to run on `username.github.io/repo/` without server config; base path `/PANTRYCHEFFV3/` and `import.meta.env.BASE_URL` used for fetch and assets.

7. **Structured errors and logging** — AppError hierarchy and handleError/getErrorMessage give consistent error handling and user-facing messages; logger with source and context supports debugging while keeping prod logs minimal (warn/error only).

---

## 9. PROBLEMS SOLVED

1. **RecipesPage bundle size (~3,572 kB)** — Cause: large `recipes_with_images.json` imported in component/seed flow. Fix: Move JSON to `public/data/recipes_with_images.json`; add `seedData.ts` with `fetchSeedRecipes()` (uses `import.meta.env.BASE_URL`); SeedButton and any seed path fetch at runtime; remove static import. Result: RecipesPage chunk ~8 kB.

2. **Test OOM / heavy JSON in tests** — Avoiding static import of recipe JSON in test runs. Fix: Mock `fetchSeedRecipes` (or fetch) in `src/test/setup.ts` to return `[]` so no real file load in tests.

3. **Recipe matching scalability** — Original logic could do O(P × R) work (each recipe ingredient checked against many pantry strings). Fix: Build a Set of normalized pantry tokens once; per-ingredient lookup and substring checks against the set. Documented O(P + R) in JSDoc; tests with 150 pantry / 120 recipe ingredients verify no degradation.

4. **Date/timezone in expiry alerts** — Parsing "YYYY-MM-DD" with `new Date(str)` uses UTC and caused “today” to be “expired” in some timezones. Fix: Parse date parts (y, m, d) and use `new Date(y, m-1, d)` for local date; same in tests with `todayISO()` and `addDays()` using local date math.

5. **TypeScript strictness catching bugs** — Strict mode and noUnusedLocals/noUnusedParameters surface missing null checks and unused parameters. Typed stores (PantryStore, RecipeStore, ShoppingListStore) and typed Edge Function responses (GeminiRecipeResponse, etc.) keep contracts clear and prevent shape mismatches.

6. **Consistent error handling across stores** — Each store could throw raw Supabase or network errors. Fix: Centralized `handleError()` and `getErrorMessage()`; stores catch, normalize to AppError, set user-facing `error` string, and log with `logger.error(SOURCE, ...)` so UI and logs are consistent.

7. **Auth recovery flow on GitHub Pages** — Reset password link must point to the correct hash and exchange code for session. Fix: Detect `type=recovery` and `code=` in URL; call `exchangeCodeForSession(code)`; redirect to `#/auth/reset-password`; session storage flag for recovery state; timeout fallback so user is not stuck.

---

*End of document. Use sections 1–9 to update your resume and to prepare for interviews.*
