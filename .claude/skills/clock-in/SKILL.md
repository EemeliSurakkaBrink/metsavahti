---
name: clock-in
description: Start a Metsävahti work session — read PROGRESS.md and feature_list.json, run ./init.sh, report the baseline and activate exactly one feature (WIP=1). Use when the user says "clock in", "start a session", "what should I work on next", or before beginning feature work.
argument-hint: '[feature-id]'
allowed-tools: Bash(pwd) Bash(git log *) Bash(git status *) Bash(./init.sh) Bash(FAST=1 ./init.sh) Bash(pnpm harness:check) Bash(pnpm check)
---

Run the clock-in routine from AGENTS.md → Clock-in. Requested feature: `$ARGUMENTS` (empty = pick automatically).

1. `pwd` — confirm the repository root (it contains `AGENTS.md`, `PROGRESS.md`, `feature_list.json`).
2. Read `PROGRESS.md`: Current Verified State and Next Steps. Read `feature_list.json`.
3. `git log --oneline -5` and `git status --short`. If `src/` is dirty while the state files are not, stop and report: a previous session ended without clock-out; do not build on top of it without the user's decision.
4. `./init.sh` (use `FAST=1 ./init.sh` only if the user asked for a quick start). If it fails, the baseline is red: fixing that is the session's first job. Report the failure and stop the routine.
5. Choose the feature: the requested id if given, otherwise the lowest `priority` with status `not_started` whose dependencies (see `notes`) are `passing`. If a feature is already `in_progress`, continue it instead — never activate a second one.
6. Quote the feature's `user_visible_behavior` and `verification` list, and confirm with the user that this is the feature to work on.
7. After confirmation, set its `status` to `in_progress` in `feature_list.json`, bump `last_updated`, and run `pnpm harness:check`.

Finish with a short summary: baseline result, active feature, the layers it needs, and any blocker from `PROGRESS.md`.
