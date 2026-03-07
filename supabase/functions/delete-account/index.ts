import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.0';

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceKey) {
      console.error('[delete-account] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
      return jsonError('Server configuration error', 'CONFIG');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonError('Missing Authorization header', 'VALIDATION');
    }

    const supabaseUserClient = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseUserClient.auth.getUser();

    if (userError || !user) {
      console.error('[delete-account] getUser failed', userError?.message);
      return jsonError(userError?.message ?? 'Unable to get current user', 'AUTH', {
        details: userError?.message,
      });
    }

    const userId = user.id;
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    const tablesWithUserId = ['pantry_items', 'shopping_list', 'favorites'] as const;

    for (const table of tablesWithUserId) {
      const { error } = await supabaseAdmin.from(table).delete().eq('user_id', userId);
      if (error) {
        console.error(`[delete-account] Error deleting from ${table}:`, error.message);
      }
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('[delete-account] deleteUser failed', deleteError.message);
      return jsonError(deleteError.message, 'AUTH', { details: deleteError.message });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[delete-account]', message, err);
    return new Response(JSON.stringify({ error: message, code: 'SERVER_ERROR' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
