-- Drop the favorites table foreign key temporarily, delete the recipes, or cascade delete
-- A better fix: Just tell the user to delete their favorites first, OR we can add a cascade to the foreign key.
-- For now, the easiest way for the user to fix this is to run a script that deletes their favorites since they are just test data anyway, or we can alter the foreign key to have ON DELETE CASCADE so that when a recipe is deleted, its favorites are deleted.

ALTER TABLE favorites
DROP CONSTRAINT favorites_recipe_id_fkey,
ADD CONSTRAINT favorites_recipe_id_fkey
   FOREIGN KEY (recipe_id)
   REFERENCES recipes(id)
   ON DELETE CASCADE;
