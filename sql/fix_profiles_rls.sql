-- ─────────────────────────────────────────────────────────────────────────────
-- Fix profiles RLS policies so logged-in users can update their own profile
-- Run this in Supabase Dashboard > SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- Step 1: Enable RLS on profiles (in case it's not on)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop any existing profile policies to start clean
DROP POLICY IF EXISTS "profiles_select_own"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own"   ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Step 3: SELECT — any authenticated user can view any profile (needed for marketplace)
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Step 4: INSERT — users can only create their own profile row
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Step 5: UPDATE — users can only update their own profile row
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Step 6: DELETE — users can only delete their own profile
CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE
  TO authenticated
  USING (id = auth.uid());

-- ── Verify ───────────────────────────────────────────────────────────────────
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
