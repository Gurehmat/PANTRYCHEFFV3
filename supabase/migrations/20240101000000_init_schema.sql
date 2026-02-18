-- Create pantry_items table
create table pantry_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  name text not null,
  quantity numeric,
  unit text,
  expiry_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table pantry_items enable row level security;

-- Create policies for pantry_items
create policy "Users can view their own pantry items"
  on pantry_items for select
  using (auth.uid() = user_id);

create policy "Users can insert their own pantry items"
  on pantry_items for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own pantry items"
  on pantry_items for update
  using (auth.uid() = user_id);

create policy "Users can delete their own pantry items"
  on pantry_items for delete
  using (auth.uid() = user_id);

-- Create recipes table
create table recipes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  title text not null,
  ingredients jsonb not null,
  instructions text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for recipes
alter table recipes enable row level security;

-- Create policies for recipes
create policy "Users can view their own generated recipes"
  on recipes for select
  using (auth.uid() = user_id);

create policy "Users can insert generated recipes"
  on recipes for insert
  with check (auth.uid() = user_id);
