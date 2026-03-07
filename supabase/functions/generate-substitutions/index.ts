import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.1.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonError(error: string, code: string, details?: unknown) {
  return new Response(JSON.stringify({ error, code, ...(details != null && { details }) }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 400,
  });
}

function isSubstitutionShape(
  arr: unknown
): arr is Array<{ missing?: string; substitution?: string; reason?: string }> {
  return (
    Array.isArray(arr) &&
    arr.every(
      (item) =>
        item != null && typeof item === 'object' && 'missing' in item && 'substitution' in item
    )
  );
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    let body: { recipeTitle?: string; missingIngredients?: unknown; pantryItems?: unknown };
    try {
      body = await req.json();
    } catch {
      return jsonError('Invalid JSON body', 'VALIDATION');
    }

    const recipeTitle = body.recipeTitle;
    const missingIngredients = body.missingIngredients;
    if (typeof recipeTitle !== 'string' || !recipeTitle.trim()) {
      return jsonError('Missing or invalid recipeTitle (string required)', 'VALIDATION');
    }
    if (!Array.isArray(missingIngredients)) {
      return jsonError('Missing or invalid missingIngredients (array required)', 'VALIDATION');
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      console.error('[generate-substitutions] GEMINI_API_KEY is not set');
      return jsonError('Server configuration error', 'CONFIG');
    }

    const pantryItems = body.pantryItems;
    const pantryNames = Array.isArray(pantryItems)
      ? (pantryItems as { name?: string }[]).map((i) => i.name ?? '').filter(Boolean)
      : [];

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `
      The user wants to cook "${recipeTitle}".
      They are missing these ingredients: ${(missingIngredients as string[]).join(', ')}.
      They have these items in their pantry: ${pantryNames.join(', ') || 'nothing'}.

      Suggest 3 practical substitutions for the missing ingredients.
      Prioritize using items from their pantry if possible, otherwise suggest common household alternatives.

      Return ONLY a valid JSON array of objects with this structure, and NO markdown formatting:
      [
        { "missing": "ingredient name", "substitution": "what to use instead", "reason": "short explanation why it works" }
      ]
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    const jsonStr = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    let substitutions: unknown;
    try {
      substitutions = JSON.parse(jsonStr);
    } catch (e) {
      console.error('[generate-substitutions] Invalid JSON from Gemini', jsonStr.slice(0, 200), e);
      return jsonError('AI returned invalid response', 'AI_INVALID_RESPONSE', {
        raw: jsonStr.slice(0, 200),
      });
    }

    if (!isSubstitutionShape(substitutions)) {
      console.error('[generate-substitutions] Unexpected structure', substitutions);
      return jsonError(
        'AI response must be array of { missing, substitution, reason }',
        'AI_INVALID_STRUCTURE'
      );
    }

    return new Response(JSON.stringify(substitutions), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const isRateLimit = /rate limit|429|resource exhausted/i.test(message);
    const isTimeout = /timeout|deadline|timed out/i.test(message);
    const code = isRateLimit ? 'AI_RATE_LIMIT' : isTimeout ? 'AI_TIMEOUT' : 'AI_ERROR';
    console.error('[generate-substitutions]', code, message, err);
    return new Response(
      JSON.stringify({
        error: isRateLimit
          ? 'Too many requests. Please try again in a moment.'
          : isTimeout
            ? 'Request timed out. Please try again.'
            : message,
        code,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
