// RECONCILIATION AGENT — scheduled Cloudflare Worker (cron).
// Deployed separately from the Pages funnel (Pages Functions can't run on a schedule).
// Every run it:
//   1. retries GHL sync for any ledger orders with ghl_synced = 0,
//   2. pulls recent Paystack successful charges and back-fills any order the webhook missed.
// Bindings/vars required (wrangler.toml below): DB (D1 = biokissed-orders),
//   PAYSTACK_SECRET_KEY, GHL_API_TOKEN, GHL_LOCATION_ID, GHL_PIPELINE_ID, GHL_STAGE_ID.
const GHL = "https://services.leadconnectorhq.com";
const ghlHdrs = (t) => ({ Authorization: `Bearer ${t}`, Version: "2021-07-28", "Content-Type": "application/json", Accept: "application/json" });

async function upsertContact(env, o) {
  const [firstName, ...rest] = (o.customer_name || "").trim().split(/\s+/);
  const body = { locationId: env.GHL_LOCATION_ID, name: o.customer_name || undefined, firstName: firstName || undefined,
    lastName: rest.join(" ") || undefined, email: o.email || undefined, phone: o.phone || undefined,
    address1: o.address || undefined, city: o.city || undefined, country: "ZA", source: "BioKissed funnel",
    tags: ["biokissed", "online-order", "paid"] };
  const r = await fetch(`${GHL}/contacts/upsert`, { method: "POST", headers: ghlHdrs(env.GHL_API_TOKEN), body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`contact upsert ${r.status}: ${d.message || ""}`);
  return d.contact?.id || d.id;
}
async function createOpportunity(env, o, contactId) {
  const body = { locationId: env.GHL_LOCATION_ID, pipelineId: env.GHL_PIPELINE_ID, pipelineStageId: env.GHL_STAGE_ID || undefined,
    name: `BioKissed order ${o.reference}`, status: "won", monetaryValue: o.amount, contactId };
  const r = await fetch(`${GHL}/opportunities/`, { method: "POST", headers: ghlHdrs(env.GHL_API_TOKEN), body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`opportunity ${r.status}: ${d.message || ""}`);
  return d.opportunity?.id || d.id;
}

async function retryUnsynced(env) {
  if (!env.DB || !env.GHL_API_TOKEN || !env.GHL_LOCATION_ID) return { attempted: 0, fixed: 0 };
  const { results = [] } = await env.DB.prepare(
    "SELECT reference,amount,email,customer_name,phone,address,city FROM orders WHERE ghl_synced = 0 AND status = 'success' LIMIT 50").all();
  let fixed = 0;
  for (const o of results) {
    try {
      const cid = await upsertContact(env, o);
      const oid = await createOpportunity(env, o, cid);
      await env.DB.prepare("UPDATE orders SET ghl_contact_id=?, ghl_opportunity_id=?, ghl_synced=1 WHERE reference=?")
        .bind(cid || null, oid || null, o.reference).run();
      fixed++;
    } catch (e) { console.log("reconcile retry failed", o.reference, e.message); }
  }
  return { attempted: results.length, fixed };
}

async function backfillFromPaystack(env) {
  if (!env.DB || !env.PAYSTACK_SECRET_KEY) return { checked: 0, inserted: 0 };
  const r = await fetch("https://api.paystack.co/transaction?status=success&perPage=50",
    { headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}` } });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.status) return { checked: 0, inserted: 0 };
  let inserted = 0;
  for (const t of d.data || []) {
    const m = t.metadata || {};
    const res = await env.DB.prepare(
      `INSERT INTO orders (reference,status,amount,currency,email,customer_name,phone,address,city,items_json,paid_at,ghl_synced)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,0) ON CONFLICT(reference) DO NOTHING`)
      .bind(t.reference, t.status, (t.amount || 0) / 100, t.currency || "ZAR", t.customer?.email || "",
            m.customer_name || "", m.phone || "", m.address || "", m.city || "", JSON.stringify(m.cart || []),
            t.paid_at || t.created_at || null).run().catch(() => ({ meta: { changes: 0 } }));
    if (res?.meta?.changes) inserted++;
  }
  return { checked: (d.data || []).length, inserted };
}

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil((async () => {
      const back = await backfillFromPaystack(env);   // catch any webhook the funnel missed
      const sync = await retryUnsynced(env);          // then push everything unsynced to GHL
      console.log("reconcile", JSON.stringify({ ...back, ...sync }));
    })());
  },
  // manual trigger for testing: GET the worker URL
  async fetch(request, env) {
    const back = await backfillFromPaystack(env);
    const sync = await retryUnsynced(env);
    return new Response(JSON.stringify({ ...back, ...sync }, null, 2), { headers: { "content-type": "application/json" } });
  },
};
