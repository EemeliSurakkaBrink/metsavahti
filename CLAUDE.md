@AGENTS.md

## Claude Code specifics

The operating manual above applies to every agent. This section covers what Claude Code
does automatically in this repository (configuration in `.claude/`).

- **Permissions** (`.claude/settings.json`): read-only git commands, `docker ps/info` and the
  verification scripts (`pnpm check*`, `lint*`, `typecheck`, `knip`, `format*`, `test:unit*`,
  `test:integration*`, `harness:check`) run without prompting. Reading or editing `.env`,
  editing `src/payload-types.ts` and `pnpm-lock.yaml`, `pnpm db:reset`,
  `docker compose down -v`, force pushes and `git reset --hard` are denied.
- **Hooks**: `SessionStart` prints branch, recent commits, Current Verified State and the
  active feature. `PreToolUse` (`guard.sh`) blocks bare `vitest`/`playwright`, npm/yarn
  installs and destructive commands, runs `pnpm harness:check` before every `git commit`,
  and asks before edits to generated Payload routes, migrations or the marker block in
  `AGENTS.md`. `PostToolUse` runs Prettier on every edited file.
- **Skills**: `/clock-in [F-NNN]` runs the clock-in routine and activates a feature;
  `/verify-feature F-NNN` runs the feature's layers in order and records evidence;
  `/clock-out` walks the clean-state checklist, updates state files and commits.
- **Subagent** `evaluator`: fresh-context reviewer that scores the working-tree diff against
  `docs/harness/evaluator-rubric.md`. Use it from `/clock-out` or on request; it never edits.
- Prefer `pnpm test:watch` for tight loops and `pnpm test:e2e:ui` for Playwright debugging.
