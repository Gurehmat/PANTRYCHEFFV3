# PantryCheff

PantryCheff is a full‑stack app that helps you cook from what you already have. It tracks pantry items, suggests recipes you can make, and uses AI to scan your fridge and generate “magic” recipes plus ingredient substitutions.

## Live Demo

Check out the live application here: [https://gurehmat.github.io/PANTRYCHEFFV3/#/](https://gurehmat.github.io/PANTRYCHEFFV3/#/)

## Tech stack

- **Frontend**: React (Vite), React Router, Zustand, Tailwind CSS  
- **Backend**: Supabase (Postgres, Auth, Edge Functions)  
- **AI**: Google Gemini via Supabase Edge Functions  
- **Build/Deploy**: Vite, GitHub Pages

## Features

- **Email/password auth** with Supabase (sign in, sign up, forgot password, reset password via email link)  
- **Landing page** for guests and a **dashboard** for signed‑in users  
- **Pantry management**  
  - Add/edit/delete pantry items  
  - Bulk add from AI fridge scans  
- **Recipe browser**  
  - Curated recipes seeded from a dataset  
  - Detail view with ingredients and instructions  
  - Favorites list  
- **Magic Recipe (AI)**  
  - Send current pantry items to a Gemini‑backed Edge Function  
  - Get back a structured recipe: title, description, ingredients, instructions, cooking time, missing ingredients  
- **Ingredient substitutions (AI)**  
  - For a given recipe + missing items, get Gemini‑generated substitution suggestions  
- **Shopping list**  
  - Add missing ingredients from recipes into a shopping list  
- **Fridge / pantry scanner (AI)**  
  - Upload or capture a photo  
  - Supabase Edge Function calls Gemini’s multimodal API  
  - Returns parsed ingredients (name, quantity, unit) ready to add into the pantry  

## Project structure

- `src/`  
  - `App.jsx`: routing and session handling (public landing vs. protected app)  
  - `components/`  
    - `LandingPage.jsx`: marketing / overview page  
    - `SignInPage.jsx`, `SignUpPage.jsx`: sign in and create account  
    - `ForgotPasswordPage.jsx`, `ResetPasswordPage.jsx`: password reset flow  
    - `Navbar.jsx`, `Layout.jsx`: shared shell for authenticated pages  
    - `Dashboard.jsx`: high‑level overview  
    - `PantryPage.jsx`, `PantryList.jsx`, `AddItemForm.jsx`, `PantryScanner.jsx`  
    - `RecipesPage.jsx`, `RecipeDetailPage.jsx`, `RecipeCard.jsx`, `RecipeGenerator.jsx`  
    - `ShoppingListPage.jsx`, `FavoritesPage.jsx`  
  - `store/`  
    - `pantryStore.js`, `recipeStore.js`, `shoppingListStore.js` (Zustand state)  
  - `services/`  
    - `recipeService.js` (calls Supabase Edge Functions: `generate-recipe`, `generate-substitutions`)  
  - `lib/`  
    - `supabaseClient.js` (Supabase JS client)  
  - `data/`  
    - Recipe JSON files used to seed and match recipes  
- `scripts/`  
  - Developer utilities: `check-db.js`, `check-images.js`, `test-generate.js`, `test-urls.js`, `verify-deployment.js`, `deduplicate_recipes.js`, `fix_duplicates.sql`, `generate-curated-recipes.mjs`, `add-recipe-images.mjs`  
- `supabase/`  
  - `migrations/`: SQL schema and policy changes for recipes, pantry, shopping list, favorites  
  - `functions/`:  
    - `scan-pantry/`: Gemini multimodal image → ingredient list  
    - `generate-recipe/`: pantry items → structured recipe JSON  
    - `generate-substitutions/`: missing ingredients → substitution suggestions  
    - `delete-account/`: delete user account and data  

## Getting started

### Prerequisites

- Node.js (LTS)  
- A Supabase project  
- A Gemini API key (Google AI Studio / Vertex AI)

### 1. Clone and install

```bash
git clone https://github.com/<your-username>/PANTRYCHEFFV3.git
cd PANTRYCHEFFV3
npm install
```

### 2. Environment variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
# Optional: only if you call Gemini directly from frontend
# VITE_GEMINI_API_KEY=your_gemini_key
```

On Supabase, configure Edge Function secrets:

- `GEMINI_API_KEY` = your Gemini API key

Deploy/redeploy the Edge Functions after setting the secret.

### 3. Supabase setup

- Run the SQL in `supabase/migrations/` in the Supabase SQL editor, or use the Supabase CLI to apply migrations.  
- Make sure RLS policies on `recipes`, `favorites`, `shopping_list`, etc. match the policies in the migration files.

### 4. Run the dev server

```bash
npm run dev
```

Open the URL printed in the terminal (typically `http://localhost:5173`).

### 5. Deploy

The project is configured for GitHub Pages:

```bash
npm run build
npm run deploy
```

This builds the Vite app and publishes the `dist` folder to the `gh-pages` branch using `gh-pages`.

## Design & implementation notes

- **State management**: Zustand is used instead of Redux to keep state logic small and focused per domain (pantry, recipes, shopping list).  
- **AI isolation**: All Gemini calls happen from Supabase Edge Functions, not directly from the browser, so the API key stays on the server side.  
- **Data contracts**: The Edge Functions return strict JSON shapes (e.g. `title`, `description`, `ingredients`, `instructions`, etc.) which the frontend relies on; the functions defensively strip Markdown code fences and validate/normalize responses.  
- **Styling**: Tailwind is used for layout and design; the landing page is intentionally more polished, while app screens focus on clarity and usability.

## Scripts (developer utilities)

All in `scripts/`. Not required for running the app. Run from project root, e.g. `node scripts/check-db.js`.

- `check-db.js`: Quick Supabase recipes table check.  
- `check-images.js`: Count recipes missing images in `src/data/recipes_with_images.json`.  
- `test-generate.js`: Test `generate-recipe` Edge Function via Supabase client.  
- `test-urls.js`: Test sample recipe image URLs.  
- `verify-deployment.js`: Call Edge Functions via fetch; writes `verification_result.json`.  
- `deduplicate_recipes.js`: Remove duplicate recipe names from `src/data/recipes.json`.  
- `fix_duplicates.sql`: RLS policies for recipes (run in Supabase SQL editor).  
- `generate-curated-recipes.mjs`, `add-recipe-images.mjs`: Build curated recipe datasets.

## Possible future improvements

- Add pagination / filtering for recipes.  
- More granular pantry item editing (expiration dates, categories).  
- Better error reporting and fallback behavior when Gemini is rate limited or unavailable.  
- User‑customizable dietary preferences (vegan, halal, etc.) baked into recipe generation.



