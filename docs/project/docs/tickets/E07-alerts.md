# E07 — Alerts Feed & In-app Notifications (MV-080…MV-087)

### MV-080 Alert feed `/ilmoitukset`

**Goal:** Paginated (50, cursor) newest-first, grouped by date headers (Europe/Helsinki), `AlertItem` (area name, cutting chip, area ha, distance, change type label, "Näytä kartalla"), filter by watch area, unread styling, empty state. **Tests:** integration owner-only; E2E `@smoke` after pipeline run. **Depends on:** MV-072, MV-050

### MV-081 Mark read / mark all read

**Goal:** Server Actions `markAlertRead`, `markAllAlertsRead`; badge in nav updates. **Tests:** integration owner-only; E2E badge count. **Depends on:** MV-080

### MV-082 Alert detail `/ilmoitukset/[id]`

**Goal:** Map zoomed to polygon (+ watch circle), snapshot attributes vs current (shows "Tiedot päivittyneet" if declaration changed since), link to Metsäkeskus map service (URL pattern in `config/wfs.ts`), "Mitä tämä tarkoittaa?" explainer per cutting type, marks read on view. **Tests:** E2E. **Depends on:** MV-080, MV-060

### MV-083 Dashboard "Uusia" badges and status strip wiring

**Goal:** Counts on `/vahtialueet` from unread alerts per area; status strip reads `job_runs` (last successful pipeline, stale warning). **Tests:** integration counts. **Depends on:** MV-066, MV-072

### MV-084 Change-type semantics in UI

**Goal:** Labels/explanations for `new`, `geometry_changed`, `attributes_changed`, `removed` in `fi.ts`; icons; `removed` hidden unless flag. **Tests:** unit. **Depends on:** MV-080

### MV-085 Alert E2E: full loop

**Goal:** `tests/e2e/alert-loop.spec.ts`: login → create area over fixture bbox → trigger `/api/jobs/run` via request context → feed shows alert → email in Mailpit contains link → link opens alert detail. Tag `@smoke`. **Depends on:** MV-075, MV-082

### MV-086 Reacceptance banner

**Goal:** `ReacceptanceBanner` compares user's latest `consent_events` versions to published `legal_documents`; soft banner with "Lue muutokset" + "Hyväksyn"; blocking modal if `requiresReacceptance`. **Tests:** integration: new version → banner data; accept writes event. **Depends on:** MV-036, MV-035, MV-066

### MV-087 Notification badge realtime-ish

**Goal:** Nav badge revalidated via `revalidateTag('alerts:userId')` after pipeline run; no websockets in v1. **Tests:** integration tag invalidation called. **Depends on:** MV-081, MV-074
