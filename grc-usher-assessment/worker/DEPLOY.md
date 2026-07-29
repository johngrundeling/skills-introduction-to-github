# Deploy runbook — grc-usher-staging-worker

Two paths. Both need the real D1 name/id and R2 bucket filled into `wrangler.toml`.

## Path A — wrangler (recommended)
```bash
cd grc-usher-assessment/worker
# 1. fill wrangler.toml placeholders:
wrangler d1 list                 # -> GRC D1 name + id
wrangler r2 bucket list          # -> reports/photos bucket name
# 2. create the isolated table (does NOT touch the live assessment table):
wrangler d1 execute <GRC_D1_NAME> --file=migration.sql
# 3. deploy (uploads worker.js + ../pages/{u1,u2,u3}.html as ASSETS):
wrangler deploy
# 4. verify:
curl -s https://grc-usher-staging-worker.johng-5ff.workers.dev/health
curl -sI https://grc-usher-staging-worker.johng-5ff.workers.dev/u1/TESTID   # 200
```

## Path B — Cloudflare `execute` API tool (in-session)
When the `execute` tool's approval gate is open, the same three steps run via
`cloudflare.request()`:
1. `GET /accounts/{acct}/d1/database` and `/r2/buckets` → fill bindings.
2. `POST /accounts/{acct}/d1/database/{id}/query` with `migration.sql`.
3. `PUT /accounts/{acct}/workers/scripts/grc-usher-staging-worker` (multipart:
   metadata with `assets` + `d1_databases` bindings, script = worker.js), then
   upload the three pages via the assets session.

## Phase 2 — GHL write-back (after pages are live)
```bash
wrangler secret put GHL_API_TOKEN     # LeadConnector private token
wrangler secret put GHL_LOCATION_ID   # POa0egWeYo78ArtCaAi4
```
Then extend `/section-submit` to PATCH the contact's `usher_*` custom fields and
add the completion/role tags (see GHL_SETUP.md).

## QA checklist (staging, before prod promote)
- [ ] `/health` returns `db: ok:*`
- [ ] `/u1/<realContactId>` … `/u3/<id>` load at parity, autosave works
- [ ] Submitting each part writes a row to `usher_submission`
- [ ] (phase 2) `usher_*` fields + tags update on the test contact
- [ ] Reports render with selfie + Part 1 role-lean + Part 3 gift→role map
- [ ] Promote: deploy as `grc-usher-worker`, swap GHL links to prod host
