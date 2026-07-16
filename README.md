# Cohort PM (`pm-frankgomezdev`)

Phase 1 Project 1 — motivational cohort project management platform.

Spec: [`knowledge-base/phase-1-project-1-implementation-spec.md`](./knowledge-base/phase-1-project-1-implementation-spec.md)  
Git flow: [`docs/git-workflow.md`](./docs/git-workflow.md)

## Stack

- Next.js 15 (App Router) + React + TypeScript
- Firebase Auth + Cloud Firestore
- Vercel hosting

## Setup

```bash
npm install
cp .env.example .env.local
```

1. Create a Firebase project (console). Enable **Email/Password** Auth.
2. Register a Web app; paste config into `.env.local` (see `.env.example`).
3. Run locally:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should be redirected to `/auth`.

4. Create a **Firestore** database (Native mode) in the Firebase console.
5. Deploy security rules from this repo (Console → Firestore → Rules, paste `firestore.rules`, Publish), **or** start in test mode briefly for local A2 only. Re-publish whenever `firestore.rules` changes (e.g. after projects/tasks slices).

### Auth smoke test

1. Open `/auth`, sign up with email + password (+ display name).
2. You land on gated **Progress** home with shell nav (Tasks, Projects, Stalls, Settings).
3. Confirm a `users/{uid}` doc exists in Firestore.
4. Sign out → visiting `/` or `/tasks` sends you back to `/auth`.

### Staff review account

Create via the signup UI (or Authentication → Add user):

- Email: `staff-review@hult-cohort.test`
- Password: choose one and share out-of-band with reviewers (do not commit passwords)

## Env vars

| Variable | Notes |
|----------|--------|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase web config (public). Never commit Admin SDK / service-account secrets. |

Same keys go in **Vercel → Project → Settings → Environment Variables** for Preview/Production.

## Deploy (Vercel)

1. Import this GitHub repo in Vercel; Production branch = `main`.
2. Previews deploy on PRs (and optionally on `dev`).
3. Set Firebase env vars before expecting Auth/Firestore to work on Preview.

```bash
npm run build
```

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local dev (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
