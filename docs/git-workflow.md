# Git workflow — feature -> dev -> main

This repo uses a three-branch promotion model.

```
feat/{issue}-{short-desc}  ->  dev  ->  main
         (PR)                  (PR)
```

| Branch | Role | Deploys |
|--------|------|---------|
| `main` | Production | Vercel **Production** |
| `dev` | Integration / staging | Vercel **Preview** (optional: Preview on every `dev` push) |
| `feat/...` or `fix/...` | Short-lived work | PR previews only |

Daily development happens on feature branches cut from `dev`. Nothing goes to `main` except a PR from `dev` when it is ready for production.

---

## Branch naming

| Pattern | Use |
|---------|-----|
| `feat/{issue}-{short-desc}` | Features |
| `fix/{issue}-{short-desc}` | Fixes |
| `chore/{short-desc}` | Docs, tooling, non-product chores |

Examples: `feat/12-task-filters`, `fix/34-auth-redirect`

Commits: `type(scope): short description` (e.g. `feat(tasks): add assignee dropdown`).

---

## Day-to-day flow

### 1. Start from up-to-date `dev`

``powershell
git checkout dev
git pull origin dev
git checkout -b feat/12-stall-radar
```

### 2. Open a PR into `dev` (not `main`)

- Base branch: **`dev`**
- Merge when review/CI look good
- Prefer squash merge to keep `dev` history readable

### 3. Promote `dev` -> `main` when ready to ship

On GitHub: **New pull request** -> base `main` <- compare `dev`.

- Title example: `Promote dev -> main (Milestone B)`
- Merge with a normal merge or squash — pick one style and keep it consistent
- After merge, sync local:

``powershell
git checkout dev
git pull origin dev
git checkout main
git pull origin main
```

Never push commits directly to `main` or `dev` if branch protection is on (recommended).

---

## Milestone guidance (this project)

Work slices (feat branches per milestone): [milestone-work-slices.md](./milestone-work-slices.md).

| Milestone | Land on `dev` first | Promote to `main` when |
|-----------|------------------------|-------------------------|
| A — Scaffold & auth | Yes | Signup -> gated home works on Preview |
| B — Layer 0 PM | Yes | <=5 min ballot demo works without Layer 1 |
| C — Layer 1 | Yes | Layer 1 acceptance checklist green on Preview |
| D — Harden & submit | Yes | Production URL ready for cohort submission |

For the tight project deadline, promote `dev` -> `main` at each milestone "done when," not only at the very end — staff/peers need a **stable Production URL**.

---

## Vercel mapping

1. Production branch = **`main`**
2. Preview deployments = PRs (and optionally every push to `dev`)
3. Submission PR Production URL = the **`main`** deployment

In Vercel -> Project -> Settings -> Git: set Production Branch to `main`.

---

## GitHub settings (one-time)

Repo: https://github.com/frankgomezdev/pm-frankgomezdev

### Branch protection — `main`

Settings -> Branches -> Add rule -> Branch name pattern: `main`

- Require a pull request before merging
- Require approvals (optional for solo; leave off or 0)
- Restrict direct pushes if the option is available

Default promotion into `main` should only be from **`dev`**.

### Branch protection — `dev`

Same rule for `dev`:

- Require a pull request before merging
- Feature PRs target `dev` only

### Default branch

Keep **Default branch = `main`** (GitHub Settings -> General).

---

## Solo shortcuts (allowed)

You are one developer with a short deadline. These keep the model honest without process theater:

- You may approve your own PRs
- Feature -> `dev` can be fast (same day)
- `dev` -> `main` at milestone boundaries / before any Production URL share
- Still use PRs so history and Vercel Preview remain visible

Do **not** collapse to pushing straight to `main` for features — that skips the staging lane.

---

## Quick reference

| Action | Command / UI |
|--------|----------------|
| New feature | `git checkout dev`; `git pull`; `git checkout -b feat/...` |
| Ship feature | PR: `feat/...` -> `dev` |
| Ship production | PR: `dev` -> `main` |
| Hotfix on Production | Branch from `main` as `fix/...`, PR -> `main`, then merge or cherry-pick back into `dev` |
