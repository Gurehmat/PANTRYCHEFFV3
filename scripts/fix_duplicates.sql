-- Allow users to delete their own recipes
-- Run this in your Supabase Dashboard > SQL Editor

create policy "Users can delete their own generated recipes"
  on recipes for delete
  using (auth.uid() = user_id);

-- Also allow updates just in case
create policy "Users can update their own generated recipes"
  on recipes for update
  using (auth.uid() = user_id);
