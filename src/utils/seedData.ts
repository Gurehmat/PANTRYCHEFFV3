/**
 * Runtime load of seed recipe data from public folder.
 * Uses base path so it works on GitHub Pages (/PANTRYCHEFFV3/).
 * Fetched once and cached.
 */
import type { SeedRecipe } from '../types/seed';

const SEED_DATA_PATH = 'data/recipes_with_images.json';

function getBaseUrl(): string {
  const base = import.meta.env.BASE_URL;
  return base.endsWith('/') ? base : base + '/';
}

let cached: SeedRecipe[] | null = null;

export async function fetchSeedRecipes(): Promise<SeedRecipe[]> {
  if (cached) return cached;
  const url = getBaseUrl() + SEED_DATA_PATH;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load seed data: ${response.status}`);
  const data = (await response.json()) as SeedRecipe[];
  cached = data;
  return data;
}
