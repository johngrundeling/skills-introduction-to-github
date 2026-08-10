#!/usr/bin/env python3
"""BioKissed SA price list / schedule PDF.
Same A4 layout as the Molecule Co reference (title page, image | product notes | retail
table, page X of Y chrome) — recoloured to the BioKissed palette, inverted teal logo on
white, Montserrat throughout.  `python build_pdf.py cust`  or  `... internal`."""
import json, os, sys
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer,
    Table, TableStyle, Image, PageBreak, NextPageTemplate, Flowable)
from reportlab.lib.enums import TA_CENTER
from reportlab.pdfgen import canvas as canvasmod
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

MODE = sys.argv[1] if len(sys.argv) > 1 else "cust"   # 'cust' | 'internal' | 'reseller'
INTERNAL = MODE == "internal"
RESELLER = MODE == "reseller"
SHOW_CODES = INTERNAL or RESELLER

ROOT = os.path.dirname(os.path.abspath(__file__))
data = json.load(open(os.path.join(ROOT, "_bk_reseller_data.json" if RESELLER else "_bk_data.json")))
AST = os.path.join(ROOT, "assets")
LOGO = os.path.join(AST, "logo_lockup_teal.png")
ICON = os.path.join(AST, "butterfly_teal.png")

# ---- register Montserrat ----
for w, f in [("MT", "Regular"), ("MT-Md", "Medium"), ("MT-Sb", "SemiBold"), ("MT-Bd", "Bold")]:
    pdfmetrics.registerFont(TTFont(w, os.path.join(AST, f"Montserrat-{f}.ttf")))

TEAL  = colors.HexColor("#5E7E92")   # header band / structure  (was NAVY)
TEALL = colors.HexColor("#779CB0")
TERRA = colors.HexColor("#9F6652")   # accent rule              (was GOLD)
NAVY  = colors.HexColor("#1A2A49")   # body text
MUT   = colors.HexColor("#6E7A84")
LINE  = colors.HexColor("#DDE4E8")
INK   = colors.HexColor("#333A40")
ALT   = colors.HexColor("#F5F7F8")

def S(name, **kw):
    kw.setdefault("leading", kw.get("fontSize", 10) * 1.25)
    return ParagraphStyle(name, parent=getSampleStyleSheet()["Normal"], **kw)

name_st = S("nm", fontName="MT-Bd", fontSize=10.5, textColor=NAVY, spaceAfter=3, leading=13)
code_st = S("cd", fontName="MT-Sb", fontSize=7.3, textColor=TEAL, spaceAfter=3, leading=9)
desc_st = S("ds", fontName="MT", fontSize=8.4, textColor=INK, leading=11.5)
price_st= S("pr", fontName="MT-Bd", fontSize=11, textColor=TEAL, alignment=TA_CENTER)
poa_st  = S("poa", fontName="MT-Sb", fontSize=9.5, textColor=MUT, alignment=TA_CENTER)
head_st = S("hd", fontName="MT-Bd", fontSize=9.5, textColor=colors.white)
head_c  = S("hdc", fontName="MT-Bd", fontSize=9.5, textColor=colors.white, alignment=TA_CENTER)
cat_st  = S("cat", fontName="MT-Bd", fontSize=16, textColor=NAVY, spaceAfter=2)
sub_st  = S("sub", fontName="MT-Md", fontSize=10, textColor=MUT, spaceBefore=4, spaceAfter=10)
noimg_st= S("ni", fontName="MT-Md", fontSize=8, textColor=MUT, alignment=TA_CENTER)

PAGE_W, PAGE_H = A4
MARGIN = 15 * mm
CONTENT = PAGE_W - 2 * MARGIN
C_IMG, C_RET = 30 * mm, 26 * mm
C_NOTE = CONTENT - C_IMG - C_RET

class HRule(Flowable):
    def __init__(self, width, color, thickness=1.2, space=2):
        super().__init__(); self.width=width; self.color=color; self.t=thickness; self.space=space
    def wrap(self, w, h): return (self.width, self.t + self.space)
    def draw(self):
        self.canv.setStrokeColor(self.color); self.canv.setLineWidth(self.t)
        self.canv.line(0, self.space, self.width, self.space)

story = [NextPageTemplate("body")]
# ---- TITLE PAGE ----
story.append(Spacer(1, 32 * mm))
story.append(Image(LOGO, width=92 * mm, height=92 * mm * 235 / 1859, kind="proportional", hAlign="CENTER"))
story.append(Spacer(1, 3 * mm))
story.append(Paragraph("loving nature", S("tag", fontName="MT-Md", fontSize=12, textColor=TEAL, alignment=TA_CENTER, spaceAfter=10)))
story.append(Paragraph("R E S E A R C H&nbsp;&nbsp; C O M P O U N D&nbsp;&nbsp; C A T A L O G U E",
                       S("t2", fontName="MT-Bd", fontSize=14, textColor=TERRA, alignment=TA_CENTER, spaceAfter=4)))
_subtitle = "Reseller Price Schedule" if RESELLER else ("Internal Price Schedule" if INTERNAL else "Price Schedule")
story.append(Paragraph(_subtitle,
                       S("t3", fontName="MT-Md", fontSize=13, textColor=TEAL, alignment=TA_CENTER)))
story.append(Spacer(1, 5 * mm))
story.append(HRule(CONTENT, TERRA, 1.1, 0))
story.append(Spacer(1, 28 * mm))
story.append(Paragraph("Prepared: 30 July 2026", S("t4", fontName="MT", fontSize=11, textColor=MUT, alignment=TA_CENTER, spaceAfter=12)))
story.append(Paragraph("Pricing in South African Rand (ZAR),", S("t5", fontName="MT-Bd", fontSize=15, textColor=NAVY, alignment=TA_CENTER, spaceAfter=2)))
story.append(Paragraph("Reconstituted (Pen).", S("t5b", fontName="MT-Bd", fontSize=15, textColor=NAVY, alignment=TA_CENTER, spaceAfter=14)))
story.append(Paragraph("Excludes courier delivery.", S("t6", fontName="MT", fontSize=10.5, textColor=MUT, alignment=TA_CENTER, spaceAfter=1)))
story.append(Paragraph("Subject to change without notice.", S("t7", fontName="MT", fontSize=10.5, textColor=MUT, alignment=TA_CENTER)))
if RESELLER:
    story.append(Spacer(1, 10 * mm))
    story.append(Paragraph("RESELLER PRICING — for approved resellers only (retail +25%; product codes shown)",
                           S("conf", fontName="MT-Sb", fontSize=9, textColor=TERRA, alignment=TA_CENTER)))
elif INTERNAL:
    story.append(Spacer(1, 10 * mm))
    story.append(Paragraph("CONFIDENTIAL — INTERNAL USE (product codes shown)",
                           S("conf", fontName="MT-Sb", fontSize=9, textColor=TERRA, alignment=TA_CENTER)))
story.append(PageBreak())

# ---- CATEGORY TABLES ----
def img_flowable(item):
    p = os.path.join(ROOT, "..", item.get("img", ""))
    if item.get("img") and os.path.exists(p):
        try: return Image(p, width=20 * mm, height=27 * mm, kind="proportional")
        except Exception: pass
    return Paragraph("No image", noimg_st)

for gi, g in enumerate(data):
    story.append(Paragraph(f'{gi+1}.&nbsp;&nbsp;{g["category"]}', cat_st))
    story.append(HRule(CONTENT, TERRA, 1.1, 1))
    story.append(Paragraph(g["sub"], sub_st))
    _pricehead = "Reseller (ZAR)" if RESELLER else "Retail (ZAR)"
    rows = [[Paragraph("Image", head_c), Paragraph("Product &amp; Research Notes", head_st), Paragraph(_pricehead, head_c)]]
    for item in g["items"]:
        note = [Paragraph(item["name"], name_st)]
        if SHOW_CODES:
            note.append(Paragraph("Product Code: " + item["code"], code_st))
        note.append(Paragraph(item["desc"], desc_st))
        price = Paragraph(item["price"], poa_st if item["price"] in ("POA",) else price_st)
        rows.append([img_flowable(item), note, price])
    t = Table(rows, colWidths=[C_IMG, C_NOTE, C_RET], repeatRows=1)
    stl = [
        ("BACKGROUND", (0,0), (-1,0), TEAL),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("ALIGN", (0,0), (0,-1), "CENTER"), ("ALIGN", (2,0), (2,-1), "CENTER"),
        ("LINEBELOW", (0,0), (-1,-1), 0.5, LINE),
        ("LINEAFTER", (0,1), (1,-1), 0.5, LINE),
        ("BOX", (0,0), (-1,-1), 0.6, LINE),
        ("TOPPADDING", (0,0), (-1,-1), 7), ("BOTTOMPADDING", (0,0), (-1,-1), 7),
        ("LEFTPADDING", (0,0), (-1,-1), 8), ("RIGHTPADDING", (0,0), (-1,-1), 8),
    ]
    for ri in range(1, len(rows)):
        if ri % 2 == 0: stl.append(("BACKGROUND", (0,ri), (-1,ri), ALT))
    t.setStyle(TableStyle(stl))
    story.append(t)
    if gi < len(data) - 1: story.append(PageBreak())

# ---- chrome: header + footer + page X of Y ----
class NumberedCanvas(canvasmod.Canvas):
    def __init__(self, *a, **k):
        super().__init__(*a, **k); self._saved = []
    def showPage(self):
        self._saved.append(dict(self.__dict__)); self._startPage()
    def save(self):
        total = len(self._saved)
        for st in self._saved:
            self.__dict__.update(st)
            if self._pageNumber > 1: self._chrome(total)
            super().showPage()
        super().save()
    def _chrome(self, total):
        try: self.drawImage(ICON, MARGIN, PAGE_H - MARGIN - 9*mm, width=9*mm, height=9*mm, mask="auto", preserveAspectRatio=True)
        except Exception: pass
        self.setFont("MT-Bd", 9); self.setFillColor(TEAL)
        self.drawString(MARGIN + 11*mm, PAGE_H - MARGIN - 5*mm, "BIOKISSED SA")
        self.setStrokeColor(LINE); self.setLineWidth(0.6)
        self.line(MARGIN, PAGE_H - MARGIN - 11*mm, PAGE_W - MARGIN, PAGE_H - MARGIN - 11*mm)
        self.line(MARGIN, MARGIN - 2*mm, PAGE_W - MARGIN, MARGIN - 2*mm)
        self.setFont("MT", 8); self.setFillColor(MUT)
        tag = "Research Use Only — Prices ZAR" + ("  ·  Reseller" if RESELLER else ("  ·  Internal" if INTERNAL else ""))
        self.drawString(MARGIN, MARGIN - 6*mm, tag)
        self.drawRightString(PAGE_W - MARGIN, MARGIN - 6*mm, f"Page {self._pageNumber} of {total}")

frame = Frame(MARGIN, MARGIN + 4*mm, CONTENT, PAGE_H - 2*MARGIN - 15*mm, id="main", topPadding=6)
title_frame = Frame(MARGIN, MARGIN, CONTENT, PAGE_H - 2*MARGIN, id="title")
fn = ("BioKissed_SA_Reseller_Price_Schedule.pdf" if RESELLER
      else "BioKissed_SA_Price_Schedule_Internal.pdf" if INTERNAL
      else "BioKissed_SA_Price_List.pdf")
doc = BaseDocTemplate(os.path.join(ROOT, fn), pagesize=A4,
    title="BioKissed SA — Research Compound Price Schedule", author="BioKissed SA")
doc.addPageTemplates([
    PageTemplate(id="title", frames=[title_frame]),
    PageTemplate(id="body", frames=[frame]),
])
doc.build(story, canvasmaker=NumberedCanvas)
print("PDF written:", fn, os.path.getsize(os.path.join(ROOT, fn)), "bytes")
