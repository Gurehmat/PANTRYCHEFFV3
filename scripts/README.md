# Scripts

Developer utilities. Run from **project root**, e.g. `node scripts/check-db.js`.


| Script                  | Purpose                                                                                                                                                                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `cleanRecipes.js`       | Clean Spoonacular recipe JSON: strip HTML from Method/Description, split steps (newlines + period+capital), extract PrepTime/Calories/Protein/Fat. Usage: `node scripts/cleanRecipes.js [input.json] [output.json]` (default: `src/data/recipes_with_images.json`) |
| `check-db.js`           | Quick check of Supabase `recipes` table (requires `.env`)                                                                                                                                                                                                          |
| `check-images.js`       | Count recipes missing images in `src/data/recipes_with_images.json`                                                                                                                                                                                                |
| `test-generate.js`      | Test `generate-recipe` Edge Function (requires `.env`)                                                                                                                                                                                                             |
| `test-urls.js`          | Test sample recipe image URLs                                                                                                                                                                                                                                      |
| `verify-deployment.js`  | Call Edge Functions via fetch; writes `verification_result.json` to project root                                                                                                                                                                                   |
| `fix_duplicates.sql`    | RLS policies for recipes — run in Supabase SQL Editor                                                                                                                                                                                                              |
| `add-recipe-images.mjs` | Add image URLs to recipe data                                                                                                                                                                                                                                      |


