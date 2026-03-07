/**
 * Integration test: Favorites flow at the STORE level only (no UI).
 * Verifies fetchFavorites and toggleFavorite update recipeStore state correctly.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useRecipeStore } from '../../store/recipeStore';
import type { Recipe, FavoriteRecipe } from '../../types/database';

const mockRecipe: Recipe = {
  id: 'r1',
  user_id: 'user-1',
  title: 'Test Recipe',
  description: 'A test',
  ingredients: ['flour', 'eggs'],
  instructions: ['Step 1', 'Step 2'],
  cooking_time: 30,
  image_url: null,
  created_at: '2024-01-01T00:00:00Z',
};

const mockFavorite: FavoriteRecipe = {
  id: 'fav-1',
  user_id: 'test-user-id',
  recipe_id: 'r1',
  recipe_data: null,
};

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

function getChain() {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  };
}

vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: () => mockGetUser(),
    },
    from: (table: string) => mockFrom(table),
  },
}));

describe('Integration: Favorites flow (store)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'test-user-id' } } });
    useRecipeStore.setState({ recipes: [], favorites: [], error: null });
  });

  it('fetchFavorites updates state when user is logged in', async () => {
    const chain = getChain();
    chain.limit.mockResolvedValue({
      data: [mockFavorite],
      error: null,
    });
    mockFrom.mockReturnValue(chain);

    await useRecipeStore.getState().fetchFavorites();

    expect(useRecipeStore.getState().favorites).toHaveLength(1);
    expect(useRecipeStore.getState().favorites[0].recipe_id).toBe('r1');
  });

  it('fetchFavorites does nothing when user is null', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    await useRecipeStore.getState().fetchFavorites();
    expect(useRecipeStore.getState().favorites).toEqual([]);
  });

  it('toggleFavorite adds recipe to favorites state', async () => {
    const chain = getChain();
    chain.insert.mockReturnValue(chain);
    chain.select.mockResolvedValue({
      data: [mockFavorite],
      error: null,
    });
    mockFrom.mockReturnValue(chain);

    const result = await useRecipeStore.getState().toggleFavorite(mockRecipe);

    expect(result.success).toBe(true);
    expect(useRecipeStore.getState().favorites).toHaveLength(1);
    expect(useRecipeStore.getState().favorites[0].recipe_id).toBe('r1');
  });

  it('toggleFavorite removes recipe from favorites when already favorited', async () => {
    useRecipeStore.setState({
      favorites: [{ ...mockFavorite, recipe_id: 'r1', recipe_data: null }],
    });
    const chain = getChain();
    chain.delete.mockReturnValue(chain);
    chain.eq.mockReturnValue(chain);
    chain.or.mockResolvedValue({ error: null });
    mockFrom.mockReturnValue(chain);

    const result = await useRecipeStore.getState().toggleFavorite(mockRecipe);

    expect(result.success).toBe(true);
    expect(useRecipeStore.getState().favorites).toHaveLength(0);
  });

  it('toggleFavorite returns error when user not logged in', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });

    const result = await useRecipeStore.getState().toggleFavorite(mockRecipe);

    expect(result.success).toBe(false);
    expect(result.error).toContain('not logged in');
    expect(useRecipeStore.getState().favorites).toHaveLength(0);
  });

  it('toggleFavorite returns error when insert fails', async () => {
    const chain = getChain();
    chain.insert.mockReturnValue(chain);
    chain.select.mockResolvedValue({
      data: null,
      error: { message: 'Insert failed' },
    });
    mockFrom.mockReturnValue(chain);

    const result = await useRecipeStore.getState().toggleFavorite(mockRecipe);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Insert failed');
  });
});
