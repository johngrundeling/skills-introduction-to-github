import json, os
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer,
    Table, TableStyle, Image, PageBreak, KeepTogether)
from reportlab.lib.enums import TA_CENTER

ROOT = "/home/user/skills-introduction-to-github"
data = json.load(open(os.path.join(ROOT, "molecule-co/_schedule_data.json"), encoding="utf-8"))

NAVY = colors.HexColor("#17335A"); ACC = colors.HexColor("#0A66C2")
MUT = colors.HexColor("#5A6B8C"); LINE = colors.HexColor("#D6DEEA")
INK = colors.HexColor("#333333"); ALT = colors.HexColor("#F4F7FB")

styles = getSampleStyleSheet()
def S(name, **kw):
    kw.setdefault("leading", kw.get("fontSize", 10) * 1.2)
    return ParagraphStyle(name, parent=styles["Normal"], **kw)
name_st = S("nm", fontName="Helvetica-Bold", fontSize=11, textColor=NAVY, spaceAfter=2, leading=13)
code_st = S("cd", fontName="Helvetica-Bold", fontSize=7.5, textColor=ACC, spaceAfter=3, leading=9)
desc_st = S("ds", fontName="Helvetica", fontSize=8.5, textColor=INK, leading=11)
price_st = S("pr", fontName="Helvetica-Bold", fontSize=11, textColor=NAVY, alignment=TA_CENTER)
poa_st = S("poa", fontName="Helvetica-Bold", fontSize=9, textColor=MUT, alignment=TA_CENTER)
head_st = S("hd", fontName="Helvetica-Bold", fontSize=10, textColor=colors.white)
head_c = S("hdc", fontName="Helvetica-Bold", fontSize=10, textColor=colors.white, alignment=TA_CENTER)
cat_st = S("cat", fontName="Helvetica-Bold", fontSize=15, textColor=NAVY, spaceBefore=6, spaceAfter=8)
noimg_st = S("ni", fontName="Helvetica-Oblique", fontSize=8, textColor=MUT, alignment=TA_CENTER)

PAGE_W, PAGE_H = letter
MARGIN = 0.75 * inch
CONTENT = PAGE_W - 2 * MARGIN
C_IMG, C_RET = 1.15 * inch, 1.15 * inch
C_NOTE = CONTENT - C_IMG - C_RET

story = []

# ---- Title page ----
story.append(Spacer(1, 2.2 * inch))
story.append(Paragraph("THE MOLECULE CO.", S("t1", fontName="Helvetica-Bold", fontSize=30, textColor=NAVY, alignment=TA_CENTER, spaceAfter=10)))
story.append(Paragraph("RESEARCH COMPOUND CATALOGUE", S("t2", fontName="Helvetica-Bold", fontSize=17, textColor=ACC, alignment=TA_CENTER, spaceAfter=4)))
story.append(Paragraph("Price Schedule", S("t3", fontName="Helvetica-Oblique", fontSize=14, textColor=MUT, alignment=TA_CENTER)))
story.append(Spacer(1, 1.0 * inch))
story.append(Paragraph("Prepared: 28 July 2026", S("t4", fontName="Helvetica", fontSize=11, textColor=INK, alignment=TA_CENTER, spaceAfter=10)))
story.append(Paragraph("Pricing in South African Rand (ZAR), Reconstituted (Pen).", S("t5", fontSize=10, textColor=MUT, alignment=TA_CENTER, spaceAfter=2)))
story.append(Paragraph("Excludes courier delivery. Subject to change without notice.", S("t6", fontSize=10, textColor=MUT, alignment=TA_CENTER)))
story.append(PageBreak())

# ---- Compliance + contents ----
story.append(Paragraph("Research Use &amp; Compliance Notice", S("c1", fontName="Helvetica-Bold", fontSize=14, textColor=NAVY, spaceAfter=8)))
story.append(Paragraph("Every compound in this catalogue is sold strictly for laboratory and research purposes. None of these products are registered medicines, and they have not been evaluated by SAHPRA, the FDA, or any equivalent regulatory body. The research notes in this document describe published research interest in each compound.", desc_st))
story.append(Spacer(1, 10))
story.append(Paragraph("How to read this catalogue", S("c2", fontName="Helvetica-Bold", fontSize=12, textColor=NAVY, spaceAfter=6)))
story.append(Paragraph("Products are grouped by research category. Each entry shows the product image, a unique product code, a plain-English summary of what researchers study the compound for, and the Retail reference price in ZAR. “POA” means Price On Application.", desc_st))
story.append(Spacer(1, 16))
story.append(Paragraph("Contents", S("c3", fontName="Helvetica-Bold", fontSize=13, textColor=NAVY, spaceAfter=8)))
for i, g in enumerate(data):
    story.append(Paragraph(f'{i+1}.&nbsp;&nbsp;{g["category"]} &nbsp;&mdash;&nbsp; <font color="#5A6B8C">{len(g["items"])} product{"s" if len(g["items"])>1 else ""}</font>', S("ct", fontSize=10, textColor=INK, spaceAfter=4)))
story.append(PageBreak())

# ---- Category tables ----
def img_flowable(item):
    p = item.get("img")
    if p and os.path.exists(os.path.join(ROOT, p)):
        try:
            return Image(os.path.join(ROOT, p), width=0.82*inch, height=1.09*inch, kind="proportional")
        except Exception:
            pass
    return Paragraph("No image", noimg_st)

for gi, g in enumerate(data):
    story.append(Paragraph(f'{gi+1}. {g["category"]}', cat_st))
    rows = [[Paragraph("Image", head_c), Paragraph("Product &amp; Research Notes", head_st), Paragraph("Retail (ZAR)", head_c)]]
    for item in g["items"]:
        note = [Paragraph(item["name"], name_st), Paragraph("Product Code: " + item["code"], code_st), Paragraph(item["desc"], desc_st)]
        price = Paragraph(item["price"], poa_st if item["price"] == "POA" else price_st)
        rows.append([img_flowable(item), note, price])
    t = Table(rows, colWidths=[C_IMG, C_NOTE, C_RET], repeatRows=1)
    st = [
        ("BACKGROUND", (0,0), (-1,0), NAVY),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("ALIGN", (0,0), (0,-1), "CENTER"),
        ("ALIGN", (2,0), (2,-1), "CENTER"),
        ("GRID", (0,0), (-1,-1), 0.5, LINE),
        ("BOX", (0,0), (-1,-1), 0.75, LINE),
        ("TOPPADDING", (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
        ("LEFTPADDING", (0,0), (-1,-1), 7),
        ("RIGHTPADDING", (0,0), (-1,-1), 7),
    ]
    for ri in range(1, len(rows)):
        if ri % 2 == 0:
            st.append(("BACKGROUND", (0,ri), (-1,ri), ALT))
    t.setStyle(TableStyle(st))
    story.append(t)
    if gi < len(data) - 1:
        story.append(PageBreak())

# ---- footer on every page ----
def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE); canvas.setLineWidth(0.5)
    canvas.line(MARGIN, 0.6*inch, PAGE_W-MARGIN, 0.6*inch)
    canvas.setFont("Helvetica", 7.5); canvas.setFillColor(MUT)
    canvas.drawString(MARGIN, 0.42*inch, "The Molecule Co. — Research Use Only. Prices in ZAR, excl. courier delivery. Subject to change.")
    canvas.drawRightString(PAGE_W-MARGIN, 0.42*inch, f"Page {doc.page}")
    canvas.restoreState()

frame = Frame(MARGIN, MARGIN, CONTENT, PAGE_H-2*MARGIN, id="main")
doc = BaseDocTemplate(os.path.join(ROOT, "molecule-co/The_Molecule_Co_Price_Schedule.pdf"),
    pagesize=letter, title="The Molecule Co. — Research Compound Catalogue Price Schedule", author="The Molecule Co.")
doc.addPageTemplates([PageTemplate(id="all", frames=[frame], onPage=footer)])
doc.build(story)
print("PDF written:", os.path.getsize(os.path.join(ROOT, "molecule-co/The_Molecule_Co_Price_Schedule.pdf")), "bytes")
