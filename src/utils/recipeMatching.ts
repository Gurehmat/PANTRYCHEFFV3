/**
 * Recipe–pantry matching: normalize ingredient names, score matches by confidence,
 * and compute match percentage with O(P + R) lookup via a pantry Set.
 */
import type { IngredientMatch, MatchResult } from '../types/matching';

/** Qualifiers we strip so "fresh basil" and "basil" match. */
const QUALIFIERS = new Set([
  'fresh',
  'dried',
  'ground',
  'chopped',
  'diced',
  'minced',
  'sliced',
  'organic',
  'frozen',
  'canned',
  'raw',
  'cooked',
  'grated',
  'crushed',
  'whole',
  'extra',
  'virgin',
  'low',
  'reduced',
  'fat',
  'sodium',
]);

/** Plural → singular for common ingredients (used after stripping qualifiers). */
const PLURALS: [RegExp, string][] = [
  [/tomatoes$/i, 'tomato'],
  [/potatoes$/i, 'potato'],
  [/berries$/i, 'berry'],
  [/strawberries$/i, 'strawberry'],
  [/blueberries$/i, 'blueberry'],
  [/blackberries$/i, 'blackberry'],
  [/raspberries$/i, 'raspberry'],
  [/cherries$/i, 'cherry'],
  [/eggs$/i, 'egg'],
  [/onions$/i, 'onion'],
  [/peppers$/i, 'pepper'],
  [/carrots$/i, 'carrot'],
  [/beans$/i, 'bean'],
  [/herbs$/i, 'herb'],
  [/leaves$/i, 'leaf'],
  [/cloves$/i, 'clove'],
  [/slices$/i, 'slice'],
  [/pieces$/i, 'piece'],
  [/cups$/i, 'cup'],
  [/tablespoons$/i, 'tablespoon'],
  [/teaspoons$/i, 'teaspoon'],
];

/**
 * Normalizes a string for matching: lowercase, trim, remove non-alphanumeric (keep spaces),
 * remove common qualifiers, and reduce common plurals to singular.
 *
 * @description Produces a canonical form for ingredient names so "Fresh Basil", "basil", and
 * "dried basil" can be compared. Also maps "tomatoes" → "tomato", "eggs" → "egg", etc.
 * @param str - Input string (falsy returns '').
 * @returns Normalized string (may be empty).
 * @example
 * normalize('  Fresh Diced Tomatoes  ') // => 'tomato'
 * normalize('2 large eggs')             // => '2 large egg'
 * @complexity Time O(n), Space O(n) where n = length of str.
 */
export function normalize(str: string | null | undefined): string {
  if (!str) return '';
  let s = String(str)
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .trim();
  // Remove qualifier words (e.g. "fresh basil" → "basil")
  s = s
    .split(/\s+/)
    .filter((w) => w.length > 0 && !QUALIFIERS.has(w))
    .join(' ');
  // Apply plural → singular for known patterns (word-final)
  for (const [re, singular] of PLURALS) {
    s = s.replace(re, singular);
  }
  return s.trim();
}

/**
 * Pantry item shape used for matching (at least has name).
 */
export interface PantryItemLike {
  name?: string | null;
}

/**
 * Legacy match status: matches, missing arrays and 0–100 score.
 * Kept for backward compatibility; prefer MatchResult from getRecipeMatches.
 */
export interface MatchStatus {
  matches: string[];
  missing: string[];
  score: number;
}

/** Recipe-like shape for getRecipeMatches: id, title, and list of ingredient strings. */
export interface RecipeLike {
  id: string;
  title: string;
  ingredients: string[] | Array<{ name?: string }>;
}

/**
 * Builds a Set of normalized pantry tokens for O(1) lookup.
 * Each pantry item name is normalized and added; we also add each word token
 * so "parmesan cheese" adds both "parmesan" and "cheese" for partial matching.
 *
 * @param pantryItems - Array of objects with at least a `name` property.
 * @returns Set of normalized strings (full names and single-word tokens).
 * @complexity Time O(P * w), Space O(P * w) where P = pantry length, w = avg words per name.
 */
function buildPantryLookup(pantryItems: PantryItemLike[]): Set<string> {
  const set = new Set<string>();
  for (const item of pantryItems) {
    const name = item?.name;
    if (name == null || String(name).trim() === '') continue;
    const norm = normalize(name);
    if (norm) set.add(norm);
    // Add each word for partial/fuzzy: "diced tomatoes" → "tomato" (already from normalize)
    const words = norm.split(/\s+/).filter((w) => w.length > 1);
    for (const w of words) set.add(w);
  }
  return set;
}

/**
 * Extracts the display string from a recipe ingredient (string or object with name).
 */
function recipeIngredientToString(ing: string | { name?: string }): string {
  if (typeof ing === 'string') return ing;
  const name = (ing as { name?: string }).name;
  return name != null ? String(name) : '';
}

/**
 * Computes confidence (0–100) and match type for one recipe ingredient against the pantry Set.
 * - Exact: normalized recipe text equals a pantry entry (or pantry contains full recipe token): 100.
 * - Partial: pantry contains recipe token or recipe contains pantry token: 80.
 * - Fuzzy: any word overlap: 50–70.
 * - None: 0.
 *
 * @param recipeIngredientRaw - Raw recipe ingredient string (preserved in result).
 * @param pantrySet - Set of normalized pantry strings from buildPantryLookup.
 * @param pantryItems - Original pantry items to resolve matched pantry name for display.
 * @returns IngredientMatch with recipeIngredient, pantryMatch (or null), confidence, matchType.
 * @complexity Time O(Rw), Space O(1) per ingredient where Rw = words in recipe ingredient.
 */
function computeIngredientMatch(
  recipeIngredientRaw: string,
  pantrySet: Set<string>,
  pantryItems: PantryItemLike[]
): IngredientMatch {
  const trimmed = String(recipeIngredientRaw).trim();
  if (!trimmed) {
    return { recipeIngredient: trimmed, pantryMatch: null, confidence: 0, matchType: 'none' };
  }
  const norm = normalize(trimmed);
  if (!norm) {
    return { recipeIngredient: trimmed, pantryMatch: null, confidence: 0, matchType: 'none' };
  }

  // Exact: full normalized string in pantry
  if (pantrySet.has(norm)) {
    const pantryMatch = findPantryNameForNormalized(pantryItems, norm);
    return { recipeIngredient: trimmed, pantryMatch, confidence: 100, matchType: 'exact' };
  }

  // Check each word of the recipe ingredient (e.g. "2 large eggs" → ["2","large","egg"])
  const words = norm.split(/\s+/).filter((w) => w.length > 0);
  let bestScore = 0;
  let bestType: IngredientMatch['matchType'] = 'none';
  let matchedPantry: string | null = null;

  for (const word of words) {
    if (word.length <= 1) continue; // skip single chars
    if (pantrySet.has(word)) {
      // Word exact in pantry → partial match
      if (80 > bestScore) {
        bestScore = 80;
        bestType = 'partial';
        matchedPantry = findPantryNameForNormalized(pantryItems, word);
      }
    }
  }

  // Partial: recipe contains a pantry key or pantry contains recipe key (e.g. "diced tomatoes" vs pantry "tomato")
  if (bestScore === 80) {
    return {
      recipeIngredient: trimmed,
      pantryMatch: matchedPantry,
      confidence: 80,
      matchType: 'partial',
    };
  }

  // Check if any pantry key is contained in recipe or recipe in pantry (substring)
  for (const key of pantrySet) {
    if (key.length <= 1) continue;
    if (norm.includes(key) || key.includes(norm)) {
      const score = norm === key ? 100 : 80;
      if (score > bestScore) {
        bestScore = score;
        bestType = score === 100 ? 'exact' : 'partial';
        matchedPantry = findPantryNameForNormalized(pantryItems, key);
      }
    }
  }
  if (bestScore >= 80) {
    return {
      recipeIngredient: trimmed,
      pantryMatch: matchedPantry,
      confidence: bestScore,
      matchType: bestType,
    };
  }

  // Fuzzy: word overlap (e.g. "parmesan cheese" vs "cheese" — already caught by word exact; try partial word)
  for (const word of words) {
    if (word.length < 3) continue;
    for (const key of pantrySet) {
      if (key.length < 3) continue;
      if (word.includes(key) || key.includes(word)) {
        const score = word === key ? 80 : 60;
        if (score > bestScore) {
          bestScore = score;
          bestType = 'fuzzy';
          matchedPantry = findPantryNameForNormalized(pantryItems, key);
        }
      }
    }
  }
  if (bestScore >= 50) {
    return {
      recipeIngredient: trimmed,
      pantryMatch: matchedPantry,
      confidence: bestScore,
      matchType: 'fuzzy',
    };
  }

  return { recipeIngredient: trimmed, pantryMatch: null, confidence: 0, matchType: 'none' };
}

/** Finds an original pantry item name whose normalized form equals the given key. */
function findPantryNameForNormalized(pantryItems: PantryItemLike[], key: string): string | null {
  for (const item of pantryItems) {
    const name = item?.name;
    if (name != null && normalize(name) === key) return String(name).trim();
    if (name != null && normalize(name).split(/\s+/).includes(key)) return String(name).trim();
  }
  return null;
}

/**
 * Computes match result for one recipe against the pantry: per-ingredient matches,
 * missing list, match percentage, and canMake (true when matchPercentage >= 80).
 *
 * @description Uses a Set of normalized pantry names for O(1) lookups. For each recipe
 * ingredient we compute confidence (exact 100, partial 80, fuzzy 50–70, none 0) and
 * aggregate into matchPercentage. canMake is true when matchPercentage >= 80.
 * @param pantryItems - Array of pantry items (at least `name`).
 * @param recipe - Recipe with id, title, and ingredients (strings or objects with name).
 * @returns MatchResult with recipeId, recipeTitle, matchedIngredients, missingIngredients,
 *          matchPercentage (0–100), and canMake.
 * @example
 * const result = getRecipeMatches(
 *   [{ name: 'tomato' }, { name: 'basil' }],
 *   { id: '1', title: 'Salad', ingredients: ['2 tomatoes', 'fresh basil'] }
 * );
 * // result.matchPercentage === 100, result.canMake === true
 * @complexity Time O(P*w + R*Rw), Space O(P*w + R). With Set lookup, each ingredient
 *             is processed in O(Rw) or O(pantrySet.size) for substring pass; typically O(P + R).
 */
export function getRecipeMatches(
  pantryItems: PantryItemLike[] | null | undefined,
  recipe: RecipeLike
): MatchResult {
  const safePantry = Array.isArray(pantryItems) ? pantryItems : [];
  const ingredientsRaw = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const recipeIngredients = ingredientsRaw
    .map(recipeIngredientToString)
    .filter((s) => s.trim() !== '');

  // Build pantry lookup once — O(P) with O(1) lookups for each recipe ingredient
  const pantrySet = buildPantryLookup(safePantry);

  const matchedIngredients: IngredientMatch[] = [];
  const missingIngredients: string[] = [];

  for (const raw of recipeIngredients) {
    const match = computeIngredientMatch(raw, pantrySet, safePantry);
    if (match.confidence > 0) {
      matchedIngredients.push(match);
    } else {
      missingIngredients.push(match.recipeIngredient);
    }
  }

  const total = recipeIngredients.length;
  const matchPercentage = total > 0 ? Math.round((matchedIngredients.length / total) * 100) : 0;
  const canMake = matchPercentage >= 80;

  return {
    recipeId: recipe.id,
    recipeTitle: recipe.title,
    matchedIngredients,
    missingIngredients,
    matchPercentage,
    canMake,
  };
}

/**
 * Computes match status between recipe ingredients and pantry items (legacy API).
 * Uses the same algorithm as getRecipeMatches and maps to MatchStatus for backward compatibility.
 *
 * @description Returns matches (matched recipe ingredient strings), missing (unmatched),
 * and score 0–100. Implemented via getRecipeMatches so behavior stays consistent.
 * @param recipeIngredients - Array of recipe ingredient strings (e.g. "2 eggs").
 * @param pantryItems - Array of objects with at least a `name` property.
 * @returns MatchStatus with matches, missing, and score (0–100).
 * @example
 * const { matches, missing, score } = getMatchStatus(['flour', 'milk'], [{ name: 'flour' }]);
 * // matches === ['flour'], missing === ['milk'], score === 50
 * @complexity Time O(P + R), Space O(P + R) — same as getRecipeMatches (Set-based lookup).
 */
export function getMatchStatus(
  recipeIngredients: string[] | null | undefined,
  pantryItems: PantryItemLike[] | null | undefined
): MatchStatus {
  const safeIngredients = Array.isArray(recipeIngredients) ? recipeIngredients : [];
  const result = getRecipeMatches(pantryItems, {
    id: '',
    title: '',
    ingredients: safeIngredients,
  });
  const matches = result.matchedIngredients.map((m) => m.recipeIngredient);
  return {
    matches,
    missing: result.missingIngredients,
    score: result.matchPercentage,
  };
}
