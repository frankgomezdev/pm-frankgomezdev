# Phase 1 Project 1 â€” Ops pack (portable)

**Purpose:** Everything you need from the Hult cohort monorepo (`hult-cohort-program`) that is *not* product design or tech spec â€” so you can build in a separate `pm-{handle}` app repo.

**Copy into your app repo** (suggested path: `docs/cohort/`):

| File | Role |
|------|------|
| This file | Eligibility, submission, review, repo rules |
| `phase-1-project-1-motivation-design-brief.md` | Why / product bet |
| `phase-1-project-1-implementation-spec.md` | How to build |

**Do not** treat this monorepo as the app root. App code lives in `pm-{handle}`.

---

## 1. What you are building

A production **project management platform** the cohort might run for the rest of the pilot. Peers judge primarily by **how motivational** the tool is (lead guidance), after you clear the **ballot eligibility floor**.

Program summary (`phase-1-project-1`):

- Individual build; HTTPS deploy before deadline  
- Merged submission PR into the cohort program repo with production URL  
- Support enrolled accounts, projects, tasks, assignments, status workflows  
- Written GitHub review on each peer repo â†’ then private ðŸ‘/ðŸ‘Ž on the cohort platform  
- Most private votes wins; non-winners help the winning platform (â‰¥2 PRs per cycle)

Source of truth for week copy: `execution/marketing/site/content/program.ts` (slug `phase-1-project-1`).

---

## 2. Where code vs submission live

| Artifact | Location |
|----------|----------|
| **App (Next.js + Firebase)** | Separate public repo: `pm-{your-github-handle}` |
| **Curriculum / program site** | `hult-cohort-program` (this monorepo) â€” do not put the PM app here |
| **Submission tracking** | PR into cohort submission repo (default: `rogerSuperBuilderAlpha/hult-cohort-program`) |

Curriculum org layout (`curriculum/onboarding/github-workflow.md`):

```
github.com/hult-cohort-{term}-{campus}/
  pm-{student-github-handle}   # your Project 1 build
  pm-platform                  # winner rename at cutover
  â€¦
```

Example org name: `hult-cohort-fall26-boston` (adjust for summer26 / campus when staff confirms). If the cohort org is not ready, create `pm-{handle}` under your GitHub user and transfer later if required.

**Winner cutover:** Winning repo is renamed/transferred to `pm-platform`. Operator obligations kick in (uptime, PR triage, seeding) â€” see Â§8.

---

## 3. Recommended stack (leads + default)

Leads recommendation (kickoff guidance):

- TypeScript + React  
- Next.js (serverless/API with Vercel)  
- Firebase (auth + database)  
- Vercel deploy  

Curriculum: stack is **agnostic**; TypeScript/Next.js on Vercel is the documented default. Ballot cares about behavior and production HTTPS, not the stack brand.

Full build steps: your `phase-1-project-1-implementation-spec.md`.

---

## 4. Ballot eligibility floor (must ship)

From `curriculum/phase-1/project-1-pm-platform/requirements.md`:

| Feature | Requirement |
|---------|-------------|
| Projects | Create / edit / archive; â‰¥1 project per user |
| Tasks | Title, description, status, assignee |
| Status workflow | â‰¥3 states (e.g. todo / in progress / done) |
| Assignment | Any cohort member (email or username) |
| Multi-user auth | Email+password or OAuth; â‰¥30 accounts |
| Task list views | Filter by assignee, status, project |
| Deployment | Public HTTPS; data persists across redeploys |

### Production bar

- Deploy returns 200 at staff smoke-test  
- 30 accounts creatable without manual DB edits  
- Tasks survive refresh + redeploy  
- No hardcoded secrets; `.env` gitignored  
- README: setup, architecture (ASCII OK), deploy URL, known bugs  

### Repo constraints

| Rule | Value |
|------|-------|
| Location | `â€¦/pm-{your-github-handle}` |
| Visibility | Public |
| License | MIT |
| `AGENTS.md` | Required |
| Copying prior cohorts | Reference OK; substantial paste = plagiarism |

### Eligibility checklist (deploy deadline)

- [ ] Public repo in cohort org (or approved location)  
- [ ] README complete with deploy URL  
- [ ] Reviewer can sign up, create project, create + assign a task  
- [ ] `AGENTS.md` present  
- [ ] Baseline features demonstrable in â‰¤5 minutes  
- [ ] Staff smoke-test passed  

Missing any â†’ **ineligible for votes** (you may still do reviews for pass credit).

---

## 5. Motivation standard (how peers should judge)

Lead framing: innovative PM that studies gaps in existing tools â€” **judged by how motivational it is**, not checkbox gamification.

Product translation lives in:

- Design brief â†’ progress, stalls/blockers, autonomy, relatedness via team unblocking  
- Implementation spec â†’ Layer 0 (floor) then Layer 1 (differentiator); no XP / leaderboards  

Curriculum rubric dimensions (reviews / tie-break): production readiness, core functionality, code quality, ecosystem thinking, UX/polish. Platform winner = **most private thumbs-up**.

---

## 6. Submission into the cohort program repo

Configured submission target (`cohort-config.ts` defaults):

- Repo: `rogerSuperBuilderAlpha/hult-cohort-program` (override via `NEXT_PUBLIC_COHORT_REPO` if staff changes it)  
- PR title: `[Project 1] Submission â€” {handle}`  
- Branch patterns seen in program tooling / practice:  
  - Agent prompt default: `submission/{handle}`  
  - Summer26 practice branch: `participants/summer26/phase-1-project-1/{handle}` off `projects/summer26/phase-1-project-1`  

**Use whichever branch convention staff/your cohort page shows.** Keep app code in `pm-{handle}`; the program PR mainly documents the live system.

### PR body must include

1. Production URL  
2. Setup steps verified on fresh clone  
3. Architecture summary  
4. Known limitations  
5. Agent usage summary  

### Schedule (`program.ts` as of this pack)

| Window | ISO (UTC) |
|--------|-----------|
| Submission opens | `2026-07-16T13:00:00.000Z` |
| Submission closes | `2026-07-22T21:00:00.000Z` |
| Review opens | `2026-07-22T21:00:00.000Z` |
| Review closes | `2026-07-23T18:00:00.000Z` |

Deadline note in program copy: PR merged to main by **Wednesday week 2, 17:00 Eastern** â€” unmerged PRs ineligible for review. Prefer live program page dates if they diverge from this snapshot.

Example submission marker style (E2E in monorepo `submissions/`): markdown with Production URL + architecture + agent usage + limitations â€” not the full app tree.

---

## 7. Peer review & voting (after you ship)

Per peer (vote-week projects):

1. Try their deploy â†’ read their submission PR  
2. File GitHub issue titled `Review by @{you}` on **their** app/repo  
3. Paste issue URL on the cohort platform â†’ unlocks vote  
4. Cast private ðŸ‘ or ðŸ‘Ž  

- Votes only after written review recorded for that peer  
- You cannot vote on yourself  
- Pass gate (personalized): all peers written reviews + all private votes  

Cohort platform: https://site-nine-rouge-68.vercel.app (project page: `/program/phase-1-project-1`)

---

## 8. If you win (operator â€” skim now, detail later)

From `operator-handbook.md`:

- Repo becomes `pm-platform`  
- Uptime â‰¥99% business hours; PR first response â‰¤24h; merge decision â‰¤72h  
- Seed roster + Project 2 + calendar milestones promptly after cutover  
- Free for all cohort members; no feature-gating  

Non-winners: contribute PRs to the winning platform (minimum 2 per cycle).

---

## 9. Reviewer / staff accounts (your README should say)

- Open signup **or** create â‰¥5 peer reviewer accounts on request  
- Staff test pattern: `staff-review@hult-cohort.test` (password shared in Discord `#setup-verification` during review week â€” do not hardcode in repo)  
- Post clear signup instructions in README  

---

## 10. Git conventions (app repo)

This repo uses **feature -> dev -> main** (see [docs/git-workflow.md](../docs/git-workflow.md)). Cohort curriculum docs often show feature -> main; we add `dev` as the integration lane.

| Branch | Use |
|--------|-----|
| `main` | Production — auto-deploys to Vercel |
| `dev` | Integration / staging — merge feature PRs here first |
| `feat/{issue}-{short-desc}` | Features (PR into `dev`) |
| `fix/{issue}-{short-desc}` | Fixes (PR into `dev`; hotfixes may PR into `main` then back to `dev`) |

Commits: `type(scope): short description` (e.g. `feat(tasks): add assignee dropdown`).

Promotion: `feat/...` -> PR -> `dev` -> PR -> `main` at milestone boundaries (or before sharing Production URL).

Issues required for bugs / features; PR template with summary, test plan, agent notes.

---

## 11. AGENTS.md stub for `pm-{handle}`

Minimum (extend from cohort template):

```markdown
# Agent workflow — Cohort PM platform (Project 1)

## Stack
Next.js (App Router) + TypeScript + Firebase Auth/Firestore + Vercel

## Docs (read in order)
1. docs/cohort/phase-1-project-1-ops-pack.md
2. docs/cohort/phase-1-project-1-motivation-design-brief.md
3. docs/cohort/phase-1-project-1-implementation-spec.md

## Build order
Milestones A → D in the implementation spec. Do not start Layer 1 before Layer 0 acceptance.

## Non-goals
No XP, points, leaderboards, or cross-user ranking.

## Conventions
- Branch flow: feat/{issue}-{desc} -> dev -> main (see docs/git-workflow.md)
- PR required into dev; promote dev -> main for production
- Never commit .env.local or service account JSON
```

---

## 12. Copy checklist

When creating `pm-{handle}`:

- [ ] Create public repo `pm-{handle}` (MIT + README + `.gitignore`)  
- [ ] Copy this ops pack + design brief + implementation spec into `docs/cohort/`  
- [ ] Add `AGENTS.md` pointing at those docs  
- [ ] Scaffold against implementation spec Milestone A  
- [ ] Deploy Vercel; put Production URL in README  
- [ ] Open cohort submission PR with required body sections  
- [ ] Keep monorepo `knowledge-base/` as optional backup; app repo is source of truth for code  

---

## 13. Source map (monorepo paths, for refresh)

| Topic | Path in `hult-cohort-program` |
|-------|-------------------------------|
| Ballot requirements | `curriculum/phase-1/project-1-pm-platform/requirements.md` |
| Project README / kickoff | `curriculum/phase-1/project-1-pm-platform/README.md` |
| Review rubric | `curriculum/phase-1/project-1-pm-platform/review-rubric.md` |
| Operator handbook | `curriculum/phase-1/project-1-pm-platform/operator-handbook.md` |
| Loop / vote week | `curriculum/phase-1/the-loop.md` |
| GitHub org layout | `curriculum/onboarding/github-workflow.md` |
| Program dates / PR title | `execution/marketing/site/content/program.ts` |
| Submission repo default | `execution/marketing/site/lib/cohort-config.ts` |
| Agent PR workflow helper | `execution/marketing/site/lib/project-agent-prompt.ts` |
| Template AGENTS.md | `execution/templates/cohort-project-template/AGENTS.md` |
