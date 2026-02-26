
-- Add category column to projects table, defaulting to 'footwear' for existing projects
ALTER TABLE public.projects ADD COLUMN category text NOT NULL DEFAULT 'footwear';
