import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateRecipe, getSubstitutions } from '../recipeService';

const mockInvoke = vi.hoisted(() => vi.fn());
vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    functions: {
      get invoke() {
        return mockInvoke;
      },
    },
  },
}));

vi.mock('../../utils/cache', () => ({
  responseCache: {
    get: vi.fn(() => null),
    set: vi.fn(),
    invalidate: vi.fn(),
    generateKey: vi.fn((...args: unknown[]) => args.join('::')),
  },
}));

vi.mock('../../utils/rateLimiter', () => ({
  aiRateLimiter: {
    canMakeRequest: vi.fn(() => true),
    recordRequest: vi.fn(),
    getTimeUntilNextSlot: vi.fn(() => 0),
  },
}));

describe('recipeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');
  });

  describe('generateRecipe', () => {
    it('calls generate-recipe with valid pantry items and returns data', async () => {
      const pantryItems = [{ name: 'flour', quantity: 1, unit: 'kg' }];
      const mockData = {
        title: 'Test Recipe',
        description: 'A test',
        ingredients: ['flour', 'water'],
        instructions: ['Mix'],
        cooking_time: 30,
      };
      mockInvoke.mockResolvedValue({ data: mockData, error: null });

      const result = await generateRecipe(pantryItems);

      expect(mockInvoke).toHaveBeenCalledWith('generate-recipe', {
        body: { pantryItems },
        headers: {
          Authorization: 'Bearer test-anon-key',
        },
      });
      expect(result).toEqual(mockData);
    });

    it('throws when Edge Function returns error', async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: 'Gemini API error' },
      });

      await expect(generateRecipe([{ name: 'flour', quantity: 1, unit: 'kg' }])).rejects.toThrow(
        /Edge Function Failed|Gemini/
      );
    });

    it('parses and returns normalized response', async () => {
      const mockData = {
        title: 'Pasta',
        description: 'Simple pasta',
        ingredients: ['pasta', 'oil'],
        instructions: ['Boil', 'Drain'],
        cooking_time: 10,
      };
      mockInvoke.mockResolvedValue({ data: mockData, error: null });

      const result = (await generateRecipe([])) as { title?: string; ingredients?: unknown };

      expect(result).toHaveProperty('title', 'Pasta');
      expect(result).toHaveProperty('ingredients');
      expect(Array.isArray(result.ingredients)).toBe(true);
    });

    it('throws on empty/null/undefined pantry items when function errors', async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: 'Bad request' },
      });

      await expect(generateRecipe([])).rejects.toThrow();
    });

    it('handles error.context.text when present', async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: {
          message: 'Fail',
          context: {
            text: vi.fn().mockResolvedValue('Response body text'),
          },
        },
      });

      await expect(generateRecipe([{ name: 'x', quantity: 1, unit: 'pcs' }])).rejects.toThrow();
    });
  });

  describe('getSubstitutions', () => {
    it('calls generate-substitutions with valid inputs and returns data', async () => {
      const mockData = {
        substitutions: [{ original: 'milk', substitute: 'oat milk', notes: 'Dairy-free' }],
      };
      mockInvoke.mockResolvedValue({ data: mockData, error: null });

      const result = await getSubstitutions(
        'Pancakes',
        ['milk'],
        [{ name: 'flour', quantity: 1, unit: 'kg' }]
      );

      expect(mockInvoke).toHaveBeenCalledWith('generate-substitutions', {
        body: {
          recipeTitle: 'Pancakes',
          missingIngredients: ['milk'],
          pantryItems: [{ name: 'flour', quantity: 1, unit: 'kg' }],
        },
        headers: {
          Authorization: 'Bearer test-anon-key',
        },
      });
      expect(result).toEqual(mockData);
    });

    it('throws when Edge Function returns error', async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: 'Rate limit' },
      });

      await expect(getSubstitutions('Recipe', ['milk'], [])).rejects.toThrow();
    });

    it('handles empty missingIngredients', async () => {
      mockInvoke.mockResolvedValue({ data: { substitutions: [] }, error: null });

      const result = await getSubstitutions('Recipe', [], []);

      expect(result).toEqual({ substitutions: [] });
    });
  });
});
