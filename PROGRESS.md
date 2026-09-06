# Progress log

Repository-local session log. Read it at clock-in, update it at clock-out (AGENTS.md).
Any coding agent can use it; nothing updates it automatically.

## Current Verified State

- Repository root: `metsavahti/` (this directory; contains `AGENTS.md`, `feature_list.json`, `init.sh`, `harness.config.json`).
- Standard startup path: `./init.sh` (`FAST=1` skips the baseline; `RUN_START_COMMAND=1` starts Docker services and `pnpm dev`).
- Standard verification path: L1 `pnpm check` · L2 `pnpm test:integration` (Docker) · L3 `pnpm test:e2e` (Docker + browsers). Per feature: `pnpm harness:verify F-NNN`.
- Last verified commit: the F-016 commit of session 002 (see `git log`); `pnpm check` green (46 unit tests), `pnpm test:e2e` green (29 checks, 3 browsers) on 2026-09-06.
- L2 last run: at scaffold time (`9bd9f80`, CI green); no `src/` runtime code changed in session 002 (map colours, email styles and the theme only).
- Harness phase 2 is complete: F-013 (scripts), F-014 (loop driver + stop guard + evaluator split), F-015 (spec in `docs/product`, 115 features imported), F-016 (design tokens + lint). How it works: `docs/harness/README.md`.
- Queue: `pnpm harness:feature list` — ready and unattended-capable now: F-010 (typed errors), F-020 (CRS module), F-030 (PostGIS migration scaffolding). Human-only ready: F-021 (WFS discovery, needs network).
- Current blocker: none for the loop itself. `gh` is not installed (`brew install gh && gh auth login`), so the driver would push branches but could not open PRs. F-017 and F-062 are blocked on `MML_API_KEY`.

## Next Steps

1. `brew install gh && gh auth login`; push `main` so it is in sync with `origin/main` (the driver's preflight requires it).
2. First live loop run, watched: `pnpm harness:loop --once --feature F-020` (CRS module, unit-only, cheap). Read `.harness/runs.jsonl`, the trace and the PR; compare the evaluator's verdict with your own and add a row to the rubric's tuning log.
3. Then `pnpm harness:loop --once` for F-010 and F-030, then let it loop. Review the generated `verification[]` lines of a feature before it runs (they were derived from the tickets' Tests lines).
4. When a page ticket comes up (first is F-011 after F-016), check that the session opened the linked artboard; tighten the generator prompt if it did not.
5. Interactive work still uses `/clock-in`, `/verify-feature`, `/clock-out`; human-only features (`manual:` steps) stay interactive.

## Session Log

### Session 002 — 2026-09-06 (phase 2: automated loop)

- Goal: implement phase 2 of the harness (`docs/harness/phase-2-automated-loop.md`): machine-checkable transitions, unattended loop driver, spec reconciliation and ticket import, design-system enforcement, overview doc.
- Completed so far: F-001 (`noUncheckedIndexedAccess`); design prototypes moved to `docs/design/`; F-013 — `scripts/validate-feature-list.ts` extended (`depends_on`, `attempts`, `ticket`, `spec`, `design`, cycle/dependency rules, read/write helpers), `scripts/harness-feature.ts`, `scripts/verify-feature.ts`, `scripts/clean-state-check.sh`, skills rewired to the scripts, checklist split into machine/judgement parts; F-014 — `scripts/harness-loop.ts` (`pnpm harness:loop`, `harness:report`), `harness.config.json`, prompt templates + evaluator JSON schema in `docs/harness/prompts/`, opt-in Stop hook `stop-guard.sh`, loop-mode blocks in `guard.sh`, evaluator agent contract, D-008; F-015 — spec moved to `docs/product/` with `docs/README.md` index, `docs/product/00-deviations.md` ledger (≈45 rows), rewritten `05-conventions.md`, reconstructed `E00-bootstrap.md`, `scripts/import-tickets.ts` (111 tickets → 115 features with `depends_on`, `spec`, `design`), `docs/design/design-map.json`, `docs/harness/README.md` overview; F-016 — design tokens as the Tailwind theme (`src/app/globals.css`, default palette removed), `src/lib/design-tokens.ts` for map + email, Figtree via `next/font`, `eslint-plugin-better-tailwindcss` rules + `react/forbid-*-props` for `style`, tokens consistency test, `docs/design/README.md`, AGENTS.md design constraint.
- Verification run: `pnpm check` (38 unit tests), `pnpm harness:check`, `pnpm harness:verify F-013 --allow-manual`, clean-state script exercised against an injected `.only` and `console.log` (both caught); `pnpm harness:loop --dry-run --no-docker --feature F-002` prints the full chain; `stop-guard.sh` and `guard.sh` simulated (block / allow / cap paths); `pnpm lint` fails on injected `bg-[#000]`, `text-gray-500` and `style=` (4 errors) and passes after removal; `pnpm harness:verify F-016` ran L1 + L3 (29 e2e checks incl. axe).
- Commits: `2052888`, `c686222`, then one commit per feature F-013…F-016 (see `git log`).
- Known risk: the clean-state script compares against `origin/main`; on a local-only branch it falls back to `main`.
- Known risk: the loop has not run live yet (no `gh`); the first run should be watched and its evaluator verdict compared with a human one. The generated verification lines are a first pass. Dark mode was removed with the token port (no design for it).
- Next best step: see Next Steps 1–2.

### Session 001 — 2026-09-06

- Goal: bootstrap the agent harness (course: learn-harness-engineering, quick start + resource library) for Claude Code.
- Completed: `AGENTS.md` operating manual (Next.js marker block kept, moved to the bottom), thin `CLAUDE.md`, `feature_list.json` (13 features, F-000 passing), this file, `init.sh`, `pnpm check` / `check:full` / `harness:check`, `scripts/validate-feature-list.ts` + unit test + lint-staged rule, `docs/DECISIONS.md`, `src/ARCHITECTURE.md`, `docs/harness/` (session handoff, clean-state checklist, evaluator rubric, quality document), `.claude/` (settings with permissions + hooks, `session-start.sh`, `guard.sh`, `format.sh`, skills `clock-in` / `verify-feature` / `clock-out`, `evaluator` subagent), README section.
- Verification run: `pnpm check` (green), `pnpm harness:check` (green), `FAST=1 ./init.sh` (green), hook scripts exercised with simulated inputs (block / ask / deny / allow as designed), Next's `writeAgentFiles()` run against the new `AGENTS.md` (reports `unchanged`).
- Evidence captured: in `feature_list.json` → F-000 → `evidence`.
- Commits: the commit following `9bd9f80`.
- Files or artefacts updated: see Completed.
- Known risk or unresolved issue: the guard hook is regex-based (it inspects the command text), so it can block commands that merely mention a forbidden pattern; split the string or ask the user. The evaluator rubric is untuned (see its tuning log). The course's contributed `audit-harness.sh` will flag the absent Makefile/`templates/` paths as recommended gaps (deliberate, D-007).
- Next best step: F-001 as described under Next Steps.
