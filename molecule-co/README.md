# The Molecule Co. — Product Catalogue for GHL Import

This folder holds a ready-to-import product catalogue for **The Molecule Co.** GoHighLevel
(GHL) location, built from the July 2026 price schedule. Product codes follow the SKU style
used on the Pure Performance Labs invoices, so invoice line items read consistently.

## Files

| File | Purpose |
|------|---------|
| `molecule-co-products.csv` | 52 products ready to upload (GHL → Payments → Products → Import). |
| `images/` | 48 product images (one per catalogue item), named by product code. |

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

**Total: 52 products** (48 catalogue items + 4 options).
