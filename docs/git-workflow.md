# Git workflow — `dev` -> `main`

This repo uses a two-lane model for fast solo iteration.

```
dev  ->  main
      (PR when promoting)
```

| Branch | Role | Deploys |
|--------|------|---------|
| `main` | Production | Vercel **Production** |
| `dev` | Day-to-day work / staging | Vercel **Preview** (optional: Preview on every `dev` push) |

Commit and push slices directly on **`dev`**. Nothing goes to `main` except a PR from `dev` when a milestone gate passes (or before sharing a Production URL).

> Historical note: early slices (A1–A2) used short-lived `feat/...` → `dev` PRs. That lane is dropped; keep working on `dev`.

---

## Day-to-day flow

### 1. Work on `dev`

```powershell
git checkout dev
git pull origin dev
# implement the next slice, commit, push
git push origin dev
```

Commits: `type(scope): short description` (e.g. `feat(tasks): add assignee dropdown`).

Optional local branches are fine for experiments, but the integration target is **`dev`**, not a required `feat/...` PR.

### 2. Promote `dev` -> `main` when ready to ship

On GitHub: **New pull request** → base `main` ← compare `dev`.

- Title example: `Promote dev -> main (Milestone B)`
- Merge with a normal merge or squash — pick one style and keep it consistent
- After merge, sync local:

```powershell
git checkout dev
git pull origin dev
git checkout main
git pull origin main
```

Never push commits directly to **`main`** (branch protection stays on).

---

## Milestone guidance (this project)

Work slices (ordered cuts on `dev`): [milestone-work-slices.md](./milestone-work-slices.md).

| Milestone | Land on `dev` first | Promote to `main` when |
|-----------|------------------------|-------------------------|
| A — Scaffold & auth | Yes | Signup → gated home works on Preview |
| B — Layer 0 PM | Yes | ≤5 min ballot demo works without Layer 1 |
| C — Layer 1 | Yes | Layer 1 acceptance checklist green on Preview |
| D — Harden & submit | Yes | Production URL ready for cohort submission |

Promote `dev` → `main` at each milestone “done when,” not only at the very end — staff/peers need a **stable Production URL**.

---

## Vercel mapping

1. Production branch = **`main`**
2. Preview deployments = pushes/PRs on `dev` (and any leftover feature PRs)
3. Submission PR Production URL = the **`main`** deployment

In Vercel → Project → Settings → Git: set Production Branch to `main`.

---

## GitHub settings (one-time)

Repo: https://github.com/frankgomezdev/pm-frankgomezdev

### Branch protection — `main`

Settings → Branches → Add rule → Branch name pattern: `main`

- Require a pull request before merging
- Require approvals (optional for solo; leave off or 0)
- Restrict direct pushes if the option is available

Default promotion into `main` should only be from **`dev`**.

### Branch protection — `dev`

**Off** for this project (solo + short deadline). Push slice work straight to `dev`.

### Default branch

Keep **Default branch = `main`** (GitHub Settings → General).

---

## Solo shortcuts (allowed)

- Push directly to `dev`
- Approve your own `dev` → `main` PRs
- Promote at milestone boundaries / before any Production URL share

Do **not** push product work straight to `main` — that skips the staging lane.

---

## Quick reference

| Action | Command / UI |
|--------|----------------|
| Next slice | Commit + push on `dev` |
| Ship production | PR: `dev` → `main` |
| Hotfix on Production | Branch from `main` as `fix/...`, PR → `main`, then merge or cherry-pick back into `dev` |
