# The Molecule Co. — Product Catalogue for GHL Import

This folder holds a ready-to-import product catalogue for **The Molecule Co.** GoHighLevel
(GHL) location, built from the July 2026 price schedule. Product codes follow the SKU style
used on the Pure Performance Labs invoices, so invoice line items read consistently.

## Files

| File | Purpose |
|------|---------|
| `molecule-co-products-GHL.csv` | **GHL upload.** 66 products in GHL's exact 29-column Shopify-style import template (GHL → Payments → Products → Import). |
| `molecule-co-products.csv` | Master / human-readable reference (8 columns): name, SKU, category, description, price, image URL. Source of truth for the sync worker. |
| `The_Molecule_Co_Price_Schedule_Cust.pdf` / `.docx` | **Customer-facing price list** — matches the branded reference exactly (logo, gold accents, no product codes), 62 products across the 6 catalogue categories, +R149 pricing. |
| `The_Molecule_Co_Price_Schedule.docx` / `.pdf` | Internal price schedule variant — same content but with product codes shown (all 66 incl. options). |
| `molecule-co-catalogue.html` | Responsive web catalogue with per-product CTA links (deploy to the website). |
| `images/` | Product images, named by product code (catalogue vials + supplier images for added items). |
| `build_schedule.js` / `build_schedule_pdf.py` | Generators that rebuild the Word / PDF schedule from the master list. |

## GHL import format notes

- The upload file matches GHL's 29-column template exactly (`Handle, Title, Body (HTML), … SEO Description`). `Title` = `CODE - Name`, `SKU` = product code, `Body (HTML)` = description, `Image Src` = image URL. Single-variant products use the Shopify convention `Option1 Name = Title`, `Option1 Value = Default Title`.
- **Price is numeric** (e.g. `750.00`), not `R750.00`. GHL's `Variant Price` column is numeric — a non-numeric value fails validation. The Rand symbol is applied automatically by the location's ZAR currency setting.
- **Image Src uses the public GitHub raw URLs.** GHL's importer fetches external image URLs on upload. If you want the images living in the GHL **Media Storage** (`storage.googleapis.com/msgsndr/<location>/media/…`) instead, the 48 images must first be uploaded to that location's Media Library, then the URLs swapped — that step needs GHL Media access this integration doesn't expose.

## Product code style (decoded from the invoice)

Format: **`PREFIX + DOSE`**

- **Prefix** — an uppercase abbreviation of the compound: 2 letters for peptides
  (Retatrutide → `RT`, Kisspeptin → `KS`, MOTS-c → `MS`), a 3-letter mnemonic for
  consumables/accessories (Bacteriostatic → `BAC`, Cartridge → `CRT`).
- **Dose** — the strength: `mg` → plain number (`RT30` = Retatrutide 30mg); `iu` → K-notation
  (`G5K` = HCG 5000iu); `ml` → plain number. Items with no printed strength use letters only
  (`AOD`, `TZ`, `FOX`).
- On an invoice the line reads **`CODE - Full Name`** (e.g. `RT30 - Retatrutide 30mg`), which is
  how the **Product Name** column is written.

## CSV columns

`Product Name` · `SKU` · `Category` · `Description` · `Price` · `Currency` (ZAR) ·
`Product Type` · `Image URL`

Prices are the **catalogue Retail** figures in ZAR. Image URLs are the raw GitHub links to the
files in `images/` and resolve once this branch is pushed (the repo is public).

## Decisions applied

- **MOTS-c base** → coded `MS10` (catalogue printed no strength; treated as 10mg).
- **Bacteriostatic Water (base)** → coded `BAC`, priced **R0.00** (matches invoice handling).
- **TB-500 10mg** appears twice in the catalogue; the second listing is kept as a distinct SKU
  `TB10A` so no catalogue item is dropped.
- Four option items were added beyond the catalogue: `ICE` Ice Pack (R35), `TBG` Thermal Bag
  (R100), `DLL` Delivery Local (R140), `DLN` Delivery National (R160). These have no catalogue
  image.

## Source-image notes (worth reviewing)

The catalogue reuses generic vial photos, so a few images do not match their caption's strength.
The images here faithfully reproduce whatever the catalogue placed on each row — replace the
source art later if exact matches are needed:

- `NAD500` (NAD+ 500mg) — catalogue shows a **PT-141** vial.
- `RT20`, `RT30`, `RT40` — reuse the Retatrutide **10mg** vial photo.
- `TS10` (Tesamorelin 10mg) — shows a Tesamorelin **5mg** vial.
- The MOTS-c photos (`MS10`/`MS20`/`MS40`) are generic across strengths.

## Full code map

| Category | Code | Product | Retail (ZAR) |
|----------|------|---------|-------------:|
| Tissue Repair | BPC10 | BPC-157 10mg | 750 |
| Tissue Repair | BPC5 | BPC-157 5mg | 600 |
| Tissue Repair | TB10 | TB-500 10mg | 1050 |
| Tissue Repair | TB10A | TB-500 10mg (alt SKU) | 1050 |
| Tissue Repair | TB5 | TB-500 5mg | 750 |
| Tissue Repair | CJIP | CJC-1295 + Ipamorelin | 999 |
| Tissue Repair | CJD10 | CJC-1295 (No DAC) 10mg | 950 |
| Tissue Repair | DSP10 | DSIP 10mg | 950 |
| Tissue Repair | IPA10 | Ipamorelin 10mg | 700 |
| Tissue Repair | PIN10 | Pinealon 10mg | 800 |
| Tissue Repair | VIP10 | VIP 10mg | 1550 |
| Metabolic | AOD | AOD-9604 | 870 |
| Metabolic | IGF1 | IGF-1 LR3 | 1550 |
| Metabolic | KS10 | Kisspeptin 10mg | 950 |
| Metabolic | MS10 | MOTS-c 10mg | 790 |
| Metabolic | MS20 | MOTS-c 20mg | 1050 |
| Metabolic | MS40 | MOTS-c 40mg | 1350 |
| Metabolic | NAD500 | NAD+ 500mg | 849 |
| Metabolic | RT10 | Retatrutide 10mg | 1049 |
| Metabolic | RT20 | Retatrutide 20mg | 1449 |
| Metabolic | RT30 | Retatrutide 30mg | 1799 |
| Metabolic | RT40 | Retatrutide 40mg | 2349 |
| Metabolic | TS5 | Tesamorelin 5mg | 910 |
| Metabolic | TS10 | Tesamorelin 10mg | 1149 |
| Metabolic | TS20 | Tesamorelin 20mg | 1799 |
| Metabolic | TZ | Tirzepatide | 1249 |
| Metabolic | AMQ5 | 5-Amino-1MQ 5mg | 580 |
| Longevity | EP10 | Epithalon 10mg | 659 |
| Longevity | EP50 | Epithalon 50mg | 1249 |
| Longevity | G5K | HCG 5000iu | 749 |
| Longevity | SLK10 | Selank 10mg | 869 |
| Longevity | THA1 | Thymosin Alpha-1 | 1309 |
| Longevity | SEM10 | Semax 10mg | 880 |
| Longevity | SS10 | SS-31 10mg | 1099 |
| Longevity | SS50 | SS-31 50mg | 1829 |
| Longevity | FOX | FOXO4-DRI | 2149 |
| Stacks | WLV10 | Wolverine Blend – BPC-157 + TB-500 10mg | 950 |
| Stacks | BT20 | BPC-157 + TB-500 20mg | 1350 |
| Stacks | GLW70 | GLOW Stack 70mg | 1399 |
| Stacks | GHK50 | GHK-Cu 50mg | 749 |
| Stacks | GHK100 | GHK-Cu 100mg | 949 |
| Stacks | KLW80 | KLOW Stack 80mg | 1599 |
| Hormonal | MT10 | Melanotan 2 10mg | 750 |
| Hormonal | PT10 | PT-141 10mg | 739 |
| Hormonal | SNP10 | Snap-8 10mg | 659 |
| Accessories | BAC | Bacteriostatic Water | 0 |
| Accessories | BAC10 | Bacteriostatic Water 10ml | 150 |
| Accessories | CRT | Cartridge | 45 |
| Options | ICE | Ice Pack | 35 |
| Options | TBG | Thermal Bag | 100 |
| Options | DLL | Delivery Local | 140 |
| Options | DLN | Delivery National | 160 |
| Tissue Repair | ARA10 | ARA-290 10mg | 719 |
| Tissue Repair | KPV10 | KPV 10mg | 649 |
| Tissue Repair | SRM10 | Sermorelin 10mg | 1049 |
| Metabolic | LMB10 | Lemon Bottle 10ml | 799 |
| Metabolic | MZ10 | Mazdutide 10mg | 1549 |
| Metabolic | NAD1000 | NAD+ 1000mg | 1249 |
| Metabolic | SG10 | Semaglutide 10mg | *POA (OOS)* |
| Metabolic | SG30 | Semaglutide 30mg | *POA (OOS)* |
| Metabolic | SLU5 | SLU-PP-332 5mg | *POA (OOS)* |
| Metabolic | TZ15 | Tirzepatide 15mg | 949 |
| Metabolic | TZ30 | Tirzepatide 30mg | 1300 |
| Metabolic | TZ60 | Tirzepatide 60mg | 1849 |
| Longevity | GLU600 | Glutathione 600mg | 649 |
| Accessories | DPN | Disposable Pen | 350 |

**Total: 66 products** (48 catalogue items + 4 options + 14 added from the supplier catalogue).

## Supplier reconciliation — purelabs.co.za

The Molecule Co catalogue was cross-checked against the Pure Performance Labs supplier
catalogue (`purelabs.co.za`, 58 SKUs). **14 items the supplier lists were not on our
catalogue and have been added** (above). Items already covered by an equivalent SKU were left
as-is.

**Pricing basis (reseller rule):** our retail = **Pure Labs list price + R149** on every product
they sell. The **entire catalogue has been re-derived to this rule** so pricing is consistent
across the master list, the GHL CSV, the HTML, and the Word/PDF schedule. Our **cost** = supplier
list × 0.75 (25% reseller discount), except flat costs Disposable Pen **R125**, Ice pack **R35**,
Thermal packaging **R100**. Out-of-stock supplier items show **POA** and are excluded from the
online store. (Note: Bacteriostatic Water 10ml moves to R299 under the flat +R149 rule — flag if
consumables should instead stay at cost.)

**Needs your input:**
- **Semaglutide 10mg / 30mg** and **SLU-PP-332 5mg** are **out of stock** on the supplier site
  with no listed price — added with price `0.00` and set **not** included in the online store
  until priced.
- **Disposable Pen** priced at the supplier's **R350**, but invoice INV0011106 sold it at
  **R125** — confirm which price applies.
- **Tirzepatide** now has strength SKUs `TZ15/TZ30/TZ60`; the original strengthless `TZ`
  (R1,249) is still present — reconcile if it duplicates one of the new variants.
- Added items have **no product image** yet (they are not in the catalogue PDF). Their images can
  be sourced from the supplier product pages on request.
