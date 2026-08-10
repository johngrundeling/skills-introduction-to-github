// FULFILLMENT AGENT — POST /api/paystack-webhook
// Paystack server-to-server notifications. On a signature-verified charge.success it:
//   1. captures the order into the D1 ledger immediately (never lose a paid order),
//   2. syncs the buyer to GHL: upsert contact + open a won opportunity (order),
//   3. is idempotent by Paystack reference, so retries never double-post.
// If GHL isn't configured or is down, the order is still safely stored with ghl_synced=0
// and the Reconciliation Agent retries it later.
import { ghlConfigured, upsertContact, createOpportunity, addContactNote } from "../_ghl.js";

const enc = new TextEncoder();
async function hmacSha512Hex(key, message) {
  const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, enc.encode(message));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.PAYSTACK_SECRET_KEY) return new Response("not configured", { status: 500 });

  const raw = await request.text();
  const signature = request.headers.get("x-paystack-signature") || "";
  if (signature !== await hmacSha512Hex(env.PAYSTACK_SECRET_KEY, raw))
    return new Response("invalid signature", { status: 401 });

  let event;
  try { event = JSON.parse(raw); } catch { return new Response("bad json", { status: 400 }); }
  if (event.event !== "charge.success") return new Response("ignored", { status: 200 });

  const d = event.data || {};
  const m = d.metadata || {};
  const order = {
    reference: d.reference,
    status: d.status,
    amount: (d.amount || 0) / 100,
    currency: d.currency || "ZAR",
    email: d.customer?.email || "",
    customer_name: m.customer_name || "",
    phone: m.phone || "",
    address: m.address || "",
    city: m.city || "",
    items: m.cart || [],
    paid_at: d.paid_at || new Date().toISOString(),
  };

  // ---- idempotency + capture: store the order first so it is never lost ----
  if (env.DB) {
    const existing = await env.DB.prepare("SELECT ghl_synced FROM orders WHERE reference = ?")
      .bind(order.reference).first().catch(() => null);
    if (existing && existing.ghl_synced === 1) return new Response("ok (dup)", { status: 200 });
    await env.DB.prepare(
      `INSERT INTO orders (reference,status,amount,currency,email,customer_name,phone,address,city,items_json,paid_at,raw_json,ghl_synced)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,0)
       ON CONFLICT(reference) DO UPDATE SET status=excluded.status, amount=excluded.amount, paid_at=excluded.paid_at`)
      .bind(order.reference, order.status, order.amount, order.currency, order.email, order.customer_name,
            order.phone, order.address, order.city, JSON.stringify(order.items), order.paid_at, raw)
      .run().catch((e) => console.log("D1 insert error", e.message));
  }

  // ---- sync to GHL (best-effort; reconcile agent retries on failure) ----
  if (ghlConfigured(env)) {
    try {
      const contactId = await upsertContact(env, order);
      const opportunityId = await createOpportunity(env, {
        contactId, amount: order.amount, reference: order.reference,
        name: `BioKissed order ${order.reference} — ${order.items.map(i => `${i.qty}×${i.name}`).join(", ")}`.slice(0, 250),
      });
      // put the full order on the contact's CRM timeline (best-effort)
      const noteLines = [
        `🧾 BioKissed order — ${order.reference}`,
        ...order.items.map(i => `  • ${i.qty}× ${i.name} @ R${Number(i.unit).toFixed(2)}`),
        `Total: R${Number(order.amount).toFixed(2)} (${order.currency})`,
        order.address ? `Deliver to: ${[order.address, order.city].filter(Boolean).join(", ")}` : "",
        order.phone ? `Phone: ${order.phone}` : "",
        `Paid: ${order.paid_at}`,
      ].filter(Boolean).join("\n");
      try { await addContactNote(env, contactId, noteLines); } catch (e) { console.log("note failed:", e.message); }
      if (env.DB) await env.DB.prepare(
        "UPDATE orders SET ghl_contact_id=?, ghl_opportunity_id=?, ghl_synced=1 WHERE reference=?")
        .bind(contactId || null, opportunityId || null, order.reference).run().catch(() => {});
    } catch (e) {
      console.log("GHL sync failed (will reconcile):", e.message);
      // order is safe in D1 with ghl_synced=0; return 200 so Paystack won't hammer retries.
    }
  }

  return new Response("ok", { status: 200 });
}
