# BioKissed Funnel — Go-Live Runbook (click-by-click)

Do the steps in order. Values you'll paste are listed in **§0**. Anything marked 🔒 is a secret
(mark it "Encrypt" in Cloudflare; never share it in plain text).

## 0. Values you'll need

| Key | Value | Secret? |
|-----|-------|---------|
| `PAYSTACK_SECRET_KEY` | your Paystack `sk_test_…` (then `sk_live_…`) | 🔒 |
| `GHL_API_TOKEN` | your BioKissed Private Integration token | 🔒 |
| `GHL_LOCATION_ID` | `fktk4QrXVBq8Y3MojJRz` | no |
| `GHL_PIPELINE_ID` | `0Ntnfu1vMFOriKKV9tr3` | no |
| `GHL_STAGE_ID` | `dea558df-5a9c-483a-b7b1-5156be62a70a` | no |
| D1 database | `biokissed-orders` (id `a02ffd09-0bca-4787-ab7d-1219a7b6c5d8`) | no |
| KV namespace | `biokissed-funnel` (id `74d5ca6b2b5842528c696302ad6ff63a`) | no |
| Repo | `johngrundeling/skills-introduction-to-github` | no |
| Branch | `claude/catalog-product-codes-kkncc3` | no |
| Chosen domain | `shop.biokissedsa.com` (suggestion) | no |

---

## 1. Deploy the Cloudflare Pages project

1. Go to **dash.cloudflare.com** → left sidebar **Workers & Pages**.
2. **Create** → **Pages** tab → **Connect to Git**.
3. **Connect GitHub** (authorize if asked) → pick repo **`skills-introduction-to-github`** → **Begin setup**.
4. **Project name:** `biokissed-funnel`.
5. **Production branch:** `claude/catalog-product-codes-kkncc3` (switch to `main` after the PR merges).
6. Expand **Build settings**:
   - **Framework preset:** `None`
   - **Build command:** *(leave empty)*
   - **Build output directory:** `.`
   - **Root directory (advanced):** `funnel`
7. **Save and Deploy.** Wait for "Success". You now have a live URL like `biokissed-funnel.pages.dev`.

## 2. Bind the database + KV (order ledger)

1. Open the project → **Settings** → **Functions** (newer UI: **Bindings**).
2. **D1 database bindings → Add**: Variable name **`DB`** → database **`biokissed-orders`** → Save.
3. **KV namespace bindings → Add**: Variable name **`KV`** → namespace **`biokissed-funnel`** → Save.

## 3. Environment variables & secrets

1. Project → **Settings** → **Environment variables** → **Production** → **Add variable** for each:
   - `PAYSTACK_SECRET_KEY` = your `sk_…` → click **Encrypt** 🔒
   - `GHL_API_TOKEN` = your token → **Encrypt** 🔒
   - `GHL_LOCATION_ID` = `fktk4QrXVBq8Y3MojJRz`
   - `GHL_PIPELINE_ID` = `0Ntnfu1vMFOriKKV9tr3`
   - `GHL_STAGE_ID` = `dea558df-5a9c-483a-b7b1-5156be62a70a`
2. **Save**, then **Deployments → ⋯ on the latest → Retry deployment** so the values load.

## 4. Custom domain

1. Project → **Custom domains** → **Set up a custom domain**.
2. Enter **`shop.biokissedsa.com`** → **Continue** → **Activate domain**.
3. DNS:
   - If **biokissedsa.com is on Cloudflare DNS**, the record is added automatically — wait for **Active**.
   - If DNS is **elsewhere**, add a **CNAME**: name `shop`, target `biokissed-funnel.pages.dev`, then return and wait for **Active** (SSL is automatic).

## 5. Paystack webhook

1. **Paystack dashboard** → **Settings** → **API Keys & Webhooks**.
2. **Webhook URL** = `https://shop.biokissedsa.com/api/paystack-webhook` → **Save**.

## 6. Apple Pay

1. **Paystack** → **Settings** → **Preferences** → **Apple Pay** (enable it / "Add domain" — contact Paystack support to switch it on if the section isn't visible).
2. Add domain **`shop.biokissedsa.com`** → **download the domain-association file** Paystack gives you.
3. Put that file into the site: open
   `funnel/.well-known/apple-developer-merchantid-domain-association` in the repo, **replace the
   whole file** with Paystack's contents, commit & push (Pages redeploys automatically).
   *(Or send me the file contents — it isn't secret — and I'll commit it for you.)*
4. Back in Paystack → **Verify** the domain. Once verified, Apple Pay shows automatically on
   **Safari (iPhone/iPad/Mac)** inside the checkout popup.

## 7. (Recommended) Deploy the Reconciliation Agent

Runs every 30 min to catch missed webhooks and retry GHL sync. Needs the wrangler CLI once:
```
cd funnel/agents
npx wrangler login
npx wrangler deploy
npx wrangler secret put PAYSTACK_SECRET_KEY
npx wrangler secret put GHL_API_TOKEN
```
(The GHL location/pipeline/stage vars are already in `funnel/agents/wrangler.toml`.)

## 8. Test end-to-end (test mode)

1. Visit `https://shop.biokissedsa.com`, add a product, **Checkout**, **Pay with Paystack**.
2. Use a Paystack **test card**: `4084 0840 8408 4081`, expiry any future date, CVV `408`,
   PIN `0000`, OTP `123456`.
3. Expect: success page → order in the **D1 ledger** → **Won opportunity** in the BioKissed pipeline.
   - Inspect ledger: `npx wrangler d1 execute biokissed-orders --command "SELECT reference,amount,email,ghl_synced FROM orders ORDER BY created_at DESC LIMIT 5"`
4. On an iPhone/Mac in Safari, confirm the **Apple Pay** button appears.

## 9. Go live

1. Swap `PAYSTACK_SECRET_KEY` to the **`sk_live_…`** key (Cloudflare → Environment variables → edit → Encrypt) → redeploy.
2. Confirm the Paystack account is in **Live** mode and Apple Pay domain is **verified**.
3. Place one small real order to confirm, then you're open.
