# Metsävahti — agent operating manual

Metsävahti ("forest watch") is a Next.js 16 + Payload CMS 3 + PostGIS web service. A user
draws a watch area on a map; twice a day the app pulls Finnish forest-use declarations
(_metsänkäyttöilmoitukset_) from the Metsäkeskus WFS, matches them against watch areas with
PostGIS and emails alerts for new or changed declarations. UI is Finnish; code, docs and
commits are English. Legal requirement: the attribution line from `src/lib/attribution.ts`
("Sisältää Suomen metsäkeskuksen Metsänkäyttöilmoitukset-aineistoa MM/YYYY") must appear in
the UI and in every email. Product details: [README.md](README.md).

This file is a router, not a manual: it defines the session loop and the invariants and
links to the detail. The repository, not the chat, is the system of record.

## Clock-in (session start)

Before touching code:

1. `pwd` — confirm you are in the repository root.
2. Read [PROGRESS.md](PROGRESS.md) — Current Verified State and Next Steps.
3. Read [feature_list.json](feature_list.json) — pick the highest-priority `not_started` feature.
4. `git log --oneline -5` — what changed most recently.
5. `./init.sh` — installs, checks tooling and runs the L1 baseline (`FAST=1` skips it).
6. If the baseline is red, fix that first. Never stack feature work on a broken start.
7. Set the chosen feature to `in_progress` (WIP=1) and work only on it.

Claude Code: `/clock-in` runs these steps; the SessionStart hook prints the state summary.

## Verification layers

| Layer | Command                 | Covers                                                    | Needs                            |
| ----- | ----------------------- | --------------------------------------------------------- | -------------------------------- |
| L1    | `pnpm check`            | lint, typecheck, knip, format:check, unit tests (~40 s)   | nothing                          |
| L2    | `pnpm test:integration` | Payload boot, migrations, access control, pipeline, email | Docker Desktop (Testcontainers)  |
| L3    | `pnpm test:e2e`         | Playwright: pages, auth, map, API, axe, WFS mock, Mailpit | Docker (`pnpm db:up`) + browsers |

- Layers run in order. Do not proceed to layer N+1 while layer N fails, and do not skip a layer a feature lists.
- L3 is required when a change crosses component boundaries (frontend + Payload/API/jobs).
- The repository is in a consistent state when `pnpm check` exits 0. `pnpm check:full` adds L2 and a build.
- `pnpm harness:check` validates `feature_list.json`; it also runs from `pnpm test:unit` and lint-staged.
- Details per suite: [tests/README.md](tests/README.md).

## Constraints

Each rule carries a `why:` so it can be revisited when the reason disappears.

- MUST use `pnpm` (never npm/yarn/npx installs). why: lockfile + `packageManager` pin. source: package.json.
- MUST NOT hand-edit generated files: `src/payload-types.ts`, `src/app/(payload)/admin/importMap.js`, `src/app/(payload)/admin/[[...segments]]/**`, `src/app/(payload)/api/**`. Regenerate with `pnpm generate:types` / `pnpm generate:importmap`. why: overwritten on next generate. source: src/ARCHITECTURE.md.
- MUST create migrations with `pnpm db:migrate:create <name>`; hand edits only for PostGIS statements. `push: false` stays. why: schema history is the only source of schema. source: docs/DECISIONS.md D-003, D-004.
- MUST run tests only through `pnpm test:*` (they wrap `dotenv -e .env.test`). MUST NOT run bare `vitest`/`playwright`, point tests at port 5432, or set `ALLOW_TESTS_ON_PORT_5432`. why: protects the dev database. source: tests/helpers/db-guard.ts, docs/DECISIONS.md D-005.
- MUST read configuration via `env` from `@/lib/env`, never `process.env` in `src/`. why: validated once, fails fast. source: src/lib/env.ts.
- MUST keep all PostGIS SQL in `src/lib/geo/spatial-queries.ts`. why: Payload does not model geometry; one audited module. source: src/ARCHITECTURE.md.
- MUST keep the Metsäkeskus attribution line in every page and email. why: CC BY 4.0 licence term. source: README.md.
- MUST NOT `.skip`/`.only` tests, weaken assertions or lower coverage thresholds to get green. why: verification is the completion gate.
- MUST update docs affected by a change in the same commit (README, `src/ARCHITECTURE.md`, `docs/DECISIONS.md`). why: stale docs mislead the next session more than no docs.
- MUST make one logical change per commit, with a conventional-commit subject and a body that explains why. why: commitlint enforces the subject; the history is read at every clock-in.
- MUST NOT read or edit `.env`; use `.env.example` for the variable list. why: secrets.

## Working rules

- WIP=1: only one feature may be `in_progress`. Finish it (`passing`) or mark it `blocked` with a note before activating the next.
- State machine: `not_started → in_progress → passing`, or `→ blocked` with the reason in `notes`. No skipping states; never set `passing` by hand without evidence.
- Granularity: a feature must be completable in one session. If it cannot, split it in `feature_list.json` before starting.
- Scope: stay inside the selected feature; a narrow supporting fix is fine, a second feature is not.
- Completion means evidence, not confidence: run the listed layers and record `YYYY-MM-DD <command> → pass (commit <hash>)` in `evidence`.
- Context anxiety: if you are running low on context, do not rush to finish. Stop, update `PROGRESS.md`, commit a clean checkpoint, and leave the next step written down.
- Escalate instead of guessing: unclear requirements → `docs/TECH_STACK.md` then ask; architecture decisions → `src/ARCHITECTURE.md` + `docs/DECISIONS.md` then ask; repeated failures → record in `PROGRESS.md` and flag for review.

## Definition of done

A feature is done only when all of these are true:

- [ ] The `user_visible_behavior` is implemented.
- [ ] Every listed verification layer actually ran, in order, and passed.
- [ ] Evidence is recorded in `feature_list.json` and the status is `passing`.
- [ ] `PROGRESS.md` is updated (Current Verified State, session entry, Next Steps).
- [ ] Affected docs are updated in the same commit.
- [ ] The tree is committed and clean, and `FAST=1 ./init.sh` still exits 0.

## Clock-out (session end)

1. Walk [docs/harness/clean-state-checklist.md](docs/harness/clean-state-checklist.md).
2. Update `PROGRESS.md` and `feature_list.json`; `pnpm harness:check`.
3. `pnpm check` (plus the feature's L2/L3).
4. Optional: score the diff with [docs/harness/evaluator-rubric.md](docs/harness/evaluator-rubric.md) (Claude Code: `evaluator` subagent). Revise before committing if any category is below 2.
5. Commit; for long sessions also fill [docs/harness/session-handoff.md](docs/harness/session-handoff.md).
6. Leave a clean restart path: the next session must be able to run `./init.sh` immediately.

Cleanup is dual-mode: immediate at every clock-out, plus a periodic (monthly) sweep that runs `pnpm knip`, prunes stale docs and regrades [docs/harness/quality-document.md](docs/harness/quality-document.md).

Claude Code: `/clock-out` walks these steps; `/verify-feature F-NNN` runs a feature's layers and records evidence.

## State artefacts and further reading

- State: [PROGRESS.md](PROGRESS.md) · [feature_list.json](feature_list.json) · [docs/DECISIONS.md](docs/DECISIONS.md) · [docs/harness/](docs/harness/) (handoff, checklist, rubric, quality document).
- Project: [README.md](README.md) · [docs/TECH_STACK.md](docs/TECH_STACK.md) · [src/ARCHITECTURE.md](src/ARCHITECTURE.md) · [tests/README.md](tests/README.md).
- Tools: Claude Code permissions, hooks, skills and the evaluator subagent are described in [CLAUDE.md](CLAUDE.md) and live in `.claude/`.

## Framework notes

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
