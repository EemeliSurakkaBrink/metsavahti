# Progress log

Repository-local session log. Read it at clock-in, update it at clock-out (AGENTS.md).
Any coding agent can use it; nothing updates it automatically.

## Current Verified State

- Repository root: `metsavahti/` (this directory; contains `AGENTS.md`, `feature_list.json`, `init.sh`).
- Standard startup path: `./init.sh` (`FAST=1` skips the baseline; `RUN_START_COMMAND=1` starts Docker services and `pnpm dev`).
- Standard verification path: L1 `pnpm check` · L2 `pnpm test:integration` (Docker) · L3 `pnpm test:e2e` (Docker + browsers).
- Last verified commit: `9bd9f80` plus the harness working tree (committed as the next commit, "chore(harness): …").
- `pnpm check`: passing (2026-09-06; lint, typecheck, knip, format:check, 27 unit tests).
- L2 / L3 last run: at scaffold time (commit `9bd9f80`, CI green); not re-run in session 001 because no `src/` code changed.
- Current highest-priority unfinished feature: F-001 — Enable `noUncheckedIndexedAccess` (config + docs; 0 type errors today).
- Current blocker: none. F-011 and F-012 are blocked on `MML_API_KEY`.

## Next Steps

1. `/clock-in F-001` (or follow AGENTS.md → Clock-in): add `"noUncheckedIndexedAccess": true` to `tsconfig.json`, keep README/TECH_STACK claims truthful, `pnpm check`, `/verify-feature F-001`, `/clock-out`.
2. Then F-002 (sign-up form + verification email). It is cross-component: plan the L2 integration test and the L3 Playwright spec before writing UI.
3. After the first real feature session: tune `docs/harness/evaluator-rubric.md` against your own judgement and regrade `docs/harness/quality-document.md`.

## Session Log

### Session 001 — 2026-09-06

- Goal: bootstrap the agent harness (course: learn-harness-engineering, quick start + resource library) for Claude Code.
- Completed: `AGENTS.md` operating manual (Next.js marker block kept, moved to the bottom), thin `CLAUDE.md`, `feature_list.json` (13 features, F-000 passing), this file, `init.sh`, `pnpm check` / `check:full` / `harness:check`, `scripts/validate-feature-list.ts` + unit test + lint-staged rule, `docs/DECISIONS.md`, `src/ARCHITECTURE.md`, `docs/harness/` (session handoff, clean-state checklist, evaluator rubric, quality document), `.claude/` (settings with permissions + hooks, `session-start.sh`, `guard.sh`, `format.sh`, skills `clock-in` / `verify-feature` / `clock-out`, `evaluator` subagent), README section.
- Verification run: `pnpm check` (green), `pnpm harness:check` (green), `FAST=1 ./init.sh` (green), hook scripts exercised with simulated inputs (block / ask / deny / allow as designed), Next's `writeAgentFiles()` run against the new `AGENTS.md` (reports `unchanged`).
- Evidence captured: in `feature_list.json` → F-000 → `evidence`.
- Commits: the commit following `9bd9f80`.
- Files or artefacts updated: see Completed.
- Known risk or unresolved issue: the guard hook is regex-based (it inspects the command text), so it can block commands that merely mention a forbidden pattern; split the string or ask the user. The evaluator rubric is untuned (see its tuning log). The course's contributed `audit-harness.sh` will flag the absent Makefile/`templates/` paths as recommended gaps (deliberate, D-007).
- Next best step: F-001 as described under Next Steps.
