-- Add Toll Support Schema Changes

-- 1. Create csr_partner_tolls table
CREATE TABLE IF NOT EXISTS public.csr_partner_tolls (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  csr_partner_id uuid NOT NULL,
  toll_name text,
  poc_name character varying NOT NULL,
  poc_password character varying,
  contact_number character varying,
  email_id character varying,
  city character varying,
  state character varying,
  budget_allocation numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  created_by uuid,
  updated_by uuid,
  CONSTRAINT csr_partner_tolls_pkey PRIMARY KEY (id),
  CONSTRAINT csr_partner_tolls_csr_partner_id_fkey FOREIGN KEY (csr_partner_id) REFERENCES public.csr_partners(id)
);

-- 2. Add columns to csr_partners
ALTER TABLE public.csr_partners ADD COLUMN IF NOT EXISTS has_toll boolean DEFAULT false;
ALTER TABLE public.csr_partners ADD COLUMN IF NOT EXISTS poc_password character varying;

-- 3. Add toll_id to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS toll_id uuid;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_toll_id_fkey') THEN
        ALTER TABLE public.projects
        ADD CONSTRAINT projects_toll_id_fkey FOREIGN KEY (toll_id) REFERENCES public.csr_partner_tolls(id);
    END IF;
END $$;

-- 4. Add toll_id to users (optional, for tracking)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS toll_id uuid;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_toll_id_fkey') THEN
        ALTER TABLE public.users
        ADD CONSTRAINT users_toll_id_fkey FOREIGN KEY (toll_id) REFERENCES public.csr_partner_tolls(id);
    END IF;
END $$;
