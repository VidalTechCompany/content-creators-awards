-- Seed admin role migration
-- This migration creates a super_admin role entry for the first admin user.
-- Update the user_id with your actual admin user ID from auth.users table

-- Example: Insert super_admin role for the first admin user
-- Uncomment and replace the UUID with your actual admin user ID:
-- insert into public.admins (user_id, role) values ('your-user-uuid-here', 'super_admin')
-- on conflict (user_id) do nothing;

-- To find your user ID:
-- 1. Sign up in the app or create user in Supabase dashboard
-- 2. Run: select id, email from auth.users;
-- 3. Replace 'your-user-uuid-here' with the actual UUID
-- 4. Uncomment the insert statement and run this migration
