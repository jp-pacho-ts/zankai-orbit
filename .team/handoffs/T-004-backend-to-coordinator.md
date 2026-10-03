# Handoff — T-004

- **Task ID:** T-004
- **From role:** backend
- **To role:** coordinator
- **Terminal:** TEAM-BE
- **Provider:** Codex
- **Capability profile:** STANDARD
- **Status:** READY_FOR_QA

## Completed work

- Implemented authenticated JSON POST routes for board generation and task breakdown, matching the T-001 transport types.
- Added server-only Gemini 2.5 Flash services using @google/genai, responseMimeType application/json, required structured responseSchema fields, and a 60-second request timeout. GEMINI_API_KEY is read only on the server and the client initializes lazily.
- Added Zod validation for trimmed requests and normalized model output, canonical column/priority values, real calendar dates or null, array/length limits, and distinct checklist suggestions. Extra fields are stripped.
- Board generation reads the authenticated profile for a quota precheck, validates output, then calls consume_board_generation_quota() once. The atomic RPC decides success when requests compete for the last allowance. Model/validation failures do not consume quota; ambiguous RPC failures are not retried.
- Task breakdown filters the task by both task ID and authenticated user ID and uses stored title/description as authoritative context. It returns suggestions without persisting rows or consuming board quota.
- All error responses contain only friendly message copy: authentication 401, invalid input or unavailable task 400, exhausted quota 403, internal/generation failures 503. Responses use Cache-Control: no-store.
- Confirmed .env.example already documents GEMINI_API_KEY as server-only; no redundant shared-file edit was needed.
- Added 11 regression tests covering authentication, malformed/oversized requests, quota precheck/atomic denial/single consumption/RPC failure, output normalization, masked failures, owned task context, missing tasks, distinct steps, dates and enums.

## Changed files

- package.json
- package-lock.json (npm-generated companion to the shared dependency manifest)
- src/app/api/ai/generate-board/route.ts
- src/app/api/ai/breakdown-task/route.ts
- src/server/ai/index.ts
- src/server/ai/handlers.ts
- src/server/ai/gemini.ts
- src/server/ai/schemas.ts
- src/server/ai/handlers.test.mjs
- .team/handoffs/T-004-backend-to-coordinator.md

## Verification performed

- npm run team:status
- npm run team:show -- T-004
- npm install @google/genai zod server-only
- npm exec --offline -- tsc --noEmit --incremental false
- npm exec --offline -- node --test src/server/ai/handlers.test.mjs (unsuccessful runner invocation)
- node --test src/server/ai/handlers.test.mjs (initial loader failure, then corrected and rerun)
- npm run build
- npm audit --omit=dev
- npm run lint
- git diff --check; git diff --stat; git diff --name-only; git status --short

## Verification results

- team:status: exit 0; T-001/T-002/T-003 are DONE, T-004 is READY, and no task is IN_PROGRESS. team:show: exit 0; confirmed scope and dependency.
- Installation: exit 0; added @google/genai, Zod and server-only plus their transitive packages.
- Typecheck: exit 0, no diagnostics.
- npm exec test invocation: exit 1 with ENOTCACHED because npm tried to resolve a separate node package; replaced with the installed Node runtime.
- Initial direct test run failed because installed TypeScript 7 does not expose the legacy transpile API. Switched the in-memory test loader to Node's stripTypeScriptTypes. Final direct run: exit 0, 11 tests passed, 0 failed on Node v26.8.1. Node emits an experimental API warning for the loader.
- Production build: exit 0, compilation and TypeScript checks succeeded; both /api/ai/generate-board and /api/ai/breakdown-task appear as dynamic routes.
- Audit: exit 1, five high-severity findings in the existing braces/chokidar/micromatch/fast-glob/Tailwind dependency chain. Suggested fix changes Tailwind's major version and is outside T-004; no forced upgrade performed.
- Lint: exit 1; existing script runs next lint, which installed Next.js 16 interprets as an invalid project directory. Lint is not verified; no shared lint configuration changed.
- git diff --check: exit 0. Scope review showed only the listed backend files, dependency manifest/lockfile, and handoff changes. .team/BOARD.md and restricted UI/database paths were not modified.
- Live Gemini calls, authenticated HTTP smoke tests, database RLS and concurrent SQL execution: not run; no live credentials or external database changes were used. Unit tests mock Supabase/model boundaries and do not establish live database behavior.

## Assumptions

- T-001 architecture and integrated T-002 client/schema contracts govern this implementation. The project already runs Next.js 16 despite the original Next.js 15 stack description; framework replacement was outside this task.
- Board generation returns drafts; downstream T-005 persists them. Missing/unowned task IDs map to friendly 400 responses within the agreed status contract.
- Shared package edits were performed sequentially in the dispatched workspace: team status showed all prerequisite specialists DONE and no concurrent implementation task. No extra agents or terminals were launched.
- Tests require a Node runtime exposing node:module stripTypeScriptTypes (Node 22.13+ or a compatible newer version); application dependencies retain the existing Node >=20 declaration.

## Known issues

- Monthly allowance reset semantics remain unresolved in the existing schema. Copy intentionally makes no recurring monthly promise.
- Existing lint script and dependency audit findings need Coordinator triage outside T-004.
- An ambiguous network failure after SQL commits can consume quota without delivering a board. No automatic retry is performed; stronger delivery/idempotency guarantees would require a later data/API contract.

## Remaining work

- No remaining T-004 implementation work. TEAM-QA should verify the integrated app with configured Supabase/Gemini, including cross-user task denial and concurrent quota consumption.
- TEAM-COORD reviews this handoff and updates task/board status. This specialist has not marked the task DONE.

## Recommended next role

- TEAM-COORD for review and manual dispatch of integrated TEAM-QA verification.

## Branch / worktree

- main; C:/Users/User/Documents/Code Projects/zankai-orbit.

## Commit

- None created; changes remain available for Team Lead review.
