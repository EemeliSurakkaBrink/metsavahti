# 05 — Conventions, Definition of Done, Agent Protocol

## Branching & PRs

- `main` is protected; squash-merge only. Branch `feat/MV-xxx-slug`, `fix/MV-xxx-slug`, `chore/...`.
- One ticket per PR. PR title `MV-xxx: <imperative summary>`. Conventional commits inside.
- PR template sections: Ticket · Summary · How to test · Screenshots (UI) · Spec deviations · Follow-ups.

## Definition of Done (every ticket)

1. All acceptance criteria in the ticket are met.
2. Tests listed in the ticket exist and pass; coverage for `src/lib/**` does not drop.
3. `pnpm lint`, `pnpm typecheck`, `pnpm test:unit`, `pnpm test:integration` pass; `pnpm test:e2e` passes if UI/routes changed.
4. No new `any`, no `// @ts-ignore` without a comment referencing an issue.
5. New env vars added to `.env.example`, `src/env.ts`, and `docs/02-tech-stack.md`.
6. New strings added to `src/i18n/fi.ts`; no hard-coded Finnish in components.
7. If behaviour deviates from `docs/`, the doc is updated in the same PR and the deviation is called out.
8. Migrations: generated with Payload/Drizzle, reviewed by hand, reversible where feasible, named `NNNN_<slug>`.
9. Accessibility: interactive elements keyboard-reachable, labelled; new pages added to the axe E2E list.

## Testing rules

- **Unit** (`tests/unit`, Vitest, no I/O): pure functions, schemas, reducers, email rendering, components with Testing Library. Mock HTTP with MSW only when a unit genuinely wraps fetch.
- **Integration** (`tests/integration`, Vitest + Testcontainers PostGIS): Payload Local API, Server Actions, Route Handlers, jobs. Real DB, mocked network (MSW). Each file gets a fresh schema via `globalSetup` template DB clone for speed.
- **E2E** (`tests/e2e`, Playwright): user journeys against `next start`, WFS mock server, Mailpit. Use `data-testid` sparingly; prefer roles/labels. Tag `@smoke` for the fast subset run on every PR; full suite nightly and before release.
- **Live** (`tests/live`): real WFS only. Never in PR CI.
- Fixtures: `tests/fixtures/wfs/<name>.json` recorded with `pnpm fixtures:record --bbox ...`. Include at least: `inside.json` (features inside the sample watch area), `outside.json`, `borderline.json` (touching edge), `changed-geometry.json`, `changed-attributes.json`, `empty.json`, `paged-1.json`/`paged-2.json`.
- Factories in `tests/factories/` (`userFactory`, `watchAreaFactory`, `declarationFactory`) — no ad-hoc inserts.

## Code conventions

- Server-first: fetch in Server Components / Server Actions; client components only for interactivity (map, forms).
- Ownership checks in every Server Action and Route Handler (`assertOwner(user, resource)`), in addition to Payload access control.
- Errors: throw typed `AppError` subclasses (`NotFound`, `Forbidden`, `RateLimited`, `ExternalServiceError`); map to responses in one place.
- Dates: store UTC, render with `Intl.DateTimeFormat('fi-FI', { timeZone: user.timezone })`.
- Geometry: GeoJSON in WGS84 at API boundaries; 3067 internally; never buffer in WGS84 for anything authoritative.
- Logging: `logger.child({ task, runId })`; no `console.log` in committed code.
- Feature flags: read from `env` only; document in `02-tech-stack.md`.

## Agent protocol (for swarm orchestration)

- Before starting: confirm all `Depends on` tickets are merged (`git log --grep MV-xxx` on `main`).
- Claim a ticket by opening a draft PR immediately with the ticket id (prevents two agents taking the same one).
- Do not modify files owned by another in-flight ticket (`Files` section) — if unavoidable, note it and rebase last.
- Keep PRs under ~600 changed lines; split with a follow-up ticket `MV-xxx-b` if needed (note in PR).
- Never skip or `.skip` a failing test to get green; fix or raise a blocker comment on the ticket.
- If the spec is ambiguous, pick the simplest interpretation that satisfies the acceptance criteria, implement it, and document the choice in the PR.
