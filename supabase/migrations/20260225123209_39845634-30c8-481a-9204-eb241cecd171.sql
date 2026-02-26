-- Add workflow_mode column to projects table
ALTER TABLE public.projects 
ADD COLUMN workflow_mode text NOT NULL DEFAULT 'from_photos';

-- Add comment for documentation
COMMENT ON COLUMN public.projects.workflow_mode IS 'Workflow mode: from_photos (default) or from_sketch';