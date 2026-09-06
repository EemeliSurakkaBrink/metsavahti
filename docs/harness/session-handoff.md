# Session handoff

Compact handoff for the next session. Fill it in at clock-out when the session was long or
touched several areas; for a short single-feature session the `PROGRESS.md` entry is enough.
Copy the template below into the top of this file (newest first) and fill every line.

---

## Template

### Handoff — YYYY-MM-DD · feature F-NNN

#### Verified now

- What is currently working:
- What verification actually ran (commands + result):

#### Changed this session

- Code or behaviour added:
- Infrastructure or harness changes:

#### Broken or unverified

- Known defect:
- Unverified path:
- Risk for the next session:

#### Next best step

- Highest-priority unfinished feature:
- Why it is next:
- What counts as passing (from `feature_list.json` → `verification`):
- What must not change during that step:

#### Commands

- Startup: `./init.sh` (add `RUN_START_COMMAND=1` to start `pnpm db:up && pnpm dev`)
- Verification: `pnpm check` (L1) · `pnpm test:integration` (L2) · `pnpm test:e2e` (L3)
- Focused debug command: `pnpm test:watch` · `pnpm test:e2e:ui` · `pnpm jobs:run`
