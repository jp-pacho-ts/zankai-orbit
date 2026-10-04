# Handoff — T-006

- **Task ID:** T-006
- **From role:** qa
- **To role:** coordinator
- **Terminal:** TEAM-QA
- **Provider:** Codex
- **Capability profile:** STANDARD
- **Status:** QA_FAILED
- **Review date:** 2026-10-04

## Completed work

Reverified the integrated working directory after T-007 and T-008. Read AGENTS.md, project, architecture, QA role, T-006, all dependency handoffs, and the handoff template. team:status reports all six dependencies DONE. The initial working tree was clean at HEAD c39fd3c0a588fa4bdbb46fd5740a57d0554fdf8c. No specialist agents or other tasks were started.

The six previously failing workflow tests now pass. Added three focused regressions for cancellation and persistence failure handling; all three fail. Reviewed AI persistence, drawer, auth lifecycle, timer, theme, SQL security, and client bundle separation. Production source and BOARD.md were not modified.

## Changed files

- tests/t-006-workflows.test.mjs — added three regression tests.
- .team/handoffs/T-006-qa-to-coordinator.md — replaced previous report with current integrated evidence.

## Verification performed

- npm run team:status
- npm run team:show -- T-006
- npm run build
- npx tsc --noEmit
- npm run lint
- node --test tests/t-006-workflows.test.mjs src/server/ai/handlers.test.mjs — initial existing suite.
- node --test tests/t-006-workflows.test.mjs src/server/ai/handlers.test.mjs — expanded suite; invoked alongside a contrast calculation in PowerShell, so its composite shell exit was not used as the test result.
- node --test --test-reporter=dot tests/t-006-workflows.test.mjs src/server/ai/handlers.test.mjs — standalone expanded runner to capture its own exit code.
- node tests/t-006-http-smoke.mjs
- git status --short; git rev-parse HEAD; git branch --show-current
- rg -l 'GEMINI_API_KEY|@google/genai' .next/static
- Presence-only environment/tool checks and Node relative-luminance calculation; no secret values read or printed.

## Verification results

| Check | Result | Evidence |
| --- | --- | --- |
| team:status | PASS, exit 0 | Six dependencies DONE; T-006 READY. |
| team:show | PASS, exit 0 | T-006 ownership, dependencies and restrictions confirmed. |
| Production build | PASS, exit 0 | Next.js 16.3.8; compiled in 4.2s, TypeScript in 4.7s; routes /, /_not-found, both AI endpoints generated. |
| npx tsc --noEmit | PASS, exit 0 | No diagnostics. |
| Lint | FAIL, exit 1 | next lint: Invalid project directory provided, no such directory: C:\Users\User\Documents\Code Projects\zankai-orbit\lint |
| Existing tests | PASS, exit 0 | 19 tests, 19 pass, 0 fail. Includes 11 backend and 8 workflow tests. |
| Expanded tests | FAIL; standalone runner exit 1 | 22 tests, 19 pass, 3 fail, 0 skipped. |
| Production HTTP smoke | PASS, exit 0 | GET / HTTP 200, brand and Montserrat reference present. Both AI POST routes return friendly configuration-failure HTTP 503 with no-store and message-only body. |
| Static client bundle scan | No matches | Neither GEMINI_API_KEY nor @google/genai found in .next/static. This is import-separation evidence, not a live secret-leak proof. |

Exact failing assertions:

- tests/t-006-workflows.test.mjs:89: cancelled drag never mutates tasks or calls persistence — task-1 columnId actually col-waiting, expected col-ideas; sibling sort orders also changed.
- tests/t-006-workflows.test.mjs:97: failed drawer task edit restores the last persisted value — actual 'Unsaved edit', expected 'Plan spring campaign'.
- tests/t-006-workflows.test.mjs:104: failed AI checklist persistence rejects so the drawer cannot report success — 'Missing expected rejection.'

Run the standalone expanded command above to reproduce all three. The test loader executes the real Zustand stores with only the external Supabase boundary substituted; failures are deterministic and require no credentials.

### Acceptance review

| Acceptance criterion | Assessment |
| --- | --- |
| Build, TypeScript, lint zero errors | FAIL: lint cannot execute successfully. |
| Prompt-to-Board creates full five-column boards | Not established end to end; API tests pass with mocks, but persisted IDs are not reconciled into the active board. |
| Reliable drag across columns | Mocked five-column movement passes; CANCEL contract fails. Browser/touch/keyboard verification not run. |
| Drawer and Ask Orbit | Priority mapping and backend ownership tests pass; failed edits and checklist saves are silently retained/reported successful. Browser clipboard and editing not run. |
| Timer records completed sessions | Mocked pause/resume/deadline and duplicate-write tests pass; actual focus_sessions inserts not run. Failed writes have no automatic retry or user recovery path. |
| Polished light/dark modes | Montserrat and canonical theme wiring found; visual transitions/responsiveness not run. Small muted text has low calculated contrast. |
| Zero developer jargon/raw errors | Reviewed copy and HTTP errors contain no raw traces; complete interactive UI review not run. Consumer wording still includes 'Network error' and 'environment'. |

### Security and data evidence

Both migrations enable RLS on all six tables and define direct or inherited ownership checks. Task and focus relationships have validation triggers. T-007 removes the defective current_user profile check, adds INSERT/UPDATE protection, removes profile deletion rights and limits client column grants. These improvements are confirmed by source review only; neither migration was applied during QA.

The quota function is SECURITY DEFINER with fixed search_path, caller identity from auth.uid(), atomic bounded increment and authenticated execute grant. Its transaction-local orbit.allow_quota_update flag is not cleared, and the trigger returns early when that flag is true. This warrants TEAM-DATA review of combined transactions/custom RPCs; it is not a demonstrated PostgREST privilege escalation, particularly given restricted column grants.

Gemini imports server-only and reads its key on the server. Backend tests confirm authentication, owner filtering, request/output validation, quota checks and friendly error masking. Runtime RLS isolation and real network secret exposure remain unverified.

## Assumptions

- The integrated workspace is the QA target. Installed Next.js 16.3.8 differs from the documented Next.js 15 stack; no package change was attempted.
- Mock-boundary regressions establish store behavior, not live Supabase/Gemini availability.
- A CANCEL payload containing a destination tests the explicit architecture contract; typical library cancellation may provide destination null, which the store already ignores.
- Existing test loader uses experimental stripTypeScriptTypes; the declared Node >=20 does not guarantee this API.

## Known issues

1. **High — TEAM-FE: generated board persistence is not reconciled.** PromptBar calls applyAiBoardDraft before createBoardFromDraft, discards returned board/column/task IDs and catches save failures. The store keeps ai-task-* IDs, board-default/user-mc, and previous columns. After a successful generation, immediately use Ask Orbit/edit/drag: requests refer to local IDs rather than the newly saved rows. Source reproduction; live execution not run. Hydrate the returned board and checklist rows and surface save failures.
2. **High — TEAM-FE: drawer mutations hide database failures.** updateTask retains failed edits without rollback or a toast. addChecklistItemsBatch ignores returned rows and exceptions; Ask Orbit consequently announces successful insertion even when saving failed, and later checklist toggles use temporary IDs. Two new tests demonstrate failure handling. Reconcile batch UUIDs and propagate/recover from save errors.
3. **High — TEAM-FE / integration owner: account lifecycle is incomplete.** useOrbitBoard loads once with empty dependencies; no onAuthStateChange handling clears board/drawer/timer on sign-out/account switch. No root middleware/proxy connects updateSession. Source finding; account-switch browser reproduction not run.
4. **Medium — TEAM-FE: cancelled drag contract fails.** moveTaskOptimistic ignores reason CANCEL when destination exists. New regression demonstrates state mutation. Ignore cancellation before mutations or persistence.
5. **Medium — TEAM-FE: date and new-task checklist inconsistencies.** Due date is free text ('May 8 or Tomorrow') passed directly to a timestamp column; new tasks have display dueDate 'No date' although the inserted row defaults to null. New-task initial 'Add first step' retains a temporary ID and is never inserted. Test configured saves and reload/toggle behavior after reconciling full rows.
6. **Medium — TEAM-FE: timer logging recovery is incomplete.** T-008 correctly resets sessionLogged after rejection, but completed state stops the tick loop and the UI exposes no logging retry. Missing client configuration also sets sessionLogged true without inserting a row. Add explicit recovery and truthful success tracking.
7. **Medium — TEAM-FE: drawer keyboard accessibility missing.** Aside declares aria-modal but has no focus trap, initial focus, Escape handler, background inertness or focus restoration. Source finding; browser verification not run.
8. **Medium — TEAM-FE / Team Lead: muted text contrast.** Calculated #7689a7 contrast is 3.56:1 on white, 3.40:1 on #f7faff, 3.25:1 on #f0f5fc; small labels use these pairs. Coordinate design-token adjustments for readable normal-sized text.
9. **Build gate — tooling owner: lint script remains broken.** npm run lint uses next lint; no ESLint setup found. Restore a working configured lint command through a scoped owner task.

## Remaining work

Live Gemini generation, authenticated AI/drawer/clipboard workflows, actual focus-session writes, migration execution, two-user/anonymous RLS and quota concurrency: **not run**. Only .env.example is present; presence-only checks find all three required process environment variables absent. psql and Supabase CLI are unavailable. No test users or database changes were created.

Rendered visual QA, keyboard/touch drag, modal navigation, responsive layout and theme screenshots: **not run**. Playwright, @playwright/test and Puppeteer are absent; no browser interaction or visual automation was performed. HTTP smoke exercises absent-configuration failures, not successful authenticated generation.

TEAM-COORD should triage the remaining findings, route bounded fixes to the owners, arrange authorized live test provisioning, then recommend another manual TEAM-QA dispatch. No production fix, deployment, merge, task status mutation or board update was performed. No final QA signoff is granted.

## Recommended next role

- TEAM-COORD to review this QA_FAILED handoff and recommend owner fixes to the Team Lead.

## Branch / worktree

- main; C:/Users/User/Documents/Code Projects/zankai-orbit.

## Commit

- Reviewed HEAD c39fd3c0a588fa4bdbb46fd5740a57d0554fdf8c. No commit created.
