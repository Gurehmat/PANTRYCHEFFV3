import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import RecipeCard from './RecipeCard';
import type { Recipe } from '../types/database';
import type { MatchResult } from '../types/matching';

function matchResult(overrides: Partial<MatchResult>): MatchResult {
  return {
    recipeId: '1',
    recipeTitle: 'Test Pasta',
    matchedIngredients: [],
    missingIngredients: [],
    matchPercentage: 0,
    canMake: false,
    ...overrides,
  };
}

const mockToggleFavorite = vi.fn();
vi.mock('../store/recipeStore', () => ({
  useRecipeStore: () => ({
    toggleFavorite: mockToggleFavorite,
    favorites: [],
  }),
}));

const defaultRecipe: Recipe = {
  id: '1',
  user_id: 'user-1',
  title: 'Test Pasta',
  description: 'A simple pasta recipe',
  image_url: null,
  cooking_time: '20 mins',
  ingredients: ['pasta', 'oil'],
  instructions: ['Step 1', 'Step 2'],
  created_at: '2024-01-01T00:00:00Z',
};

describe('RecipeCard', () => {
  it('renders recipe title, description, and match percentage', () => {
    render(
      <MemoryRouter>
        <RecipeCard
          recipe={defaultRecipe}
          matchResult={matchResult({
            matchPercentage: 75,
            missingIngredients: ['cheese'],
            matchedIngredients: [
              {
                recipeIngredient: 'pasta',
                pantryMatch: 'pasta',
                confidence: 100,
                matchType: 'exact',
              },
            ],
          })}
        />
      </MemoryRouter>
    );
    expect(screen.getByText('Test Pasta')).toBeInTheDocument();
    expect(screen.getByText(/simple pasta recipe/i)).toBeInTheDocument();
    expect(screen.getByText(/75% Match/)).toBeInTheDocument();
  });

  it('shows missing ingredients when present', () => {
    render(
      <MemoryRouter>
        <RecipeCard
          recipe={defaultRecipe}
          matchResult={matchResult({
            matchPercentage: 50,
            missingIngredients: ['cheese', 'cream'],
            matchedIngredients: [
              {
                recipeIngredient: 'pasta',
                pantryMatch: 'pasta',
                confidence: 100,
                matchType: 'exact',
              },
            ],
          })}
        />
      </MemoryRouter>
    );
    expect(screen.getByText(/missing 2 ingredients/i)).toBeInTheDocument();
    expect(screen.getByText(/cheese, cream/)).toBeInTheDocument();
  });

  it('shows "You have everything!" when no missing ingredients', () => {
    render(
      <MemoryRouter>
        <RecipeCard
          recipe={defaultRecipe}
          matchResult={matchResult({
            matchPercentage: 100,
            missingIngredients: [],
            canMake: true,
            matchedIngredients: [
              {
                recipeIngredient: 'pasta',
                pantryMatch: 'pasta',
                confidence: 100,
                matchType: 'exact',
              },
              { recipeIngredient: 'oil', pantryMatch: 'oil', confidence: 100, matchType: 'exact' },
            ],
          })}
        />
      </MemoryRouter>
    );
    expect(screen.getByText(/you have everything/i)).toBeInTheDocument();
  });

  it('handles missing description gracefully', () => {
    render(
      <MemoryRouter>
        <RecipeCard
          recipe={{ ...defaultRecipe, description: null } as Recipe}
          matchResult={matchResult({ matchPercentage: 100, missingIngredients: [], canMake: true })}
        />
      </MemoryRouter>
    );
    expect(screen.getByText('Test Pasta')).toBeInTheDocument();
  });

  it('calls toggleFavorite when heart button clicked', async () => {
    mockToggleFavorite.mockResolvedValue({ success: true });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <RecipeCard
          recipe={defaultRecipe}
          matchResult={matchResult({ matchPercentage: 100, missingIngredients: [], canMake: true })}
        />
      </MemoryRouter>
    );
    const heartBtn = screen.getByRole('button', { name: undefined });
    await user.click(heartBtn);
    expect(mockToggleFavorite).toHaveBeenCalledWith(defaultRecipe);
  });

  it('renders link to recipe detail', () => {
    render(
      <MemoryRouter>
        <RecipeCard
          recipe={defaultRecipe}
          matchResult={matchResult({ matchPercentage: 100, missingIngredients: [], canMake: true })}
        />
      </MemoryRouter>
    );
    const link = screen.getByRole('link', { name: /view recipe/i });
    expect(link).toHaveAttribute('href', '/recipes/1');
  });

  it('heart button is inside the recipe card link', () => {
    render(
      <MemoryRouter>
        <RecipeCard
          recipe={defaultRecipe}
          matchResult={matchResult({ matchPercentage: 100, missingIngredients: [], canMake: true })}
        />
      </MemoryRouter>
    );
    const link = screen.getByRole('link', { name: /view recipe/i });
    const heartBtn = screen.getByRole('button');
    expect(link).toContainElement(heartBtn);
  });
});
