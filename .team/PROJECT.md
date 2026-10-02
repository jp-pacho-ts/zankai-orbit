# Project Context: Zankai Orbit

- **Project Name:** Zankai Orbit
- **Organization / Creator:** Zankai Software Solution
- **Description:** AI-native consumer productivity workspace and visual Kanban board with "Prompt-to-Board" automated goal planning powered by Gemini 2.5 Flash and Supabase.
- **Target Users:** Everyday people, students, creators, and non-developer teams.
- **Team Lead:** Human Owner
- **Package Manager:** `npm`

## Initial Features & Goals

1. **Prompt-to-Board AI Planning:**
   - Universal AI prompt bar in the header: *"✨ Ask AI to create a board..."*
   - Calls `/api/ai/generate-board` using Google Gemini 2.5 Flash via `@google/genai` SDK with structured JSON output.
   - Automatically generates structured board title, theme, 5 default columns, tasks with descriptions, priority levels, estimated checklist items, and suggested due dates.

2. **Visual Kanban Board & Task Management:**
   - 5 default columns: **"Ideas"**, **"Up Next"**, **"In Motion"**, **"Waiting"**, and **"Complete"**.
   - Smooth drag & drop reordering across columns and within columns using `@hello-pangea/dnd` (touch & mobile friendly).
   - Rich task cards featuring category badge, title, priority label (`low` | `medium` | `high`), due date indicator, assignee avatar, checklist completion progress bar, and card actions menu.
   - Task detail sliding drawer (slides smoothly from the right) with editable title, description, column/status, priority, due date, interactive checklist items, *"Ask Orbit"* AI breakdown button (`/api/ai/breakdown-task`), and *"Copy summary"* button.

3. **Floating Focus Timer (Pomodoro):**
   - Bottom-center floating pill widget with a 25-minute Pomodoro countdown timer.
   - Controls for start, pause, resume, and reset.
   - Automatically logs completed focus sessions into the `focus_sessions` table with duration and timestamp.

4. **Consumer-Grade UI & Brand System (Canonical Reference: `docs/reference/ZankaiOrbitDashboard.tsx`):**
   - **Canonical Design Source of Truth:** `docs/reference/ZankaiOrbitDashboard.tsx` supplied by Team Lead. All layouts, component hierarchy, CSS tokens, and Lucide React icons MUST follow this code strictly.
   - **Icon Library:** `lucide-react` (icons: `Bell`, `CalendarDays`, `Check`, `ChevronDown`, `Copy`, `Filter`, `LayoutGrid`, `List`, `MoreHorizontal`, `Moon`, `Plus`, `Search`, `Settings2`, `Sparkles`, `Sun`, `X`).
   - **Column Symbols:** Ideas `✳`, Up Next `◯`, In Motion `◐`, Waiting `◈`, Complete `✓`.
   - **Color Palette (CSS Variables):**
     - Light mode: `--bg: #f7faff`, `--top: #fff`, `--panel: #f0f5fc`, `--card: #fff`, `--line: #dce7f5`, `--text: #12203a`, `--muted: #7689a7`, `--soft: #eaf2fd`, `--blue: #2867e8`, `--blue2: #438ff4`, `--shadow: #1a4c9512`.
     - Dark mode: `--bg: #07111f`, `--top: #0b1729`, `--panel: #0d1b30`, `--card: #14233a`, `--line: #253d5b`, `--text: #edf4ff`, `--muted: #8ea4c2`, `--soft: #1b3150`, `--blue: #65a1ff`, `--blue2: #83baff`, `--shadow: #0007`.
   - **Brand Mark:** Circular gradient `linear-gradient(145deg, #7ec5ff, #2f68e9)` with planetary ring (`rotate(-34deg)`), `✦`, and italic text `ZANKAI ORBIT`.
   - **Top Navigation Bar:** Height 68px, workspace selector dropdown ("Northstar Team" with "N" badge), live status pill with pulsing blue glow ("Everything in motion"), dark/light theme toggle, notifications (`Bell`), settings (`Settings2`), and profile avatar with owner details.
   - **Board Heading & Filter Strip:** Search bar (`Search`), category filter dropdown (`Filter`), "+ New task" button, board task counter with team avatar stack, and Board / List view switcher (`LayoutGrid` / `List`).
   - **Floating Focus Timer:** Fixed bottom-center glassmorphism pill (`backdrop-filter: blur(15px)`), live status glow dot, active task title label, tabular-nums clock (`HH:MM:SS`), and pause/resume button.
   - **Task Detail Drawer:** Right-side slide-in modal (`min(480px, 100vw)`), title input, status and priority select boxes, overview textarea, interactive to-dos checklist with custom checkboxes, add-step input, due date picker, assignee selector, and bottom actions ("Ask Orbit" AI button, "Copy summary" button).
   - **Strict Voice:** No developer jargon, no git terms, no API inputs.

## Standard Stack & Deviations

- **Framework:** Next.js 15 (App Router, TypeScript strict mode)
- **UI & Styling:** Tailwind CSS, shadcn/ui, Lucide React, Framer Motion
- **Typography:** Montserrat font (Google Fonts / `next/font/google`)
- **Drag & Drop:** `@hello-pangea/dnd`
- **Database & Backend:** Supabase (PostgreSQL, Supabase Auth, Supabase Realtime)
- **Client State Management:** Zustand
- **AI Engine:** Google Gemini 2.5 Flash via `@google/genai` SDK
- **Package Manager:** `npm` (strictly enforced; no yarn/pnpm/bun)

### Stack Deviations & Rationale
- **Database Layer:** Uses Supabase (PostgreSQL with Row Level Security, Supabase Auth, and Realtime client) rather than standalone Prisma. Schema migrations and SQL definitions are managed in `supabase/migrations/` and client utilities in `src/lib/supabase/`.

## Database Schema (Supabase PostgreSQL with RLS: `auth.uid() = user_id`)

1. **`profiles`**
   - `id` (UUID, PK, references `auth.users(id)` ON DELETE CASCADE)
   - `email` (TEXT)
   - `display_name` (TEXT)
   - `avatar_url` (TEXT)
   - `tier` (TEXT, check: `'free'` | `'pro'`, default: `'free'`)
   - `ai_monthly_generations` (INT, default: `0`)
   - `max_ai_generations` (INT, default: `15`)
   - `created_at` (TIMESTAMPTZ, default: `NOW()`)

2. **`boards`**
   - `id` (UUID, PK, default: `gen_random_uuid()`)
   - `user_id` (UUID, references `profiles(id)` ON DELETE CASCADE)
   - `title` (TEXT, NOT NULL)
   - `emoji` (TEXT, default: `'🚀'`)
   - `color_theme` (TEXT, default: `'blue'`)
   - `sort_order` (INT, default: `0`)
   - `created_at` (TIMESTAMPTZ, default: `NOW()`)

3. **`columns`**
   - `id` (UUID, PK, default: `gen_random_uuid()`)
   - `board_id` (UUID, references `boards(id)` ON DELETE CASCADE)
   - `title` (TEXT, NOT NULL) — *Default sequence: "Ideas", "Up Next", "In Motion", "Waiting", "Complete"*
   - `sort_order` (INT, NOT NULL, default: `0`)
   - `created_at` (TIMESTAMPTZ, default: `NOW()`)

4. **`tasks`**
   - `id` (UUID, PK, default: `gen_random_uuid()`)
   - `column_id` (UUID, references `columns(id)` ON DELETE CASCADE)
   - `board_id` (UUID, references `boards(id)` ON DELETE CASCADE)
   - `user_id` (UUID, references `profiles(id)` ON DELETE CASCADE)
   - `title` (TEXT, NOT NULL)
   - `description` (TEXT)
   - `priority` (TEXT, check: `'low'` | `'medium'` | `'high'`, default: `'medium'`)
   - `due_date` (TIMESTAMPTZ)
   - `sort_order` (INT, NOT NULL, default: `0`)
   - `created_at` (TIMESTAMPTZ, default: `NOW()`)

5. **`checklist_items`**
   - `id` (UUID, PK, default: `gen_random_uuid()`)
   - `task_id` (UUID, references `tasks(id)` ON DELETE CASCADE)
   - `title` (TEXT, NOT NULL)
   - `is_completed` (BOOLEAN, NOT NULL, default: `FALSE`)
   - `sort_order` (INT, NOT NULL, default: `0`)

6. **`focus_sessions`**
   - `id` (UUID, PK, default: `gen_random_uuid()`)
   - `user_id` (UUID, references `profiles(id)` ON DELETE CASCADE)
   - `task_id` (UUID, references `tasks(id)` ON DELETE SET NULL)
   - `duration_minutes` (INT, NOT NULL, default: `25`)
   - `completed_at` (TIMESTAMPTZ, default: `NOW()`)

## Repository Conventions & Constraints

- **Security & RLS:** Every table must enforce Row Level Security (RLS) with policies ensuring `auth.uid() = user_id` (or board ownership for cascaded items).
- **AI Credentials:** `GEMINI_API_KEY` stored exclusively on the server (`.env.local`). Never expose API keys or AI client calls on the frontend.
- **Copy & Jargon Constraints:** Maintain a consumer-friendly productivity voice. Never show developer/technical terms such as "Git branch", "Database error code", "API schema", or raw JSON errors.
- **Design Integrity:** Montserrat font family throughout. Maintain design fidelity with MagicPath reference `keen-house-7963`.

## Working Agreement

- **Owner of this file:** Coordinator (`TEAM-COORD`) / Team Lead.
- **Single-writer board rule:** Only `TEAM-COORD` updates `.team/BOARD.md`.
- **Manual dispatch:** `TEAM-COORD` plans and recommends; the human Team Lead manually starts specialist terminals (`TEAM-ARCH`, `TEAM-FE`, `TEAM-BE`, `TEAM-DATA`, `TEAM-QA`).
- **Approval Authority:** The human Team Lead retains final authority over `RED` decisions (architecture replacement, destructive database operations, production deployment, force push, and merging).
