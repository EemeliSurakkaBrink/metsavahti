# Decisions

Lightweight architecture decision records. Newest last. Add an entry whenever a choice
is made that a future session could not derive from the code alone (why, not what).
The original spec and its deviations table live in [TECH_STACK.md](./TECH_STACK.md).

Format: **Context** (what forced a choice) · **Decision** · **Consequences**.

## D-001 · Next.js 16 instead of the specified 15 (2026-09-06)

- Context: `@payloadcms/next@3.88` supports only Next 15.4.x or ≥16.2.6.
- Decision: Next 16.3 with Turbopack for dev and build.
- Consequences: no `next lint` (ESLint runs standalone); Next regenerates the agent-rules block in `AGENTS.md`; the `distDir` lock means parallel builds need separate `NEXT_DIST_DIR`s.

## D-002 · pnpm 10, Zod 4, Vitest 5, TypeScript 5.9 (2026-09-06)

- Context: versions available and mutually compatible at scaffold time (see the table in TECH_STACK.md).
- Decision: take the current majors; pin exact versions in `package.json`.
- Consequences: `pnpm.onlyBuiltDependencies` replaces the build-script prompt; Vitest `projects` config; Zod 4 APIs (`z.prettifyError`) are used in scripts.

## D-003 · Geometry columns live outside Payload's field model (2026-09-06)

- Context: Payload has no PostGIS field type.
- Decision: `watch_areas.geom_3067` is a generated column (`ST_Buffer(ST_Transform(center,3067), radius_m)`), `declarations.geom` is written by `lib/geo/spatial-queries.ts`; both are registered in `afterSchemaInit` so Drizzle knows them.
- Consequences: all spatial SQL is confined to one module; migrations that touch geometry are hand-written PostGIS statements.

## D-004 · Schema only from committed migrations (2026-09-06)

- Context: `push: true` would let dev and test schemas drift and could drop the PostGIS columns.
- Decision: `push: false` everywhere; `prodMigrations` apply on boot in production.
- Consequences: every schema change needs `pnpm db:migrate:create`; integration tests run `payload migrate` against the throwaway container.

## D-005 · Three isolated database environments (2026-09-06)

- Context: an agent or a human running tests against the dev database would destroy data.
- Decision: dev `.env`/5432, integration Testcontainers, e2e `.env.test`/5433; every test script is wrapped in `dotenv -e .env.test --`; `tests/helpers/db-guard.ts` aborts on non-test databases or port 5432.
- Consequences: Docker Desktop is required for L2/L3; the Claude Code guard hook blocks bare `vitest`/`playwright` invocations.

## D-006 · Geometry-only change detection for the MVP (2026-09-06)

- Context: the WFS layer has no reliable "updated at" attribute.
- Decision: `geom_hash` (sha256 of WKB) decides `new` vs `changed`; a second run with identical data sends nothing.
- Consequences: attribute-only changes are missed until F-008 adds `attr_hash`.

## D-007 · Agent harness layout (2026-09-06)

- Context: adopting the course _learn-harness-engineering_ (quick start + resource library) for Claude Code without fighting the existing toolchain.
- Decision:
  - The operating manual is `AGENTS.md` (agent-agnostic); `CLAUDE.md` imports it with `@AGENTS.md` and adds Claude-Code-only notes. The Next.js marker block stays in `AGENTS.md` but at the bottom.
  - State files: `feature_list.json` (course template schema, `status` / `user_visible_behavior` field names) and `PROGRESS.md` (vendor-neutral name; the course's `claude-progress.md` name is only a convention).
  - Verification is named, not rebuilt: L1 `pnpm check`, L2 `pnpm test:integration`, L3 `pnpm test:e2e`. The feature list is validated by `scripts/validate-feature-list.ts` from `pnpm test:unit`, lint-staged and the commit guard hook, not by a separate CI step.
  - Resource templates live in `docs/harness/`. No Makefile, no `templates/` directory, no blocking `Stop` hook (it fires after every reply and would nag during normal work); the contributed `audit-harness.sh` from the course greps for those names and will report them as recommended gaps.
  - Claude Code wiring in `.claude/`: shared `settings.json` (permissions + hooks), hooks `session-start.sh`, `guard.sh`, `format.sh`, skills `clock-in`, `clock-out`, `verify-feature`, subagent `evaluator`.
- Consequences: one manual for every agent; the loop (read state → one feature → verify → write state) is enforced by tooling rather than by prose; audit-script parity is a conscious non-goal.
