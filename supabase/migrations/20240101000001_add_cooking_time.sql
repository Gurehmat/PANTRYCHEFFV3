-- Add cooking_time to recipes table
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS cooking_time text;
