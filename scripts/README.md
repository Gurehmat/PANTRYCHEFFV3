# Scripts

Developer utilities. Run from **project root**, e.g. `node scripts/check-db.js`.

| Script | Purpose |
|--------|--------|
| `check-db.js` | Quick check of Supabase `recipes` table (requires `.env`) |
| `check-images.js` | Count recipes missing images in `src/data/recipes_with_images.json` |
| `test-generate.js` | Test `generate-recipe` Edge Function (requires `.env`) |
| `test-urls.js` | Test sample recipe image URLs |
| `verify-deployment.js` | Call Edge Functions via fetch; writes `verification_result.json` to project root |
| `deduplicate_recipes.js` | Remove duplicate recipe names from `src/data/recipes.json` |
| `fix_duplicates.sql` | RLS policies for recipes — run in Supabase SQL Editor |
| `generate-curated-recipes.mjs` | Fetch recipes from TheMealDB, write `src/data/curated_recipes.json` |
| `add-recipe-images.mjs` | Add image URLs to recipe data |
