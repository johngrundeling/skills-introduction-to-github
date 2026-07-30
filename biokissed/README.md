# BioKissed SA — Research Compound Catalogue

The full BioKissed SA product set, rebranded from the Molecule Co catalogue. Same 66
products, prices, codes and research notes — restyled end-to-end in the BioKissed identity:
white + teal/blue palette, the BioKissed butterfly lockup, "loving nature" tagline, and
**Montserrat** for all body copy (the logo keeps its own custom logotype).

## What's here

| File | Purpose |
|------|---------|
| `images/` | All **66** product images. 60 rebranded vials (teal cap + band, BioKissed lockup, wiped white label, Montserrat name/strength) + 6 branded tiles for the non-vial items (Cartridge, Disposable Pen, Ice Pack, Thermal Bag, Delivery Local/National). |
| `images_thumb/` | Down-scaled copies used for document embedding (keeps the PDF/Word light). |
| `biokissed-catalogue.html` | Responsive web catalogue — white/teal cards, teal SKU badges, per-product CTA. |
| `biokissed-products.csv` | Master list (9 cols incl. `Brand = BioKissed SA`) — source of truth. |
| `biokissed-products-GHL.csv` | GHL 29-column Shopify-style import file. |
| `BioKissed_SA_Price_List.pdf` / `.docx` | **Customer** price list — no product codes. |
| `BioKissed_SA_Price_Schedule_Internal.pdf` / `.docx` | **Internal** schedule — product codes shown, marked confidential. |
| `assets/` | Inverted teal & navy logo lockups, teal butterfly, full logo, Montserrat weights. |
| `build_data.py` · `build_pdf.py` · `build_html.py` · `build_docx.js` | Generators — rerun to rebuild every output from the master list. |

## Design decisions

- **Bottle** — the gold PURE cap band and metal crown are recoloured warm→teal; a clean
  synthetic teal band carries the BioKissed lockup + "loving nature"; the original label is
  fully wiped to white (no ghosting) and re-lettered in Montserrat: **product name** (the
  reusable template that repeats on every model), a terracotta divider, strength, `Lab Tested`,
  `For Research Use Only`. White + blue kept as requested.
- **Documents** — identical layout, shape and size to the Molecule Co reference, only the
  colours change: navy→teal structure, gold→terracotta accents. Because the bottle is
  white-logo-on-blue, the documents (white background) use the **inverted** blue/teal logo, so
  the page stays mostly white with minimal heavy colour.
- **Pricing** — carried over unchanged from the master list (retail = supplier list + R176;
  cold-chain/delivery are flat line items; OOS items show **POA**; the Bacteriostatic Water
  base stays **Free**).

## Rebuild

```bash
cd biokissed
python3 build_data.py          # master CSV, GHL CSV, grouped JSON
python3 build_pdf.py cust       # customer PDF
python3 build_pdf.py internal   # internal PDF
node   build_docx.js cust       # customer Word
node   build_docx.js internal   # internal Word
python3 build_html.py           # web catalogue
```

## Notes worth a glance

- **CTA links** use the pattern `https://biokissedsa.com/product/<slug>/` — confirm these
  match the live store slugs before publishing.
- **8 source vials were low-resolution** (300 px: AMQ5, G5K, PIN10, SS50, THA1, TZ, TZ30, TZ60).
  They were rebuilt on a high-resolution generic vial with the correct BioKissed name/strength,
  so the bottle shape is representative rather than the exact original photo.
- Montserrat is referenced by name in the Word files; install the font (bundled in `assets/`)
  for pixel-perfect rendering, otherwise Word substitutes a near sans-serif.
