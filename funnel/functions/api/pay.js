// POST /api/pay — initialize a Paystack transaction.
// The amount is computed HERE from the trusted server catalog, never from the browser,
// so a tampered client price can't change what is charged.
import { CATALOG } from "../_catalog.js";

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.PAYSTACK_SECRET_KEY) return json({ error: "Payment not configured (missing PAYSTACK_SECRET_KEY)." }, 500);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid request." }, 400); }

  const { items = [], customer = {}, delivery = null, addons = [] } = body;
  const email = (customer.email || "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "A valid email address is required." }, 400);
  if (!Array.isArray(items) || items.length === 0) return json({ error: "Your cart is empty." }, 400);

  // ---- compute the authoritative total from the trusted catalog ----
  let amount = 0;
  const lines = [];
  for (const it of items) {
    const sku = String(it.sku || "");
    const qty = Math.max(1, Math.min(99, parseInt(it.qty, 10) || 0));
    const p = CATALOG.products[sku];
    if (!p) return json({ error: `Unknown product: ${sku}` }, 400);
    if (CATALOG.oos.includes(sku) || p.price <= 0) return json({ error: `${p.name} is not available for purchase.` }, 400);
    amount += p.price * qty;
    lines.push({ sku, name: p.name, qty, unit: p.price });
  }
  // delivery (required) + optional cold-chain add-ons, priced from the same trusted catalog
  if (delivery) {
    const d = CATALOG.fees[delivery];
    if (!d) return json({ error: "Invalid delivery option." }, 400);
    amount += d.price; lines.push({ sku: delivery, name: d.name, qty: 1, unit: d.price });
  }
  for (const a of addons) {
    const f = CATALOG.fees[a];
    if (f) { amount += f.price; lines.push({ sku: a, name: f.name, qty: 1, unit: f.price }); }
  }
  amount = Math.round(amount * 100) / 100;
  if (amount <= 0) return json({ error: "Order total must be greater than zero." }, 400);

  const origin = new URL(request.url).origin;
  // channels: leave unset so Paystack shows every enabled channel (card, EFT, Capitec Pay,
  // Apple Pay …). Set PAYSTACK_CHANNELS="card,eft,apple_pay" to restrict.
  const channels = (env.PAYSTACK_CHANNELS || "").split(",").map(s => s.trim()).filter(Boolean);
  const payload = {
    email,
    amount: Math.round(amount * 100),            // ZAR -> kobo/cents (Paystack subunit)
    currency: CATALOG.currency,                   // ZAR
    callback_url: `${origin}/success.html`,
    ...(channels.length ? { channels } : {}),
    metadata: {
      customer_name: customer.name || "",
      phone: customer.phone || "",
      address: customer.address || "",
      city: customer.city || "",
      cart: lines,
      custom_fields: [
        { display_name: "Customer", variable_name: "customer_name", value: customer.name || "" },
        { display_name: "Phone", variable_name: "phone", value: customer.phone || "" },
        { display_name: "Delivery address", variable_name: "address",
          value: [customer.address, customer.city].filter(Boolean).join(", ") },
        { display_name: "Items", variable_name: "items",
          value: lines.map(l => `${l.qty}× ${l.name}`).join(", ") },
      ],
    },
  };

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`, "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.status) return json({ error: data.message || "Could not start payment." }, 502);

  return json({
    authorization_url: data.data.authorization_url,   // fallback: full-page redirect
    access_code: data.data.access_code,               // preferred: on-site popup (inline-js)
    reference: data.data.reference,
    amount,
  });
}
