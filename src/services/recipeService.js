import { supabase } from '../lib/supabaseClient'

export const generateRecipe = async (pantryItems) => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-recipe', {
      body: { pantryItems }
    })

    if (error) {
      let rawError = error.message;
      if (error.context && typeof error.context.text === 'function') {
        const text = await error.context.text();
        rawError = `Response: ${text}`;
      } else if (error.context) {
        rawError = `Context: ${JSON.stringify(error.context)}`;
      }
      throw new Error(`Edge Function Failed: ${rawError}`);
    }
    return data
  } catch (error) {
    console.error('Error generating recipe:', error)
    throw new Error(error.message || 'Failed to generate recipe')
  }
}




export const getSubstitutions = async (recipeTitle, missingIngredients, pantryItems) => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-substitutions', {
      body: { recipeTitle, missingIngredients, pantryItems },
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      }
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting substitutions:', error)
    throw new Error(error.message || 'Failed to get substitutions')
  }
}
