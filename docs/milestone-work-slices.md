# Milestone work slices — Phase 1 Project 1

Milestones (A–D) are the **acceptance gates**. Work slices are short-lived `feat/...` branches that PR into `dev` so integration stays runnable between gates.

- Branch / promote flow: [git-workflow.md](./git-workflow.md)
- Product requirements & milestone “done when”: [phase-1-project-1-implementation-spec.md](../knowledge-base/phase-1-project-1-implementation-spec.md) (§8–§9)

**Rules:** one milestone at a time; do not start C before B’s gate passes. Do not expand into §11 out-of-scope or gamification. When all slices for a milestone are on `dev` and that milestone’s “done when” passes → PR `dev` → `main` (see [Promotion](#promotion-dev--main)).

---

## Milestone A — Scaffold & auth

**Gate (spec):** signup → land on gated home (placeholder OK)

| Slice | Branch | Scope | Done when | Depends on |
|-------|--------|-------|-----------|------------|
| **A1** | `feat/a1-app-scaffold` | • Next.js + TS app at repo root<br>• Firebase project + Auth email/password env wiring<br>• `.env.example`; Vercel preview hooked up | App builds; Preview deploys; Firebase client config loads from env (no secrets in git) | — |
| **A2** | `feat/a2-auth-shell` | • `/auth` login / signup<br>• Session gate; `users/{uid}` bootstrap on first login<br>• Empty shell nav: Progress \| Tasks \| Projects \| Stalls \| Settings<br>• Gated home placeholder | Signup → redirected to gated home; unauthenticated users blocked from app routes | A1 |

---

## Milestone B — Layer 0 PM

**Gate (spec):** ≤5 min ballot demo works without progress/stall features

| Slice | Branch | Scope | Done when | Depends on |
|-------|--------|-------|-----------|------------|
| **B1** | `feat/b1-projects-crud` | • Projects create / edit / archive<br>• `/projects` list; basic project detail shell | Authenticated user can create, edit, and archive a project; data persists | Milestone A on `dev` |
| **B2** | `feat/b2-tasks-crud` | • Tasks CRUD: title, description, status (`todo` \| `in_progress` \| `done`), assignee<br>• Assignee picker (any registered user by display name / email)<br>• Bump `lastMovedAt` on meaningful changes<br>• `/tasks/[id]` detail edit | Create/edit tasks with ≥3 statuses and assignee; task detail usable | B1 |
| **B3** | `feat/b3-task-filters` | • `/tasks` filters: assignee, status, project<br>• `/projects/[id]` task list for that project | Filterable task list + project-scoped task list; reviewer can sign up → project → assign task unaided (ballot Layer 0 path minus outcomes/progress/stalls) | B2 |

---

## Milestone C — Layer 1 core

**Gate (spec):** Layer 1 acceptance checklist passes on deploy preview

| Slice | Branch | Scope | Done when | Depends on |
|-------|--------|-------|-----------|------------|
| **C1** | `feat/c1-outcomes` | • Outcomes CRUD on project<br>• Task ↔ `outcomeId` link; UI encourages non-null | Create outcomes; link tasks to outcomes on create/edit | Milestone B on `dev` |
| **C2** | `feat/c2-activity-progress` | • `activity` logging on task mutations (status, assign, blocker clear, etc.) with informational/relational `message`<br>• Progress home `/`: individual “what I moved forward” + team outcome strip (done/total per outcome) — coordination, not ranking | `/` is progress-first; activity appears for today’s/recent moves; team outcome progress visible | C1 |
| **C3** | `feat/c3-stall-radar` | • Blocker fields on task detail: `blockedByTaskIds`, `blockerNote`, `nextAction`<br>• `/stalls` radar: quiet (`isStalled` via prefs threshold) / blocked tasks + who/what unblocks | Stall/blocker list usable; task detail can record blockers and next action | C2 |
| **C4** | `feat/c4-settings-nudge` | • `/settings`: home view, reflection/goal-nudge toggles, `stallDaysThreshold`, reminder cadence UI-only<br>• Goal-quality nudge (rules) on vague titles; optional split suggest<br>• Optional end-of-day reflection → `activity` type `reflection`<br>• Framing: zero XP/points/leaderboards; copy informational/relational only | Layer 1 checklist (§8) green on Preview | C3 |

---

## Milestone D — Production harden & submit

**Gate (spec):** Layer 0 + Layer 1 checklists green on production URL

| Slice | Branch | Scope | Done when | Depends on |
|-------|--------|-------|-----------|------------|
| **D1** | `feat/d1-harden-polish` | • Firestore security rules tightened (spec minimum)<br>• Empty-state polish; responsive layout | Rules enforce auth + write boundaries; app usable on mobile widths; no secrets in git | Milestone C on `dev` |
| **D2** | `feat/d2-docs-submit` | • README (setup, architecture, deploy URL, signup, known bugs, staff test account)<br>• `AGENTS.md` + `.env.example`<br>• Optional seed script (demo project + outcomes)<br>• Submission PR body checklist ready (Production URL, fresh-clone setup, architecture, limitations, agent usage) | Docs complete; Production URL on `main` after promote; Layer 0 + Layer 1 checklists green on production | D1 |

---

## Promotion (`dev` → `main`)

After **all slices for a milestone** are merged to `dev` and that milestone’s **Done when** (tables above / spec §9) passes on Preview:

1. Open PR: base `main` ← compare `dev`
2. Title example: `Promote dev -> main (Milestone B)`
3. Merge; sync local `dev` and `main`

Promote at each milestone gate — not only at D — so Production stays a stable URL for staff/peers. Details: [git-workflow.md — Milestone guidance](./git-workflow.md#milestone-guidance-this-project).

---

## How to start the next slice

```powershell
git checkout dev
git pull origin dev
git checkout -b feat/a2-auth-shell
```

PR the branch into **`dev`**. Only promote `dev` → `main` when the current milestone gate passes.
