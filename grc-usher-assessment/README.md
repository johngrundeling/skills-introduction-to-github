# GRC Usher & Catcher — Serve Readiness Profile

A course-specific, reduced fork of the GRC DNA assessment for the **Usher &
Catcher training** (reusable for helper schools). Built as a **separate**
system so the live GRC DNA engine and the shared grc-pdf-generator are never
touched.

---

## ▶ STATUS — DEPLOYED TO STAGING & QA-PASSED

`grc-usher-staging-worker` is **live** at `https://grc-usher-staging-worker.johng-5ff.workers.dev`
(D1 `grc-dna-staging` / isolated `usher_submission` table, R2 `grc-dna-staging`).
QA passed: short-link 302, u1/u2/u3 served, `/section-submit`→D1, combined
`/report/<cid>` renders, `/pastoral/<cid>?token=` gated. Test rows cleaned.

**Remaining to go fully live:**
1. GHL config from `GHL_Usher_Config_Guide.docx` (fields, tags, workflow, registration form).
2. Worker secrets: `GHL_API_TOKEN`, `GHL_LOCATION_ID`, `PASTORAL_TOKEN`; and set `HOME_URL`.
3. Promote to prod (`grc-usher-worker`) and swap GHL links to the prod host.

### Built & signed off
- **Question banks** (signed off): `usher_part1_servant_heart.json` (32), `usher_part2_serve_ready.json` (30), `usher_part3_ministry_fit.json` (12 gifts).
- **Assessment pages** on the real GRC DNA design system (Montserrat, teal, trait colours) + `GRC_ID` identity safeguard: `pages/u1.html`, `pages/u2.html`, `pages/u3.html`.
- **Registration + selfie** page: `pages/register.html` (live camera capture + file fallback).
- **Reports**: `reports/candidate_report.html`, `reports/pastoral_report.html` (both carry selfie + Part 1 role-lean + Part 3 gift→role map).
- **Worker**: `worker/worker.js` — serves pages, `/register`, `/section-submit`, `/report/<cid>`, `/pastoral/<cid>?token=`, `/health`. Plus `wrangler.toml`, `migration.sql`, `DEPLOY.md`.
- **GHL**: `GHL_SETUP.md` and the Word guide `GHL_Usher_Config_Guide.docx`.

### The ONE decision that unblocks go-live (deploy — step 6)
Pick a route for `grc-usher-staging-worker`:
1. **Allow the Cloudflare `execute` tool in the Claude client** → Claude deploys + runs `migration.sql` + verifies `/health` and the links. (Every `execute` call is currently auto-declined — that's the only blocker.)
2. Paste a **scoped Cloudflare API token** (Workers/D1/R2 edit) → deploy via `npx wrangler`.
3. Run the 3 commands in `worker/DEPLOY.md` yourself.

### Then (config John will do from the Word guide)
- Create `usher_*` custom fields + `usher-*` tags in GHL; build the workflow with `{{contact.id}}` links.
- Set `HOME_URL` (GHL usher-home page) in `wrangler.toml`.
- Set worker secrets: `GHL_API_TOKEN`, `GHL_LOCATION_ID` (POa0egWeYo78ArtCaAi4), `PASTORAL_TOKEN`.
- Then: QA on staging with a test contact → promote to `grc-usher-worker` (prod) → swap GHL links to the prod host.

### Confirmed decisions
Separate worker · S1=32 / S2=30 / S3=12 gifts · reuse existing D1 (isolated `usher_submission` table) + R2 (`grc-usher-photos/`, report prefixes) · faithful to the live engine, reduced · selfie captured at registration and shown on both reports · staging → QA → prod.
