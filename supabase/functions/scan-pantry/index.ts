declare const Deno: {
  env: { get: (k: string) => string | undefined };
  serve: (h: (req: Request) => Promise<Response>) => void;
};

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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    let body: { image?: string };
    try {
      body = (await req.json()) as { image?: string };
    } catch (parseErr: unknown) {
      const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
      console.error('[scan-pantry] Parse error', msg);
      return jsonError('Invalid JSON body', 'VALIDATION', { message: msg });
    }

    const image = body?.image;
    if (!image || typeof image !== 'string') {
      return jsonError('Missing or invalid "image" (base64 string required)', 'VALIDATION', {
        receivedKeys: Object.keys(body || {}),
      });
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      console.error('[scan-pantry] GEMINI_API_KEY is not set');
      return jsonError('Server configuration error', 'CONFIG');
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: 'Analyze this image of a fridge or pantry. List every food ingredient you can clearly identify. Return purely a JSON array of objects with \'name\', \'quantity\' (number, estimate if needed, default 1), and \'unit\' (default \'pc\' or \'pack\' etc). Example: [{"name": "Milk", "quantity": 1, "unit": "bottle"}]. Do not include markdown formatting like ```json.',
                },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: image,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[scan-pantry] Gemini API error', response.status, errorText);
      const isRateLimit = response.status === 429;
      const is5xx = response.status >= 500 && response.status < 600;
      const code = isRateLimit ? 'AI_RATE_LIMIT' : is5xx ? 'AI_SERVER_ERROR' : 'AI_ERROR';
      return new Response(
        JSON.stringify({
          error: isRateLimit
            ? 'Too many requests. Please try again in a moment.'
            : `AI service error (${response.status})`,
          code,
          details: errorText.slice(0, 200),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] }[] }[];
    };
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]';
    text = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    let ingredients: unknown[];
    try {
      ingredients = JSON.parse(text) as unknown[];
    } catch (e) {
      console.error('[scan-pantry] Invalid JSON from Gemini', text.slice(0, 200), e);
      return jsonError('AI returned invalid response', 'AI_INVALID_RESPONSE', {
        raw: text.slice(0, 200),
      });
    }

    if (!Array.isArray(ingredients)) {
      return jsonError('AI response must be a JSON array', 'AI_INVALID_STRUCTURE');
    }

    return new Response(JSON.stringify(ingredients), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const isTimeout = /timeout|deadline|timed out/i.test(message);
    const code = isTimeout ? 'AI_TIMEOUT' : 'NETWORK_ERROR';
    console.error('[scan-pantry]', code, message, err);
    return new Response(
      JSON.stringify({
        error: isTimeout ? 'Request timed out. Please try again.' : message,
        code,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
