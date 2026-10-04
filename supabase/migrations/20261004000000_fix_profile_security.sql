-- Migration: 20261004000000_fix_profile_security.sql
-- Description: Remediate profile privileged field security, protect INSERT and UPDATE, prevent deletion exploits (T-007)

-- 1. DROP DEFECTIVE POLICIES
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;

-- 2. SECURE INSERT POLICY
-- Prevents clients from inserting elevated tier or quota values
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id
    AND (tier IS NULL OR tier = 'free')
    AND (ai_monthly_generations IS NULL OR ai_monthly_generations = 0)
    AND (max_ai_generations IS NULL OR max_ai_generations = 15)
  );

-- 3. REVISED PROFILE PRIVILEGED FIELD PROTECTION TRIGGER FUNCTION
-- Removes defective current_user check (which in SECURITY DEFINER always equals postgres/owner)
-- Uses auth.role() / JWT role checks to enforce security for authenticated/anon callers
-- Supports internal quota increment via transaction-local setting 'orbit.allow_quota_update'
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- If authorized by internal quota function, allow update
  IF current_setting('orbit.allow_quota_update', true) = 'true' THEN
    RETURN NEW;
  END IF;

  -- Determine caller role from auth.role() or JWT claims safely
  BEGIN
    v_role := auth.role();
  EXCEPTION WHEN OTHERS THEN
    v_role := COALESCE(current_setting('request.jwt.claim.role', true), '');
  END;

  -- Apply restrictions to authenticated or anon clients
  IF v_role IN ('authenticated', 'anon') THEN
    IF TG_OP = 'INSERT' THEN
      -- Guarantee safe default values on client insertion
      NEW.tier := 'free';
      NEW.ai_monthly_generations := 0;
      NEW.max_ai_generations := 15;
    ELSIF TG_OP = 'UPDATE' THEN
      -- Forbid modifying tier or quota counters directly
      IF (OLD.tier IS DISTINCT FROM NEW.tier) OR
         (OLD.ai_monthly_generations IS DISTINCT FROM NEW.ai_monthly_generations) OR
         (OLD.max_ai_generations IS DISTINCT FROM NEW.max_ai_generations) THEN
        RAISE EXCEPTION 'Modifying tier or quota fields directly is forbidden';
      END IF;

      -- Forbid modifying profile id
      IF OLD.id IS DISTINCT FROM NEW.id THEN
        RAISE EXCEPTION 'Modifying profile id is forbidden';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 4. ATTACH TRIGGER FOR BOTH INSERT AND UPDATE ON PROFILES
DROP TRIGGER IF EXISTS on_profile_protect_fields ON public.profiles;
CREATE TRIGGER on_profile_protect_fields
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_fields();

-- 5. UPDATE ATOMIC AI QUOTA CONSUMPTION FUNCTION WITH AUTHORIZATION MARKER
CREATE OR REPLACE FUNCTION public.consume_board_generation_quota()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_updated INT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Mark transaction as authorized to increment quota counter
  PERFORM set_config('orbit.allow_quota_update', 'true', true);

  UPDATE public.profiles
  SET ai_monthly_generations = ai_monthly_generations + 1
  WHERE id = v_user_id
    AND ai_monthly_generations < max_ai_generations;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  RETURN v_updated > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_board_generation_quota() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_board_generation_quota() TO authenticated;

-- 6. EXPLICIT COLUMN PRIVILEGES
REVOKE ALL ON public.profiles FROM anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT INSERT (id, email, display_name, avatar_url) ON public.profiles TO authenticated;
GRANT UPDATE (display_name, avatar_url, email) ON public.profiles TO authenticated;
REVOKE UPDATE (tier, ai_monthly_generations, max_ai_generations, id, created_at) ON public.profiles FROM authenticated;
REVOKE DELETE ON public.profiles FROM authenticated, anon;
