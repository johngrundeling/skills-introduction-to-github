/**
 * grc-usher-staging-worker
 * Serves the Usher & Catcher assessment pages (u1/u2/u3) and records
 * submissions. Deliberately SEPARATE from the live GRC DNA engine and the
 * shared grc-pdf-generator — it only ever writes to its own usher_submission
 * table, so the live congregation assessment is never touched.
 *
 * Routes:
 *   GET  /u/<cid>            -> 302 /u1/<cid>              (short start link)
 *   GET  /u1|/u2|/u3[/<cid>] -> serves the section page (cid read client-side)
 *   POST /section-submit     -> { course:"usher", section, contactId, ... } -> D1
 *   GET  /health             -> worker + DB status
 *
 * Bindings (wrangler.toml): ASSETS (static pages), DB (reused GRC D1).
 * GHL custom-field write-back is layered in a later phase (needs GHL_API_TOKEN
 * secret) — this worker keeps the durable record in D1 in the meantime.
 */
const SECTIONS = { u1: "u1.html", u2: "u2.html", u3: "u3.html" };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p = url.pathname;
    try {
      // short start link
      let m = p.match(/^\/u\/([A-Za-z0-9]+)\/?$/);
      if (m) return Response.redirect(url.origin + "/u1/" + m[1], 302);

      // section pages (contactId optional; the page reads it from the path)
      m = p.match(/^\/(u1|u2|u3)(?:\/([A-Za-z0-9]+))?\/?$/);
      if (m) {
        const r = await env.ASSETS.fetch(new Request(new URL("/" + SECTIONS[m[1]], url.origin)));
        return new Response(r.body, {
          status: r.status,
          headers: { "content-type": "text/html;charset=utf-8", "cache-control": "no-store" }
        });
      }

      if (p === "/section-submit" && request.method === "POST") {
        const b = await request.json().catch(() => ({}));
        if (!b || b.course !== "usher" || !SECTIONS[b.section]) return json({ ok: false, error: "bad_payload" }, 400);
        const cid = String(b.contactId || "").replace(/[^A-Za-z0-9]/g, "") || null;
        await env.DB.prepare(
          "INSERT INTO usher_submission (contact_id, section, payload, created_at) VALUES (?1, ?2, ?3, ?4)"
        ).bind(cid, b.section, JSON.stringify(b), Date.now()).run();
        return json({ ok: true });
      }

      if (p === "/health") {
        let db = "x";
        try { const r = await env.DB.prepare("SELECT COUNT(*) n FROM usher_submission").first(); db = "ok:" + r.n; }
        catch (e) { db = "err:" + (e && e.message || e); }
        return json({ ok: true, worker: "grc-usher-staging-worker", environment: env.ENVIRONMENT, db });
      }

      return json({ error: "not_found", routes: ["/u/<cid>", "/u1|u2|u3/<cid>", "POST /section-submit", "/health"] }, 404);
    } catch (e) {
      return json({ error: "worker_exception", message: String(e && e.message || e) }, 500);
    }
  }
};

function json(o, s) {
  return new Response(JSON.stringify(o, null, 2), {
    status: s || 200,
    headers: { "content-type": "application/json", "cache-control": "no-store" }
  });
}
