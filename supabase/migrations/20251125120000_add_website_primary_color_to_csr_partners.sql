-- Add columns to csr_partners table
ALTER TABLE public.csr_partners
ADD COLUMN website character varying,
ADD COLUMN primary_color character varying;
