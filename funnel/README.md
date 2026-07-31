# BioKissed SA — Shop Funnel (Cloudflare Pages + Paystack)

A self-contained storefront funnel: browse all 62 purchasable products, add to a cart,
choose delivery + optional cold-chain, and pay through **Paystack** — deployed on
**Cloudflare Pages** with **Pages Functions** doing the secure server side.

## How it works

```
Shopper ──> index.html (cart + checkout)
                │  POST /api/pay  { items, customer, delivery, addons }
                ▼
        functions/api/pay.js  ── recomputes the total from the TRUSTED catalog
                │                  (a tampered browser price cannot change the charge)
                │  Paystack "initialize" → authorization_url
                ▼
        Paystack hosted checkout (card + channels you enable)
                │  on success → redirect to /success.html?reference=…
                ▼
        success.html ── GET /api/verify?reference=… ── functions/api/verify.js
                                                        (confirms the payment)

Paystack ──(server-to-server)──> functions/api/paystack-webhook.js
            charge.success, signature-verified = the reliable order record
```

Key security point: **the amount charged is always computed on the server** in
`functions/_catalog.js`, never taken from the browser.

## Files

| Path | Purpose |
|------|---------|
| `index.html` | The shop — cart, checkout form, delivery & cold-chain options. |
| `success.html` | Post-payment confirmation (verifies the reference). |
| `functions/api/pay.js` | Initializes the Paystack transaction (server-computed total). |
| `functions/api/verify.js` | Verifies a transaction after redirect. |
| `functions/api/paystack-webhook.js` | Signature-verified webhook = reliable order record. |
| `functions/_catalog.js` | **Trusted** product/fee prices (generated). |
| `_catalog.json` | Client copy used to render the shop (generated). |
| `build_funnel.py` | Regenerates `index.html`, `_catalog.js`, `_catalog.json` from the master list. |
| `wrangler.toml` | Cloudflare Pages project config. |

## Deploy — Cloudflare Pages connected to this GitHub repo (recommended)

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
2. Pick this repo and the branch (`claude/catalog-product-codes-kkncc3`, or `main` after merge).
3. Build settings:
   - **Framework preset:** None
   - **Build command:** *(leave empty)*
   - **Root directory:** `funnel`
   - **Build output directory:** `.`
4. **Save and Deploy.** Pages auto-detects `functions/` and publishes the site + APIs.
5. Add the secret: project → **Settings → Environment variables** →
   **`PAYSTACK_SECRET_KEY`** = your Paystack **secret** key (`sk_test_…` to start,
   `sk_live_…` when ready). Mark it **encrypted**. Redeploy.

Alternative (CLI): `npx wrangler pages deploy funnel --project-name biokissed-funnel`
then `npx wrangler pages secret put PAYSTACK_SECRET_KEY`.

## Paystack setup

1. Create/log in to your Paystack account and note your **test** keys (Settings → API Keys).
2. Put the **secret** key in Cloudflare as `PAYSTACK_SECRET_KEY` (above). The public key is
   **not needed** here — the funnel uses server-initialized redirect checkout.
3. Enable the payment channels you want (cards, etc.) in the Paystack dashboard.
4. **Webhook:** Paystack → Settings → API Keys & Webhooks → set the webhook URL to
   `https://<your-pages-domain>/api/paystack-webhook`. The handler verifies Paystack's
   `x-paystack-signature` before trusting any event.
5. Test with a Paystack **test card**, confirm the order appears in your Paystack dashboard,
   then swap in the **live** secret key and go live.

## Custom domain

Add your domain (or a subdomain like `shop.biokissedsa.com`) under the Pages project →
**Custom domains**. Update Paystack's callback/webhook to the live domain if you hard-set them.

## Rebuild after catalogue changes

```bash
cd biokissed && python3 build_data.py      # refresh master data
cd ../funnel && python3 build_funnel.py     # regenerates _catalog.js, _catalog.json AND index.html
```
`build_funnel.py` rebuilds the trusted server catalog (`functions/_catalog.js`), the client
catalog (`_catalog.json`), and the shop page from `biokissed/biokissed-products.csv` in one step.

## Notes

- **Out of stock** (Semaglutide 10mg/30mg, SLU-PP-332) are shown as *Sold out* and cannot be
  added. **Bacteriostatic Water** base is **Free**.
- Delivery is required at checkout (Local R145 / National R249); Ice Pack (R35) and Thermal Bag
  (R100) are optional add-ons.
- To email each paid order to BioKissed or store it, extend `paystack-webhook.js` where marked.
