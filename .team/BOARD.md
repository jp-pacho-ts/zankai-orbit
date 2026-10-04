# Team Board

> **Single-Writer Rule:** Only `TEAM-COORD` (Coordinator) or the human Team Lead (via `npm run team:board` / `npm run team:init`) may update `.team/BOARD.md`. Specialist workers (`TEAM-ARCH`, `TEAM-FE`, `TEAM-BE`, `TEAM-DATA`, `TEAM-QA`) must **never** directly modify `.team/BOARD.md`; they report completion and status through `.team/handoffs/`.

<!-- AI_TEAM_BOARD_START -->
BACKLOG: 0 · READY: 1 · IN_PROGRESS: 0 · BLOCKED: 0 · READY_FOR_QA: 0 · QA_FAILED: 0 · DONE: 7

| ID | Title | Status | Role | Terminal | Provider | Profile | Parallelism | Dependencies |
|---|---|---|---|---|---|---|---|---|
| [T-001](tasks/T-001.md) | Initial Architecture, Shared Contracts & System Design | DONE | Architect | TEAM-ARCH | Codex | DEEP | SAFE PARALLEL | None |
| [T-002](tasks/T-002.md) | Supabase Schema, Migrations, RLS Policies & Client Setup | DONE | Data | TEAM-DATA | Antigravity | STANDARD | PARALLEL WITH ISOLATION | T-001 |
| [T-003](tasks/T-003.md) | Next.js 15 Foundation, Montserrat Font, Theme & App Shell | DONE | Frontend | TEAM-FE | Antigravity | STANDARD | PARALLEL WITH ISOLATION | T-001 |
| [T-004](tasks/T-004.md) | Gemini 2.5 Flash AI Route Handlers & Server Services | DONE | Backend | TEAM-BE | Codex | STANDARD | PARALLEL WITH ISOLATION | T-001 |
| [T-005](tasks/T-005.md) | Interactive Kanban Board, Drag & Drop, Detail Drawer & Floating Focus Timer | DONE | Frontend | TEAM-FE | Antigravity | STANDARD | PARALLEL WITH ISOLATION | T-002, T-003, T-004 |
| [T-006](tasks/T-006.md) | End-to-End Integrated QA, Security, UX & Workflow Verification | READY | QA | TEAM-QA | Codex | STANDARD | SEQUENTIAL / BLOCKED | T-002, T-003, T-004, T-005, T-007, T-008 |
| [T-007](tasks/T-007.md) | Data Layer Security & Helper Error Propagation | DONE | Data | TEAM-DATA | Antigravity | STANDARD | SAFE PARALLEL | None |
| [T-008](tasks/T-008.md) | Frontend Workflow Store Fixes & Error Handling | DONE | Frontend | TEAM-FE | Antigravity | STANDARD | SAFE PARALLEL | None |
<!-- AI_TEAM_BOARD_END -->
