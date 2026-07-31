// POST /api/paystack-webhook — Paystack server-to-server notifications.
// Verifies the x-paystack-signature (HMAC-SHA512 of the raw body with your secret key)
// before trusting the event. On charge.success the order is confirmed & paid.
//
// This is the RELIABLE record of an order (a customer may close the tab before the
// browser redirect). Right now it just acknowledges + logs; wire email / storage where marked.
const enc = new TextEncoder();

async function hmacSha512Hex(key, message) {
  const cryptoKey = await crypto.subtle.importKey(
    "raw", enc.encode(key), { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.PAYSTACK_SECRET_KEY) return new Response("not configured", { status: 500 });

  const raw = await request.text();
  const signature = request.headers.get("x-paystack-signature") || "";
  const expected = await hmacSha512Hex(env.PAYSTACK_SECRET_KEY, raw);
  if (signature !== expected) return new Response("invalid signature", { status: 401 });

  let event;
  try { event = JSON.parse(raw); } catch { return new Response("bad json", { status: 400 }); }

  if (event.event === "charge.success") {
    const d = event.data || {};
    const order = {
      reference: d.reference,
      amount: (d.amount || 0) / 100,
      currency: d.currency,
      email: d.customer?.email,
      customer_name: d.metadata?.customer_name,
      phone: d.metadata?.phone,
      address: d.metadata?.address,
      city: d.metadata?.city,
      items: d.metadata?.cart || [],
      paid_at: d.paid_at,
    };
    // TODO(optional): email this order to BioKissed and/or store it in KV/D1.
    console.log("PAID ORDER", JSON.stringify(order));
  }
  return new Response("ok", { status: 200 });
}
