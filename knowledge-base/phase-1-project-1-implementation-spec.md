# Phase 1 Project 1 — Implementation Spec

**App:** Cohort project management platform (motivational PM)  
**Why / product bet:** [phase-1-project-1-motivation-design-brief.md](./phase-1-project-1-motivation-design-brief.md)  
**Ballot floor:** [curriculum/.../requirements.md](../curriculum/phase-1/project-1-pm-platform/requirements.md)  
**Program entry:** `phase-1-project-1` in `execution/marketing/site/content/program.ts`

Do not expand this into more research. Implement against this file.

---

## 1. Goal

Ship a production multi-user PM tool the cohort could live in for weeks, differentiated by **visible progress in meaningful work** and **fast stall/blocker clearing** — not gamification.

**Success =** ballot-eligible (Layer 0) **and** peers can honestly 👍 on motivation (Layer 1).

---

## 2. Non-goals (v1)

- No XP, points, karma, badges, or scores of any kind  
- No leaderboards or cross-user ranking  
- No streaks, celebrations/confetti, kudos, or dreaded-task polish (brief optional list — deferred)  
- No GitHub issue/PR sync, review/vote module, email reminders, or comments threads (curriculum differentiators — deferred unless time remains after Layer 1)  
- No native mobile app (responsive web is enough)

---

## 3. Stack

| Layer | Choice |
|-------|--------|
| App | Next.js 15 (App Router) + React + TypeScript |
| Auth | Firebase Auth — email/password (required); optional Google OAuth later |
| DB | Cloud Firestore |
| Hosting | Vercel |
| Env | `.env.local` / Vercel env; never commit secrets |

**App location (decided):** separate cohort repo `pm-frankgomezdev` (this repo). Keep all app code at the repo root (or under a conventional app path if you introduce one). `knowledge-base/` stays docs-only.

---

## 4. Data model (Firestore)

### `users/{uid}`

| Field | Type | Notes |
|-------|------|-------|
| `email` | string | |
| `displayName` | string | shown in assignee picker |
| `createdAt` | timestamp | |
| `preferences` | map | Layer 1 autonomy — see below |

`preferences` defaults:

```ts
{
  homeView: 'progress',          // 'progress' | 'tasks'
  reflectionPromptEnabled: true,
  nudgeGoalQuality: true,
  stallDaysThreshold: 3,         // no movement → stalled
  reminderCadence: 'off',        // 'off' | 'daily' | 'weekly' — UI only in v1
}
```

### `projects/{projectId}`

| Field | Type | Notes |
|-------|------|-------|
| `title` | string | |
| `description` | string | |
| `status` | `'active' \| 'archived'` | |
| `createdBy` | string | uid |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

### `outcomes/{outcomeId}` (Layer 1 — meaningful work)

Named outcomes tasks contribute to (e.g. “Ship Project 2 comms”, “Review week complete”).

| Field | Type | Notes |
|-------|------|-------|
| `projectId` | string | parent project |
| `title` | string | meaningful name, not a vanity metric |
| `description` | string | optional |
| `status` | `'open' \| 'done'` | |
| `createdBy` | string | uid |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

### `tasks/{taskId}`

| Field | Type | Notes |
|-------|------|-------|
| `projectId` | string | required |
| `outcomeId` | string \| null | Layer 1; encourage non-null in UI |
| `title` | string | |
| `description` | string | |
| `status` | `'todo' \| 'in_progress' \| 'done'` | ≥3 states (ballot) |
| `assigneeId` | string \| null | uid of any user |
| `blockedByTaskIds` | string[] | tasks that must finish first |
| `blockerNote` | string \| null | why stuck (user-entered) |
| `nextAction` | string \| null | smallest unblocking step |
| `lastMovedAt` | timestamp | status/assignee/blocker/title change bumps this |
| `createdBy` | string | uid |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |
| `archived` | boolean | default false |

**Derived (client or query, not stored):**  
`isStalled` = `status !== 'done'` AND `now - lastMovedAt >= preferences.stallDaysThreshold` days (fallback 3).

### `activity/{eventId}` (Layer 1 progress feed)

Append-only events for “what moved forward.”

| Field | Type | Notes |
|-------|------|-------|
| `type` | `'task_created' \| 'status_changed' \| 'assigned' \| 'blocker_cleared' \| 'outcome_progress' \| 'reflection'` | |
| `actorId` | string | uid |
| `projectId` | string | |
| `taskId` | string \| null | |
| `outcomeId` | string \| null | |
| `message` | string | **informational/relational framing only** — e.g. “Moved Auth to done — unblocks Priya on login UI” |
| `createdAt` | timestamp | |

### Security rules (minimum)

- Auth required for all reads/writes  
- Any authenticated user may read users (for assignee picker: `uid`, `displayName`, `email`)  
- Any authenticated user may CRUD projects/outcomes/tasks/activity they can access (v1: all signed-in users share one cohort workspace — simplify; no per-project ACLs yet)  
- Users may only write their own `users/{uid}` and `preferences`

---

## 5. Auth

| Requirement | Spec |
|-------------|------|
| Method | Email + password via Firebase Auth |
| Signup | Open registration (supports ≥30 accounts without manual DB edits) |
| On first login | Create `users/{uid}` if missing |
| Staff test | Document how to create `staff-review@hult-cohort.test` in README |
| Session | Firebase client SDK; protect app routes with client auth gate + server verification where mutating |

**Routes:** `/login`, `/signup` (or combined `/auth`). Unauthenticated users redirected from `/` and all app routes.

---

## 6. Screens & flows

| Route | Purpose | Layer |
|-------|---------|-------|
| `/auth` | Login / signup | 0 |
| `/` | **Progress home** (default) — individual momentum + team outcome strip | 1 (primary), uses Layer 0 data |
| `/tasks` | Task list with filters: assignee, status, project | 0 |
| `/projects` | Project list; create/edit/archive | 0 |
| `/projects/[id]` | Project detail: outcomes + tasks for that project | 0 + 1 |
| `/tasks/[id]` | Task detail: edit fields, deps, blocker note, next action, outcome link | 0 + 1 |
| `/stalls` | Stall / blocker radar | 1 |
| `/settings` | Preferences (autonomy controls) | 1 |
| `/demo` optional | Seeded walkthrough copy for reviewers | — |

### Primary ≤5 min demo path (ballot)

1. Sign up  
2. Create project  
3. Create outcome (named meaningful goal)  
4. Create 3 tasks linked to outcome; assign 2 to different users  
5. Change statuses; show filters on `/tasks`  
6. Land on `/` progress home + open `/stalls` after leaving a task quiet  

### Framing rule (UI copy)

Never show “+points”. Use recognition/info: who/what advanced, who was unblocked.

---

## 7. API / server surface

Prefer **Next.js Route Handlers** under `app/api/` (Vercel serverless) + Firebase Admin for writes that need trust, **or** client Firestore SDK with security rules if faster for Milestone A–B. Pick one pattern in Milestone A and stick to it.

### Suggested endpoints (if using Route Handlers)

| Method | Path | Behavior |
|--------|------|----------|
| `GET` | `/api/me` | Current user profile + preferences |
| `PATCH` | `/api/me/preferences` | Update autonomy prefs |
| `GET/POST` | `/api/projects` | List / create |
| `PATCH` | `/api/projects/[id]` | Edit / archive |
| `GET/POST` | `/api/projects/[id]/outcomes` | List / create outcomes |
| `GET/POST` | `/api/tasks` | List (query: `projectId`, `assigneeId`, `status`) / create |
| `GET/PATCH` | `/api/tasks/[id]` | Detail / update (bumps `lastMovedAt` on meaningful changes; writes `activity`) |
| `GET` | `/api/progress` | Aggregate for home: today’s activity for actor + team outcome rollups |
| `GET` | `/api/stalls` | Tasks where `isStalled` or `blockerNote` set; include unblocker candidates (assignees of upstream `blockedByTaskIds`, or project members) |

**Activity logging:** every status change, assignment, blocker clear, and reflection POST writes one `activity` doc with a human `message`.

**Goal-quality nudge (Layer 1):** client-side heuristics on create/edit — if title word count &lt; 4 or matches vague patterns (`work on`, `fix`, `update`, `misc`), show inline nudge + optional “suggest rewrite” / “split into subtasks” (can be rule-based first; LLM optional later). Persist only if user accepts.

**Stall rule:** `GET /api/stalls` (or client query) applies `stallDaysThreshold` from user prefs (default 3).

---

## 8. Acceptance criteria

### Layer 0 — eligibility floor

- [ ] Create / edit / archive projects  
- [ ] Create tasks with title, description, status, assignee  
- [ ] ≥3 statuses: `todo`, `in_progress`, `done`  
- [ ] Assign to any registered user (picker by display name / email)  
- [ ] Filter task list by assignee, status, project  
- [ ] Email/password auth; ≥30 accounts creatable via signup UI  
- [ ] Public HTTPS deploy on Vercel; data survives refresh and redeploy  
- [ ] No secrets in git; `.env.example` documented  
- [ ] README: setup, architecture (ASCII OK), deploy URL, known bugs, signup instructions  
- `AGENTS.md` present in app repo  
- [ ] Reviewer can sign up and create + assign a task unaided (≤5 min)

### Layer 1 — motivation differentiator

- [ ] Default home (`/`) is progress-first, not raw open-task count  
- [ ] Individual: today’s (or recent) “what I moved forward” from `activity`, each item tied to an outcome when possible  
- [ ] Team: visible progress toward outcomes (e.g. done/total tasks per outcome) — coordination, not ranking  
- [ ] Tasks can link to an `outcomeId`; UI encourages linking  
- [ ] Stall radar lists quiet / blocked tasks with `blockerNote`, `nextAction`, and who/what unblocks or is unblocked  
- [ ] Goal-quality nudge on vague titles; optional split into subtasks  
- [ ] Settings: user can change home view, toggle reflection/goal nudges, stall threshold  
- [ ] Optional end-of-day reflection writes `activity` type `reflection`  
- [ ] Zero XP/points/leaderboards anywhere in UI  
- [ ] Copy is informational/relational only  

---

## 9. Milestone build order

### Milestone A — Scaffold & auth

- Next.js + TS app; Firebase project; Auth email/password; env wiring; Vercel preview  
- `/auth`, session gate, `users/{uid}` bootstrap  
- Empty shell nav: Progress | Tasks | Projects | Stalls | Settings  
- **Done when:** signup → land on gated home (placeholder OK)

### Milestone B — Layer 0 PM

- Projects CRUD + archive  
- Tasks CRUD: title, description, status, assignee; `lastMovedAt`  
- `/tasks` filters; `/projects/[id]` task list  
- **Done when:** ≤5 min ballot demo works without progress/stall features

### Milestone C — Layer 1 core

- Outcomes CRUD; task ↔ outcome link  
- `activity` logging on task mutations  
- Progress home (individual + team outcome strip)  
- Stall radar + blocker fields on task detail  
- Goal-quality nudge (rules)  
- Settings preferences  
- **Done when:** Layer 1 acceptance checklist passes on deploy preview

### Milestone D — Production harden & submit

- Firestore rules tightened; polish empty states; responsive layout  
- Seed script optional (demo project + outcomes for reviewers)  
- README + AGENTS.md + `.env.example`; production Vercel URL  
- Submission PR body: Production URL, setup verified on fresh clone, architecture summary, known limitations, agent usage summary  
- **Done when:** Layer 0 + Layer 1 checklists green on production URL

---

## 10. Deploy / README / submission

| Item | Requirement |
|------|-------------|
| Hosting | Vercel production, public HTTPS |
| README | Setup (Firebase + env), architecture diagram, deploy URL, signup steps, known bugs, staff test account notes |
| `AGENTS.md` | How agents should work in this repo (point at this spec + design brief) |
| Secrets | Firebase web config can be public; Admin SDK / service account never committed |
| Cohort submission PR | Title `[Project 1] Submission — {handle}`; body must include Production URL, Setup steps verified on fresh clone, Architecture summary, Known limitations, Agent usage summary |
| Deadline | Merged PR by program `submissionCloses` / week-2 Eastern deadline in `program.ts` |

---

## 11. Out of scope until after D (if time)

From design brief optional polish and curriculum differentiators: past-self trends, streaks+freezes, scaled celebrations, teammate kudos, dreaded-task surfacing, comments, GitHub links, notifications, review/vote module.

---

## 12. Coding-agent instructions

1. Implement one milestone at a time; do not start C before B acceptance.  
2. Prefer boring Layer 0; put creative UX energy into `/`, `/stalls`, and task framing copy.  
3. When unsure why a feature exists, read the design brief — do not re-research.  
4. Never add points, ranks, or competitive social features.
