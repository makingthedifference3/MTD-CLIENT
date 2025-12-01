-- Link application users to CSR partners
ALTER TABLE IF EXISTS public.users
  ADD COLUMN IF NOT EXISTS csr_partner_id uuid REFERENCES public.csr_partners(id);

CREATE INDEX IF NOT EXISTS idx_users_csr_partner_id ON public.users(csr_partner_id);
