# Handoff — T-006

- **Task ID:** T-006
- **From role:** qa
- **To role:** coordinator
- **Terminal:** TEAM-QA
- **Provider:** Codex
- **Capability profile:** STANDARD
- **Status:** QA_FAILED
- **Verification date:** 2026-10-04

## Completed work

Verified the integrated main working directory at HEAD `be5cc6388ce484df54fabef448d4b42af3cfe9c8`. Read AGENTS.md, project context, architecture, QA role, task, QA-gate skill, handoff template, and all T-002 through T-005 handoffs. Both the task board and team:status identify all four dependencies as DONE; their frontend, backend, and SQL implementations are present. Initial git status was clean. No specialists were launched.

Executed production build, strict TypeScript, lint, existing backend tests, focused tests against the actual Zustand stores with mocked persistence, and production HTTP smoke checks. Reviewed SQL policies, auth boundaries, client/server imports, bundle contents, UI error handling, font/theme setup, drawer contracts, and timer persistence. No production source or database changes were made.

## Changed files

- `tests/t-006-workflows.test.mjs`
- `tests/t-006-http-smoke.mjs`
- `.team/handoffs/T-006-qa-to-coordinator.md`

Build/typecheck generated ignored artifacts. `.team/BOARD.md`, task metadata, package manifests, and production source were not edited.

## Verification performed

| Command | Exit | Actual result |
| --- | --- | --- |
| `npm run team:status` | 0 | Dependencies T-002/T-003/T-004/T-005 DONE; T-006 READY; no tasks IN_PROGRESS. |
| `npm run team:show -- T-006` | 0 | Confirmed assigned role, sequential dependencies, owned/restricted scope. |
| `npm run build` | 0 | Next.js 16.3.8 Turbopack: compiled successfully in 2.8s; TypeScript finished in 6.5s; generated 5/5 pages. `/` static; both AI routes dynamic. |
| `npx --no-install tsc --noEmit` | 0 | No diagnostics. |
| `npx tsc --noEmit` | 0 | Exact required command; no diagnostics. |
| `npm run lint` | 1 | `next lint`: `Invalid project directory provided, no such directory: C:\Users\User\Documents\Code Projects\zankai-orbit\lint`. ESLint analysis did not run. |
| `node --test src/server/ai/handlers.test.mjs` | 0 | 11 tests, 11 passed, 0 failed. Authentication, input/output validation, quota, authoritative owned-task context, masked failures. |
| `node --test tests/t-006-workflows.test.mjs` | 1 | 8 tests, 2 passed, 6 failed; details below. |
| `node tests/t-006-http-smoke.mjs` | 0 | GET `/` 200; brand/Montserrat class present. Both AI POST routes return friendly `{message}` 503 and no-store when configuration is absent. Temporary loopback server stopped in finally. |
| `rg -n 'GEMINI_API_KEY|generativelanguage|@google/genai' .next/static` | 1 | No matches; ripgrep 1 means no matching strings, not a failed security test. |
| `git diff --check` | 0 | No tracked whitespace errors at the time checked. Final scope check recorded separately below. |

The first build was polled to completion but its final response was omitted from the visible tool output; a second build captured the successful exit and full route summary above. The first HTTP smoke attempt exited 1 because its test assertion expected contiguous brand text despite nested spans; corrected the QA assertion to strip HTML tags and match the emitted Montserrat class, then reran successfully. These were test/evidence corrections, not application fixes. Node warns that stripTypeScriptTypes is experimental.

No npm `test`, `typecheck`, or schema-validation scripts exist in package.json. Used installed TypeScript and direct Node test runners instead; did not install dependencies or modify scripts.

## Verification results

**Overall: FAIL. Do not mark T-006 DONE or approve production readiness.**

| Acceptance criterion | Result | Evidence / limit |
| --- | --- | --- |
| Build, TypeScript, lint zero errors | FAIL | Build/typecheck pass; lint command exits 1 before linting. |
| End-to-end AI creation of full five-column boards | FAIL / live not run | Request transport and five-column trigger present, backend mocked tests pass; frontend never reconciles persisted board/task IDs. No configured live services. |
| Reliable drag across all columns | FAIL | Unfiltered store reorder and movement through all five columns pass; filtered reorder and failed-write rollback tests fail. Browser pointer/touch/keyboard interaction not run. |
| Drawer and Ask Orbit work smoothly | FAIL | Temporary IDs break subsequent persistence; priority mapping is invalid; AI errors become synthetic success. Clipboard execution not run. |
| Focus timer records completed sessions | FAIL / live not run | Mocked 1500-second start, pause/resume, deadline expiry and single write pass; logging failure incorrectly leaves sessionLogged true. Actual SQL insert not run. |
| Light/dark visual polish | Not verified; contrast issue | Montserrat and canonical theme tokens present. Light muted text ratios below 4.5:1. Rendered browser/theme transition and responsive QA not run. |
| No jargon/raw traces in UI | Partial | Reviewed copy and HTTP failures are friendly; no Git controls/raw server traces found. All rendered states cannot be certified without browser QA. |
| RLS/data isolation | Not signed off | All six tables enable RLS with owner predicates and relationship triggers. Privileged profile protection is defective; live two-user tests not run. |
| Server-only Gemini key | Static check passes | Server-only sentinels; key read confined to server Gemini module; searched client bundle has no key name/SDK/endpoint match. No real secret was configured, so actual-value leakage testing not run. |

### Executed workflow reproductions

Run `node --test tests/t-006-workflows.test.mjs` to reproduce all six failures. Tests execute the real stores, replacing only the external Supabase boundary; these do not establish live database or browser behavior.

1. **Filtered reorder changes the wrong card (high, TEAM-FE).** `kanban-board.tsx`/`kanban-column.tsx` pass visible filtered indices, while `board-store.ts` splices the complete source list by source.index. With hidden task-1 and visible task-2/task-3, drag task-2 from visible index 0 to 1: actual full order is `task-2,task-1,task-3`; task-2 never moves after task-3. Locate by draggableId and translate visible destination positions safely.
2. **Failed drag writes never roll back (high, TEAM-FE).** Reject mocked moveTask during Ideas → Waiting. Expected original Ideas or reconciliation/error; actual column remains Waiting. Catch silently preserves optimistic state. The saved oldTasks snapshot is unused. Other CRUD/checklist mutations also swallow errors. Restore/refetch authoritative state and show friendly failure.
3. **New task loses database identity (high, TEAM-FE).** Mock createTask returns UUID `00000000-0000-4000-8000-000000000001`; addTask returns `task-<timestamp>`. Later drawer edits, AI breakdown, timer logging, and drag use an ID the database cannot recognize. Reconcile returned task and dependent checklist IDs; the initial local checklist is never inserted.
4. **New checklist loses database identity (high, TEAM-FE).** Mock addChecklistItem returns the UUID; store keeps `step-<timestamp>`. A subsequent completion toggle targets the wrong ID. Batch creation likewise discards returned rows.
5. **Null due date becomes Tomorrow (medium, TEAM-FE).** Apply AI draft with dueDate null; actual task.dueDate is `Tomorrow`. Preserve nullable timestamp contract and convert real date-only values intentionally. Drawer also accepts arbitrary text and persists it directly into TIMESTAMPTZ.
6. **Focus write failure marked logged (high, TEAM-FE).** Reject mocked logFocusSession; actual sessionLogged remains true. Flag is set before the write and never restored; future completion calls return without retry or failure indication. Preserve duplicate prevention while distinguishing pending, successful, and failed writes.

### Additional source-review findings

- **Profile tier/quota protection is unsafe (high, TEAM-DATA; live exploit not tested).** `supabase/migrations/20261003000000_create_orbit_schema.sql:286` defines protect_profile_privileged_fields as SECURITY DEFINER but checks current_user against postgres/service_role. current_user reflects the function owner; a postgres-owned function skips the guard. The claimed column privilege revocations in T-002's handoff are absent: the only REVOKE/GRANT statements affect the quota function. Profile INSERT also accepts arbitrary protected values subject only to own ID; the protection trigger runs only on UPDATE, and DELETE policy permits deleting one's profile. Whether deployed clients can exercise these paths depends on actual table grants, not verified here. Protect INSERT/UPDATE and recreation paths with explicit privileges/validated functions; verify as two authenticated users and anonymous role, including direct tier/counter/max mutations and profile deletion/reinsertion. Do not deploy destructive fixes without Team Lead approval.
- **AI board stays bound to old/local IDs (high, TEAM-FE).** PromptBar applies draft before createBoardFromDraft and ignores its returned board/columns/tasks. applyAiBoardDraft reuses old columns and board ID, sets task boardId to board-default, userId to user-mc, and synthetic ai-task IDs. Even successful persistence cannot make edits to the displayed board work. Reproduce with a successful authenticated generation, edit/drag a generated card, then refresh. Reconcile the complete persisted BoardView and report partial save failures instead of claiming success. TEAM-DATA's sequential draft persistence has no partial-write cleanup/transaction and should also be reviewed.
- **Normal/Urgent priorities violate the contract (high, TEAM-FE).** Drawer lowercases select labels to `normal`/`urgent`; allowed SQL/domain values are low/medium/high. Selecting Normal on a high task fails persistence and displays misleading local state. Map Normal → medium and resolve Urgent within the agreed three-value contract.
- **Ask Orbit masks failures as successful suggestions (medium, TEAM-FE).** Every non-2xx response, including 401/400/503, appends canned steps and displays Smart steps added. Network exceptions do the same. Surface backend friendly messages; do not represent fallback steps as successful AI generation.
- **Sign-out/account-state isolation missing (high, TEAM-FE with TEAM-COORD contract review).** UserNav Sign out only closes the menu. No onAuthStateChange listener or store reset exists; useOrbitBoard loads once. Existing board/drawer/timer state is not cleared on sign-out or account change as architecture requires. Verify a real account switch after implementing auth state handling. No root middleware/proxy wires the supplied updateSession helper, so refresh-cookie integration also remains incomplete.
- **Drawer keyboard accessibility missing (medium, TEAM-FE).** An aside declares aria-modal but has no initial focus, focus trap, Escape dismissal, background inertness, or focus restoration. Unused Radix dialog primitives do not provide these behaviors to this drawer. Source finding; browser keyboard reproduction remains to run.
- **Muted light text contrast is low (medium, TEAM-FE / Team Lead design decision).** Calculated relative-luminance ratios for #7689a7: on white 3.56:1, on #f7faff 3.40:1, on #f0f5fc 3.25:1. Small labels use these pairs. Canonical tokens are followed, but normal-sized text needs improved contrast; coordinate any reference-token change.
- **Sibling reorder errors are ignored (medium, TEAM-DATA).** moveTask checks the moved-row error but ignores errors from subsequent sibling updates. A partial save can corrupt ordering while resolving successfully. Batch checklist insertion restarts sort_order at zero when appending to existing items. Add failure propagation/reconciliation and proper append positions.

## Assumptions

- The integrated workspace, not isolated handoffs, is the QA target. Installed Next.js is 16.3.8 despite the documented Next.js 15 stack; no replacement attempted.
- Intentionally failing QA tests encode required behavior and are retained for owner fixes.
- Test loader requires Node stripTypeScriptTypes (executed on Node v26.8.1); the application manifest's Node >=20 declaration alone does not guarantee this QA runner works.

## Known issues

Live Gemini generation, authenticated browser AI/drawer/clipboard flows, SQL migration execution, anonymous/two-user RLS, quota concurrency, and actual focus_sessions inserts: **not run**. Only .env.example exists; presence-only checks report all three required process environment variables absent. No secret values were read or printed. psql and Supabase CLI were not found; no local database configuration is present. Playwright, @playwright/test, and Puppeteer are absent. No browser automation or visual skill was invoked; screenshots, touch/keyboard drag, modal focus and rendered theme/responsive checks remain **not run**. No test credentials were invented and no external database was changed.

The production HTTP test checks absent-configuration 503 handling, not authenticated success or live Gemini availability. Mocked timer completion advances the deadline instead of waiting 25 minutes. Static bundle search is evidence of import separation, not proof against every possible secret leak. Monthly quota reset semantics remain unresolved as already recorded in architecture.

## Remaining work

Coordinator should route lint setup and frontend defects to TEAM-FE, profile protection and helper persistence defects to TEAM-DATA, and coordinate auth integration and live test provisioning. After fixes, manually dispatch TEAM-QA for integrated regression and live/browser verification. This report supplies findings only; no task dispatched or board status changed.

## Recommended next role

- TEAM-COORD to triage this QA_FAILED handoff and recommend bounded specialist fixes to the Team Lead.

## Branch / worktree

- `main`; `C:/Users/User/Documents/Code Projects/zankai-orbit`.

## Commit

- No commit created. Verified HEAD `be5cc6388ce484df54fabef448d4b42af3cfe9c8`; QA artifacts left for review.
