# Tests

Three suites, each with its own isolation model. None of them can touch the
development database: every command runs through `dotenv -e .env.test --`, and
`helpers/db-guard.ts` aborts if `DATABASE_URL` is not a `*_test` / `*_e2e`
database or points at port 5432.

## Unit — `pnpm test:unit`

- Config: `vitest.unit.config.ts` (project `unit`, `environment: node`).
- Location: `tests/unit/**/*.test.{ts,tsx}`. Component/email tests opt into
  jsdom with `// @vitest-environment jsdom` at the top of the file and use
  `@testing-library/react` + `user-event` (`auth/auth-layout-and-shared-form-components.test.tsx`
  is the pattern: `render`, `screen`, `waitFor` for the lazily loaded scorer, `cleanup` in `afterEach`).
- No database, no network: `helpers/msw.ts` errors on any unhandled request.
- Covers CRS transforms (5 control points, round-trip < 1 mm) and GeoJSON reprojection, buffers/bboxes, WFS URL building + retry policy, Zod
  schema against the recorded fixture (snapshot), geometry hashing, hakkuutapa
  labels, attribution text, cron-secret comparison, email rendering (`EmailLayout` snapshot, alert
  template, adapter selection by env), the auth layout and form components (`PasswordInput`
  toggle + zxcvbn meter, `FormError`, `FormSuccess`, `scorePassword` thresholds), the DB guard.

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
- Covers: PostGIS enabled (`PostGIS_Version()`, adapter `extensions`), applied migrations equal `index.ts`,
  migrations applied (generated `geom_3067`, GIST indexes), access
  control, the `users` collection (self-only read/update, admin-only `role`/`plan`/`deletedAt`,
  `01 §3.1` defaults, derived `marketingConsentAt`, IANA `timezone`, auth options),
  the `watch-areas` collection (generated `geom_3067` area ≈ πr², geometry follows a radius
  update, `01 §3.2` fields and the `notify_by_email` rename, radius bounds, free-plan limit of 2
  areas on create and on ownership change),
  the `declarations` + `declaration-revisions` collections (`01 §3.3` columns and indexes,
  generated `centroid` inside the MultiPolygon, raw insert via `helpers/declarations.ts`,
  unique `source_id` violation, derived `cuttingTypeLabel` / `validUntil`, admin read-only),
  the `watch-area-declarations` + `alerts` collections (`01 §3.4–3.5` columns, unique
  (watch_area, declaration), cascading FKs, `(user, created_at DESC)` / `(user, notified_at)` indexes,
  admin read-only join rows, owner-only alert read, `readAt`-only owner update, no owner create/delete,
  and a `down` → `up` round-trip of the MV-034 migration converting pre-MV-034 alerts),
  the `notification-log` + `consent-events` + `data-export-requests` + `job-runs` + `exports`
  collections (`01 §3.6–3.9` columns and indexes, consent events rejecting update/delete through
  access control and through the hooks even with `overrideAccess`, IP stored as a /24 prefix, owner-only
  reads, zip-only uploads written under `EXPORTS_DIR`, admin-only job runs and log, and a `down` → `up`
  round-trip of the MV-035 migration backfilling `type` / `provider` / `sent_at`),
  the `legal-documents` collection (`01 §3.10` columns, unique (slug, version), the idempotent
  placeholder seed, `findLatestLegalDocument()` ignoring drafts and future `publishedAt`, public read of
  published versions only, admin-only writes, and a `down` → `up` round-trip of the MV-036 migration),
  the email transport (`payload.email` is the nodemailer adapter; a layout-rendered
  `payload.sendEmail` reaches Mailpit with the settings link and attribution),
  the full `sync-declarations` pipeline (new → idempotent → changed
  geometry with a `declaration-revisions` row and an in-place `watch-area-declarations` update,
  emails asserted through the Mailpit API), and the cron endpoint.

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
  redirect/auth/map/pending-alert count, marketing layout + system pages (header/footer, 404 status,
  `/huolto`, `/liikaa-pyyntoja`, the error boundary through `/virhe`, axe), health and
  jobs API (runs the sync against the mock). `/virhe` throws only because `.env.test` sets
  `ENABLE_ERROR_TEST_ROUTE=1`; the unit test `infra/error-test-route.test.ts` checks that
  it is a 404 otherwise.

## Live contract — `pnpm test:live`

- `vitest.live.config.ts`; hits the real Metsäkeskus WFS. Runs nightly in CI
  (`.github/workflows/nightly.yml`) and tells you when the upstream data model
  drifts from `src/lib/wfs/schemas.ts`.

## Fixtures

`fixtures/wfs/forestusedeclaration.sample.json` is a real 2-feature sample
recorded with `pnpm fixtures:record` (coordinates rounded to cm). The E2E seed
and the integration tests derive the watch-area centre from its bbox.
