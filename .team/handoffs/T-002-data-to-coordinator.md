# Handoff — T-002

- **Task ID:** T-002
- **From role:** data
- **To role:** coordinator
- **Terminal:** TEAM-DATA
- **Provider:** Antigravity
- **Capability profile:** STANDARD
- **Status:** COMPLETED

## Completed work

- **Supabase PostgreSQL Schema Migration (`supabase/migrations/20261003000000_create_orbit_schema.sql`):**
  - Implemented the authoritative 6-table schema according to `.team/PROJECT.md`:
    - `profiles`: Primary key `id` referencing `auth.users(id)` ON DELETE CASCADE, `email`, `display_name`, `avatar_url`, `tier` (`'free'` | `'pro'`), `ai_monthly_generations` (default 0), `max_ai_generations` (default 15), and `created_at`.
    - `boards`: Primary key `id` (UUID), `user_id` (references `profiles(id)` ON DELETE CASCADE), `title`, `emoji` (default `'🚀'`), `color_theme` (default `'blue'`), `sort_order` (default 0), and `created_at`.
    - `columns`: Primary key `id` (UUID), `board_id` (references `boards(id)` ON DELETE CASCADE), `title`, `sort_order` (default 0), and `created_at`.
    - `tasks`: Primary key `id` (UUID), `column_id` (references `columns(id)` ON DELETE CASCADE), `board_id` (references `boards(id)` ON DELETE CASCADE), `user_id` (references `profiles(id)` ON DELETE CASCADE), `title`, `description`, `priority` (`'low'` | `'medium'` | `'high'`, default `'medium'`), `due_date`, `sort_order` (default 0), and `created_at`.
    - `checklist_items`: Primary key `id` (UUID), `task_id` (references `tasks(id)` ON DELETE CASCADE), `title`, `is_completed` (default false), and `sort_order` (default 0).
    - `focus_sessions`: Primary key `id` (UUID), `user_id` (references `profiles(id)` ON DELETE CASCADE), `task_id` (references `tasks(id)` ON DELETE SET NULL), `duration_minutes` (default 25), and `completed_at`.
  - Added indexes per `.team/ARCHITECTURE.md`:
    - `idx_boards_user_sort` on `boards(user_id, sort_order)`
    - `idx_columns_board_sort` on `columns(board_id, sort_order)`
    - `idx_tasks_board_column_sort` on `tasks(board_id, column_id, sort_order)`
    - `idx_tasks_user` on `tasks(user_id)`
    - `idx_checklist_task_sort` on `checklist_items(task_id, sort_order)`
    - `idx_focus_sessions_user_completed` on `focus_sessions(user_id, completed_at DESC)`

- **Row Level Security (RLS) & Column Security:**
  - Enabled RLS across all 6 tables without exception.
  - Defined operation-specific (SELECT, INSERT, UPDATE, DELETE) policies using `USING` and `WITH CHECK` clauses.
  - Enforced `auth.uid() = user_id` on `profiles`, `boards`, `tasks`, and `focus_sessions`.
  - Enforced inherited board ownership policies for `columns` and `checklist_items`.
  - Added database triggers (`validate_task_relationships` and `validate_focus_session_task`) verifying cross-row foreign key ownership (ensuring task board belongs to user, task column belongs to task board, and focus session task belongs to user).
  - Protected privileged profile fields (`tier`, `ai_monthly_generations`, `max_ai_generations`) from unauthorized client mutations via trigger check (`protect_profile_privileged_fields`) and column privilege revocations.

- **Lifecycle Triggers & Quota Function:**
  - `on_auth_user_created` trigger on `auth.users`: automatically creates a corresponding row in `public.profiles` upon signup.
  - `on_board_created` trigger on `public.boards`: automatically inserts the 5 canonical columns ("Ideas", "Up Next", "In Motion", "Waiting", "Complete" with sort orders 0..4).
  - `consume_board_generation_quota()` SQL function: atomic, `SECURITY DEFINER` function with fixed `search_path = public`, deriving caller identity from `auth.uid()`, incrementing `ai_monthly_generations` only when below `max_ai_generations`, returning boolean. Granted only to `authenticated`.

- **Mock Seed Data (`supabase/seed.sql`):**
  - Created mock consumer dataset with safe auth user provisioning, profile setup, sample board ("Personal Productivity & Goals"), 5 columns, multi-priority tasks, checklist items, and a logged focus session.

- **Supabase Client Setup (`src/lib/supabase/`):**
  - Installed `@supabase/supabase-js` and `@supabase/ssr`.
  - `src/lib/supabase/types.ts`: Complete TypeScript Database schema matching all 6 tables, columns, constraints, and RPC function.
  - `src/lib/supabase/client.ts`: SSR-ready browser client factory via `createBrowserClient`.
  - `src/lib/supabase/server.ts`: Request-scoped, cookie-backed server client factory via `createServerClient` and Next.js 15 async `cookies()`.
  - `src/lib/supabase/middleware.ts`: Middleware auth session refresh helper `updateSession`.
  - `src/lib/supabase/mappers.ts`: Boundary mappers converting database snake_case rows to camelCase domain models in `src/types/orbit.ts`.
  - `src/lib/supabase/helpers.ts`: Typed data access utilities for boards (`getUserBoards`, `getBoardWithDetails` assembling `BoardView`, `createBoard`, `createBoardFromDraft`, `updateBoard`, `deleteBoard`), tasks (`createTask`, `updateTask`, `deleteTask`, `moveTask`), checklist items (`addChecklistItem`, `addChecklistItemsBatch`, `toggleChecklistItem`, `deleteChecklistItem`), focus sessions (`logFocusSession`, `getUserFocusSessions`), and quota (`getCurrentProfile`, `consumeBoardGenerationQuota`).
  - `src/lib/supabase/index.ts`: Consolidated exports.

- **Environment Configuration:**
  - Created `.env.example` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `GEMINI_API_KEY`.

## Changed files

- `package.json`
- `package-lock.json`
- `.env.example`
- `src/lib/supabase/types.ts`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/middleware.ts`
- `src/lib/supabase/mappers.ts`
- `src/lib/supabase/helpers.ts`
- `src/lib/supabase/index.ts`
- `supabase/migrations/20261003000000_create_orbit_schema.sql`
- `supabase/seed.sql`
- `.team/handoffs/T-002-data-to-coordinator.md`

## Verification performed

- `npm install @supabase/supabase-js @supabase/ssr`: Executed; installed dependencies successfully.
- `npx tsc --noEmit`: Executed; compiled cleanly with 0 TypeScript errors.
- `npm run build`: Executed; Next.js 16 production build succeeded with Turbopack in 5.8s, generating static routes for `/` and `/_not-found`.
- `npm run team:status`: Executed; reported team state and confirmed T-002 status.
- `npm run team:show -- T-002`: Executed; verified requirements, owned scope, and dependencies.
- `npm run lint`: Executed; failed due to unconfigured project lint directory script (`next lint` without ESLint configuration in devDependencies).
- `git status` and `git diff`: Executed; confirmed clean changes strictly matching owned scope and shared files.

## Verification results

- `npx tsc --noEmit`: Exited 0 with no errors.
- `npm run build`: Exited 0; production build and page generation completed successfully.
- `npm run team:status`: Exited 0.
- `npm run team:show -- T-002`: Exited 0.

## Assumptions

- Supabase project credentials will be supplied in `.env.local` based on `.env.example`.
- T-004 (backend) will call `consume_board_generation_quota()` after successfully validating generated board drafts.
- T-005 (frontend interactive board) will use `src/lib/supabase/helpers.ts` to persist drag-and-drop moves, task detail edits, checklist completions, and focus session completions.

## Known issues

- None.

## Remaining work

- None for T-002.
- Downstream tasks: T-004 (Gemini route handlers) and T-005 (interactive board with persisted state).

## Recommended next role

- `coordinator` (`TEAM-COORD`) to review this handoff, update `.team/BOARD.md`, and dispatch `TEAM-BE` for T-004 or subsequent tasks.

## Branch / worktree

- `main`

## Commit

- `27eb48c`
