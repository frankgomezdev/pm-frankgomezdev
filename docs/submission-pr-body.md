# Cohort submission PR — body template

Use this when opening the **program** submission PR (not this app repo).

**Title:** `[Project 1] Submission — frankgomezdev`

Copy into the PR body and fill blanks:

```markdown
## Production URL

https://YOUR-PRODUCTION-URL.vercel.app

## Setup steps verified on fresh clone

1. `git clone https://github.com/frankgomezdev/pm-frankgomezdev.git && cd pm-frankgomezdev`
2. `npm install`
3. Copy `.env.example` → `.env.local` and fill Firebase web config
4. Enable Email/Password Auth; create Firestore; publish `firestore.rules`
5. `npm run dev` → sign up → create project → create outcome → create/assign task → Progress + Stalls
6. Production: Vercel project linked to `main` with the same `NEXT_PUBLIC_FIREBASE_*` env vars

Staff test account: `staff-review@hult-cohort.test` (password shared out-of-band).

## Architecture summary

- Next.js 15 App Router + TypeScript on Vercel
- Firebase Auth (email/password) + Cloud Firestore via client SDK
- Security rules: auth required; users write only own profile/preferences; shared cohort CRUD for projects/outcomes/tasks; append-only activity
- Layer 0: projects, tasks (≥3 statuses), assignee picker, filters
- Layer 1: outcomes, Progress home (personal activity + team outcome strip), Stalls (quiet/blocked), goal-quality nudge, settings, optional reflection
- No XP / points / leaderboards

ASCII diagram: see app repo README “Architecture”.

## Known limitations

- Shared cohort workspace (no per-project ACLs)
- Reminder cadence UI-only (no notifications)
- Rule-based title nudge only
- Deferred: comments, GitHub sync, review/vote module, celebrations/streaks (spec §11)

## Agent usage summary

- Cursor agents implemented against `knowledge-base/phase-1-project-1-implementation-spec.md` and the motivation design brief
- Work landed in milestone slices on `dev` (see `docs/milestone-work-slices.md` + `AGENTS.md`)
- Humans: Firebase/Vercel console setup, rules publish, Production URL verification, submission PR
```

Branch / target repo: follow the live cohort page (ops pack defaults to `rogerSuperBuilderAlpha/hult-cohort-program`). Keep **app code** in `pm-frankgomezdev`; the program PR documents the live system.
