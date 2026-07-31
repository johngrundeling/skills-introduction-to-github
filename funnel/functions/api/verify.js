// GET /api/verify?reference=... — confirm a Paystack transaction after the customer returns.
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!env.PAYSTACK_SECRET_KEY) return json({ error: "Payment not configured." }, 500);

  const reference = new URL(request.url).searchParams.get("reference");
  if (!reference) return json({ error: "Missing reference." }, 400);

  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.status) return json({ error: data.message || "Could not verify payment." }, 502);

  const d = data.data;
  return json({
    paid: d.status === "success",
    status: d.status,
    reference: d.reference,
    amount: (d.amount || 0) / 100,
    currency: d.currency,
    customer: d.customer?.email || "",
    items: d.metadata?.cart || [],
  });
}
