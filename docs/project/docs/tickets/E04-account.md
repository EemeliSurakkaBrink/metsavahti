# E04 — Account & Settings (MV-050…MV-057)

### MV-050 App layout: sidebar / bottom tabs
**Goal:** `(app)` layout with desktop sidebar (Vahtialueet, Ilmoitukset, Tili) and mobile bottom tab bar; account menu; unread alert badge (count from `alerts.readAt IS NULL`). **Tests:** unit render at two viewports; E2E nav on Mobile Chrome. **Depends on:** MV-046, MV-034

### MV-051 Profile page `/tili`
**Goal:** Name, locale, timezone edits (Server Action `updateProfile`); email shows current + "Vaihda" starting change flow (MV-052). **Tests:** integration owner-only; E2E edit name. **Depends on:** MV-050, MV-047

### MV-052 Email change flow
**Goal:** `pendingEmail` + signed token (`jose`, 1 h); `ChangeEmailConfirm` email to new address; notice to old; `/vaihda-sahkoposti/vahvista?token=` applies change and re-marks verified. **Tests:** integration: token reuse rejected; E2E via Mailpit. **Depends on:** MV-051, MV-040

### MV-053 Security page `/tili/turvallisuus`
**Goal:** Change password (current required; invalidates other sessions), sessions list (device/UA, created, last seen, current flag), "Kirjaa ulos muista laitteista". **Tests:** integration: other session invalid after password change; E2E. **Depends on:** MV-050, MV-044

### MV-054 Notification settings `/tili/ilmoitukset`
**Goal:** Global enabled toggle, mode radio (immediate/daily/weekly), per-watch-area override table (reads watch areas; if none, empty state), marketing consent toggle writing `consent_events`, "Lähetä testisähköposti" (rate-limited 3/h) sending a sample `AlertImmediate` with fixture data. **Tests:** integration: consent event written with `granted=false` on untick; E2E test email arrives in Mailpit. **Depends on:** MV-050, MV-035, MV-040

### MV-055 Unsubscribe endpoint
**Goal:** `GET /api/notifications/unsubscribe?token=` (signed, purpose `unsub`, watchAreaId, 30 d) → sets `notificationsEnabled=false`, renders confirmation page with login link; token single-use recorded in `notification_log` or a small table. **Tests:** integration: valid → disabled; tampered → 400. **Depends on:** MV-032, MV-047

### MV-056 Privacy page `/tili/tietosuoja` (UI only)
**Goal:** Consent history table from `consent_events`, cookie-settings button, export section wired to MV-093 (shows disabled state until implemented behind flag), links to policy + supervisory authority. **Tests:** E2E renders history. **Depends on:** MV-050, MV-035

### MV-057 Delete account page `/tili/poista` (UI only)
**Goal:** Explanation from `retention.ts`, `POISTA` + password confirmation form calling `POST /api/account/delete` (endpoint from MV-094; until then returns 501 behind flag), `/tili-poistettu` public page. **Tests:** unit form validation; E2E page renders and validates. **Depends on:** MV-050
