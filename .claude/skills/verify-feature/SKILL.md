---
name: verify-feature
description: Run a feature's verification layers from feature_list.json in order (L1 → L2 → L3 → manual), stop at the first failure, and on success record evidence and set the feature to passing. Use when a feature's implementation is believed complete or the user asks to verify a feature.
argument-hint: '<feature-id>'
---

Verify feature `$ARGUMENTS` against AGENTS.md → Verification layers and Definition of done.

1. Read the feature from `feature_list.json`. If the id is missing, list the `in_progress` and `not_started` ids and stop.
2. Run the `verification` entries in order. `L1:`/`L2:`/`L3:` entries name the exact command; run it as written. `manual:` entries describe a check to perform and report on (do not invent a pass).
   - Stop at the first failing layer. Report the failing command and the relevant output, and do not run later layers (AGENTS.md: do not proceed to layer N+1 while layer N fails).
   - L2 and L3 need Docker; if `docker info` fails, report the layer as not run, not as passed.
3. When every entry passed:
   - Append one evidence line per entry to `evidence`: `YYYY-MM-DD <command> → pass (commit <short hash of HEAD>)`; for manual entries describe what was observed.
   - Set `status` to `passing`, bump `last_updated`.
   - Run `pnpm exec prettier --write feature_list.json` and `pnpm harness:check`.
4. Report a table of entries with pass/fail/not-run and the evidence lines added. Remind that clock-out (`/clock-out`) still has to update `PROGRESS.md` and commit.

Never edit the `verification` list to make it pass, and never mark `passing` with a layer not run.
