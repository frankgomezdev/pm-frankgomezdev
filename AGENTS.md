# Agents — Cohort PM (`pm-frankgomezdev`)

How coding agents should work in this repo.

## Sources of truth (do not re-research)

1. [`knowledge-base/phase-1-project-1-implementation-spec.md`](./knowledge-base/phase-1-project-1-implementation-spec.md) — **what to build** (data model, screens, acceptance, milestones)
2. [`knowledge-base/phase-1-project-1-motivation-design-brief.md`](./knowledge-base/phase-1-project-1-motivation-design-brief.md) — **why** (progress, stalls, autonomy; no gamification)
3. [`docs/milestone-work-slices.md`](./docs/milestone-work-slices.md) — ordered execution cuts on `dev`
4. [`docs/git-workflow.md`](./docs/git-workflow.md) — push on `dev`; promote `dev` → `main` at milestone gates

Ops / ballot / submission context: [`knowledge-base/phase-1-project-1-ops-pack.md`](./knowledge-base/phase-1-project-1-ops-pack.md).

## Hard rules

- Implement **one milestone at a time**; do not start C before B acceptance (and so on).
- Prefer boring Layer 0 PM; put UX energy into `/` (Progress), `/stalls`, and informational/relational task copy.
- **Never** add XP, points, karma, badges, leaderboards, streaks, confetti, or competitive ranking.
- Do not pull in §11 out-of-scope items unless the human explicitly expands scope after D.
- No secrets in git. Firebase **web** config may be public via `NEXT_PUBLIC_*`; never commit Admin SDK / service-account JSON.
- App code lives at repo root (`app/`, `components/`, `lib/`). `knowledge-base/` and `docs/` are docs-only.

## Stack (locked)

Next.js 15 App Router + TypeScript + Firebase Auth (email/password) + Cloud Firestore + Vercel. Client Firestore SDK + `firestore.rules` (no Admin SDK required for v1).

## Working style

- Day-to-day: commit and push on **`dev`**.
- Promote with PR **`dev` → `main`** when a milestone “done when” passes.
- After changing `firestore.rules`, remind the human to **Publish** rules in the Firebase console.
- Keep PRs/commits scoped to the current slice; don’t invent product requirements.

## When unsure

Read the design brief for *why* a feature exists. Do not expand the product surface “to be helpful.”
