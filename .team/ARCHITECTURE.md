# Zankai Orbit architecture

## Source of truth and boundaries

T-001 establishes the contract for T-002 (data), T-003 (app shell), T-004 (AI routes), and T-005 (interactive board). The product and six-table schema are in .team/PROJECT.md; TypeScript shapes are in src/types/orbit.ts; ADR-001 records the boundary decisions. The stack is Next.js 15 App Router, strict TypeScript, Supabase PostgreSQL/Auth/Realtime, Zustand, and Gemini 2.5 Flash through @google/genai. Prisma is not used.

| Area | Responsibility | Owner |
| --- | --- | --- |
| src/app/layout.tsx, page.tsx, globals.css | Montserrat/theme shell and signed-in workspace at / | T-003 |
| src/components/layout/** and ui/** | Header and reusable UI | T-003 |
| src/components/ai-bar/**, kanban/**, drawer/**, timer/** | Prompt, drag/drop, task editing, timer | T-005 |
| src/stores/** and hooks/** | Client-only Zustand state | T-005 |
| src/app/api/ai/generate-board/route.ts and breakdown-task/route.ts | Authenticated JSON POST endpoints | T-004 |
| src/server/ai/** | Gemini client, prompts, schemas, quota orchestration | T-004, server only |
| src/lib/supabase/** | Typed browser/server/middleware clients and data helpers | T-002 |
| supabase/migrations/** and seed.sql | Tables, RLS, triggers, indexes, seed data | T-002 |
| src/types/orbit.ts | Shared domain and transport types | T-001 |

Server Components load authorized profile/board data and pass serializable view models to Client Components. Client Components own drag events, drawer selection, optimistic updates, and the timer. Route Handlers alone call Gemini. Never import src/server/** or GEMINI_API_KEY into client bundles. Supabase is the persistence source of truth; Zustand is a user-scoped local projection reconciled from authorized rows. The committed routes are / and the two AI POST routes. Authentication UI paths and additional CRUD endpoints are outside T-001.

## Supabase clients, identity, and persistence

Use @supabase/ssr with @supabase/supabase-js. The browser factory uses NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. The server and Route Handler factories are request-scoped and cookie-backed, never global singletons. Next.js 15 middleware refreshes auth cookies and propagates response cookies. Server Components may read cookies but must not be relied on to write refreshed cookies. T-002 owns factories; middleware file placement must be coordinated with T-003 because the root middleware file is outside T-002's owned scope.

The public Supabase key can reach the browser. GEMINI_API_KEY and any service role key stay server-only. Both AI routes call Supabase auth.getUser() and use that identity for database access. Caller-supplied user IDs confer no authority. Map database snake_case rows to the camelCase types in orbit.ts at the data boundary. UUIDs are strings; timestamps are ISO 8601 strings. Persisted task dueDate is a nullable timestamp.

A board insertion triggers creation of five columns, with sort_order 0 to 4: Ideas, Up Next, In Motion, Waiting, Complete. To persist a generated board draft, insert the board, read the trigger-created columns, map generated column titles to their IDs, then insert tasks and checklist items. Do not create duplicate columns. On partial failure, reconcile or clean up through authorized operations; a transactional RPC is preferable if partial writes become observable.

## Database and RLS contract

The six tables and their fields/foreign keys are exactly those in .team/PROJECT.md: profiles, boards, columns, tasks, checklist_items, focus_sessions. profiles.id is the authenticated user ID. boards.user_id, tasks.user_id, and focus_sessions.user_id match it. Columns inherit ownership through boards; checklist items through tasks and boards. Enable RLS on all six tables with no anonymous data access. Use operation-specific SELECT, INSERT, UPDATE, DELETE policies as appropriate; use USING on old rows and WITH CHECK on new rows. The signup trigger creates profiles. Clients may edit only allowed profile fields. Protect tier, ai_monthly_generations, and max_ai_generations with column privileges or controlled database functions; row RLS alone does not protect columns.

Task writes must enforce all of: tasks.user_id equals auth.uid(), the referenced board belongs to that user, and column_id belongs to that board. An optional focus_sessions.task_id must also belong to that user. Foreign keys alone do not enforce these cross-row relationships. Use composite constraints, policy predicates, or database triggers. Index boards(user_id, sort_order), columns(board_id, sort_order), tasks(board_id, column_id, sort_order), checklist_items(task_id, sort_order), and focus_sessions(user_id, completed_at). T-002 should verify user A cannot read or mutate user B's rows, including cross-board references. Seed SQL must use known test users or an explicit safe mechanism; it must not assume a production auth user.

## AI API and validation contract

Both endpoints accept/return JSON. The public shapes are exported from orbit.ts. T-004 validates requests with Zod before work, parses and validates model output with matching Zod schemas, and returns only normalized fields. Success is HTTP 200. Errors use { message: string } with consumer-facing copy: unauthenticated 401, invalid input 400, exhausted quota 403, generation failure 503. Never expose prompts, parser errors, raw JSON, or stack traces.

POST /api/ai/generate-board accepts { prompt: string, theme?: string } and returns a draft, not persisted rows: { title, emoji, colorTheme, tasks }. Each task is { title, description, column, priority, checklist, dueDate }. Column is one of the five default titles; priority is low, medium, or high; dueDate is YYYY-MM-DD or null. T-005 converts the date to a chosen local-time timestamp when saving to avoid timezone shifts. The model emits no IDs, owner IDs, sort orders, or column records. Validate trimmed prompts at 10-2000 characters, optional themes at 1-40, generated title at 1-120, description at 0-1000, 1-30 tasks, and 0-10 checklist strings of 1-200 characters per task. T-004 checks quota before Gemini and increments it exactly once after successful validated generation. T-002 implements authenticated no-argument SQL function consume_board_generation_quota() returning boolean. It atomically increments the caller profile counter only while below max_ai_generations, derives identity from auth.uid(), and has a fixed search_path and authenticated-only execute permission. T-004 calls it after validated generation; false maps to the friendly 403 quota response. A precheck may avoid wasted Gemini calls, but the atomic function decides success. The current schema lacks a monthly reset marker; the reset policy must be resolved before presenting this as a recurring monthly allowance.

POST /api/ai/breakdown-task accepts { taskId, taskTitle, taskDescription? } and returns { subtasks: [{ title }], summary }. T-004 verifies the UUID task ID is owned by the authenticated user and uses stored title/description as the authoritative prompt context. Validate 3-6 distinct nonempty subtask titles and a short summary. This endpoint returns suggestions only; T-005 inserts checklist rows. It does not consume board-generation quota unless that product rule changes.

Use @google/genai on the server with model gemini-2.5-flash, responseMimeType application/json, and responseSchema with required properties, enums, and nullable dueDate. The model schema is not a security boundary: parse, Zod-validate, and map accepted fields. Keep GEMINI_API_KEY in .env.local; .env.example contains names only.

### Gemini responseSchema blueprints

T-004 should express these objects with @google/genai Type.OBJECT, Type.STRING, and Type.ARRAY, and set every listed field as required. The board schema is an object with title:string, emoji:string, colorTheme:string, and tasks:array of objects. Each task object requires title:string, description:string, column:string enum [Ideas, Up Next, In Motion, Waiting, Complete], priority:string enum [low, medium, high], checklist:array of strings, and dueDate:string with format date and nullable true. The breakdown schema is an object requiring subtasks:array of objects each requiring title:string, and summary:string. Set responseMimeType to application/json for both calls. Enforce lengths, array bounds, dates, and distinct checklist suggestions in Zod after JSON parsing because the SDK schema is only the model output format.
## Client state, drag, and timer

T-005 separates Zustand into a board projection (active board ID, ordered columns/tasks, optimistic mutation state), drawer selection (selected task ID/open state), and focus timer (status, remaining seconds, deadline, optional task ID). Clear user-scoped state on sign-out/account change. Persist through T-002 helpers and reconcile returned rows or refetch. Realtime messages may invalidate/refetch or apply version-aware updates; they must not silently overwrite an in-progress local drag.

For @hello-pangea/dnd, task UUID is draggableId, column UUID is droppableId, and the droppable type is TASK. TaskDragEndPayload is a structural subset of DropResult. destination null or reason CANCEL means no mutation. Indices are zero-based positions in ordered columns. Ignore no-op moves. Reorder locally, normalize sortOrder for affected tasks, persist positions and columnId under RLS, then roll back/refetch on failure. This contract covers task dragging, not column dragging.

Task card view models include checklist progress. The six-table schema has no category or assignee field: category badges derive their label from the board title or column title, and the avatar represents the signed-in board owner. Editable categories or multi-user assignment require a later schema decision.

The timer is client-only until completion. Track a wall-clock deadline so background tabs do not extend the session. Normal path: idle to running to paused to running to completed; reset returns to idle. On first completion, insert one focus_sessions row via T-002's helper with authenticated user inferred at the data boundary, durationMinutes 25, optional owned taskId, and completion timestamp. Guard duplicate writes across rerenders. An unfinished session is not guaranteed to survive refresh.

## Primary references

- https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://googleapis.github.io/js-genai/release_docs/interfaces/types.GenerationConfig.html
- https://github.com/hello-pangea/dnd/blob/main/docs/guides/changes-while-dragging.md




