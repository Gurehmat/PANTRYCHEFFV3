-- Optional nutrition/prep fields for recipes (from cleaned seed data)
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS calories integer;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS protein text;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS fat text;
