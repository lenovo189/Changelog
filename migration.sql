-- Add theme columns to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS theme_name text DEFAULT 'midnight',
ADD COLUMN IF NOT EXISTS theme_bg text,
ADD COLUMN IF NOT EXISTS theme_text text,
ADD COLUMN IF NOT EXISTS theme_accent text,
ADD COLUMN IF NOT EXISTS theme_secondary text;
