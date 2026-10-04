-- Migration: 20261003000000_create_orbit_schema.sql
-- Description: Core 6-table schema, RLS policies, triggers, indexes, and quota function for Zankai Orbit

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLES

-- profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
  ai_monthly_generations INT NOT NULL DEFAULT 0 CHECK (ai_monthly_generations >= 0),
  max_ai_generations INT NOT NULL DEFAULT 15 CHECK (max_ai_generations >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- boards table
CREATE TABLE IF NOT EXISTS public.boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🚀',
  color_theme TEXT NOT NULL DEFAULT 'blue',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- columns table
CREATE TABLE IF NOT EXISTS public.columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id UUID NOT NULL REFERENCES public.columns(id) ON DELETE CASCADE,
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date TIMESTAMPTZ,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- checklist_items table
CREATE TABLE IF NOT EXISTS public.checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0
);

-- focus_sessions table
CREATE TABLE IF NOT EXISTS public.focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  duration_minutes INT NOT NULL DEFAULT 25 CHECK (duration_minutes > 0),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_boards_user_sort ON public.boards(user_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_columns_board_sort ON public.columns(board_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_tasks_board_column_sort ON public.tasks(board_id, column_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_checklist_task_sort ON public.checklist_items(task_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_completed ON public.focus_sessions(user_id, completed_at DESC);

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

-- 4.1. Profiles Policies
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id
    AND (tier IS NULL OR tier = 'free')
    AND (ai_monthly_generations IS NULL OR ai_monthly_generations = 0)
    AND (max_ai_generations IS NULL OR max_ai_generations = 15)
  );

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Note: No DELETE policy on profiles; prevents deletion/re-insertion privilege escalation

-- 4.2. Boards Policies
CREATE POLICY "boards_select_own"
  ON public.boards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "boards_insert_own"
  ON public.boards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "boards_update_own"
  ON public.boards FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "boards_delete_own"
  ON public.boards FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4.3. Columns Policies (inherit ownership through boards)
CREATE POLICY "columns_select_own"
  ON public.columns FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.id = columns.board_id AND b.user_id = auth.uid()
  ));

CREATE POLICY "columns_insert_own"
  ON public.columns FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.id = columns.board_id AND b.user_id = auth.uid()
  ));

CREATE POLICY "columns_update_own"
  ON public.columns FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.id = columns.board_id AND b.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.id = columns.board_id AND b.user_id = auth.uid()
  ));

CREATE POLICY "columns_delete_own"
  ON public.columns FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.id = columns.board_id AND b.user_id = auth.uid()
  ));

-- 4.4. Tasks Policies (enforce task user, board ownership, and column-board relationship)
CREATE POLICY "tasks_select_own"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "tasks_insert_own"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.boards b
      WHERE b.id = tasks.board_id AND b.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.columns c
      WHERE c.id = tasks.column_id AND c.board_id = tasks.board_id
    )
  );

CREATE POLICY "tasks_update_own"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.boards b
      WHERE b.id = tasks.board_id AND b.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.columns c
      WHERE c.id = tasks.column_id AND c.board_id = tasks.board_id
    )
  );

CREATE POLICY "tasks_delete_own"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4.5. Checklist Items Policies (inherit ownership through tasks and boards)
CREATE POLICY "checklist_items_select_own"
  ON public.checklist_items FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = checklist_items.task_id AND t.user_id = auth.uid()
  ));

CREATE POLICY "checklist_items_insert_own"
  ON public.checklist_items FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = checklist_items.task_id AND t.user_id = auth.uid()
  ));

CREATE POLICY "checklist_items_update_own"
  ON public.checklist_items FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = checklist_items.task_id AND t.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = checklist_items.task_id AND t.user_id = auth.uid()
  ));

CREATE POLICY "checklist_items_delete_own"
  ON public.checklist_items FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = checklist_items.task_id AND t.user_id = auth.uid()
  ));

-- 4.6. Focus Sessions Policies (enforce session user and optional task ownership)
CREATE POLICY "focus_sessions_select_own"
  ON public.focus_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "focus_sessions_insert_own"
  ON public.focus_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (task_id IS NULL OR EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = focus_sessions.task_id AND t.user_id = auth.uid()
    ))
  );

CREATE POLICY "focus_sessions_update_own"
  ON public.focus_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (task_id IS NULL OR EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = focus_sessions.task_id AND t.user_id = auth.uid()
    ))
  );

CREATE POLICY "focus_sessions_delete_own"
  ON public.focus_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. COLUMN-LEVEL PROTECTION & VALIDATION TRIGGERS

-- Prevent client manipulation of profile tier or quota counters
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

DROP TRIGGER IF EXISTS on_profile_protect_fields ON public.profiles;
CREATE TRIGGER on_profile_protect_fields
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_fields();

-- Enforce task relational integrity at trigger level
CREATE OR REPLACE FUNCTION public.validate_task_relationships()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.id = NEW.board_id AND b.user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'Task board % does not belong to user %', NEW.board_id, NEW.user_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.columns c
    WHERE c.id = NEW.column_id AND c.board_id = NEW.board_id
  ) THEN
    RAISE EXCEPTION 'Task column % does not belong to board %', NEW.column_id, NEW.board_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_task_validate_relations ON public.tasks;
CREATE TRIGGER on_task_validate_relations
  BEFORE INSERT OR UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.validate_task_relationships();

-- Enforce focus session task ownership
CREATE OR REPLACE FUNCTION public.validate_focus_session_task()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.task_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = NEW.task_id AND t.user_id = NEW.user_id
    ) THEN
      RAISE EXCEPTION 'Focus session task % does not belong to user %', NEW.task_id, NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_focus_session_validate_task ON public.focus_sessions;
CREATE TRIGGER on_focus_session_validate_task
  BEFORE INSERT OR UPDATE ON public.focus_sessions
  FOR EACH ROW EXECUTE FUNCTION public.validate_focus_session_task();

-- 6. LIFECYCLE TRIGGERS

-- 6.1. Auth user signup trigger -> creates profiles row
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6.2. Board creation trigger -> seeds the default 5 columns (Ideas, Up Next, In Motion, Waiting, Complete)
CREATE OR REPLACE FUNCTION public.handle_new_board()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.columns (board_id, title, sort_order)
  VALUES
    (NEW.id, 'Ideas', 0),
    (NEW.id, 'Up Next', 1),
    (NEW.id, 'In Motion', 2),
    (NEW.id, 'Waiting', 3),
    (NEW.id, 'Complete', 4);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_board_created ON public.boards;
CREATE TRIGGER on_board_created
  AFTER INSERT ON public.boards
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_board();

-- 7. ATOMIC AI QUOTA CONSUMPTION FUNCTION
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

-- Explicit table and column privileges for profiles
REVOKE ALL ON public.profiles FROM anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT INSERT (id, email, display_name, avatar_url) ON public.profiles TO authenticated;
GRANT UPDATE (display_name, avatar_url, email) ON public.profiles TO authenticated;
REVOKE UPDATE (tier, ai_monthly_generations, max_ai_generations, id, created_at) ON public.profiles FROM authenticated;
REVOKE DELETE ON public.profiles FROM authenticated, anon;

-- 8. REALTIME REPLICATION (SAFE CONDITIONAL REGISTRATION)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.boards;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.columns;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.checklist_items;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.focus_sessions;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END;
$$;
