# Zankai Orbit — Production Roadmap & Checklist (`PLAN.md`)

This living checklist tracks the transition of **Zankai Orbit** from an initial MVP into a full-scale, production-ready consumer workspace.

---

## Progress Overview

- [x] **Milestone 0: MVP Foundation & Core Loops (T-001 – T-010)** — `COMPLETED`
- [ ] **Milestone 1: Production Authentication & User Lifecycle (T-011 – T-015)** — `IN PROGRESS`
- [ ] **Milestone 2: Multi-Board Workspaces & Alternate Views (T-016 – T-020)** — `PLANNED`
- [ ] **Milestone 3: Realtime Collaboration & Optimistic Multi-Tab Sync (T-021 – T-024)** — `PLANNED`
- [ ] **Milestone 4: Focus Timer History, Streaks & Personal Analytics (T-025 – T-028)** — `PLANNED`
- [ ] **Milestone 5: AI Quotas, Pro Tiers & Subscription Monetization (T-029 – T-032)** — `PLANNED`
- [ ] **Milestone 6: Production Hardening, Accessibility & Launch Readiness (T-033 – T-036)** — `PLANNED`

---

## Detailed Milestones & Task Breakdown

### Milestone 0: MVP Foundation (`COMPLETED`)
- [x] `T-001` [ARCH] System Architecture, TypeScript Domain Types & ADR-001
- [x] `T-002` [DATA] Supabase Schema, Migrations, RLS Policies & Client Setup
- [x] `T-003` [FE] Next.js 16 App Shell, Montserrat Font, Light/Dark Theme & Reference Layout
- [x] `T-004` [BE] Gemini 2.5 Flash Route Handlers (`generate-board`, `breakdown-task`)
- [x] `T-005` [FE] Interactive Kanban Board, Drag & Drop, Detail Drawer & Focus Timer
- [x] `T-006` [QA] End-to-End Integrated QA Gate & Security Audit
- [x] `T-007` [DATA] Data Layer Security Trigger Fix & Helper Error Propagation
- [x] `T-008` [FE] Store Drag & Drop Fixes, ID Reconciliation & Drawer Priority Mapping
- [x] `T-009` [FE] Drag Cancellation Contract, Edit Rollback & Batch Error Handling
- [x] `T-010` [FE] Batch Checklist Database UUID Reconciliation & Lint Tooling

---

### Milestone 1: Production Authentication & User Lifecycle (`ACTIVE`)
> **Goal:** Transition from offline mock mode (`Maya Chen`) to real user authentication (Email/Password, Magic Link, Google/GitHub OAuth), secure cookie sessions, profile onboarding, and strict account isolation.

- [ ] `T-011` [ARCH] **Auth Flow System Design, Session Lifecycle Contract & ADR-002**
  - [ ] Define user session states (`unauthenticated`, `authenticating`, `authenticated`, `offline_preview`).
  - [ ] Define cookie refresh strategy using `@supabase/ssr` middleware.
  - [ ] Specify store hydration and sign-out cleanup lifecycle.
  - [ ] Document architecture in `.team/decisions/ADR-002-auth-session-lifecycle.md`.
- [ ] `T-012` [DATA] **Supabase Auth Triggers, Profile Auto-Creation & Email Sync**
  - [ ] PostgreSQL trigger on `auth.users` to automatically populate `public.profiles` on signup.
  - [ ] Default initial board creation on new account signup (template board with 5 columns).
  - [ ] Verify RLS policies isolate `boards`, `tasks`, `focus_sessions` strictly to `auth.uid() = user_id`.
- [ ] `T-013` [BE] **Server Session Middleware, Auth Callback Routes & Server Protection**
  - [ ] Implement Next.js App Router middleware (`src/middleware.ts`) with `@supabase/ssr` to refresh cookies.
  - [ ] Implement OAuth & Magic Link callback route (`/auth/callback`).
  - [ ] Update `/api/ai/*` route handlers to read verified user identity from cookies.
- [ ] `T-014` [FE] **Consumer Auth Dialog, User Menu, Profile Settings & Auth State Sync**
  - [ ] Design non-intrusive consumer Auth Modal (Sign In / Sign Up tabs, Magic Link, OAuth buttons).
  - [ ] Top-nav user avatar dropdown (display name, email, tier badge, Settings, Sign Out).
  - [ ] Store hydration: load authenticated user's boards on sign-in, reset store to clean preview on sign-out.
- [ ] `T-015` [QA] **End-to-End Integrated Auth, Cookie Lifecycle & RLS Verification**
  - [ ] Validate signup/signin/signout functional loop.
  - [ ] Test cross-account data isolation (User A cannot see or edit User B's boards/tasks).
  - [ ] Verify cookie refresh and offline fallback behavior.

---

### Milestone 2: Multi-Board Workspaces & Alternate Views (`PLANNED`)
> **Goal:** Allow users to create, switch, rename, and organize multiple boards, and provide a List/Table view alternative to the Kanban board.

- [ ] `T-016` [ARCH] Multi-Board Workspace Contracts, Navigation Hierarchy & List View Schema
- [ ] `T-017` [DATA] Board CRUD Helpers, Default Column Seeding & Active Board Preference
- [ ] `T-018` [FE] Workspace & Board Switcher Dropdown (Create Board Modal, Color/Emoji Picker)
- [ ] `T-019` [FE] List View Component (Tabular task layout grouped by status, sortable columns)
- [ ] `T-020` [QA] Integrated Multi-Board & View Switcher QA Gate

---

### Milestone 3: Realtime Collaboration & Optimistic Sync (`PLANNED`)
> **Goal:** Keep board state instantly synchronized across multiple tabs and devices using Supabase Realtime channels.

- [ ] `T-021` [ARCH] Realtime Broadcast & Presence Architecture Contract
- [ ] `T-022` [DATA] Supabase Realtime Publications on `tasks`, `columns`, and `boards`
- [ ] `T-023` [FE] Zustand Realtime Channel Subscription Hook with Conflict Resolution
- [ ] `T-024` [QA] Multi-Client Concurrency, Broadcast Latency & Reconnect Stress Tests

---

### Milestone 4: Focus Timer History & Productivity Analytics (`PLANNED`)
> **Goal:** Transform the floating focus timer into a complete productivity system with streak tracking, session logging, and visual analytics.

- [ ] `T-025` [DATA] Focus Analytics Aggregation Views & Streak SQL Functions
- [ ] `T-026` [FE] Focus Analytics Drawer / Modal (Weekly Pomodoro bar chart, current streak, total focus hours)
- [ ] `T-027` [FE] Focus Sound FX (Gentle bell chime on completion, ambient white noise options)
- [ ] `T-028` [QA] Focus Session Verification, Audio Playback & Date Boundary Testing

---

### Milestone 5: AI Quota Meter, Pro Tier & Monetization (`PLANNED`)
> **Goal:** Support fair usage limits, visual tier meters, and smooth upgrade paths for power users.

- [ ] `T-029` [BE] Monthly Quota Reset Service & Tier Verification Endpoint
- [ ] `T-030` [FE] AI Quota Meter UI in Prompt Bar ("8 / 15 free generations used this month")
- [ ] `T-031` [FE] "Upgrade to Orbit Pro" Modal (Unlimited AI boards, custom themes, priority AI)
- [ ] `T-032` [QA] Quota Limit Enforcement, Boundary Testing & Tier Upgrade Mock Verification

---

### Milestone 6: Accessibility, Performance & Launch Readiness (`PLANNED`)
> **Goal:** Production polish, WCAG AA accessibility, mobile responsiveness, and zero-defect deployment setup.

- [ ] `T-033` [FE] Comprehensive Accessibility Remediation (Focus traps, ARIA landmarks, keyboard drag navigation)
- [ ] `T-034` [FE] Mobile & Tablet Responsive Layout Polish (Touch gestures, collapsible columns)
- [ ] `T-035` [QA] Playwright End-to-End Automated Browser Test Suite
- [ ] `T-036` [BE/DATA] Production Supabase Deployment Guide & Environment Health Checks

---

## Terminal Dispatch Reference

- **Coordinator:** `TEAM-COORD` → Antigravity (`agy`) / Codex (`codex`)
- **Architect:** `TEAM-ARCH` → Codex (`codex.cmd -m gpt-6-sol -c model_reasoning_effort=high`)
- **Data:** `TEAM-DATA` → Antigravity (`agy`)
- **Backend:** `TEAM-BE` → Codex (`codex.cmd -m gpt-6-sol -c model_reasoning_effort=medium`)
- **Frontend:** `TEAM-FE` → Antigravity (`agy`)
- **QA:** `TEAM-QA` → Codex (`codex.cmd -m gpt-6-sol -c model_reasoning_effort=medium`)
