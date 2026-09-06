# Tests

Three suites, each with its own isolation model. None of them can touch the
development database: every command runs through `dotenv -e .env.test --`, and
`helpers/db-guard.ts` aborts if `DATABASE_URL` is not a `*_test` / `*_e2e`
database or points at port 5432.

## Unit — `pnpm test:unit`

- Config: `vitest.unit.config.ts` (project `unit`, `environment: node`).
- Location: `tests/unit/**/*.test.{ts,tsx}`. Component/email tests opt into
  jsdom with `// @vitest-environment jsdom` at the top of the file.
- No database, no network: `helpers/msw.ts` errors on any unhandled request.
- Covers CRS transforms (5 control points, round-trip < 1 mm) and GeoJSON reprojection, buffers/bboxes, WFS URL building + retry policy, Zod
  schema against the recorded fixture (snapshot), geometry hashing, hakkuutapa
  labels, attribution text, cron-secret comparison, email rendering, the DB guard.

## Integration — `pnpm test:integration`

- Config: `vitest.integration.config.ts` (project `integration`, one worker,
  `isolate: false` so a single Payload instance is reused across files).
- `global-setup.ts` starts a throwaway **PostGIS** and **Mailpit** through
  Testcontainers (Docker Desktop), runs `payload migrate` against the container
  and `provide()`s the endpoints; `setup.ts` `inject()`s them into `process.env`
  before the Payload config is imported.
- Each file calls `resetDatabase()` (TRUNCATE … CASCADE) in `beforeAll`.
- The WFS is stubbed with `msw` (`helpers/wfs-fixture.ts` answers bbox queries
  like the real service).
- Covers: migrations applied (generated `geom_3067`, GIST indexes), access
  control, the full `sync-declarations` pipeline (new → idempotent → changed
  geometry, emails asserted through the Mailpit API), and the cron endpoint.

## E2E — `pnpm test:e2e` (`test:e2e:ui` for the inspector)

- Config: `playwright.config.ts`. Requires `pnpm db:up` (compose `db_test` on
  5433 + Mailpit) and `pnpm exec playwright install chromium webkit`.
- Playwright starts two servers: the WFS mock (`e2e/mocks/wfs-server.ts`, Hono on 3200) and the app on **3100** (`next dev` locally, `next start` in CI, both with
  `NEXT_DIST_DIR=.next-e2e`). `reuseExistingServer` is on locally, so keep them
  running between iterations for fast reruns.
- Project order: `db-setup` (guard → migrate → truncate → seed first user + a
  watch area through the REST API) → `auth-setup` (logs in once, stores cookies
  in `e2e/.auth/user.json`) → `chromium`, `webkit`, `mobile-chrome` in parallel.
- Specs: landing page + attribution + axe, login validation, dashboard
  redirect/auth/map, health and jobs API (runs the sync against the mock).

## Live contract — `pnpm test:live`

- `vitest.live.config.ts`; hits the real Metsäkeskus WFS. Runs nightly in CI
  (`.github/workflows/nightly.yml`) and tells you when the upstream data model
  drifts from `src/lib/wfs/schemas.ts`.

## Fixtures

`fixtures/wfs/forestusedeclaration.sample.json` is a real 2-feature sample
recorded with `pnpm fixtures:record` (coordinates rounded to cm). The E2E seed
and the integration tests derive the watch-area centre from its bbox.
