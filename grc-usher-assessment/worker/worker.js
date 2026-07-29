/**
 * grc-usher-staging-worker
 * Serves the Usher & Catcher assessment (u1/u2/u3), registration + selfie,
 * records submissions to its OWN usher_submission table, and renders the
 * candidate + pastoral reports. Never touches the live DNA engine or the
 * shared grc-pdf-generator.
 *
 * Routes:
 *   GET  /u/<cid>              -> 302 /u1/<cid>
 *   GET  /u1|/u2|/u3[/<cid>]   -> section page
 *   GET  /register             -> registration + selfie page
 *   POST /register             -> GHL upsert (if secrets) + selfie -> R2
 *   POST /section-submit       -> record to D1
 *   GET  /report/<cid>         -> candidate report (member self-view)
 *   GET  /pastoral/<cid>?token=-> pastoral report (staff, token-gated)
 *   GET  /health
 *
 * Bindings: ASSETS, DB (reused GRC D1), R2. Vars: ENVIRONMENT, COURSE,
 * R2_PUBLIC_BASE, HOME_URL. Secrets (phase 2): GHL_API_TOKEN, GHL_LOCATION_ID,
 * PASTORAL_TOKEN.
 */
const SECTIONS = { u1: "u1.html", u2: "u2.html", u3: "u3.html" };
const ROLE_LEAN = { EX: "Welcome Usher", DR: "Floor / Head-Usher track", DE: "Ministry Support / Safety", ST: "Ministry Support (Catcher) & Follow-Up" };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p = url.pathname;
    try {
      let m = p.match(/^\/u\/([A-Za-z0-9]+)\/?$/);
      if (m) return Response.redirect(url.origin + "/u1/" + m[1], 302);

      m = p.match(/^\/(u1|u2|u3)(?:\/([A-Za-z0-9]+))?\/?$/);
      if (m) return serveAsset(env, url, SECTIONS[m[1]]);

      if (p === "/register" && request.method === "GET") return serveAsset(env, url, "register.html");

      if (p === "/register" && request.method === "POST") {
        const b = await request.json().catch(() => ({}));
        if (!b || !b.email || !b.name) return json({ ok: false, error: "bad_payload" }, 400);
        let contactId = null;
        if (env.GHL_API_TOKEN && env.GHL_LOCATION_ID) {
          try {
            const up = await fetch("https://services.leadconnectorhq.com/contacts/upsert", {
              method: "POST",
              headers: { Authorization: "Bearer " + env.GHL_API_TOKEN, Version: "2021-07-28", "Content-Type": "application/json" },
              body: JSON.stringify({ locationId: env.GHL_LOCATION_ID, name: b.name, email: b.email, phone: b.mobile, tags: ["usher-registered", "usher-selfie-captured"] })
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
        return json({ ok: true, home: env.HOME_URL || null });
      }

      m = p.match(/^\/report\/([A-Za-z0-9]+)\/?$/);
      if (m) return renderReport(env, url, m[1], "candidate");

      m = p.match(/^\/pastoral\/([A-Za-z0-9]+)\/?$/);
      if (m) {
        if (!env.PASTORAL_TOKEN || url.searchParams.get("token") !== env.PASTORAL_TOKEN)
          return html("<body style='font-family:sans-serif;padding:32px;text-align:center'><h2>Confidential pastoral report</h2><p>This link requires authorised access.</p></body>", 403);
        return renderReport(env, url, m[1], "pastoral");
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

async function serveAsset(env, url, file) {
  const r = await env.ASSETS.fetch(new Request(new URL("/" + file, url.origin)));
  return new Response(r.body, { status: r.status, headers: { "content-type": "text/html;charset=utf-8", "cache-control": "no-store" } });
}

async function latest(env, cid, section) {
  const r = await env.DB.prepare("SELECT payload FROM usher_submission WHERE contact_id=?1 AND section=?2 ORDER BY created_at DESC LIMIT 1").bind(cid, section).first();
  if (!r) return null;
  try { return JSON.parse(r.payload); } catch (e) { return null; }
}

async function renderReport(env, url, cid, kind) {
  const [u1, u2, u3] = await Promise.all([latest(env, cid, "u1"), latest(env, cid, "u2"), latest(env, cid, "u3")]);
  if (!u1 && !u2 && !u3) return html("<body style='font-family:sans-serif;padding:32px;text-align:center'><h2>Report not ready</h2><p>This profile has not completed the assessment yet.</p></body>", 404);
  const tpl = await (await env.ASSETS.fetch(new Request(new URL("/" + (kind === "pastoral" ? "pastoral_report.html" : "candidate_report.html"), url.origin)))).text();
  const selfie = (env.R2_PUBLIC_BASE || "") + "/grc-usher-photos/" + cid + ".jpg";
  const V = {
    name: "", mobile: "", email: "", date: new Date().toISOString().slice(0, 10), selfie_url: selfie,
    s1_code: u1 ? u1.code : "—", s1_primary: u1 ? u1.primary : "", s1_secondary: u1 ? u1.secondary : "",
    s1_how_you_serve: u1 ? servingLine(u1.primary) : "", s1_role_lean: u1 ? ROLE_LEAN[u1.primary] : "",
    s1_trait_totals: u1 ? Object.entries(u1.scores).map(([k, v]) => k + ":" + v).join("  ") : "",
    s2_band: u2 ? u2.band : "—", s2_score: u2 ? u2.normalised : "—",
    s2_encouragement: u2 ? bandNote(u2.band) : "",
    s2_domain_rows: u2 ? Object.entries(u2.domains).map(([k, v]) => row(k, Math.round(v / 25 * 100) + "%")).join("") : "",
    s2_pastoral_flag_block: (u2 && u2.pastoral_flag) ? "<div class='flag'>Pastoral flag: conversation recommended before active service.</div>" : "",
    s3_top_gifts_rows: u3 ? u3.top.map(g => row(g, u3.gifts[g].total + "/20 · " + u3.gifts[g].quad)).join("") : "",
    s3_gift_rows: u3 ? u3.top.map(g => row(g, u3.gifts[g].total + "/20 · " + u3.gifts[g].quad)).join("") : "",
    role_fit: u3 ? u3.role_fit : (u1 ? ROLE_LEAN[u1.primary] : "—"),
    role_fit_note: "Confirmed by your temperament (Part 1) and gifts (Part 3).",
    recommended_role: u3 ? u3.role_fit : "", pastoral_action: (u2 && u2.pastoral_flag) ? "Conversation required before placement." : "Cleared for role induction."
  };
  return html(tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in V ? String(V[k]) : "")));
}

function row(a, b) { return "<div class='row'><span>" + a + "</span><span>" + b + "</span></div>"; }
function servingLine(p) { return ({ EX: "You serve best where people are met and made to feel welcome.", DR: "You serve best where someone must take charge and keep things moving.", DE: "You serve best where attentiveness and care for detail protect people.", ST: "You serve best where steady, dependable, behind-the-scenes care is needed." })[p] || ""; }
function bandNote(b) { return b === "Ready" ? "You show strong, consistent readiness to serve." : b === "Developing" ? "You are growing well — a few areas will strengthen with support." : "Some areas need growth before active service; your pastor will walk with you."; }
function json(o, s) { return new Response(JSON.stringify(o, null, 2), { status: s || 200, headers: { "content-type": "application/json", "cache-control": "no-store" } }); }
function html(h, s) { return new Response(h, { status: s || 200, headers: { "content-type": "text/html;charset=utf-8", "cache-control": "no-store" } }); }
