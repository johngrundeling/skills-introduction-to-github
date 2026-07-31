# BioKissed SA — Payment ⇄ GHL Agents (Cloudflare)

Automation between the funnel, **Paystack**, and **GoHighLevel**. Built and staged; the code
is complete and the data stores exist. Two things gate go-live (below).

## The agents

| Agent | Where it runs | What it does |
|-------|---------------|--------------|
| **Fulfillment Agent** | Pages Function `functions/api/paystack-webhook.js` | On signature-verified `charge.success`: writes the order to the D1 ledger, then upserts the buyer as a GHL **contact** and opens a **won opportunity** (order) valued at the total. Idempotent by Paystack reference. |
| **Order Ledger** | Cloudflare **D1** `biokissed-orders` | Durable record of every paid order (`orders` table). An order is stored *before* the GHL call, so it can never be lost. |
| **Reconciliation Agent** | Standalone Worker `agents/reconcile.worker.js` (cron every 30 min) | Back-fills any charge the webhook missed (pulls Paystack successes) and retries GHL sync for any `ghl_synced = 0` rows. |

Design principle: **capture first, sync second.** Money events are recorded in D1 immediately;
GHL sync is best-effort and self-healing via the reconciliation agent.

## Cloudflare resources already created (this account)

| Resource | Name | ID |
|----------|------|----|
| D1 database | `biokissed-orders` | `a02ffd09-0bca-4787-ab7d-1219a7b6c5d8` |
| KV namespace | `biokissed-funnel` | `74d5ca6b2b5842528c696302ad6ff63a` |

Schema in `schema.sql` (already applied). Nothing touches the existing `grc-*` workers/stores.

## Configuration (secrets + vars)

Set on the **Pages** project (Fulfillment Agent) and on the **reconcile Worker**:

| Name | Type | Value |
|------|------|-------|
| `PAYSTACK_SECRET_KEY` | secret | Paystack `sk_test_…` → `sk_live_…` |
| `GHL_API_TOKEN` | secret | GHL **Private Integration token** for the **BioKissed SA** location |
| `GHL_LOCATION_ID` | var | `fktk4QrXVBq8Y3MojJRz` (BioKissed SA) |
| `GHL_PIPELINE_ID` | var | `0Ntnfu1vMFOriKKV9tr3` ("BioKissed SA - Sales Pipeline") |
| `GHL_STAGE_ID` | var | `dea558df-5a9c-483a-b7b1-5156be62a70a` (stage "Won") |

> Non-secret IDs above are confirmed live from the BioKissed SA location. Only
> `GHL_API_TOKEN` (a Private Integration token) is still needed — create it in
> GHL → Settings → Private Integrations, scoped to contacts + opportunities.

### Why the funnel isn't built *inside* GHL
GHL's API exposes no funnel/page-builder endpoint (funnels are UI-only), and a GHL-native
funnel would use GHL's own checkout (Stripe/NMI) rather than Paystack. The Cloudflare funnel
is therefore the storefront; it links into GHL through the Fulfillment Agent above, which
drops every paid order into the BioKissed pipeline as a **Won** opportunity.

## Two blockers before go-live

1. **Worker/Pages deployment isn't possible through my current Cloudflare access** (it can read
   Workers and create storage, but not deploy). Deploy happens via the **Git-connected Pages
   project** (funnel) and `wrangler deploy` (reconcile worker) — see `README.md`.
2. **The GHL connector available to me is authorized to "Career Legends", not "BioKissed SA".**
   The agents are parameterized by `GHL_LOCATION_ID` / `GHL_API_TOKEN`, so nothing is hard-wired
   to the wrong business — but the **BioKissed** Private Integration token + location id must be
   supplied before the GHL side will post to the right place.

## Activation checklist

- [ ] Base/tax account finalized (your side).
- [ ] Pages project connected to this repo (root `funnel`), `PAYSTACK_SECRET_KEY` set.
- [ ] BioKissed GHL Private Integration token + location/pipeline/stage ids supplied → set as
      env on Pages **and** on the reconcile worker.
- [ ] Bind D1 `biokissed-orders` + KV `biokissed-funnel` to the Pages project
      (dashboard → Settings → Functions → bindings; ids above — `wrangler.toml` already lists them).
- [ ] Paystack webhook → `https://<pages-domain>/api/paystack-webhook`.
- [ ] Deploy reconcile worker: `cd funnel/agents && npx wrangler deploy` (+ its secrets/vars).
- [ ] Test: pay with a Paystack test card → order appears in D1 and as a GHL contact + opportunity.

## Inspecting the ledger

```
npx wrangler d1 execute biokissed-orders --command "SELECT reference,amount,email,ghl_synced,paid_at FROM orders ORDER BY created_at DESC LIMIT 20"
```
