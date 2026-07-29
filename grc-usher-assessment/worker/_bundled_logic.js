// Bundled worker logic — pages are injected as a global `const PAGES = {...}`
// (filename -> HTML string) prepended at build time. Same routes as worker.js
// but self-contained (no ASSETS binding), so it deploys as a single module.
const SECTIONS = { u1: "u1.html", u2: "u2.html", u3: "u3.html" };
const ROLE_LEAN = { EX: "Welcome Usher", DR: "Floor / Head-Usher track", DE: "Ministry Support / Safety", ST: "Ministry Support (Catcher) & Follow-Up" };
const ROLE_TAG = { "Welcome Usher": "usher-role-welcome", "Floor / Head-Usher track": "usher-role-floor", "Ministry Support (Catcher) / Safety": "usher-role-ministry-support", "Follow-Up Usher": "usher-role-followup", "Undergirding support (any role)": "" };

// ── Role catalogue ───────────────────────────────────────────────────────────
// Data-driven so roles can be added/renamed here without touching the scoring
// logic. lean = Part-1 temperament weights; gifts = Part-3 gifts that predict
// fit; minBand = readiness gate; blockedByFlag = safety roles a pastoral flag
// must hold; tag = GHL tag written when a person is placed into the role.
const ROLE_CATALOGUE = [
  { key: "greeter",   label: "Greeter (welcome, direct & seat)", tag: "usher-role-greeter",
    lean: { EX: 1, ST: 0.5 }, gifts: ["Hospitality", "Encouragement"], minBand: "Developing", blockedByFlag: false,
    blurb: "Greets and directs people at the door, and helps with welcoming and seating." },
  { key: "floor",     label: "Floor Usher / Catcher", tag: "usher-role-floor",
    lean: { DR: 1, ST: 0.7 }, gifts: ["Leadership", "Faith", "Discernment", "Mercy", "Helps & Service"], minBand: "Ready", blockedByFlag: true,
    blurb: "Directs crowd flow and assists the ministry to catch those who fall under prayer." },
  { key: "head",      label: "Head-Usher track", tag: "usher-role-head",
    lean: { DR: 1, DE: 0.4 }, gifts: ["Administration", "Leadership"], minBand: "Ready", blockedByFlag: true,
    blurb: "Coordinates and leads the usher team; organises rosters and floor flow.",
    prefBlurb: "The Advance Team selects the Head Usher — tick to register your wish and availability to be considered, given training and leadership approval." },
  { key: "parking",   label: "Parking Assistant", tag: "usher-role-parking",
    lean: { DR: 0.7, ST: 0.7 }, gifts: ["Helps & Service"], minBand: "Developing", blockedByFlag: false,
    blurb: "Directs and assists with parking; a practical, welcoming first point of contact." },
  { key: "helper",    label: "Helper (behind-the-scenes)", tag: "usher-role-helper",
    lean: { ST: 1, DE: 0.6 }, gifts: ["Helps & Service", "Giving"], minBand: "Developing", blockedByFlag: false,
    blurb: "Dependable behind-the-scenes support wherever practical help is needed." },
  { key: "followup",  label: "Follow-Up Usher", tag: "usher-role-followup",
    lean: { ST: 0.8, EX: 0.7 }, gifts: ["Evangelism & Follow-Up", "Shepherding"], minBand: "Ready", blockedByFlag: false,
    blurb: "Connects with newcomers and helps them take their next step." },
  { key: "undergird", label: "Undergirding (prayer & giving)", tag: "usher-role-undergird",
    lean: {}, gifts: ["Intercession", "Giving"], minBand: "Developing", blockedByFlag: false,
    blurb: "Supports every role through faithful prayer and generous giving." }
];
const ROLE_BY_KEY = ROLE_CATALOGUE.reduce(function (m, r) { m[r.key] = r; return m; }, {});
const BAND_RANK = { "Not-yet": 0, "Developing": 1, "Ready": 2 };

// Rank every catalogue role by fit for this candidate. Blend of gifts (Part 3),
// temperament (Part 1) and readiness (Part 2), then apply gates: safety roles
// are held when a pastoral flag is raised; roles are capped below their required
// readiness band ("grow first").
function computeRoleFits(u1, u2, u3) {
  const traits = (u1 && u1.scores) || {};
  const band = (u2 && u2.band) || null;
  const flag = !!(u2 && u2.pastoral_flag);
  const readFrac = (u2 && typeof u2.normalised === "number") ? u2.normalised / 100 : 0.5;
  const giftTotal = function (g) { return (u3 && u3.gifts && u3.gifts[g]) ? (u3.gifts[g].total || 0) : 0; };
  const out = ROLE_CATALOGUE.map(function (r) {
    let tw = 0, ts = 0;
    for (const k in r.lean) { tw += r.lean[k]; ts += (Number(traits[k]) || 0) / 40 * r.lean[k]; }
    const tempScore = tw ? ts / tw : 0.5; // no-lean roles (undergird) are temperament-neutral
    let gs = 0; for (const g of r.gifts) gs += giftTotal(g) / 20;
    const giftScore = r.gifts.length ? gs / r.gifts.length : 0;
    let pct = Math.round(100 * (0.4 * giftScore + 0.35 * tempScore + 0.25 * readFrac));
    let gate = "";
    if (r.blockedByFlag && flag) { gate = "hold"; pct = Math.min(pct, 45); }
    else if (band && BAND_RANK[band] < BAND_RANK[r.minBand]) { gate = "grow"; pct = Math.min(pct, 59); }
    let why = "";
    const gp = r.gifts.map(function (g) { return [g, giftTotal(g)]; }).sort(function (a, b) { return b[1] - a[1]; })[0];
    if (gp && gp[1] > 0) why = gp[0] + " " + gp[1] + "/20";
    return { key: r.key, label: r.label, blurb: r.blurb, pct: Math.max(0, Math.min(100, pct)), gate: gate, why: why };
  });
  out.sort(function (a, b) { return b.pct - a.pct; });
  return out;
}
function roleLabel(key) { return ROLE_BY_KEY[key] ? ROLE_BY_KEY[key].label : (key || "—"); }
function roleFitRows(fits, topN) {
  const list = topN ? fits.slice(0, topN) : fits;
  return list.map(function (f) {
    const tag = f.gate === "hold" ? " <span class='gate hold'>hold · pastoral</span>" : f.gate === "grow" ? " <span class='gate grow'>grow first</span>" : "";
    const why = f.why ? " · " + esc(f.why) : "";
    return "<div class='fit'><div class='fit-h'><span>" + esc(f.label) + tag + "</span><span class='fit-pct'>" + f.pct + "%</span></div>"
      + "<div class='bar'><i style='width:" + f.pct + "%'></i></div>"
      + "<div class='fit-b'>" + esc(f.blurb) + why + "</div></div>";
  }).join("");
}
function prefCheckboxes(chosen) {
  const set = {}; (chosen || []).forEach(function (k) { set[k] = 1; });
  return ROLE_CATALOGUE.map(function (r) {
    return "<label class='pick'><input type='checkbox' name='prefrole' value='" + r.key + "'" + (set[r.key] ? " checked" : "") + "><span><b>" + esc(r.label) + "</b><br><small>" + esc(r.prefBlurb || r.blurb) + "</small></span></label>";
  }).join("");
}
function placeOptions(current) {
  return "<option value=''>— not placed —</option>" + ROLE_CATALOGUE.map(function (r) {
    return "<option value='" + r.key + "'" + (current === r.key ? " selected" : "") + ">" + esc(r.label) + "</option>";
  }).join("");
}

const GHL_BASE = "https://services.leadconnectorhq.com";
const SUMMARY_FIELD_ID = "Y9fbY2JOAdxPagXxmtVB"; // the "usher_*" contact field

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p = url.pathname;
    try {
      let m = p.match(/^\/u\/([A-Za-z0-9]+)\/?$/);
      if (m) return Response.redirect(url.origin + "/u1/" + m[1], 302);

      m = p.match(/^\/(u1|u2|u3)(\/.*)?$/);
      if (m) return html(PAGES[SECTIONS[m[1]]]);

      if (p === "/register" && request.method === "GET") return html(PAGES["register.html"]);

      if (p === "/register" && request.method === "POST") {
        const b = await request.json().catch(() => ({}));
        if (!b || !b.email || !b.name) return json({ ok: false, error: "bad_payload" }, 400);
        let contactId = null;
        if (env.GHL_API_TOKEN && env.GHL_LOCATION_ID) {
          try {
            const up = await fetch("https://services.leadconnectorhq.com/contacts/upsert", {
              method: "POST",
              headers: { Authorization: "Bearer " + env.GHL_API_TOKEN, Version: "2021-07-28", "Content-Type": "application/json" },
              body: JSON.stringify({ locationId: env.GHL_LOCATION_ID, name: b.name, email: b.email, phone: b.mobile, tags: ["usher-registered", "usher-selfie-captured"].concat(b.agree ? ["usher-nbc-attested"] : []) })
            });
            const uj = await up.json();
            contactId = (uj.contact && uj.contact.id) || uj.id || null;
          } catch (e) {}
        }
        if (b.selfie && env.R2) {
          try {
            const key = "grc-usher-photos/" + (contactId || b.email.replace(/[^a-z0-9]/gi, "_")) + ".jpg";
            const bin = Uint8Array.from(atob(String(b.selfie).split(",").pop()), c => c.charCodeAt(0));
            await env.R2.put(key, bin, { httpMetadata: { contentType: "image/jpeg" } });
          } catch (e) {}
        }
        return json({ ok: true, contactId });
      }

      if (p === "/section-submit" && request.method === "POST") {
        const b = await request.json().catch(() => ({}));
        if (!b || b.course !== "usher" || !SECTIONS[b.section]) return json({ ok: false, error: "bad_payload" }, 400);
        const cid = String(b.contactId || "").replace(/[^A-Za-z0-9]/g, "") || null;
        await env.DB.prepare("INSERT INTO usher_submission (contact_id, section, payload, created_at) VALUES (?1,?2,?3,?4)")
          .bind(cid, b.section, JSON.stringify(b), Date.now()).run();
        // Carry through to GHL (never blocks the save — D1 is source of truth).
        if (env.GHL_API_TOKEN && cid) {
          try {
            await ghlAddTags(env, cid, ["usher-" + b.section + "-complete"]);
            const secs = await env.DB.prepare("SELECT DISTINCT section FROM usher_submission WHERE contact_id=?1").bind(cid).all();
            const have = new Set((secs.results || []).map(r => r.section));
            if (have.has("u1") && have.has("u2") && have.has("u3")) {
              const u3 = await latest(env, cid, "u3");
              const roleTag = u3 && ROLE_TAG[u3.role_fit] ? [ROLE_TAG[u3.role_fit]] : [];
              await ghlAddTags(env, cid, ["usher-cleared"].concat(roleTag));
              await ghlWriteSummary(env, cid);
              // Email the candidate their report — exactly once — so delivery does
              // not depend on a GHL workflow being built. Guarded by a marker row.
              const already = await env.DB.prepare("SELECT 1 AS x FROM usher_submission WHERE contact_id=?1 AND section='_emailed' LIMIT 1").bind(cid).first();
              if (!already) {
                const sent = await ghlSendCandidateEmail(env, cid, url.origin);
                await ghlSendLeadershipEmail(env, cid, url.origin); // best-effort notification to leadership
                if (sent) await env.DB.prepare("INSERT INTO usher_submission (contact_id, section, payload, created_at) VALUES (?1,'_emailed','{}',?2)").bind(cid, Date.now()).run();
              }
            }
          } catch (e) {}
        }
        return json({ ok: true, home: env.HOME_URL || null });
      }

      // Candidate states where they would love to serve (from their own report).
      m = p.match(/^\/prefer\/([A-Za-z0-9]+)\/?$/);
      if (m && request.method === "POST") {
        const cid = m[1].replace(/[^A-Za-z0-9]/g, "");
        const b = await request.json().catch(() => ({}));
        const roles = Array.isArray(b.roles) ? b.roles.filter(function (k) { return ROLE_BY_KEY[k]; }).slice(0, 7) : [];
        await env.DB.prepare("INSERT INTO usher_submission (contact_id, section, payload, created_at) VALUES (?1,'_preference',?2,?3)")
          .bind(cid, JSON.stringify({ roles: roles }), Date.now()).run();
        if (env.GHL_API_TOKEN && cid) { try { await ghlAddTags(env, cid, roles.map(function (k) { return "usher-pref-" + k; })); } catch (e) {} }
        return json({ ok: true, roles: roles });
      }

      // Head-Usher / Pastor places the candidate into a role (token-gated).
      m = p.match(/^\/place\/([A-Za-z0-9]+)\/?$/);
      if (m && request.method === "POST") {
        if (!env.PASTORAL_TOKEN || url.searchParams.get("token") !== env.PASTORAL_TOKEN) return json({ ok: false, error: "unauthorised" }, 403);
        const cid = m[1].replace(/[^A-Za-z0-9]/g, "");
        const b = await request.json().catch(() => ({}));
        const role = ROLE_BY_KEY[b.role] ? b.role : null;
        await env.DB.prepare("INSERT INTO usher_submission (contact_id, section, payload, created_at) VALUES (?1,'_placement',?2,?3)")
          .bind(cid, JSON.stringify({ role: role, by: "leadership" }), Date.now()).run();
        if (env.GHL_API_TOKEN && cid && role) { try { await ghlAddTags(env, cid, ["usher-placed", ROLE_BY_KEY[role].tag]); } catch (e) {} }
        return json({ ok: true, role: role, label: role ? ROLE_BY_KEY[role].label : null });
      }

      m = p.match(/^\/report\/([A-Za-z0-9]+)\/?$/);
      if (m) return renderReport(env, m[1], "candidate");

      // Friendly guard: /report opened without a valid contact id (e.g. an
      // unresolved {{contact.id}} merge field from a funnel button) — never
      // show the raw JSON 404 to a candidate.
      if (p === "/report" || p.startsWith("/report/") || p.startsWith("/report%")) {
        return html("<body style='font-family:sans-serif;padding:40px 24px;text-align:center;color:#231F20'><div style='max-width:420px;margin:0 auto'><h2 style='color:#3B6261'>Your report link needs your personal ID</h2><p style='color:#6B6B6B;line-height:1.6'>Please open your report from the button at the end of your assessment, or from the personal link sent to you. If you have not completed all three parts yet, finish them first and your report will be ready.</p></div></body>", 404);
      }

      m = p.match(/^\/pastoral\/([A-Za-z0-9]+)\/?$/);
      if (m) {
        if (!env.PASTORAL_TOKEN || url.searchParams.get("token") !== env.PASTORAL_TOKEN)
          return html("<body style='font-family:sans-serif;padding:32px;text-align:center'><h2>Confidential pastoral report</h2><p>This link requires authorised access.</p></body>", 403);
        return renderReport(env, m[1], "pastoral");
      }

      if (p === "/health") {
        let db = "x";
        try { const r = await env.DB.prepare("SELECT COUNT(*) n FROM usher_submission").first(); db = "ok:" + r.n; }
        catch (e) { db = "err:" + (e && e.message || e); }
        return json({ ok: true, worker: "grc-usher-staging-worker", environment: env.ENVIRONMENT, db });
      }

      return json({ error: "not_found", routes: ["/u/<cid>", "/u1|u2|u3/<cid>", "/register", "POST /section-submit", "/report/<cid>", "/pastoral/<cid>?token=", "/health"] }, 404);
    } catch (e) {
      return json({ error: "worker_exception", message: String(e && e.message || e) }, 500);
    }
  }
};

async function latest(env, cid, section) {
  const r = await env.DB.prepare("SELECT payload FROM usher_submission WHERE contact_id=?1 AND section=?2 ORDER BY created_at DESC LIMIT 1").bind(cid, section).first();
  if (!r) return null;
  try { return JSON.parse(r.payload); } catch (e) { return null; }
}

async function renderReport(env, cid, kind) {
  const [u1, u2, u3, prefRow, placeRow] = await Promise.all([
    latest(env, cid, "u1"), latest(env, cid, "u2"), latest(env, cid, "u3"),
    latest(env, cid, "_preference"), latest(env, cid, "_placement")
  ]);
  if (!u1 && !u2 && !u3) return html("<body style='font-family:sans-serif;padding:32px;text-align:center'><h2>Report not ready</h2><p>This profile has not completed the assessment yet.</p></body>", 404);
  const fits = computeRoleFits(u1, u2, u3);
  const prefRoles = (prefRow && Array.isArray(prefRow.roles)) ? prefRow.roles : [];
  const placedRole = placeRow ? placeRow.role : null;
  const tpl = PAGES[kind === "pastoral" ? "pastoral_report.html" : "candidate_report.html"];
  let selfie = (env.R2_PUBLIC_BASE || "") + "/grc-usher-photos/" + cid + ".jpg";
  let name = "", mobile = "", email = "";
  if (env.GHL_API_TOKEN) {
    try {
      const r = await fetch(GHL_BASE + "/contacts/" + cid, { headers: ghlHeaders(env) });
      if (r.ok) {
        const c = (await r.json()).contact || {};
        name = c.contactName || ((c.firstName || "") + " " + (c.lastName || "")).trim();
        mobile = c.phone || ""; email = c.email || "";
        if (Array.isArray(c.customFields)) {
          const pf = c.customFields.find(function (f) { return /photo|selfie/i.test(String(f.value || "")) && /^https?:/.test(String(f.value || "")); });
          if (pf) selfie = pf.value;
        }
      }
    } catch (e) {}
  }
  const V = {
    name: name, mobile: mobile, email: email, date: new Date().toISOString().slice(0, 10), selfie_url: selfie,
    s1_code: u1 ? u1.code : "—", s1_primary: u1 ? u1.primary : "", s1_secondary: u1 ? u1.secondary : "",
    s1_how_you_serve: u1 ? servingLine(u1.primary) : "", s1_role_lean: u1 ? ROLE_LEAN[u1.primary] : "",
    s1_trait_totals: u1 ? Object.entries(u1.scores).map(function (e) { return e[0] + ":" + e[1]; }).join("  ") : "",
    s2_band: u2 ? u2.band : "—", s2_score: u2 ? u2.normalised : "—", s2_encouragement: u2 ? bandNote(u2.band) : "",
    s2_domain_rows: u2 ? Object.entries(u2.domains).map(function (e) { return row(e[0], Math.round(e[1] / 25 * 100) + "%"); }).join("") : "",
    s2_pastoral_flag_block: (u2 && u2.pastoral_flag) ? "<div class='flag'>Pastoral flag: conversation recommended before active service.</div>" : "",
    s3_top_gifts_rows: u3 ? u3.top.map(function (g) { return row(g, u3.gifts[g].total + "/20 · " + u3.gifts[g].quad); }).join("") : "",
    s3_gift_rows: u3 ? u3.top.map(function (g) { return row(g, u3.gifts[g].total + "/20 · " + u3.gifts[g].quad); }).join("") : "",
    role_fit: u3 ? u3.role_fit : (u1 ? ROLE_LEAN[u1.primary] : "—"),
    role_fit_note: "Confirmed by your temperament (Part 1) and gifts (Part 3).",
    recommended_role: (fits[0] ? fits[0].label : (u3 ? u3.role_fit : "")),
    pastoral_action: (u2 && u2.pastoral_flag) ? "Conversation required before placement." : "Cleared for role induction.",
    // Multi-role selection + placement
    cid: cid,
    role_fit_rows: roleFitRows(fits, kind === "pastoral" ? 7 : 4),
    pref_checkboxes: prefCheckboxes(prefRoles),
    candidate_pref: prefRoles.length ? prefRoles.map(roleLabel).join(", ") : "— none stated yet —",
    place_options: placeOptions(placedRole),
    placement_current: placedRole ? roleLabel(placedRole) : "— not placed —"
  };
  return html(tpl.replace(/\{\{(\w+)\}\}/g, function (_, k) { return (k in V ? String(V[k]) : ""); }));
}

function row(a, b) { return "<div class='row'><span>" + a + "</span><span>" + b + "</span></div>"; }
function servingLine(p) { return ({ EX: "You serve best where people are met and made to feel welcome.", DR: "You serve best where someone must take charge and keep things moving.", DE: "You serve best where attentiveness and care for detail protect people.", ST: "You serve best where steady, dependable, behind-the-scenes care is needed." })[p] || ""; }
function bandNote(b) { return b === "Ready" ? "You show strong, consistent readiness to serve." : b === "Developing" ? "You are growing well — a few areas will strengthen with support." : "Some areas need growth before active service; your pastor will walk with you."; }
function json(o, s) { return new Response(JSON.stringify(o, null, 2), { status: s || 200, headers: { "content-type": "application/json", "cache-control": "no-store" } }); }
function html(h, s) { return new Response(h, { status: s || 200, headers: { "content-type": "text/html;charset=utf-8", "cache-control": "no-store" } }); }

// ── GHL write-through helpers ────────────────────────────────────────────────
function ghlHeaders(env) { return { Authorization: "Bearer " + env.GHL_API_TOKEN, Version: "2021-07-28", "Content-Type": "application/json" }; }
async function ghlAddTags(env, cid, tags) {
  await fetch(GHL_BASE + "/contacts/" + cid + "/tags", { method: "POST", headers: ghlHeaders(env), body: JSON.stringify({ tags: tags }) });
}
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
async function ghlSendCandidateEmail(env, cid, origin) {
  if (!env.GHL_API_TOKEN) return false;
  try {
    const r = await fetch(GHL_BASE + "/contacts/" + cid, { headers: ghlHeaders(env) });
    if (!r.ok) return false;
    const c = (await r.json()).contact || {};
    if (!c.email) return false;
    const first = c.firstName || "there";
    const link = origin + "/report/" + cid;
    const body = "<div style='font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#231F20;line-height:1.6;max-width:520px'>"
      + "<p>Dear " + esc(first) + ",</p>"
      + "<p>Thank you for completing your Usher &amp; Catcher Serve Readiness Profile. Your full report is ready.</p>"
      + "<p style='margin:22px 0'><a href='" + link + "' style='background:#3B6261;color:#ffffff;padding:13px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block'>View My Report</a></p>"
      + "<p style='font-size:13px;color:#6B6B6B'>Or open this link:<br><a href='" + link + "' style='color:#3B6261'>" + link + "</a></p>"
      + "<p>Your Head Usher will also be in touch with you shortly about your next steps in serving.</p>"
      + "<p>Love &amp; blessings,<br><b>Gateway Revival Church — Benoni</b></p></div>";
    const resp = await fetch(GHL_BASE + "/conversations/messages", {
      method: "POST", headers: ghlHeaders(env),
      body: JSON.stringify({ type: "Email", contactId: cid, subject: "Your Gateway Revival Church — Usher & Catcher Report", html: body })
    });
    return resp.ok;
  } catch (e) { return false; }
}
async function ghlSendLeadershipEmail(env, cid, origin) {
  // Sends to the Head-Usher contact (LEADERSHIP_TO_CONTACT_ID) and CCs the
  // pastors (LEADERSHIP_CC). GHL only allows the "to" of an outbound email to
  // be the message's contact, so leadership must be a real contact; CC accepts
  // any address.
  if (!env.GHL_API_TOKEN || !env.LEADERSHIP_TO_CONTACT_ID) return false;
  try {
    const r = await fetch(GHL_BASE + "/contacts/" + cid, { headers: ghlHeaders(env) });
    const c = r.ok ? ((await r.json()).contact || {}) : {};
    const name = ((c.firstName || "") + " " + (c.lastName || "")).trim() || "A candidate";
    const phone = c.phone || "";
    let summary = "";
    if (Array.isArray(c.customFields)) { const f = c.customFields.find(function (x) { return x.id === SUMMARY_FIELD_ID; }); if (f) summary = f.value || ""; }
    const rep = origin + "/report/" + cid;
    const pas = origin + "/pastoral/" + cid + (env.PASTORAL_TOKEN ? "?token=" + env.PASTORAL_TOKEN : "");
    const body = "<div style='font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#231F20;line-height:1.6;max-width:560px'>"
      + "<p><b>" + esc(name) + "</b> " + (phone ? "(" + esc(phone) + ") " : "") + "has completed the Usher &amp; Catcher Serve Readiness assessment.</p>"
      + (summary ? "<p><b>Result:</b> " + esc(summary) + "</p>" : "")
      + "<p><b>Candidate report:</b><br><a href='" + rep + "' style='color:#3B6261'>" + rep + "</a></p>"
      + "<p><b>Pastoral report</b> (confidential):<br><a href='" + pas + "' style='color:#3B6261'>" + pas + "</a></p>"
      + "<p style='font-size:13px;color:#6B6B6B'>Automated notification &mdash; Gateway Revival Church, Benoni.</p></div>";
    const cc = env.LEADERSHIP_CC ? String(env.LEADERSHIP_CC).split(",").map(function (s) { return s.trim(); }).filter(Boolean) : [];
    const resp = await fetch(GHL_BASE + "/conversations/messages", {
      method: "POST", headers: ghlHeaders(env),
      body: JSON.stringify({ type: "Email", contactId: env.LEADERSHIP_TO_CONTACT_ID, emailCc: cc, subject: "New Usher assessment completed — " + name, html: body })
    });
    return resp.ok;
  } catch (e) { return false; }
}
async function ghlWriteSummary(env, cid) {
  const [u1, u2, u3] = await Promise.all([latest(env, cid, "u1"), latest(env, cid, "u2"), latest(env, cid, "u3")]);
  const parts = [];
  if (u1) parts.push("S1 " + u1.code);
  if (u2) parts.push("S2 " + u2.band + " " + u2.normalised + "/100");
  if (u3) parts.push("S3 " + (u3.role_fit || "") + " [" + (u3.top || []).slice(0, 3).join(", ") + "]");
  const summary = "Usher assessment complete — " + parts.join(" | ");
  await fetch(GHL_BASE + "/contacts/" + cid, { method: "PUT", headers: ghlHeaders(env), body: JSON.stringify({ customFields: [{ id: SUMMARY_FIELD_ID, field_value: summary }] }) });
}
