-- Add ALL metric columns to projects table for direct metric tracking
-- This ensures all dashboard metrics are stored and fetched from the database

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS sessions_conducted integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS libraries_setup integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS scholarships_given integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ration_kits_distributed integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS families_fed integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS waste_collected_kg integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS plastic_recycled_kg integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS communities_covered integer DEFAULT 0;

-- Also add a project_metrics JSONB column for flexible metrics storage
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS project_metrics jsonb DEFAULT '{}';

-- Update existing projects to have status 'active' if they don't have a status
UPDATE public.projects 
SET status = 'active' 
WHERE status IS NULL OR status = '' OR status = 'planning';

-- Add comment for documentation
COMMENT ON COLUMN public.projects.project_metrics IS 'JSONB storage for custom metrics with current/target pairs';
