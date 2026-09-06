# Clean-state checklist

Run through this at clock-out, before committing. A session is not finished until every
box is ticked; `/clock-out` in Claude Code walks the same list.

## Course checklist

- [ ] The standard startup path still works: `FAST=1 ./init.sh` exits 0.
- [ ] The standard verification path still runs: `pnpm check` exits 0 (plus L2/L3 when the feature requires them).
- [ ] Current progress is recorded in `PROGRESS.md` (Current Verified State, session entry, Next Steps).
- [ ] `feature_list.json` reflects what is actually passing versus unverified; `pnpm harness:check` exits 0.
- [ ] No half-finished step is left undocumented (notes on the feature, or a handoff in `docs/harness/session-handoff.md`).
- [ ] The next session can continue without manual repair.

## Repo-specific

- [ ] No `.skip`, `.only`, lowered coverage threshold or weakened assertion was introduced.
- [ ] No debug artefacts: stray `console.log` in `src/`, temporary files, commented-out code.
- [ ] `.env` is not staged; secrets did not land in `.env.test` or fixtures.
- [ ] Generated files were regenerated, not edited: `pnpm generate:types` after collection changes, `pnpm generate:importmap` after admin component changes.
- [ ] Docs affected by the change were updated in the same commit (README, `src/ARCHITECTURE.md`, `docs/DECISIONS.md`).
- [ ] The `<!-- BEGIN:nextjs-agent-rules -->` block in `AGENTS.md` is intact (`git diff AGENTS.md` shows only intended edits).
- [ ] Commit subject follows conventional commits and the body explains why.
