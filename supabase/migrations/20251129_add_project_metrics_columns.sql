-- Add missing metric columns to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS pads_distributed integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS trees_planted integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS meals_served integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS students_enrolled integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS schools_renovated integer DEFAULT 0;
