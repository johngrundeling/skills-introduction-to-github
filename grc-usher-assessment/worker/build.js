#!/usr/bin/env node
// Build worker.bundled.js = `const PAGES = {<name>:<html>...};` + _bundled_logic.js
// The bundled worker has no ASSETS binding; pages are injected as a global so the
// whole worker ships as a single self-contained module. Run after editing any
// page in ../pages or _bundled_logic.js:  node worker/build.js
const fs = require("fs");
const path = require("path");

const here = __dirname;
const pagesDir = path.join(here, "..", "pages");

// Keep this order stable for clean diffs. Any *.html added to pages/ is included.
const ORDER = ["u1.html", "u2.html", "u3.html", "register.html", "candidate_report.html", "pastoral_report.html"];
const present = fs.readdirSync(pagesDir).filter((f) => f.endsWith(".html"));
const files = ORDER.filter((f) => present.includes(f)).concat(present.filter((f) => !ORDER.includes(f)).sort());

const PAGES = {};
for (const f of files) PAGES[f] = fs.readFileSync(path.join(pagesDir, f), "utf8");

const logic = fs.readFileSync(path.join(here, "_bundled_logic.js"), "utf8");
const out = "const PAGES = " + JSON.stringify(PAGES) + ";\n" + logic;
fs.writeFileSync(path.join(here, "worker.bundled.js"), out);

const crypto = require("crypto");
const sha = crypto.createHash("sha256").update(out).digest("hex");
console.log("worker.bundled.js  bytes=" + Buffer.byteLength(out) + "  sha256=" + sha);
