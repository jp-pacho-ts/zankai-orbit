# ADR-001: Stack contracts and AI architecture

- **Status:** Proposed
- **Date:** 2026-10-02
- **Owner:** architect (TEAM-ARCH)
- **Approval level:** GREEN (implements T-001 and the stack already specified in .team/PROJECT.md)
- **Team Lead decision:** Pending review; no RED change is proposed

## Context

T-002, T-003, T-004, and T-005 need a stable boundary before implementing Supabase persistence, the Next.js shell, Gemini routes, and the interactive board. The project specifies Supabase rather than Prisma, browser-visible board editing under RLS, server-only Gemini credentials, and Zustand for interactive state. The six-table schema does not store category badges or multiple assignees.

## Decision & Shared Contracts

- **API shapes and request/response types:** src/types/orbit.ts defines GenerateBoardRequest/Response and BreakdownTaskRequest/Response. POST /api/ai/generate-board returns a draft with title, emoji, colorTheme, and generated tasks (title, description, one of five default column titles, priority, checklist strings, nullable YYYY-MM-DD dueDate). It does not write the board. POST /api/ai/breakdown-task returns 3-6 checklist suggestions and a summary; it does not write checklist items. Errors are human-readable { message: string }. The client uses authorized Supabase helpers to persist accepted suggestions.
- **Domain types and enum values:** Profile, Board, Column, Task, ChecklistItem, FocusSession, Priority (low/medium/high), Tier (free/pro), view models, drag payloads, and timer types are in orbit.ts. SQL snake_case is mapped to camelCase at the data boundary. The default column sequence is Ideas, Up Next, In Motion, Waiting, Complete.
- **Entity names and relations:** The six Supabase PostgreSQL tables in .team/PROJECT.md are authoritative; there are no Prisma entities. boards and tasks carry user_id, columns belong to boards, checklist_items belong to tasks, and focus_sessions optionally reference an owned task. A board trigger seeds the five columns. Generated drafts map target column titles to those rows instead of inserting duplicate columns.
- **Validation and authorization:** Route Handlers call auth.getUser() for each request. Input and Gemini output are validated with Zod; generated text is length bounded and stripped to expected fields. Breakdown verifies ownership of taskId and uses stored task text. Every table has RLS; policies and integrity checks enforce direct or inherited board ownership. Browser clients cannot change profile tier or quota fields. GEMINI_API_KEY and any service role key stay server-only.
- **Gemini output:** T-004 uses @google/genai with gemini-2.5-flash, application/json response MIME type, and responseSchema for both endpoints. The schema constrains fields and enums, but Zod validation remains mandatory after parsing.
- **Quota operation:** T-004 may precheck to avoid unnecessary model calls. After a successful validated board draft, it calls an authenticated no-argument database function consume_board_generation_quota() returning boolean. T-002 implements this as an atomic conditional profile update of ai_monthly_generations only while below max_ai_generations, using auth.uid() internally. It returns false when the limit is reached. The function must have a fixed search_path, authenticated-only execute permission, no caller-supplied user ID, and no direct browser update privilege on quota columns. If it returns false, T-004 returns the friendly quota response. This prevents concurrent successful responses from exceeding the limit. The meaning and reset schedule of monthly remains a follow-up because the schema has no reset marker.
- **State ownership:** Zustand holds a board projection, drawer selection, and wall-clock focus timer. Supabase remains authoritative. Task UUID is the draggable ID, column UUID the droppable ID. Timer completion produces one client-side session write per runtime.

## Alternatives considered

- **Prisma plus a separate server CRUD API:** Adds a second data access model and conflicts with the Supabase RLS/Realtime stack specified by the project.
- **Gemini calls from the browser:** Exposes credentials and makes quota/ownership enforcement unreliable.
- **Free-form model text or prompt-only JSON:** Produces fragile parsing and unclear contracts. responseSchema plus Zod gives a constrained transport and an application-side validation boundary.
- **One global Zustand store as persistence:** Risks stale cross-user state and conflicts with database ownership. Separate UI projections can be cleared/reconciled.
- **Add category and assignee columns now:** Changes the agreed six-table schema. The category badge derives from board or column title, and the owner avatar represents the signed-in user, until a later approved product/schema task.

## Consequences & Parallel Impact

T-002 owns migrations and Supabase helpers; T-003 owns the app shell; T-004 owns AI handlers/services; T-005 owns the interactive client. T-002 and T-004 must coordinate the quota function signature before either relies on it. T-002 and T-003 must coordinate root middleware placement. T-002, T-003, and T-004 touch shared package/config files, so concurrent implementation requires separate worktrees and explicit integration; their task status and dispatch remain TEAM-COORD/Team Lead decisions. RLS and server output validation are required for authorization and data integrity. No destructive migration, deployment, merge, or auth replacement is authorized by this ADR.

## Approval and follow-up

Team Lead may accept or revise this proposed GREEN contract. TEAM-COORD should read the T-001 handoff and schedule downstream tasks under their stated dependencies. Resolve the monthly quota reset policy before advertising a recurring allowance. Review any proposal for persisted categories or multi-user assignments as a separate schema change. Architecture details are maintained in .team/ARCHITECTURE.md.


