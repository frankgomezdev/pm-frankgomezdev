# Cohort PM (`pm-frankgomezdev`)

Phase 1 Project 1 — motivational cohort project management platform.  
Differentiator: **visible progress on meaningful work** and **fast stall/blocker clearing** — not gamification.

| | |
|--|--|
| **Production URL** | _Paste your Vercel Production URL here (Settings → Domains), e.g. `https://pm-frankgomezdev.vercel.app`_ |
| **Repo** | https://github.com/frankgomezdev/pm-frankgomezdev |
| **Spec** | [`knowledge-base/phase-1-project-1-implementation-spec.md`](./knowledge-base/phase-1-project-1-implementation-spec.md) |
| **Design brief** | [`knowledge-base/phase-1-project-1-motivation-design-brief.md`](./knowledge-base/phase-1-project-1-motivation-design-brief.md) |
| **Agents** | [`AGENTS.md`](./AGENTS.md) |
| **Work slices** | [`docs/milestone-work-slices.md`](./docs/milestone-work-slices.md) |
| **Git flow** | [`docs/git-workflow.md`](./docs/git-workflow.md) |
| **Submission PR template** | [`docs/submission-pr-body.md`](./docs/submission-pr-body.md) |

## Stack

- **App:** Next.js 15 (App Router) + React + TypeScript  
- **Auth:** Firebase Auth (email / password)  
- **DB:** Cloud Firestore (client SDK + security rules)  
- **Host:** Vercel (Production branch = `main`)

## Architecture

```
Browser (Next.js App Router)
  ├── /auth          Firebase Auth email/password
  ├── App shell      client AuthGate → Progress | Tasks | Projects | Stalls | Settings
  └── lib/*          Firestore reads/writes via client SDK
         │
         ▼
Firebase project
  ├── Auth           users (≥30 via open signup)
  └── Firestore
        users / projects / outcomes / tasks / activity
        (rules: firestore.rules — auth required; self-only user writes;
         append-only activity; shared cohort workspace)
         │
         ▼
Vercel
  ├── Production     main
  └── Preview        PRs / optional dev pushes
```

Layer 0 = ballot PM floor. Layer 1 = Progress home, outcomes, stalls, nudges, settings — informational/relational framing only (no XP/points/leaderboards).

## Setup (fresh clone)

Verified path for a clean machine:

```bash
git clone https://github.com/frankgomezdev/pm-frankgomezdev.git
cd pm-frankgomezdev
npm install
cp .env.example .env.local
```

1. **Firebase Console** → create (or open) a project.  
2. **Authentication** → Sign-in method → enable **Email/Password**.  
3. **Project settings** → Your apps → Web app → copy config into `.env.local` (all `NEXT_PUBLIC_FIREBASE_*` keys from [`.env.example`](./.env.example)).  
4. **Firestore** → Create database (Native mode) → pick a region.  
5. **Firestore → Rules** → paste [`firestore.rules`](./firestore.rules) → **Publish**.  
6. Run:

```bash
npm run dev
```

Open http://localhost:3000 → redirected to `/auth`.

### Signup / smoke (≤5 min ballot path)

1. Sign up (display name + email + password).  
2. **Projects** → create a project.  
3. Open the project → add an **outcome** (meaningful goal).  
4. Add **tasks** linked to the outcome; assign at least one.  
5. **Tasks** → filter by project / status / assignee.  
6. Change a status → **Progress** shows what moved forward + outcome strip.  
7. Add a blocker note → **Stalls** lists it.  
8. Optional: **Settings** → **Seed demo project** for sample data.

### Staff review account

Create via signup UI (or Authentication → Add user):

| Field | Value |
|-------|--------|
| Email | `staff-review@hult-cohort.test` |
| Password | Choose one; share **out-of-band** with reviewers — **never commit** |

## Env vars

| Variable | Notes |
|----------|--------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Web config (public) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | |

Set the same keys in **Vercel → Project → Settings → Environment Variables** for Production and Preview.  
Never commit Admin SDK / service-account JSON.

## Deploy (Vercel)

1. Import this GitHub repo; **Production Branch = `main`**.  
2. Framework Preset = **Next.js**; Root Directory empty; Output Directory empty.  
3. Add Firebase env vars → Redeploy.  
4. Promote work with PR `dev` → `main` (see git-workflow).

```bash
npm run build
npm run start
```

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local dev (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |

In-app demo seed: **Settings → Seed demo project** (signed-in).

## Known limitations / bugs

- v1 is a **shared cohort workspace** (any signed-in user can read/write projects/tasks) — no per-project ACLs yet.  
- Reminder cadence is **stored only** (no email/push notifications).  
- Stall “quiet” detection uses client clocks + `lastMovedAt`; no background jobs.  
- Goal-quality nudge is **rule-based** (not LLM).  
- Optional seed creates **additional** demo data each run (archive old demos manually).  
- No GitHub sync, comments threads, or review/vote module (deferred — spec §11).

## License

MIT — see [`LICENSE`](./LICENSE).
