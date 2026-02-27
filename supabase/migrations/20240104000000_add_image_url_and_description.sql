-- Add image_url to recipes table
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS description text;
