#!/usr/bin/env python3
"""BioKissed SA web catalogue — same responsive card-grid layout as the Molecule Co
reference, recoloured to the BioKissed white + teal palette with the inverted logo and
Montserrat. Reads biokissed-products.csv; images use the full-res web URLs."""
import csv, os, html, base64, re

ROOT = os.path.dirname(os.path.abspath(__file__))
BRANCH = "claude/catalog-product-codes-kkncc3"
WEB = f"https://raw.githubusercontent.com/johngrundeling/skills-introduction-to-github/refs/heads/{BRANCH}/biokissed/images"
SITE = "https://biokissedsa.com"

rows = list(csv.DictReader(open(os.path.join(ROOT, "biokissed-products.csv"))))
logo_b64 = base64.b64encode(open(os.path.join(ROOT, "assets/logo_lockup_teal.png"), "rb").read()).decode()

def slug(name):
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")

def price_html(p):
    p = (p or "").strip()
    try: v = float(p)
    except ValueError: return '<span class="poa">POA</span>'
    if v <= 0:
        return '<span class="poa">Free</span>' if False else '<span class="poa">POA</span>'
    return f'<span class="price">R{v:,.2f}</span>'

# group by category in file order
groups = []
seen = {}
for r in rows:
    c = r["Category"]
    if c not in seen:
        seen[c] = []; groups.append((c, seen[c]))
    seen[c].append(r)

cards = []
for cat, items in groups:
    inner = []
    for r in items:
        code = r["SKU"]; name = r["Product Name"]
        img = f"{WEB}/{code}.png"
        desc = html.escape((r["Description"] or "")[:150] + ("…" if len(r["Description"] or "") > 150 else ""))
        # BAC base is free
        praw = r["Price"]
        try: pv = float(praw)
        except: pv = -1
        if code == "BAC":
            price = '<span class="price">Free</span>'
        elif pv <= 0:
            price = '<span class="poa">POA</span>'
        else:
            price = f'<span class="price">R{pv:,.2f}</span>'
        cta = f'{SITE}/product/{slug(name)}/'
        inner.append(
            f'<article class="card"><div class="thumb"><img loading="lazy" src="{img}" alt="{html.escape(name)}">'
            f'<span class="sku">{html.escape(code)}</span></div>'
            f'<h3>{html.escape(name)}</h3><p class="desc">{desc}</p>'
            f'<div class="row">{price}<a class="cta" href="{cta}" target="_blank" rel="noopener">Order&nbsp;Now</a></div></article>'
        )
    cards.append(f'<section><h2>{html.escape(cat)}</h2><div class="grid">{"".join(inner)}</div></section>')

doc = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>BioKissed SA — Research Compound Catalogue</title><style>
@font-face{{font-family:Montserrat;src:url("assets/Montserrat-Regular.ttf");font-weight:400}}
@font-face{{font-family:Montserrat;src:url("assets/Montserrat-SemiBold.ttf");font-weight:600}}
@font-face{{font-family:Montserrat;src:url("assets/Montserrat-Bold.ttf");font-weight:700}}
*{{box-sizing:border-box}}
body{{margin:0;font:16px/1.55 Montserrat,system-ui,Segoe UI,Roboto,sans-serif;background:var(--bg);color:var(--ink)}}
:root{{--bg:#f4f7f8;--card:#fff;--ink:#1a2a49;--mut:#6e7a84;--acc:#5e7e92;--acc2:#9f6652;--line:#e2e9ec}}
@media(prefers-color-scheme:dark){{:root{{--bg:#0f1519;--card:#161f25;--ink:#eaf1f4;--mut:#9db0ba;--acc:#779cb0;--acc2:#c08a74;--line:#26333a}}}}
header{{padding:38px 20px 30px;text-align:center;border-bottom:1px solid var(--line);background:var(--card)}}
header img{{height:56px;width:auto}}
header .tag{{margin:8px 0 4px;color:var(--acc);font-size:14px;letter-spacing:.06em}}
header p{{margin:6px 0 0;color:var(--mut);font-size:13px}}
main{{max-width:1180px;margin:0 auto;padding:20px}}
section{{margin:30px 0}}
h2{{font-size:18px;font-weight:700;border-left:4px solid var(--acc2);padding-left:12px;margin:0 0 16px}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(215px,1fr));gap:16px}}
.card{{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px;display:flex;flex-direction:column;transition:box-shadow .15s,transform .15s}}
.card:hover{{box-shadow:0 8px 24px #1a2a4915;transform:translateY(-2px)}}
.thumb{{position:relative;aspect-ratio:1/1.15;border-radius:10px;overflow:hidden;background:#f0f4f5;display:flex;align-items:center;justify-content:center}}
.thumb img{{width:100%;height:100%;object-fit:contain}}
.sku{{position:absolute;top:8px;left:8px;background:var(--acc);color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:6px;letter-spacing:.03em}}
.card h3{{font-size:15px;font-weight:700;margin:10px 2px 4px}}
.desc{{color:var(--mut);font-size:12px;margin:0 2px 12px;flex:1}}
.row{{display:flex;align-items:center;justify-content:space-between;gap:8px}}
.price{{font-weight:700;font-size:16px;color:var(--acc)}}
.poa{{color:var(--mut);font-size:13px;font-weight:600}}
.cta{{background:var(--acc);color:#fff;text-decoration:none;font-weight:700;font-size:13px;padding:8px 13px;border-radius:9px;white-space:nowrap}}
.cta:hover{{filter:brightness(1.07)}}
footer{{max-width:1180px;margin:0 auto;padding:26px 20px;color:var(--mut);font-size:12px;border-top:1px solid var(--line)}}
</style></head><body>
<header>
<img src="data:image/png;base64,{logo_b64}" alt="BioKissed SA">
<div class="tag">loving nature</div>
<p>Research Compound Catalogue · Pricing in ZAR · Generated 30 Jul 2026</p>
</header>
<main>
{"".join(cards)}
</main>
<footer>
<strong>BioKissed SA</strong> — Research Use Only. All compounds are supplied strictly for laboratory and research purposes and are not
registered medicines. Prices in South African Rand (ZAR), reconstituted (pen), and exclude courier delivery. Subject to change without notice.
</footer>
</body></html>'''

out = os.path.join(ROOT, "biokissed-catalogue.html")
open(out, "w").write(doc)
print("wrote", out, len(doc), "bytes,", sum(len(v) for _,v in groups), "products")
