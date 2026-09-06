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

## D-008 · Driver-run sessions: local loop, auto permissions, PR per feature, opt-in Stop hook (2026-09-06)

- Context: phase 2 of the harness (`docs/harness/phase-2-automated-loop.md`) makes sessions start unattended. D-007 rejected a Stop hook because it would nag during interactive work; an unattended session has nobody to nag and needs a hard stop condition.
- Decision:
  - The driver is a local script (`scripts/harness-loop.ts`, `pnpm harness:loop`) run on the developer's machine with the existing Claude Code login and host Docker; no CI or cloud runner.
  - Sessions run `claude -p --permission-mode auto --permission-prompts none` with an explicit `--allowedTools` list from `harness.config.json`. Allow rules resolve before the classifier, so the pnpm/git path is deterministic; the deny list and `guard.sh` still apply; `bypassPermissions` is not used because Docker and the dev database live on the host.
  - One git worktree and branch `feat/F-NNN` per feature, cut from `main`; the result is pushed and a PR is opened with `gh`. By default the driver waits for the merge before starting a dependent feature (`merge: "wait"`; `--auto-merge` arms `gh pr merge --auto --squash`).
  - Caps per session: 2 attempts per feature (one evaluator-driven retry), 200 turns, 15 USD, 60 minutes; the loop stops after 2 consecutive failed features. `manual:` verification steps are never waived unattended.
  - A generator/evaluator split: the evaluator runs as a separate `claude -p --agent evaluator` session on a different model with a JSON verdict schema.
  - The Stop hook `.claude/hooks/stop-guard.sh` is registered but inert unless `HARNESS_STOP_GUARD=1` (set by the driver); it blocks at most three times per session. This amends D-007.
- Consequences: `.harness/` (traces, run log, counters) is gitignored; `guard.sh` additionally blocks `pnpm db:up/down`, `git push`, `git checkout main` and worktree commands when `HARNESS_LOOP=1`; only one feature runs at a time because L3 uses fixed ports and `.next-e2e`; `gh` must be installed and logged in for PRs (without it the branch is pushed and the PR is opened by hand).

## D-009 · Design tokens are the whole Tailwind theme; the default palette is removed (2026-09-06)

- Context: the Claude Design tokens (`docs/design/tokens.js`) had to become enforceable, not advisory; agents otherwise reach for `bg-[#…]` and Tailwind's own palette.
- Decision:
  - `src/app/globals.css` declares the tokens in `@theme` and starts with `--color-*: initial`, so the default Tailwind palette does not exist; `text-gray-500` is an unknown class. shadcn's semantic names (`bg-primary`, `text-muted-foreground` …) are aliased onto the tokens so the generated `components/ui/*` keep working.
  - The radius scale is remapped, not copied: tokens.js `sm 6 / DEFAULT 10 / lg 14 / xl 20` becomes `rounded-sm 6 / rounded-md 8 / rounded-lg 10 / rounded-xl 14 / rounded-2xl 20`, because shadcn components already use `rounded-lg` for the default radius; `md: 8px` is added for compact buttons.
  - `src/lib/design-tokens.ts` mirrors the values for code that cannot use classes (MapLibre paint, React Email); `tests/unit/design/tokens.test.ts` fails when the two drift or when a colour literal appears elsewhere in `src/`.
  - Enforcement in L1: `eslint-plugin-better-tailwindcss` (`no-unknown-classes`, `no-conflicting-classes`, `no-duplicate-classes`, `no-restricted-classes` for arbitrary values and palette colours) and `react/forbid-dom-props` / `forbid-component-props` for `style`, with exceptions only for the map container and email templates.
  - No dark theme: the design has none, so the shadcn `.dark` block, the `dark` variant and `dark:` classes are removed (00-deviations R13).
- Consequences: new colours are added to both token sources in the same commit; a page ticket reads its artboard from `design-map.json` before coding; reintroducing dark mode needs a design first.

## D-010 · Unmatched URLs go through a catch-all route, not `app/not-found.tsx` (2026-09-06)

- Context: MV-011 asks for a root `not-found.tsx`. The app has two root layouts, `src/app/(frontend)/layout.tsx` and Payload's generated `(payload)/layout.tsx`, and no `app/layout.tsx`. Next builds its `/_not-found` route only from files directly under `app/`, and a custom `app/not-found.tsx` without `app/layout.tsx` makes `next dev` generate a root layout, which would wrap Payload's document in a second one. The alternative, `global-not-found.tsx`, is still behind `experimental.globalNotFound` in Next 16.3.
- Decision: `src/app/(frontend)/(marketing)/[...notFound]/page.tsx` catches every URL no other route matches and throws `notFound()`; `(marketing)/not-found.tsx` renders the 404 inside the marketing frame with the attribution footer. `notFound()` thrown at shell level goes through Next's error-recovery render, so the response carries status 404 and the 404 UI hydrates from the inlined payload rather than being in the HTML body.
- Consequences: Playwright and browsers see the designed page and a 404 status; `curl` sees the status and an empty body. `notFound()` inside `(app)` or later groups needs its own `not-found.tsx` (R7 in the deviations ledger) or falls back to Next's default. Revisit when `global-not-found.tsx` is stable: it would replace the catch-all with a server-rendered document (ledger R15).
