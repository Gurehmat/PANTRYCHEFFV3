-- SHOPPING LIST TABLE
create table if not exists shopping_list (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  name text not null,
  quantity numeric default 1,
  unit text,
  checked boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table shopping_list enable row level security;

-- Policies
create policy "Users can view their own shopping list" on shopping_list for select using (auth.uid() = user_id);
create policy "Users can insert into their own shopping list" on shopping_list for insert with check (auth.uid() = user_id);
create policy "Users can update their own shopping list" on shopping_list for update using (auth.uid() = user_id);
create policy "Users can delete from their own shopping list" on shopping_list for delete using (auth.uid() = user_id);


-- FAVORITES TABLE
create table if not exists favorites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  recipe_id uuid references recipes(id), -- For DB recipes
  recipe_data jsonb, -- For AI generated recipes or external ones
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table favorites enable row level security;

-- Policies
create policy "Users can view their own favorites" on favorites for select using (auth.uid() = user_id);
create policy "Users can insert their own favorites" on favorites for insert with check (auth.uid() = user_id);
create policy "Users can update their own favorites" on favorites for update using (auth.uid() = user_id);
create policy "Users can delete their own favorites" on favorites for delete using (auth.uid() = user_id);

-- Refresh cache
notify pgrst, 'reload config';
