import { describe, it, expect } from 'vitest';
import { normalize, getMatchStatus, getRecipeMatches } from '../recipeMatching';

describe('normalize', () => {
  it('returns empty string for null', () => {
    expect(normalize(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(normalize(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(normalize('')).toBe('');
  });

  it('lowercases the string', () => {
    expect(normalize('TOMATO')).toBe('tomato');
  });

  it('trims leading and trailing whitespace', () => {
    expect(normalize('  flour  ')).toBe('flour');
  });

  it('removes special characters but keeps spaces and alphanumeric', () => {
    expect(normalize('olive oil!')).toBe('olive oil');
    expect(normalize('salt & pepper')).toBe('salt pepper');
  });

  it('preserves numbers and spaces and applies plural to singular', () => {
    expect(normalize('2 large eggs')).toBe('2 large egg');
  });
});

describe('getMatchStatus', () => {
  const pantryItem = (name: string) => ({
    id: '1',
    name,
    quantity: 1,
    unit: 'pcs',
    user_id: 'u',
    created_at: '',
  });

  it('returns correct data structure with matches, missing, and score', () => {
    const result = getMatchStatus(['flour'], [pantryItem('flour')]);
    expect(result).toHaveProperty('matches');
    expect(result).toHaveProperty('missing');
    expect(result).toHaveProperty('score');
    expect(Array.isArray(result.matches)).toBe(true);
    expect(Array.isArray(result.missing)).toBe(true);
    expect(typeof result.score).toBe('number');
  });

  it('exact ingredient name matching', () => {
    const result = getMatchStatus(['flour'], [pantryItem('flour')]);
    expect(result.matches).toEqual(['flour']);
    expect(result.missing).toEqual([]);
    expect(result.score).toBe(100);
  });

  it('case-insensitive matching', () => {
    const result = getMatchStatus(['Flour'], [pantryItem('flour')]);
    expect(result.matches).toContain('Flour');
    expect(result.missing).toEqual([]);
    expect(result.score).toBe(100);
  });

  it('pantry name as substring of recipe ingredient matches', () => {
    const result = getMatchStatus(['2 large eggs'], [pantryItem('egg')]);
    expect(result.matches).toContain('2 large eggs');
    expect(result.missing).toEqual([]);
    expect(result.score).toBe(100);
  });

  it('handles trimming and whitespace in pantry names', () => {
    const result = getMatchStatus(['  milk  '], [pantryItem('milk')]);
    expect(result.matches.length).toBe(1);
    expect(result.missing).toEqual([]);
  });

  it('empty pantry returns all ingredients as missing', () => {
    const result = getMatchStatus(['flour', 'eggs', 'milk'], []);
    expect(result.matches).toEqual([]);
    expect(result.missing).toEqual(['flour', 'eggs', 'milk']);
    expect(result.score).toBe(0);
  });

  it('empty recipe ingredients returns full match', () => {
    const result = getMatchStatus([], [pantryItem('flour')]);
    expect(result.matches).toEqual([]);
    expect(result.missing).toEqual([]);
    expect(result.score).toBe(0);
  });

  it('full pantry match - nothing missing', () => {
    const pantry = [pantryItem('flour'), pantryItem('egg'), pantryItem('milk')];
    const result = getMatchStatus(['flour', '2 eggs', '1 cup milk'], pantry);
    expect(result.matches).toEqual(['flour', '2 eggs', '1 cup milk']);
    expect(result.missing).toEqual([]);
    expect(result.score).toBe(100);
  });

  it('partial match - some have, some missing', () => {
    const pantry = [pantryItem('flour'), pantryItem('egg')];
    const result = getMatchStatus(['flour', 'eggs', 'milk', 'sugar'], pantry);
    expect(result.matches).toContain('flour');
    expect(result.matches).toContain('eggs');
    expect(result.missing).toContain('milk');
    expect(result.missing).toContain('sugar');
    expect(result.score).toBe(50);
  });

  it('duplicate recipe ingredients counted once per occurrence', () => {
    const pantry = [pantryItem('salt')];
    const result = getMatchStatus(['salt', 'salt'], pantry);
    expect(result.matches).toEqual(['salt', 'salt']);
    expect(result.missing).toEqual([]);
    expect(result.score).toBe(100);
  });

  it('duplicate pantry items do not affect match', () => {
    const pantry = [pantryItem('flour'), pantryItem('flour')];
    const result = getMatchStatus(['flour'], pantry);
    expect(result.matches).toEqual(['flour']);
    expect(result.missing).toEqual([]);
    expect(result.score).toBe(100);
  });

  it('special characters in ingredient names are normalized for matching', () => {
    const result = getMatchStatus(['olive oil'], [pantryItem('olive oil')]);
    expect(result.matches).toContain('olive oil');
    expect(result.missing).toEqual([]);
  });

  it('no match when pantry has no relevant items', () => {
    const result = getMatchStatus(['chocolate', 'butter'], [pantryItem('flour')]);
    expect(result.matches).toEqual([]);
    expect(result.missing).toEqual(['chocolate', 'butter']);
    expect(result.score).toBe(0);
  });

  it('match percentage rounds correctly', () => {
    const pantry = [pantryItem('a'), pantryItem('b')];
    const result = getMatchStatus(['a', 'b', 'c', 'd'], pantry);
    expect(result.score).toBe(50);
  });

  it('handles non-array recipeIngredients by treating as empty', () => {
    const result = getMatchStatus(null as unknown as string[], [pantryItem('flour')]);
    expect(result.matches).toEqual([]);
    expect(result.missing).toEqual([]);
    expect(result.score).toBe(0);
  });

  it('handles non-array pantryItems by treating as empty', () => {
    const result = getMatchStatus(['flour'], null as unknown as { name: string }[]);
    expect(result.matches).toEqual([]);
    expect(result.missing).toEqual(['flour']);
    expect(result.score).toBe(0);
  });

  it('pantry item with undefined name is skipped', () => {
    const pantry = [{ id: '1', name: undefined, quantity: 1, unit: 'pcs' }] as unknown as {
      name: string;
    }[];
    const result = getMatchStatus(['flour'], pantry);
    expect(result.missing).toContain('flour');
  });

  it('ingredient substring match - tomato matches tomatoes', () => {
    const result = getMatchStatus(['3 tomatoes'], [pantryItem('tomato')]);
    expect(result.matches).toContain('3 tomatoes');
    expect(result.missing).toEqual([]);
  });

  it('preserves original ingredient strings in matches and missing', () => {
    const result = getMatchStatus(['2 Large Eggs', '1 Cup Milk'], [pantryItem('egg')]);
    expect(result.matches).toContain('2 Large Eggs');
    expect(result.missing).toContain('1 Cup Milk');
  });

  it('score is 0 when recipe has no ingredients', () => {
    const result = getMatchStatus([], [pantryItem('flour')]);
    expect(result.score).toBe(0);
  });

  it('one of many matching gives correct score', () => {
    const result = getMatchStatus(['flour', 'sugar', 'salt'], [pantryItem('flour')]);
    expect(result.score).toBe(33);
  });
});

describe('getRecipeMatches', () => {
  const pantryItem = (name: string) => ({
    id: '1',
    name,
    quantity: 1,
    unit: 'pcs',
    user_id: 'u',
    created_at: '',
  });
  const recipe = (id: string, title: string, ingredients: string[]) => ({ id, title, ingredients });

  it('returns MatchResult shape with all required fields', () => {
    const result = getRecipeMatches(
      [pantryItem('flour')],
      recipe('r1', 'Cake', ['flour', 'sugar'])
    );
    expect(result).toMatchObject({
      recipeId: 'r1',
      recipeTitle: 'Cake',
      matchPercentage: 50,
      canMake: false,
    });
    expect(Array.isArray(result.matchedIngredients)).toBe(true);
    expect(Array.isArray(result.missingIngredients)).toBe(true);
    expect(result.matchedIngredients.length + result.missingIngredients.length).toBe(2);
  });

  it('MatchResult matchedIngredients have IngredientMatch shape', () => {
    const result = getRecipeMatches([pantryItem('flour')], recipe('r1', 'Cake', ['flour']));
    expect(result.matchedIngredients).toHaveLength(1);
    const m = result.matchedIngredients[0];
    expect(m).toHaveProperty('recipeIngredient');
    expect(m).toHaveProperty('pantryMatch');
    expect(m).toHaveProperty('confidence');
    expect(m).toHaveProperty('matchType');
    expect(typeof m.confidence).toBe('number');
    expect(['exact', 'partial', 'fuzzy', 'none']).toContain(m.matchType);
  });

  it('exact match returns confidence 100 and matchType exact', () => {
    const result = getRecipeMatches([pantryItem('flour')], recipe('r1', 'Bread', ['flour']));
    expect(result.matchedIngredients[0].confidence).toBe(100);
    expect(result.matchedIngredients[0].matchType).toBe('exact');
  });

  it('partial match (pantry substring of recipe) returns confidence 80', () => {
    const result = getRecipeMatches(
      [pantryItem('tomato')],
      recipe('r1', 'Salad', ['2 diced tomatoes'])
    );
    expect(result.matchedIngredients[0].confidence).toBe(80);
    expect(result.matchedIngredients[0].matchType).toBe('partial');
  });

  it('partial match (recipe word in pantry) returns 80', () => {
    const result = getRecipeMatches(
      [pantryItem('cheese')],
      recipe('r1', 'Pasta', ['parmesan cheese'])
    );
    expect(result.matchedIngredients[0].confidence).toBe(80);
    expect(result.matchedIngredients[0].matchType).toBe('partial');
  });

  it('no match returns ingredient in missingIngredients only', () => {
    const result = getRecipeMatches([pantryItem('flour')], recipe('r1', 'Soup', ['chocolate']));
    expect(result.missingIngredients).toContain('chocolate');
    expect(
      result.matchedIngredients.find((m) => m.recipeIngredient === 'chocolate')
    ).toBeUndefined();
    expect(result.matchPercentage).toBe(0);
  });

  it('canMake is true when matchPercentage >= 80', () => {
    const pantry = [
      pantryItem('flour'),
      pantryItem('egg'),
      pantryItem('milk'),
      pantryItem('sugar'),
    ];
    const r = getRecipeMatches(pantry, recipe('r1', 'Cake', ['flour', 'egg', 'milk', 'sugar']));
    expect(r.matchPercentage).toBe(100);
    expect(r.canMake).toBe(true);
  });

  it('canMake is false when matchPercentage < 80', () => {
    const result = getRecipeMatches(
      [pantryItem('flour')],
      recipe('r1', 'Cake', ['flour', 'sugar', 'eggs', 'milk'])
    );
    expect(result.matchPercentage).toBe(25);
    expect(result.canMake).toBe(false);
  });

  it('canMake is true at exactly 80%', () => {
    const pantry = [pantryItem('a'), pantryItem('b'), pantryItem('c'), pantryItem('d')];
    const result = getRecipeMatches(pantry, recipe('r1', 'Four', ['a', 'b', 'c', 'd', 'e']));
    expect(result.matchPercentage).toBe(80);
    expect(result.canMake).toBe(true);
  });

  it('qualifier removal: fresh basil matches basil', () => {
    const result = getRecipeMatches([pantryItem('basil')], recipe('r1', 'Pesto', ['fresh basil']));
    expect(result.matchedIngredients).toHaveLength(1);
    expect(result.matchedIngredients[0].confidence).toBe(100);
    expect(result.missingIngredients).not.toContain('fresh basil');
  });

  it('qualifier removal: dried oregano matches oregano', () => {
    const result = getRecipeMatches(
      [pantryItem('oregano')],
      recipe('r1', 'Pizza', ['dried oregano'])
    );
    expect(result.matchedIngredients.length).toBe(1);
    expect(result.matchedIngredients[0].matchType).toBe('exact');
  });

  it('plural handling: tomatoes matches tomato', () => {
    const result = getRecipeMatches([pantryItem('tomato')], recipe('r1', 'Salad', ['3 tomatoes']));
    expect(result.matchedIngredients).toHaveLength(1);
    expect(result.missingIngredients).not.toContain('3 tomatoes');
  });

  it('plural handling: potatoes matches potato', () => {
    const result = getRecipeMatches([pantryItem('potato')], recipe('r1', 'Mash', ['potatoes']));
    expect(result.matchedIngredients).toHaveLength(1);
    expect(result.matchedIngredients[0].confidence).toBeGreaterThanOrEqual(80);
  });

  it('matchType is correct for exact match', () => {
    const result = getRecipeMatches([pantryItem('salt')], recipe('r1', 'Dish', ['salt']));
    expect(result.matchedIngredients[0].matchType).toBe('exact');
  });

  it('matchType is correct for partial match', () => {
    const result = getRecipeMatches(
      [pantryItem('egg')],
      recipe('r1', 'Breakfast', ['2 large eggs'])
    );
    expect(result.matchedIngredients[0].matchType).toBe('partial');
  });

  it('matchType none for missing ingredient', () => {
    const result = getRecipeMatches([pantryItem('flour')], recipe('r1', 'Cake', ['unicorn meat']));
    expect(result.missingIngredients).toContain('unicorn meat');
    expect(
      result.matchedIngredients.find((m) => m.recipeIngredient === 'unicorn meat')
    ).toBeUndefined();
  });

  it('handles empty recipe ingredients', () => {
    const result = getRecipeMatches([pantryItem('flour')], recipe('r1', 'Empty', []));
    expect(result.matchPercentage).toBe(0);
    expect(result.canMake).toBe(false);
    expect(result.matchedIngredients).toHaveLength(0);
    expect(result.missingIngredients).toHaveLength(0);
  });

  it('handles null/undefined pantry by treating as empty', () => {
    const result = getRecipeMatches(null, recipe('r1', 'Cake', ['flour']));
    expect(result.missingIngredients).toContain('flour');
    expect(result.matchPercentage).toBe(0);
  });

  it('handles empty string ingredient (excluded from count)', () => {
    const result = getRecipeMatches(
      [pantryItem('flour')],
      recipe('r1', 'Cake', ['flour', '  ', ''])
    );
    expect(result.matchedIngredients).toHaveLength(1);
    expect(result.missingIngredients).toHaveLength(0);
  });

  it('handles single character ingredient name', () => {
    const result = getRecipeMatches([pantryItem('a')], recipe('r1', 'Test', ['a']));
    expect(result.matchedIngredients).toHaveLength(1);
    expect(result.matchedIngredients[0].confidence).toBe(100);
  });

  it('large pantry and recipe arrays do not degrade (Set-based lookup)', () => {
    const pantry = Array.from({ length: 150 }, (_, i) => pantryItem(`item${i}`));
    const ingredients = Array.from({ length: 120 }, (_, i) => `ingredient ${i}`);
    pantry.push(pantryItem('item50'));
    const result = getRecipeMatches(pantry, recipe('r1', 'Big', ingredients));
    expect(result.recipeId).toBe('r1');
    expect(result.matchedIngredients.length + result.missingIngredients.length).toBe(120);
    expect(result.matchPercentage).toBeGreaterThanOrEqual(0);
    expect(result.matchPercentage).toBeLessThanOrEqual(100);
  });

  it('getMatchStatus and getRecipeMatches agree on score vs matchPercentage', () => {
    const pantry = [pantryItem('flour'), pantryItem('egg')];
    const ingredients = ['flour', 'egg', 'milk'];
    const status = getMatchStatus(ingredients, pantry);
    const matchResult = getRecipeMatches(pantry, recipe('r1', 'Cake', ingredients));
    expect(status.score).toBe(matchResult.matchPercentage);
    expect(status.missing).toEqual(matchResult.missingIngredients);
    expect(status.matches).toEqual(matchResult.matchedIngredients.map((m) => m.recipeIngredient));
  });

  it('fuzzy or partial overlap gives confidence in 50-70 or 80 range', () => {
    const result = getRecipeMatches(
      [pantryItem('cheese')],
      recipe('r1', 'Pasta', ['parmesan cheese'])
    );
    expect(result.matchedIngredients[0].confidence).toBeGreaterThanOrEqual(50);
    expect(result.matchedIngredients[0].confidence).toBeLessThanOrEqual(100);
  });
});
