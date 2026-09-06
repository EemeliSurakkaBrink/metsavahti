# Progress log

Repository-local session log. Read it at clock-in, update it at clock-out (AGENTS.md).
Any coding agent can use it; nothing updates it automatically.

## Current Verified State

- Repository root: `metsavahti/` (this directory; contains `AGENTS.md`, `feature_list.json`, `init.sh`).
- Standard startup path: `./init.sh` (`FAST=1` skips the baseline; `RUN_START_COMMAND=1` starts Docker services and `pnpm dev`).
- Standard verification path: L1 `pnpm check` · L2 `pnpm test:integration` (Docker) · L3 `pnpm test:e2e` (Docker + browsers).
- Last verified commit: `113bcda` plus the working tree of session 002 (F-001 done; phase 2 in progress).
- `pnpm check`: passing (2026-09-06, session 002; lint, typecheck, knip, format:check, 27 unit tests). Note: at `113bcda` L1 was red because the spec docs were unformatted; fixed in session 002.
- L2 / L3 last run: at scaffold time (commit `9bd9f80`, CI green); not re-run in session 001 because no `src/` code changed.
- F-001 (`noUncheckedIndexedAccess`) is passing. Phase 2 of the harness (automated loop) is the active work; see `docs/harness/phase-2-automated-loop.md` and the F-013…F-016 entries.
- Current blocker: none. F-011 and F-012 are blocked on `MML_API_KEY`.

## Next Steps

1. `/clock-in F-001` (or follow AGENTS.md → Clock-in): add `"noUncheckedIndexedAccess": true` to `tsconfig.json`, keep README/TECH_STACK claims truthful, `pnpm check`, `/verify-feature F-001`, `/clock-out`.
2. Then F-002 (sign-up form + verification email). It is cross-component: plan the L2 integration test and the L3 Playwright spec before writing UI.
3. After the first real feature session: tune `docs/harness/evaluator-rubric.md` against your own judgement and regrade `docs/harness/quality-document.md`.

## Session Log

### Session 002 — 2026-09-06 (phase 2: automated loop)

- Goal: implement phase 2 of the harness (`docs/harness/phase-2-automated-loop.md`): machine-checkable transitions, unattended loop driver, spec reconciliation and ticket import, design-system enforcement, overview doc.
- Completed so far: F-001 (`noUncheckedIndexedAccess`); design prototypes moved to `docs/design/`; F-013 — `scripts/validate-feature-list.ts` extended (`depends_on`, `attempts`, `ticket`, `spec`, `design`, cycle/dependency rules, read/write helpers), `scripts/harness-feature.ts`, `scripts/verify-feature.ts`, `scripts/clean-state-check.sh`, skills rewired to the scripts, checklist split into machine/judgement parts; F-014 — `scripts/harness-loop.ts` (`pnpm harness:loop`, `harness:report`), `harness.config.json`, prompt templates + evaluator JSON schema in `docs/harness/prompts/`, opt-in Stop hook `stop-guard.sh`, loop-mode blocks in `guard.sh`, evaluator agent contract, D-008.
- Verification run: `pnpm check` (38 unit tests), `pnpm harness:check`, `pnpm harness:verify F-013 --allow-manual`, clean-state script exercised against an injected `.only` and `console.log` (both caught); `pnpm harness:loop --dry-run --no-docker --feature F-002` prints the full chain; `stop-guard.sh` and `guard.sh` simulated (block / allow / cap paths).
- Commits: `2052888`, `c686222`, then one commit per feature F-013…F-016 (see `git log`).
- Known risk: the clean-state script compares against `origin/main`; on a local-only branch it falls back to `main`.
- Next best step: F-015 (spec reconciliation + ticket import), then F-016 (design system), then the overview doc; install `gh` (`brew install gh && gh auth login`) before the first live loop run.

### Session 001 — 2026-09-06

- Goal: bootstrap the agent harness (course: learn-harness-engineering, quick start + resource library) for Claude Code.
- Completed: `AGENTS.md` operating manual (Next.js marker block kept, moved to the bottom), thin `CLAUDE.md`, `feature_list.json` (13 features, F-000 passing), this file, `init.sh`, `pnpm check` / `check:full` / `harness:check`, `scripts/validate-feature-list.ts` + unit test + lint-staged rule, `docs/DECISIONS.md`, `src/ARCHITECTURE.md`, `docs/harness/` (session handoff, clean-state checklist, evaluator rubric, quality document), `.claude/` (settings with permissions + hooks, `session-start.sh`, `guard.sh`, `format.sh`, skills `clock-in` / `verify-feature` / `clock-out`, `evaluator` subagent), README section.
- Verification run: `pnpm check` (green), `pnpm harness:check` (green), `FAST=1 ./init.sh` (green), hook scripts exercised with simulated inputs (block / ask / deny / allow as designed), Next's `writeAgentFiles()` run against the new `AGENTS.md` (reports `unchanged`).
- Evidence captured: in `feature_list.json` → F-000 → `evidence`.
- Commits: the commit following `9bd9f80`.
- Files or artefacts updated: see Completed.
- Known risk or unresolved issue: the guard hook is regex-based (it inspects the command text), so it can block commands that merely mention a forbidden pattern; split the string or ask the user. The evaluator rubric is untuned (see its tuning log). The course's contributed `audit-harness.sh` will flag the absent Makefile/`templates/` paths as recommended gaps (deliberate, D-007).
- Next best step: F-001 as described under Next Steps.
