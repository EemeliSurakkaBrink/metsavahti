---
name: clock-out
description: End a Metsävahti work session — walk the clean-state checklist, update PROGRESS.md and feature_list.json, run pnpm check, optionally score the diff with the evaluator subagent, and commit. Invoking this skill is the user's request to commit.
disable-model-invocation: true
allowed-tools: Bash(git status *) Bash(git diff *) Bash(git log *) Bash(pnpm harness:check) Bash(pnpm check) Bash(FAST=1 ./init.sh) Bash(pnpm exec prettier *)
---

Run the clock-out routine from AGENTS.md → Clock-out and Definition of done.

1. `git status --short` and `git diff --stat`. Confirm the changes belong to the active feature only; list anything out of scope and ask before including it.
2. Walk `docs/harness/clean-state-checklist.md` item by item and report each as done / not done. Fix what can be fixed (debug artefacts, missing doc updates, regenerate generated files); never skip tests or weaken assertions to satisfy an item.
3. Update `feature_list.json`: the active feature is `passing` only if `/verify-feature` recorded evidence; otherwise leave it `in_progress` (or `blocked` with the reason in `notes`). Bump `last_updated`. `pnpm harness:check`.
4. Update `PROGRESS.md`:
   - Current Verified State: last verified commit (fill in after committing, or say "this commit"), `pnpm check` result and date, highest-priority unfinished feature, current blocker.
   - Append a `### Session NNN — YYYY-MM-DD` entry (goal, completed, verification run, evidence, commits, files updated, known risk, next best step).
   - Rewrite Next Steps so a fresh session can start immediately.
   - For a long or multi-area session also add a handoff block at the top of `docs/harness/session-handoff.md`.
5. `pnpm check` (and the feature's L2/L3 if they were not run in this session). Stop and report if red.
6. Optional but recommended when a feature reaches `passing`: launch the `evaluator` subagent on the working tree. If the verdict is Revise or Block, address the findings before committing.
7. Commit: one logical change, conventional-commit subject, body that explains why; include the state files and any doc updates in the same commit. The guard hook re-runs `pnpm harness:check` on `git commit`.
8. Confirm `git status` is clean and `FAST=1 ./init.sh` exits 0. Report the commit hash and the next best step.
