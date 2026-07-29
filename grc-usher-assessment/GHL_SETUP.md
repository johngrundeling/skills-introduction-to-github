# GHL setup — Usher & Catcher (Career Legends / GRC · location POa0egWeYo78ArtCaAi4)

> The GHL API/MCP can add tags and upsert contacts, but **cannot create custom
> fields or workflows programmatically** — those are created once in the GHL UI
> (or via the GHL API with a token). This sheet is the exact spec to enter.

## 1. Custom fields (create under Settings → Custom Fields, group "GRC Usher")

| Field name | Key | Type | Written by |
|---|---|---|---|
| Usher S1 Code | `usher_s1_code` | Text | Part 1 (e.g. `ST-EX`) |
| Usher S1 Primary | `usher_s1_primary` | Text | Part 1 |
| Usher S1 Secondary | `usher_s1_secondary` | Text | Part 1 |
| Usher S2 Score | `usher_s2_score` | Number | Part 2 (0–100) |
| Usher S2 Band | `usher_s2_band` | Text | Part 2 (Ready/Developing/Not-yet) |
| Usher S2 Pastoral Flag | `usher_s2_pastoral_flag` | Checkbox | Part 2 |
| Usher S3 Top Gifts | `usher_s3_top_gifts` | Text | Part 3 |
| Usher Role Fit | `usher_role_fit` | Text | Part 3 (best-fit role) |
| **Usher Selfie URL** | `usher_photo_url` | Text | Registration → R2 |
| Usher Report URL | `usher_report_url` | Text | Report step |
| Usher Pastoral URL | `usher_pastoral_url` | Text | Report step |
| Usher S1 Complete | `usher_s1_complete` | Checkbox | Part 1 |
| Usher S2 Complete | `usher_s2_complete` | Checkbox | Part 2 |
| Usher S3 Complete | `usher_s3_complete` | Checkbox | Part 3 |
| Usher Reports Sent | `usher_reports_sent` | Checkbox | Report step |

## 2. Tags

`usher-registered` · **`usher-selfie-captured`** · `usher-s1-complete` · `usher-s2-complete` ·
`usher-s3-complete` · `usher-role-welcome` · `usher-role-floor` · `usher-role-ministry-support` ·
`usher-role-followup` · `usher-cleared`

## 3. Selfie (must not be missed)

- Captured on the **Usher Registration page** (fork of the DNA registration).
- Stored at R2 **`grc-usher-photos/<contactId>.jpg`**; public URL saved to `usher_photo_url`; tag `usher-selfie-captured` added.
- Carried through to every section by `contactId` (the `GRC_ID` safeguard in u1/u2/u3), and printed on **both** reports.

## 4. Workflow (Automation)

1. **Trigger:** tag `usher-registered` added → **SMS Part 1**.
2. On `usher-s1-complete` → **SMS Part 2**.
3. On `usher-s2-complete` → **SMS Part 3**.
4. On `usher-s3-complete` → generate candidate + pastoral reports, set `usher_reports_sent`, add `usher-cleared` + the matching `usher-role-*` tag, send candidate report to member and pastoral report to the pastoral CC.

## 5. Link framework — the permanent fix for "links don't fire"

Use GHL's **`{{contact.id}}` merge field** in every SMS/workflow step so each link self-populates the correct contact — no hand-built IDs, no mismatches:

```
Part 1:  https://grc-usher-staging-worker.johng-5ff.workers.dev/u1/{{contact.id}}
Part 2:  https://grc-usher-staging-worker.johng-5ff.workers.dev/u2/{{contact.id}}
Part 3:  https://grc-usher-staging-worker.johng-5ff.workers.dev/u3/{{contact.id}}
```

Put the link on its **own line**, plain ASCII. Swap the host to the prod worker on go-live.
