-- SIMPLE FIX: Allow Anonymous Profile Creation During Signup
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. REMOVE THE AUTOMATIC PROFILE CREATION TRIGGER
-- =====================================================

-- Drop the trigger that automatically creates profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the associated function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- =====================================================
-- 2. ALLOW ANONYMOUS PROFILE CREATION DURING SIGNUP
-- =====================================================

-- Drop existing profile policies
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create simple policies that allow profile creation during signup
CREATE POLICY "Allow profile creation" ON public.profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow profile updates for own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Keep the existing select policy
-- CREATE POLICY "Users can view own profile" ON public.profiles
--   FOR SELECT USING (auth.uid() = id);

-- =====================================================
-- 3. ALTERNATIVE: SECURITY DEFINER FUNCTION APPROACH
-- =====================================================

-- If you prefer a more secure approach, uncomment this section:
-- 
-- CREATE OR REPLACE FUNCTION public.create_profile_during_signup(
--   user_id UUID,
--   profile_data JSONB
-- )
-- RETURNS VOID AS $$
-- BEGIN
--   INSERT INTO public.profiles (
--     id, email, first_name, last_name, full_name, role, company_name, phone
--   ) VALUES (
--     user_id,
--     profile_data->>'email',
--     profile_data->>'first_name',
--     profile_data->>'last_name',
--     profile_data->>'full_name',
--     profile_data->>'role',
--     profile_data->>'company_name',
--     profile_data->>'phone'
--   )
--   ON CONFLICT (id) DO UPDATE SET
--     first_name = EXCLUDED.first_name,
--     last_name = EXCLUDED.last_name,
--     full_name = EXCLUDED.full_name,
--     role = EXCLUDED.role,
--     company_name = EXCLUDED.company_name,
--     phone = EXCLUDED.phone,
--     updated_at = NOW();
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- This approach allows any user to create profiles during signup
-- but restricts updates to authenticated users only 