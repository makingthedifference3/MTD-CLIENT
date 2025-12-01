-- First, create a test CSR partner if not exists
INSERT INTO csr_partners (id, name, company_name, website, logo_url, primary_color)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Interise',
  'Interise Solutions',
  'https://interise.com',
  NULL,
  '#2563eb'
)
ON CONFLICT (id) DO NOTHING;

-- Note: To create the actual auth user, you need to:
-- 1. Go to your Supabase Dashboard: https://jklmwtaylfvebbemtttt.supabase.co
-- 2. Navigate to Authentication → Users
-- 3. Click "Add User" 
-- 4. Email: client@interise.com
-- 5. Password: demo123
-- 6. Click "Create User"
-- 7. Copy the generated user ID

-- Then, once you have the user ID from auth.users, create the user profile:
-- Replace 'YOUR_USER_ID_HERE' with the actual UUID from step 7
-- 
-- INSERT INTO users (id, email, full_name, role, csr_partner_id)
-- VALUES (
--   'YOUR_USER_ID_HERE',
--   'client@interise.com',
--   'Demo Client',
--   'client',
--   '00000000-0000-0000-0000-000000000001'
-- );
