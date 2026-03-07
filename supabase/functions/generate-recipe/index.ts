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

function isRecipeShape(obj: unknown): obj is {
  title?: string;
  description?: string;
  ingredients?: unknown[];
  instructions?: unknown;
  cooking_time?: unknown;
  missing_ingredients?: unknown[];
} {
  if (obj == null || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.title === 'string' && Array.isArray(o.ingredients) && Array.isArray(o.instructions)
  );
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    let body: { pantryItems?: unknown[] };
    try {
      body = await req.json();
    } catch {
      return jsonError('Invalid JSON body', 'VALIDATION');
    }

    const pantryItems = body.pantryItems;
    if (!Array.isArray(pantryItems)) {
      return jsonError('Missing or invalid pantryItems (must be an array)', 'VALIDATION');
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      console.error('[generate-recipe] GEMINI_API_KEY is not set');
      return jsonError('Server configuration error', 'CONFIG');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `
      You are a master chef. Based on these pantry items: ${pantryItems
        .map(
          (i: { name?: string; quantity?: number; unit?: string }) =>
            `${i.quantity ?? 1} ${i.unit ?? 'unit'} ${i.name ?? 'item'}`
        )
        .join(', ')},
      suggest a creative and delicious recipe.
      Return ONLY a valid JSON object with this structure:
      {
        "title": "Recipe Title",
        "description": "Short description",
        "ingredients": ["1 cup flour", "2 eggs"],
        "instructions": ["Step 1", "Step 2"],
        "cooking_time": "30 mins",
        "missing_ingredients": ["optional items you might need"]
      }
      Do not include markdown formatting or backticks.
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    const jsonStr = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    let recipe: unknown;
    try {
      recipe = JSON.parse(jsonStr);
    } catch (e) {
      console.error('[generate-recipe] Invalid JSON from Gemini', { text: text.slice(0, 200), e });
      return jsonError('AI returned invalid response', 'AI_INVALID_RESPONSE', {
        raw: text.slice(0, 200),
      });
    }

    if (!isRecipeShape(recipe)) {
      console.error('[generate-recipe] Unexpected recipe shape', recipe);
      return jsonError(
        'AI response missing required fields (title, ingredients, instructions)',
        'AI_INVALID_STRUCTURE'
      );
    }

    if (typeof recipe.instructions === 'string') {
      recipe.instructions = [recipe.instructions];
    }

    return new Response(JSON.stringify(recipe), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const isRateLimit =
      /rate limit|429|resource exhausted/i.test(message) ||
      (err &&
        typeof err === 'object' &&
        'status' in err &&
        (err as { status: number }).status === 429);
    const isTimeout = /timeout|deadline|timed out/i.test(message);
    const code = isRateLimit ? 'AI_RATE_LIMIT' : isTimeout ? 'AI_TIMEOUT' : 'AI_ERROR';
    console.error('[generate-recipe]', code, message, err);
    return new Response(
      JSON.stringify({
        error: isRateLimit
          ? 'Too many requests. Please try again in a moment.'
          : isTimeout
            ? 'Request timed out. Please try again.'
            : message,
        code,
        details: import.meta.env.DEV ? message : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
