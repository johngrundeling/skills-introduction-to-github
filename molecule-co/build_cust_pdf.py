import json, os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer,
    Table, TableStyle, Image, PageBreak)
from reportlab.lib.enums import TA_CENTER
from reportlab.pdfgen import canvas as canvasmod

ROOT = "/home/user/skills-introduction-to-github"
data = json.load(open(os.path.join(ROOT, "molecule-co/_cust_data.json"), encoding="utf-8"))
LOGO = os.path.join(ROOT, "molecule-co/assets/logo.png")
ICON = os.path.join(ROOT, "molecule-co/assets/logo_icon.png")

NAVY = colors.HexColor("#1A2A49"); GOLD = colors.HexColor("#AF8A3D")
MUT = colors.HexColor("#6B7280"); LINE = colors.HexColor("#D9DEE7")
INK = colors.HexColor("#333333"); ALT = colors.HexColor("#F5F6F8")

def S(name, **kw):
    kw.setdefault("leading", kw.get("fontSize", 10) * 1.25)
    return ParagraphStyle(name, parent=getSampleStyleSheet()["Normal"], **kw)

name_st = S("nm", fontName="Helvetica-Bold", fontSize=11, textColor=NAVY, spaceAfter=3, leading=13)
desc_st = S("ds", fontName="Helvetica", fontSize=8.7, textColor=INK, leading=11.5)
price_st = S("pr", fontName="Helvetica-Bold", fontSize=11, textColor=NAVY, alignment=TA_CENTER)
poa_st = S("poa", fontName="Helvetica-Bold", fontSize=9.5, textColor=MUT, alignment=TA_CENTER)
head_st = S("hd", fontName="Helvetica-Bold", fontSize=10, textColor=colors.white)
head_c = S("hdc", fontName="Helvetica-Bold", fontSize=10, textColor=colors.white, alignment=TA_CENTER)
cat_st = S("cat", fontName="Helvetica-Bold", fontSize=17, textColor=NAVY, spaceAfter=2)
sub_st = S("sub", fontName="Helvetica-Oblique", fontSize=10.5, textColor=MUT, spaceBefore=4, spaceAfter=10)
noimg_st = S("ni", fontName="Helvetica-Oblique", fontSize=8, textColor=MUT, alignment=TA_CENTER)

PAGE_W, PAGE_H = A4
MARGIN = 15 * mm
CONTENT = PAGE_W - 2 * MARGIN
C_IMG, C_RET = 30 * mm, 26 * mm
C_NOTE = CONTENT - C_IMG - C_RET

# ---------- flowables for a gold rule + category heading ----------
from reportlab.platypus import Flowable
class HRule(Flowable):
    def __init__(self, width, color, thickness=1.2, space=2):
        super().__init__(); self.width=width; self.color=color; self.t=thickness; self.space=space
    def wrap(self, w, h): return (self.width, self.t + self.space)
    def draw(self):
        self.canv.setStrokeColor(self.color); self.canv.setLineWidth(self.t)
        self.canv.line(0, self.space, self.width, self.space)

story = []
# ----- TITLE PAGE -----
story.append(Spacer(1, 34 * mm))
story.append(Image(LOGO, width=78 * mm, height=78 * mm * 100 / 512, kind="proportional", hAlign="CENTER"))
story.append(Spacer(1, 7 * mm))
story.append(Paragraph('R E S E A R C H&nbsp;&nbsp; C O M P O U N D&nbsp;&nbsp; C A T A L O G U E',
                       S("t2", fontName="Helvetica-Bold", fontSize=15, textColor=GOLD, alignment=TA_CENTER, spaceAfter=3)))
story.append(Paragraph("Price Schedule", S("t3", fontName="Helvetica-Oblique", fontSize=13, textColor=NAVY, alignment=TA_CENTER)))
story.append(Spacer(1, 5 * mm))
story.append(HRule(CONTENT, GOLD, 1.1, 0))
story.append(Spacer(1, 30 * mm))
story.append(Paragraph("Prepared: 28 July 2026", S("t4", fontSize=11, textColor=MUT, alignment=TA_CENTER, spaceAfter=12)))
story.append(Paragraph("Pricing in South African Rand (ZAR),", S("t5", fontName="Helvetica-Bold", fontSize=15, textColor=NAVY, alignment=TA_CENTER, spaceAfter=2)))
story.append(Paragraph("Reconstructed (Pen),", S("t5b", fontName="Helvetica-Bold", fontSize=15, textColor=NAVY, alignment=TA_CENTER, spaceAfter=14)))
story.append(Paragraph("excludes courier delivery,", S("t6", fontSize=10.5, textColor=MUT, alignment=TA_CENTER, spaceAfter=1)))
story.append(Paragraph("Subject to change without notice.", S("t7", fontSize=10.5, textColor=MUT, alignment=TA_CENTER)))
story.append(PageBreak())

# ----- CATEGORY TABLES -----
def img_flowable(item):
    p = item.get("img")
    if p and os.path.exists(os.path.join(ROOT, p)):
        try: return Image(os.path.join(ROOT, p), width=20 * mm, height=27 * mm, kind="proportional")
        except Exception: pass
    return Paragraph("No image", noimg_st)

for gi, g in enumerate(data):
    story.append(Paragraph(f'{gi+1}.&nbsp;&nbsp;{g["category"]}', cat_st))
    story.append(HRule(CONTENT, GOLD, 1.1, 1))
    story.append(Paragraph(g["sub"], sub_st))
    rows = [[Paragraph("Image", head_c), Paragraph("Product &amp; Research Notes", head_st), Paragraph("Retail (ZAR)", head_c)]]
    for item in g["items"]:
        note = [Paragraph(item["name"], name_st), Paragraph(item["desc"], desc_st)]
        price = Paragraph(item["price"], poa_st if item["price"] == "POA" else price_st)
        rows.append([img_flowable(item), note, price])
    t = Table(rows, colWidths=[C_IMG, C_NOTE, C_RET], repeatRows=1)
    st = [
        ("BACKGROUND", (0,0), (-1,0), NAVY),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("ALIGN", (0,0), (0,-1), "CENTER"), ("ALIGN", (2,0), (2,-1), "CENTER"),
        ("LINEBELOW", (0,0), (-1,-1), 0.5, LINE),
        ("LINEAFTER", (0,1), (1,-1), 0.5, LINE),
        ("BOX", (0,0), (-1,-1), 0.6, LINE),
        ("TOPPADDING", (0,0), (-1,-1), 7), ("BOTTOMPADDING", (0,0), (-1,-1), 7),
        ("LEFTPADDING", (0,0), (-1,-1), 8), ("RIGHTPADDING", (0,0), (-1,-1), 8),
    ]
    for ri in range(1, len(rows)):
        if ri % 2 == 0: st.append(("BACKGROUND", (0,ri), (-1,ri), ALT))
    t.setStyle(TableStyle(st))
    story.append(t)
    if gi < len(data) - 1: story.append(PageBreak())

# ----- header/footer + page X of Y via numbered canvas -----
class NumberedCanvas(canvasmod.Canvas):
    def __init__(self, *a, **k):
        super().__init__(*a, **k); self._saved = []
    def showPage(self):
        self._saved.append(dict(self.__dict__)); self._startPage()
    def save(self):
        total = len(self._saved)
        for st in self._saved:
            self.__dict__.update(st)
            if self._pageNumber > 1: self._draw_chrome(total)
            super().showPage()
        super().save()
    def _draw_chrome(self, total):
        # header: icon + wordmark + rule
        try: self.drawImage(ICON, MARGIN, PAGE_H - MARGIN - 9*mm, width=11*mm, height=11*mm, mask="auto", preserveAspectRatio=True)
        except Exception: pass
        self.setFont("Helvetica-Bold", 9); self.setFillColor(NAVY)
        self.drawString(MARGIN + 13*mm, PAGE_H - MARGIN - 5*mm, "THE MOLECULE CO.")
        self.setStrokeColor(LINE); self.setLineWidth(0.6)
        self.line(MARGIN, PAGE_H - MARGIN - 11*mm, PAGE_W - MARGIN, PAGE_H - MARGIN - 11*mm)
        # footer
        self.line(MARGIN, MARGIN - 2*mm, PAGE_W - MARGIN, MARGIN - 2*mm)
        self.setFont("Helvetica", 8); self.setFillColor(MUT)
        self.drawString(MARGIN, MARGIN - 6*mm, "Research Use Only — Prices ZAR,")
        self.drawRightString(PAGE_W - MARGIN, MARGIN - 6*mm, f"Page {self._pageNumber} of {total}")

# content frame leaves room for header (top) and footer (bottom)
frame = Frame(MARGIN, MARGIN + 4*mm, CONTENT, PAGE_H - 2*MARGIN - 15*mm, id="main", topPadding=6)
title_frame = Frame(MARGIN, MARGIN, CONTENT, PAGE_H - 2*MARGIN, id="title")
doc = BaseDocTemplate(os.path.join(ROOT, "molecule-co/The_Molecule_Co_Price_Schedule_Cust.pdf"),
    pagesize=A4, title="The Molecule Co. — Research Compound Catalogue Price Schedule", author="The Molecule Co.")
doc.addPageTemplates([
    PageTemplate(id="title", frames=[title_frame]),
    PageTemplate(id="body", frames=[frame]),
])
# first flowable on title page; switch template after first page break
from reportlab.platypus import NextPageTemplate
story.insert(0, NextPageTemplate("body"))
doc.build(story, canvasmaker=NumberedCanvas)
print("Customer PDF written:", os.path.getsize(os.path.join(ROOT, "molecule-co/The_Molecule_Co_Price_Schedule_Cust.pdf")), "bytes")
