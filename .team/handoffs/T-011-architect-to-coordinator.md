# Handoff — T-011

- **Task ID:** T-011
- **From role:** architect
- **To role:** coordinator
- **Terminal:** TEAM-ARCH
- **Provider:** Codex
- **Capability profile:** DEEP
- **Status:** COMPLETED

## Completed work

- Defined the four auth session states, sign-in payloads, a safe profile projection, and tier permission hints in src/types/auth.ts.
- Recorded the SSR cookie refresh, callback, route protection, client hydration, sign-out purge, account-switch race control, and offline preview contracts in ADR-002.
- Reviewed the existing Supabase session helper, signup trigger, board hook/stores, current Next.js dependency, and T-012 through T-015 contracts to make the design implementable.

## Changed files

- .team/decisions/ADR-002-auth-session-lifecycle.md
- src/types/auth.ts
- .team/handoffs/T-011-architect-to-coordinator.md

## Verification performed

- npx tsc --noEmit
- npm run build
- npm run team:status

## Verification results

- npx tsc --noEmit exited 0 with no diagnostics.
- npm run build exited 0. Next.js 16.3.8 compiled successfully, completed TypeScript, and generated all five static pages.
- npm run team:status exited 0; before this handoff it listed T-011 READY with zero handoffs. Only TEAM-COORD should update board status.
- No live auth or RLS integration test was run under T-011; those belong to downstream implementation and T-015.

## Assumptions

- Supabase Auth remains the selected identity provider; this task adds lifecycle contracts without replacing auth.
- Public preview is synthetic data and may be shown to a signed-out user. Protected AI endpoints continue to return a friendly 401 when no verified user exists, consistent with ADR-001.
- TierPermissions is a UI projection; the profile row, RLS, and server quota function decide access.

## Known issues

- The installed package is Next.js 16.3.8, where proxy.ts is the current request-boundary convention, while T-013 owns src/middleware.ts under a Next.js 15 plan. ADR-002 is YELLOW/Proposed until the Team Lead chooses a version/path and TEAM-COORD aligns T-013 scope.
- T-013's unauthenticated mock-AI fallback line conflicts with the existing 401 AI route contract. ADR-002 places synthetic preview behavior in the public client; TEAM-COORD should clarify T-013 before dispatch.
- The initial migration already creates on_auth_user_created and on_board_created triggers. T-012 should extend onboarding idempotently rather than duplicate them.
- The current useOrbitBoard hook and stores do not yet purge user data or cancel stale hydration on sign-out; T-014 owns that implementation.
- An unrelated pre-existing modification to .team/PLAN.md was present and was not changed here.

## Remaining work

- No remaining T-011 authoring work. TEAM-COORD/Team Lead must resolve the two T-013 contract decisions before downstream dispatch; T-012 through T-015 implement and verify the design.

## Recommended next role

- TEAM-COORD for handoff review, board update, and T-013 scope/contract reconciliation before manual specialist dispatch.

## Branch / worktree

- main; workspace root.

## Commit

- No T-011 commit. Starting HEAD: c10d9ab.

