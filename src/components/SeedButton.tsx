import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRecipeStore } from '../store/recipeStore';
import { fetchSeedRecipes } from '../utils/seedData';
import type { SeedRecipe } from '../types/seed';
import { Database, Check, Loader2, AlertCircle } from 'lucide-react';

function stripHtml(html: string | null | undefined): string | null {
  if (!html) return null;
  return html.replace(/<[^>]*>?/gm, '');
}

export default function SeedButton() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'success' | 'error' | null>(null);
  const { fetchRecipes } = useRecipeStore();

  const handleSeed = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const recipes = await fetchSeedRecipes();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Must be logged in to seed database');

      const { error: deleteError } = await supabase.from('recipes').delete().eq('user_id', user.id);
      if (deleteError) throw deleteError;

      const recipesToInsert = recipes.map((recipe: SeedRecipe) => ({
        user_id: user.id,
        title: recipe.Name,
        description: stripHtml(recipe.Description),
        ingredients: recipe.Ingredients,
        instructions: JSON.stringify(recipe.Method),
        image_url: recipe.Image || null,
      }));

      const { error } = await supabase.from('recipes').insert(recipesToInsert);
      if (error) {
        console.error('Supabase error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      await fetchRecipes();
      setStatus('success');
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      console.error('Seeding error full object:', error);
      setStatus('error');
      const message = error instanceof Error ? error.message : JSON.stringify(error);
      alert(`Seeding failed: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSeed}
      disabled={loading || status === 'success'}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
        ${status === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : status === 'error' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900'}
      `}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : status === 'success' ? (
        <Check className="w-4 h-4" />
      ) : status === 'error' ? (
        <AlertCircle className="w-4 h-4" />
      ) : (
        <Database className="w-4 h-4" />
      )}
      {status === 'success' ? 'Seeded!' : status === 'error' ? 'Failed' : 'Seed Database'}
    </button>
  );
}
