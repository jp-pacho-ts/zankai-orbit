-- Seed Data: supabase/seed.sql
-- Mock consumer boards, tasks, and checklist items for local development and testing

DO $$
DECLARE
  v_user_id UUID := '00000000-0000-0000-0000-000000000001';
  v_board_id UUID := '10000000-0000-0000-0000-000000000001';
  v_col_ideas UUID;
  v_col_up_next UUID;
  v_col_in_motion UUID;
  v_col_waiting UUID;
  v_col_complete UUID;
  v_task_1 UUID := '20000000-0000-0000-0000-000000000001';
  v_task_2 UUID := '20000000-0000-0000-0000-000000000002';
  v_task_3 UUID := '20000000-0000-0000-0000-000000000003';
  v_task_4 UUID := '20000000-0000-0000-0000-000000000004';
  v_task_5 UUID := '20000000-0000-0000-0000-000000000005';
  v_task_6 UUID := '20000000-0000-0000-0000-000000000006';
BEGIN
  -- 1. Create mock auth user if auth.users schema exists
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'alex@example.com',
      crypt('orbitpassword123', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"display_name":"Alex Mercer","full_name":"Alex Mercer"}',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- 2. Create mock profile
  INSERT INTO public.profiles (
    id,
    email,
    display_name,
    avatar_url,
    tier,
    ai_monthly_generations,
    max_ai_generations
  )
  VALUES (
    v_user_id,
    'alex@example.com',
    'Alex Mercer',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    'free',
    2,
    15
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url;

  -- 3. Create mock board
  INSERT INTO public.boards (
    id,
    user_id,
    title,
    emoji,
    color_theme,
    sort_order
  )
  VALUES (
    v_board_id,
    v_user_id,
    'Personal Productivity & Goals',
    '🚀',
    'blue',
    0
  )
  ON CONFLICT (id) DO NOTHING;

  -- 4. Lookup trigger-created columns for this board (or insert if trigger was disabled)
  SELECT id INTO v_col_ideas FROM public.columns WHERE board_id = v_board_id AND title = 'Ideas' LIMIT 1;
  SELECT id INTO v_col_up_next FROM public.columns WHERE board_id = v_board_id AND title = 'Up Next' LIMIT 1;
  SELECT id INTO v_col_in_motion FROM public.columns WHERE board_id = v_board_id AND title = 'In Motion' LIMIT 1;
  SELECT id INTO v_col_waiting FROM public.columns WHERE board_id = v_board_id AND title = 'Waiting' LIMIT 1;
  SELECT id INTO v_col_complete FROM public.columns WHERE board_id = v_board_id AND title = 'Complete' LIMIT 1;

  IF v_col_ideas IS NULL THEN
    INSERT INTO public.columns (board_id, title, sort_order) VALUES (v_board_id, 'Ideas', 0) RETURNING id INTO v_col_ideas;
    INSERT INTO public.columns (board_id, title, sort_order) VALUES (v_board_id, 'Up Next', 1) RETURNING id INTO v_col_up_next;
    INSERT INTO public.columns (board_id, title, sort_order) VALUES (v_board_id, 'In Motion', 2) RETURNING id INTO v_col_in_motion;
    INSERT INTO public.columns (board_id, title, sort_order) VALUES (v_board_id, 'Waiting', 3) RETURNING id INTO v_col_waiting;
    INSERT INTO public.columns (board_id, title, sort_order) VALUES (v_board_id, 'Complete', 4) RETURNING id INTO v_col_complete;
  END IF;

  -- 5. Seed tasks and checklist items

  -- Task 1: Launch Zankai Orbit workspace (In Motion)
  INSERT INTO public.tasks (
    id, column_id, board_id, user_id, title, description, priority, due_date, sort_order
  )
  VALUES (
    v_task_1,
    v_col_in_motion,
    v_board_id,
    v_user_id,
    'Launch Zankai Orbit workspace',
    'Finalize the modern AI-assisted Kanban board with focus timer.',
    'high',
    NOW() + INTERVAL '2 days',
    0
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.checklist_items (task_id, title, is_completed, sort_order)
  VALUES
    (v_task_1, 'Finalize Kanban drag-and-drop', TRUE, 0),
    (v_task_1, 'Test Pomodoro focus timer', TRUE, 1),
    (v_task_1, 'Connect Gemini prompt-to-board', FALSE, 2),
    (v_task_1, 'Deploy preview build to Vercel', FALSE, 3)
  ON CONFLICT DO NOTHING;

  -- Task 2: Plan weekend mountain getaway (Up Next)
  INSERT INTO public.tasks (
    id, column_id, board_id, user_id, title, description, priority, due_date, sort_order
  )
  VALUES (
    v_task_2,
    v_col_up_next,
    v_board_id,
    v_user_id,
    'Plan weekend mountain getaway',
    'Organize a 3-day cabin retreat with outdoor hiking routes.',
    'medium',
    NOW() + INTERVAL '5 days',
    0
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.checklist_items (task_id, title, is_completed, sort_order)
  VALUES
    (v_task_2, 'Book cabin reservation', TRUE, 0),
    (v_task_2, 'Plan scenic hiking trail', FALSE, 1),
    (v_task_2, 'Pack all-weather gear & supplies', FALSE, 2)
  ON CONFLICT DO NOTHING;

  -- Task 3: Learn French with Duolingo (Ideas)
  INSERT INTO public.tasks (
    id, column_id, board_id, user_id, title, description, priority, due_date, sort_order
  )
  VALUES (
    v_task_3,
    v_col_ideas,
    v_board_id,
    v_user_id,
    'Learn French with Duolingo',
    'Build a daily morning streak and practice conversational phrases.',
    'low',
    NULL,
    0
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.checklist_items (task_id, title, is_completed, sort_order)
  VALUES
    (v_task_3, 'Complete introductory placement test', TRUE, 0),
    (v_task_3, 'Set 15-minute daily study reminder', FALSE, 1)
  ON CONFLICT DO NOTHING;

  -- Task 4: Redesign personal portfolio (Ideas)
  INSERT INTO public.tasks (
    id, column_id, board_id, user_id, title, description, priority, due_date, sort_order
  )
  VALUES (
    v_task_4,
    v_col_ideas,
    v_board_id,
    v_user_id,
    'Redesign personal portfolio',
    'Showcase latest UI engineering and AI integration projects.',
    'medium',
    NULL,
    1
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.checklist_items (task_id, title, is_completed, sort_order)
  VALUES
    (v_task_4, 'Curate 3 strongest case studies', FALSE, 0),
    (v_task_4, 'Sketch wireframes in Figma', FALSE, 1)
  ON CONFLICT DO NOTHING;

  -- Task 5: Review monthly household budget (Waiting)
  INSERT INTO public.tasks (
    id, column_id, board_id, user_id, title, description, priority, due_date, sort_order
  )
  VALUES (
    v_task_5,
    v_col_waiting,
    v_board_id,
    v_user_id,
    'Review monthly household budget',
    'Awaiting end-of-month bank statement exports.',
    'medium',
    NOW() + INTERVAL '7 days',
    0
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.checklist_items (task_id, title, is_completed, sort_order)
  VALUES
    (v_task_5, 'Download credit card statements', FALSE, 0),
    (v_task_5, 'Audit unused subscriptions', FALSE, 1)
  ON CONFLICT DO NOTHING;

  -- Task 6: Set up home office workspace (Complete)
  INSERT INTO public.tasks (
    id, column_id, board_id, user_id, title, description, priority, due_date, sort_order
  )
  VALUES (
    v_task_6,
    v_col_complete,
    v_board_id,
    v_user_id,
    'Set up home office workspace',
    'Assembled standing desk and optimized monitor ergonomics.',
    'high',
    NOW() - INTERVAL '1 day',
    0
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.checklist_items (task_id, title, is_completed, sort_order)
  VALUES
    (v_task_6, 'Assemble ergonomic standing desk', TRUE, 0),
    (v_task_6, 'Calibrate 4K monitor color profile', TRUE, 1),
    (v_task_6, 'Under-desk cable management routing', TRUE, 2)
  ON CONFLICT DO NOTHING;

  -- 6. Log sample completed focus session
  INSERT INTO public.focus_sessions (
    id,
    user_id,
    task_id,
    duration_minutes,
    completed_at
  )
  VALUES (
    '30000000-0000-0000-0000-000000000001',
    v_user_id,
    v_task_1,
    25,
    NOW() - INTERVAL '1 hour'
  )
  ON CONFLICT (id) DO NOTHING;

END $$;
