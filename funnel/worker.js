// BioKissed funnel — Cloudflare Worker (Static Assets + API).
// Static files live in ./public and are served automatically. This Worker only handles the
// /api/* routes, reusing the same handlers as the Pages Functions so there's one source of truth.
import { onRequestPost as payPost } from "./functions/api/pay.js";
import { onRequestGet as verifyGet } from "./functions/api/verify.js";
import { onRequestPost as webhookPost } from "./functions/api/paystack-webhook.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const p = url.pathname;
    if (p === "/api/pay" && request.method === "POST") return payPost({ request, env, ctx });
    if (p === "/api/verify" && request.method === "GET") return verifyGet({ request, env, ctx });
    if (p === "/api/paystack-webhook" && request.method === "POST") return webhookPost({ request, env, ctx });
    // anything else → static asset (index.html, success.html, assets, .well-known, …)
    return env.ASSETS.fetch(request);
  },
};
