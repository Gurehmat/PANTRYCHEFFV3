import { http, HttpResponse } from 'msw';

const BASE = 'https://test.supabase.co';

export const handlers = [
  // Auth: get user (used by stores before mutations)
  http.post(`${BASE}/auth/v1/token`, () =>
    HttpResponse.json({
      access_token: 'test-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'refresh',
      user: { id: 'test-user-id', email: 'test@test.com' },
    })
  ),
  http.get(`${BASE}/auth/v1/user`, () =>
    HttpResponse.json({ id: 'test-user-id', email: 'test@test.com' })
  ),
  http.post(`${BASE}/auth/v1/signup`, () =>
    HttpResponse.json({ user: { id: 'test-user-id' }, error: null })
  ),
  http.post(`${BASE}/auth/v1/token?grant_type=password`, () =>
    HttpResponse.json({ user: { id: 'test-user-id' }, error: null })
  ),

  // Pantry items
  http.get(`${BASE}/rest/v1/pantry_items*`, () =>
    HttpResponse.json([], { headers: { 'Content-Range': '0-0/0' } })
  ),
  http.post(new RegExp(`${BASE.replace('.', '\\.')}/rest/v1/pantry_items`), async ({ request }) => {
    const body = (await request.json()) as {
      name: string;
      quantity: number;
      unit: string;
      user_id: string;
    }[];
    const row = {
      id: 'mock-pantry-1',
      user_id: body[0]?.user_id || 'test-user-id',
      name: body[0]?.name || 'Item',
      quantity: body[0]?.quantity ?? 1,
      unit: body[0]?.unit || 'pcs',
      expiry_date: null,
      created_at: new Date().toISOString(),
    };
    return HttpResponse.json([row], {
      status: 201,
      headers: { 'Content-Range': '0-0/1', Prefer: 'return=representation' },
    });
  }),

  // Recipes
  http.get(`${BASE}/rest/v1/recipes*`, () =>
    HttpResponse.json(
      [
        {
          id: 'r1',
          title: 'Test Recipe',
          description: 'A test',
          ingredients: ['flour', 'eggs'],
          instructions: '["Step 1","Step 2"]',
          cooking_time: 30,
          image_url: null,
          created_at: new Date().toISOString(),
        },
      ],
      { headers: { 'Content-Range': '0-0/1' } }
    )
  ),

  // Favorites
  http.get(`${BASE}/rest/v1/favorites*`, () =>
    HttpResponse.json([], { headers: { 'Content-Range': '0-0/0' } })
  ),
  http.post(`${BASE}/rest/v1/favorites*`, async ({ request }) => {
    const body = (await request.json()) as {
      user_id: string;
      recipe_id: string | null;
      recipe_data: unknown;
    }[];
    return HttpResponse.json(
      [
        {
          id: 'fav-1',
          user_id: body[0]?.user_id,
          recipe_id: body[0]?.recipe_id,
          recipe_data: body[0]?.recipe_data,
          created_at: new Date().toISOString(),
        },
      ],
      { status: 201, headers: { Prefer: 'return=representation' } }
    );
  }),
  http.delete(`${BASE}/rest/v1/favorites*`, () => HttpResponse.json(null, { status: 204 })),

  // Shopping list
  http.get(`${BASE}/rest/v1/shopping_list*`, () =>
    HttpResponse.json([], { headers: { 'Content-Range': '0-0/0' } })
  ),
  http.post(`${BASE}/rest/v1/shopping_list*`, async ({ request }) => {
    const body = (await request.json()) as {
      name: string;
      quantity: number;
      unit: string;
      user_id: string;
    }[];
    return HttpResponse.json(
      [
        {
          id: 'shop-1',
          user_id: body[0]?.user_id || 'test-user-id',
          name: body[0]?.name || 'Item',
          quantity: body[0]?.quantity ?? 1,
          unit: body[0]?.unit || 'pc',
          checked: false,
          created_at: new Date().toISOString(),
        },
      ],
      { status: 201, headers: { Prefer: 'return=representation' } }
    );
  }),
];
