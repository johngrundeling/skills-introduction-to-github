# GRC Usher & Catcher — Serve Readiness Profile (build in progress)

A course-specific, reduced fork of the GRC DNA assessment, built for the
**Usher & Catcher training** (and reusable for helper schools). Kept separate
from the live GRC DNA engine.

## Status (as of pause for 3:20 PM resume)

Three question banks are **drafted and signed off** by John:

| Part | File | Items | Status |
|------|------|-------|--------|
| 1 · Servant Heart Profile | `usher_part1_servant_heart.json` | 32 (8×4 temperament) | ✅ signed off |
| 2 · Serve-Ready Check | `usher_part2_serve_ready.json` | 30 (6 domains × 5) | ✅ signed off |
| 3 · Ministry Fit & Gifting | `usher_part3_ministry_fit.json` | 12 gifts, dual-axis | ✅ signed off |

## Confirmed decisions

- **Separate Cloudflare worker** (`grc-usher-staging-worker` → `grc-usher-worker`), not an extension of the DNA worker.
- Section names locked: *Servant Heart Profile / Serve-Ready Check / Ministry Fit & Gifting*.
- Counts locked: S1 = 32, S2 = 30, S3 = 12 gifts.
- **Reuse existing D1** with a `course = 'usher'` discriminator; reuse R2 with prefixes `grc-usher-reports/` and `grc-usher-participant/`.
- Faithful to the live engine: same formats, scales and scoring logic as DNA S1/S2/S3, just reduced.
- **Both reports** (candidate + pastoral) must surface the Part 1 temperament role-lean AND the Part 3 gift → usher-role map (Welcome / Floor-Head / Ministry Support-Catcher-Safety / Follow-Up).
- Staging first, QA end-to-end, then promote to prod.

## Next phase (build — resume 3:20 PM SAST)

1. Stand up `grc-usher-staging-worker` (D1 discriminator + R2 prefixes).
2. Build `u1`/`u2`/`u3` assessment pages from the JSON banks (brand-matched, mobile-first, autosave).
3. Build candidate + pastoral report templates (role-lean + gift→role map required).
4. GHL: `usher_*` custom fields, `usher-*` tags, workflow with **`{{contact.id}}` self-populating links**
   (`/u1/{{contact.id}}`, `/u2/{{contact.id}}`, `/u3/{{contact.id}}`) — the permanent fix for the
   mis-mapped-link problem from the DNA batch.
5. QA on staging with a test contact → promote to `grc-usher-worker` (prod).

Delegate mechanical build steps to subagents at an appropriate model level to conserve tokens.
