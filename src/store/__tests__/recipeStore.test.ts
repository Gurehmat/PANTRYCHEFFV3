import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRecipeStore } from '../recipeStore';
import type { Recipe, FavoriteRecipe } from '../../types/database';

const minimalRecipe: Recipe = {
  id: 'r1',
  user_id: 'user-1',
  title: 'Pasta',
  description: null,
  ingredients: [],
  instructions: [],
  cooking_time: null,
  image_url: null,
  created_at: '',
};

const mockFrom = vi.hoisted(() => vi.fn());
const mockGetUser = vi.hoisted(() => vi.fn());
vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    get from() {
      return mockFrom;
    },
    auth: {
      get getUser() {
        return mockGetUser;
      },
    },
  },
}));

function getChain() {
  return {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  };
}

describe('recipeStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRecipeStore.setState({
      recipes: [],
      favorites: [],
      loading: false,
      error: null,
    });
    mockFrom.mockReturnValue(getChain());
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  });

  describe('initial state', () => {
    it('has correct initial state when reset', () => {
      useRecipeStore.setState({ recipes: [], favorites: [], loading: false, error: null });
      expect(useRecipeStore.getState().recipes).toEqual([]);
      expect(useRecipeStore.getState().favorites).toEqual([]);
      expect(useRecipeStore.getState().loading).toBe(false);
      expect(useRecipeStore.getState().error).toBe(null);
    });
  });

  describe('fetchRecipes', () => {
    it('sets recipes and parses instructions on success', async () => {
      const chain = getChain();
      chain.select.mockReturnValue(chain);
      chain.limit.mockResolvedValue({
        data: [
          {
            id: '1',
            title: 'Pasta',
            instructions: '["Boil water","Add pasta"]',
            description: 'Yum',
          },
        ],
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      await useRecipeStore.getState().fetchRecipes();

      expect(useRecipeStore.getState().recipes).toHaveLength(1);
      expect(useRecipeStore.getState().recipes[0].title).toBe('Pasta');
      expect(useRecipeStore.getState().recipes[0].instructions).toEqual([
        'Boil water',
        'Add pasta',
      ]);
      expect(useRecipeStore.getState().loading).toBe(false);
      expect(useRecipeStore.getState().error).toBe(null);
    });

    it('sets error on supabase error', async () => {
      const chain = getChain();
      chain.select.mockReturnValue(chain);
      chain.limit.mockResolvedValue({ data: null, error: { message: 'Fetch failed' } });
      mockFrom.mockReturnValue(chain);

      await useRecipeStore.getState().fetchRecipes();

      expect(useRecipeStore.getState().error).toBe('Fetch failed');
    });

    it('deduplicates by title keeping first', async () => {
      const chain = getChain();
      chain.select.mockReturnValue(chain);
      chain.limit.mockResolvedValue({
        data: [
          { id: '1', title: 'Pasta', instructions: '[]', description: '' },
          { id: '2', title: 'Pasta', instructions: '[]', description: 'second' },
        ],
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      await useRecipeStore.getState().fetchRecipes();

      expect(useRecipeStore.getState().recipes).toHaveLength(1);
      expect(useRecipeStore.getState().recipes[0].description).toBe('');
    });

    it('handles invalid JSON instructions as empty array', async () => {
      const chain = getChain();
      chain.select.mockReturnValue(chain);
      chain.limit.mockResolvedValue({
        data: [{ id: '1', title: 'Pasta', instructions: 'not json', description: '' }],
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      await useRecipeStore.getState().fetchRecipes();

      expect(useRecipeStore.getState().recipes[0].instructions).toEqual([]);
    });
  });

  describe('fetchFavorites', () => {
    it('sets favorites when user is logged in', async () => {
      const chain = getChain();
      chain.select.mockReturnValue(chain);
      chain.eq.mockReturnValue(chain);
      chain.order.mockReturnValue(chain);
      chain.limit.mockResolvedValue({
        data: [{ recipe_id: 'r1', recipe_data: null }],
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      await useRecipeStore.getState().fetchFavorites();

      expect(useRecipeStore.getState().favorites).toHaveLength(1);
    });

    it('does nothing when user is null', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } });

      await useRecipeStore.getState().fetchFavorites();

      expect(useRecipeStore.getState().favorites).toEqual([]);
    });
  });

  describe('toggleFavorite', () => {
    it('adds favorite when not favorited', async () => {
      useRecipeStore.setState({ favorites: [] });
      const chain = getChain();
      chain.insert.mockReturnValue(chain);
      chain.select.mockResolvedValue({
        data: [{ id: 'f1', user_id: 'user-1', recipe_id: 'r1', recipe_data: null }],
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const result = await useRecipeStore.getState().toggleFavorite(minimalRecipe);

      expect(result.success).toBe(true);
      expect(useRecipeStore.getState().favorites).toHaveLength(1);
    });

    it('removes favorite when already favorited', async () => {
      useRecipeStore.setState({
        favorites: [
          { id: 'f1', user_id: 'user-1', recipe_id: 'r1', recipe_data: null },
        ] as FavoriteRecipe[],
      });
      const chain = getChain();
      chain.delete.mockReturnValue(chain);
      chain.eq.mockReturnValue(chain);
      chain.or.mockResolvedValue({ error: null });
      mockFrom.mockReturnValue(chain);

      const result = await useRecipeStore.getState().toggleFavorite(minimalRecipe);

      expect(result.success).toBe(true);
      expect(useRecipeStore.getState().favorites).toHaveLength(0);
    });

    it('returns success false when user not logged in', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } });

      const result = await useRecipeStore.getState().toggleFavorite(minimalRecipe);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not logged in');
    });

    it('returns success false on insert error', async () => {
      useRecipeStore.setState({ favorites: [] });
      const chain = getChain();
      chain.insert.mockReturnValue(chain);
      chain.select.mockResolvedValue({ data: null, error: { message: 'Insert failed' } });
      mockFrom.mockReturnValue(chain);

      const result = await useRecipeStore.getState().toggleFavorite(minimalRecipe);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insert failed');
    });
  });
});
