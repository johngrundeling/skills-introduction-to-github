// GHL (LeadConnector v2) client used by the Fulfillment Agent.
// All identifiers come from env so this can point at the BioKissed SA location without code
// changes:  GHL_API_TOKEN (Private Integration token), GHL_LOCATION_ID, GHL_PIPELINE_ID, GHL_STAGE_ID.
const BASE = "https://services.leadconnectorhq.com";
const HDRS = (token) => ({
  Authorization: `Bearer ${token}`,
  Version: "2021-07-28",
  "Content-Type": "application/json",
  Accept: "application/json",
});

export function ghlConfigured(env) {
  return !!(env.GHL_API_TOKEN && env.GHL_LOCATION_ID);
}

// Create or update the buyer as a GHL contact (dedupe by email/phone). Returns contactId.
export async function upsertContact(env, c) {
  const [firstName, ...rest] = (c.name || "").trim().split(/\s+/);
  const body = {
    locationId: env.GHL_LOCATION_ID,
    name: c.name || undefined,
    firstName: firstName || undefined,
    lastName: rest.join(" ") || undefined,
    email: c.email || undefined,
    phone: c.phone || undefined,
    address1: c.address || undefined,
    city: c.city || undefined,
    country: "ZA",
    source: "BioKissed funnel",
    tags: ["biokissed", "online-order", "paid"],
  };
  const r = await fetch(`${BASE}/contacts/upsert`, {
    method: "POST", headers: HDRS(env.GHL_API_TOKEN), body: JSON.stringify(body),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`GHL contact upsert failed: ${d.message || r.status}`);
  return d.contact?.id || d.id || d.contact?.contactId;
}

// Drop the order onto the contact's activity feed as a note, so it sits in the CRM timeline
// next to all other client communication. Best-effort (never blocks the order).
export async function addContactNote(env, contactId, text) {
  if (!contactId) return;
  const r = await fetch(`${BASE}/contacts/${contactId}/notes`, {
    method: "POST", headers: HDRS(env.GHL_API_TOKEN),
    body: JSON.stringify({ body: text }),
  });
  if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(`GHL note failed: ${d.message || r.status}`); }
}

// Open an opportunity (order) in the BioKissed pipeline, marked won, valued at the order total.
export async function createOpportunity(env, { contactId, name, amount, reference }) {
  const body = {
    locationId: env.GHL_LOCATION_ID,
    pipelineId: env.GHL_PIPELINE_ID,
    pipelineStageId: env.GHL_STAGE_ID || undefined,
    name: name || `Order ${reference}`,
    status: "won",
    monetaryValue: amount,
    contactId,
  };
  const r = await fetch(`${BASE}/opportunities/`, {
    method: "POST", headers: HDRS(env.GHL_API_TOKEN), body: JSON.stringify(body),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`GHL opportunity create failed: ${d.message || r.status}`);
  return d.opportunity?.id || d.id;
}
