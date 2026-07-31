#!/usr/bin/env python3
"""BioKissed SA — data prep. Reads the Molecule Co master list and emits the
BioKissed master CSV, the GHL 29-column import CSV, and a grouped JSON that the
PDF / Word / HTML builders consume. Prices, codes and descriptions carry over
unchanged; only branding, image URLs and presentation change."""
import csv, json, os, re

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "..", "molecule-co", "molecule-co-products.csv")
BRANCH = "claude/catalog-product-codes-kkncc3"
IMG_BASE = f"https://raw.githubusercontent.com/johngrundeling/skills-introduction-to-github/refs/heads/{BRANCH}/biokissed/images"

CAT_SHORT = {
    "1. Tissue Repair & Recovery": "Tissue Repair & Recovery",
    "2. Metabolic & Weight Management": "Metabolic & Weight Management",
    "3. Longevity & Cellular Health": "Longevity & Cellular Health",
    "4. Specialty Combination Stacks": "Specialty Combination Stacks",
    "5. Hormonal & Vitality": "Hormonal & Vitality",
    "6. Accessories & Consumables": "Accessories & Consumables",
    "7. Options & Delivery": "Options & Delivery",
}
CAT_SUB = {
    "1. Tissue Repair & Recovery": "Peptides studied for healing, recovery and connective-tissue support.",
    "2. Metabolic & Weight Management": "Compounds researched for metabolic, appetite and body-composition pathways.",
    "3. Longevity & Cellular Health": "Research compounds explored for cellular ageing, repair and resilience.",
    "4. Specialty Combination Stacks": "Pre-combined blends formulated for convenient multi-pathway research.",
    "5. Hormonal & Vitality": "Peptides investigated for hormonal, libido and pigmentation pathways.",
    "6. Accessories & Consumables": "Reconstitution and delivery consumables for laboratory use.",
    "7. Options & Delivery": "Cold-chain packaging and courier options added at checkout.",
}

def clean_name(product_name):
    return product_name.split(" - ", 1)[-1].strip()

def fmt_price(p, code=""):
    p = (p or "").strip()
    try:
        v = float(p)
    except ValueError:
        return "POA"
    if v <= 0:
        return "Free" if code == "BAC" else "POA"   # BAC base is a free add-on
    return "R" + (f"{v:,.0f}" if v == int(v) else f"{v:,.2f}")

def load():
    rows = list(csv.DictReader(open(SRC)))
    for r in rows:
        r["_code"] = r["SKU"].strip()
        r["_name"] = clean_name(r["Product Name"])
        r["_img"]  = f"{IMG_BASE}/{r['_code']}.png"
        r["_price"] = fmt_price(r["Price"], r["_code"])
    return rows

def write_master(rows):
    out = os.path.join(ROOT, "biokissed-products.csv")
    cols = ["Product Name","SKU","Category","Description","Price","Currency","Product Type","Image URL","Brand"]
    with open(out, "w", newline="") as fh:
        w = csv.writer(fh); w.writerow(cols)
        for r in rows:
            w.writerow([r["_name"], r["_code"], CAT_SHORT.get(r["Category"], r["Category"]),
                        r["Description"], r["Price"], r.get("Currency","ZAR") or "ZAR",
                        r.get("Product Type","Physical") or "Physical", r["_img"], "BioKissed SA"])
    print("wrote", out, len(rows))

def write_ghl(rows):
    out = os.path.join(ROOT, "biokissed-products-GHL.csv")
    cols = ["Handle","Title","Body (HTML)","Included in Online Store","Image Src","Option1 Name",
            "Option1 Value","Option2 Name","Option2 Value","Option3 Name","Option3 Value","Variant Price",
            "Variant Compare At Price","Track Inventory","Allow Out of Stock Purchases","Available Quantity",
            "SKU","Weight Value","Weight Unit","Dimension Length","Dimension Width","Dimension Height",
            "Dimension Unit","Product Label Enable","Label Title","Label Start Date","Label End Date",
            "SEO Title","SEO Description"]
    with open(out, "w", newline="") as fh:
        w = csv.writer(fh); w.writerow(cols)
        for r in rows:
            oos = r["_price"] == "POA"
            price = "" if oos else f'{float(r["Price"]):.2f}'
            w.writerow(["bk-"+r["_code"].lower(), f'{r["_code"]} - {r["_name"]}', r["Description"],
                        "FALSE" if oos else "TRUE", r["_img"], "Title", "Default Title",
                        "", "", "", "", price, "", "FALSE", "TRUE", "", r["_code"],
                        "", "", "", "", "", "", "FALSE", "", "", "",
                        f'{r["_name"]} | BioKissed SA', r["Description"][:150]])
    print("wrote", out, len(rows))

def write_grouped(rows):
    groups = []
    seen = {}
    for r in rows:
        cat = CAT_SHORT.get(r["Category"], r["Category"])
        if cat not in seen:
            seen[cat] = {"category": cat, "sub": CAT_SUB.get(r["Category"], ""), "items": []}
            groups.append(seen[cat])
        seen[cat]["items"].append({
            "code": r["_code"], "name": r["_name"], "desc": r["Description"],
            "price": r["_price"], "img": f"biokissed/images_thumb/{r['_code']}.png",
        })
    json.dump(groups, open(os.path.join(ROOT, "_bk_data.json"), "w"), indent=1)
    print("wrote _bk_data.json groups:", len(groups), "items:", sum(len(g["items"]) for g in groups))
    return groups

if __name__ == "__main__":
    rows = load()
    write_master(rows)
    write_ghl(rows)
    write_grouped(rows)
