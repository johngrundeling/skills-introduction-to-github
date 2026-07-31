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

> You are using the **Workers** "deploy from Git" flow (it runs `npx wrangler deploy`). The repo
> is now set up for exactly that — a Worker named `biokissed-funnel-r1` that serves the shop and
> runs the payment API. The database/KV bindings and the non-secret GHL IDs are already in
> `funnel/wrangler.toml`, so they deploy automatically. You only fix a few build fields and add
> **two** secrets.

## 1. Fix the build settings on your `biokissed-funnel-r1` project

Open the project → the failing build → **Build settings** (pencil/Edit), and set:
- **Git branch / Production branch:** `claude/catalog-product-codes-kkncc3`
  *(the `funnel` folder only exists on this branch until the PR is merged to `main`)*
- **Build command:** *(empty — delete the branch name that's in there)*
- **Deploy command:** `npx wrangler deploy`
- **Root directory:** `funnel`   *(NOT `/shop.biokissedsa.com` — that's what caused "root directory not found")*

**Save**, then **Retry build**. It should now Clone → Build → Deploy successfully.

## 2. Database / KV — nothing to do

`funnel/wrangler.toml` already binds **DB → biokissed-orders** and **KV → biokissed-funnel**, and
sets the GHL location/pipeline/stage. They apply on deploy automatically.

## 3. Add the two secrets

Project → **Settings** → **Variables and Secrets** → **Add**:
- `PAYSTACK_SECRET_KEY` = your `sk_test_…` → type **Secret** (encrypted) 🔒
- `GHL_API_TOKEN` = your BioKissed Private Integration token → type **Secret** 🔒

**Save**, then **Retry build / Deploy** once more so the secrets are included.

## 4. Custom domain

1. Open the Worker → **Settings** → **Domains & Routes** → **Add** → **Custom domain**.
2. Enter **`shop.biokissedsa.com`** → **Add domain**.
3. If **biokissedsa.com is on Cloudflare DNS** the record is created automatically — wait for **Active**.
   If DNS is elsewhere, add the CNAME Cloudflare shows you at your DNS host, then wait for **Active**
   (SSL is automatic). Your funnel is then live at `https://shop.biokissedsa.com`.

## 5. Paystack webhook

1. **Paystack dashboard** → **Settings** → **API Keys & Webhooks**.
2. **Webhook URL** = `https://shop.biokissedsa.com/api/paystack-webhook` → **Save**.

## 6. Apple Pay

1. **Paystack** → **Settings** → **Preferences** → **Apple Pay** (enable it / "Add domain" — contact Paystack support to switch it on if the section isn't visible).
2. Add domain **`shop.biokissedsa.com`** → **download the domain-association file** Paystack gives you.
3. Put that file into the site: open
   `funnel/public/.well-known/apple-developer-merchantid-domain-association` in the repo, **replace the
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
