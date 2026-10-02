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

4. **Consumer-Grade UI & Brand System (Design Reference: MagicPath `keen-house-7963`):**
   - Clean, airy palette: Pale blue page background, pure white cards, subtle blue-gray borders, vibrant blue primary buttons.
   - Coordinated dark mode: Deep navy background with high-contrast, accessible surface accents and working toggle.
   - Header with workspace selector dropdown, subtle pulsing status indicator ("Orbit Live"), theme mode toggle, and user profile avatar with tier badge.
   - Montserrat font family used consistently throughout all typography.
   - Strict consumer tone: **NO developer jargon**, **NO GitHub controls**, **NO client-visible API key inputs**.

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
