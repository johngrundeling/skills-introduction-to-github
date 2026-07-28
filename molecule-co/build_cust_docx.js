const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell,
  WidthType, BorderStyle, ShadingType, ImageRun, PageBreak, Header, Footer, PageNumber,
  TabStopType, TabStopPosition, VerticalAlign,
} = require('docx');

const ROOT = '/home/user/skills-introduction-to-github';
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'molecule-co/_cust_data.json'), 'utf8'));
const logo = fs.readFileSync(path.join(ROOT, 'molecule-co/assets/logo.png'));
const icon = fs.readFileSync(path.join(ROOT, 'molecule-co/assets/logo_icon.png'));

const NAVY = '1A2A49', GOLD = 'AF8A3D', MUT = '6B7280', INK = '333333', LINE = 'D9DEE7', ALT = 'F5F6F8';
const PAGE_W = 11906, MARGIN = 851;                 // A4 portrait, ~15mm margins (twips)
const CONTENT = PAGE_W - 2 * MARGIN;
const C_IMG = 1700, C_RET = 1500, C_NOTE = CONTENT - C_IMG - C_RET;
const noB = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const grid = { style: BorderStyle.SINGLE, size: 4, color: LINE };

function cell(children, w, opts = {}) {
  return new TableCell({
    width: { size: w, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER,
    margins: { top: 90, bottom: 90, left: 130, right: 130 },
    shading: opts.fill ? { type: ShadingType.CLEAR, color: 'auto', fill: opts.fill } : undefined,
    children,
  });
}
const spacedTitle = 'RESEARCH  COMPOUND  CATALOGUE'.split('').join(' ');

const children = [];
// ---- Title page ----
children.push(
  new Paragraph({ spacing: { before: 3200, after: 120 }, alignment: AlignmentType.CENTER,
    children: [new ImageRun({ type: 'png', data: logo, transformation: { width: 300, height: 59 } })] }),
  new Paragraph({ spacing: { before: 120, after: 60 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: spacedTitle, bold: true, size: 28, color: GOLD })] }),
  new Paragraph({ alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Price Schedule', italics: true, size: 26, color: NAVY })] }),
  new Paragraph({ spacing: { before: 160, after: 0 }, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: GOLD, space: 6 } }, children: [] }),
  new Paragraph({ spacing: { before: 1500, after: 200 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Prepared: 28 July 2026', size: 22, color: MUT })] }),
  new Paragraph({ spacing: { after: 20 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Pricing in South African Rand (ZAR),', bold: true, size: 30, color: NAVY })] }),
  new Paragraph({ spacing: { after: 220 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Reconstructed (Pen),', bold: true, size: 30, color: NAVY })] }),
  new Paragraph({ spacing: { after: 10 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'excludes courier delivery,', size: 20, color: MUT })] }),
  new Paragraph({ alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Subject to change without notice.', size: 20, color: MUT })] }),
  new Paragraph({ children: [new PageBreak()] }),
);

// ---- Category tables ----
data.forEach((g, gi) => {
  children.push(
    new Paragraph({ spacing: { before: gi === 0 ? 40 : 160, after: 0 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: GOLD, space: 4 } },
      children: [new TextRun({ text: `${gi + 1}.  ${g.category}`, bold: true, size: 32, color: NAVY })] }),
    new Paragraph({ spacing: { before: 80, after: 140 },
      children: [new TextRun({ text: g.sub, italics: true, size: 21, color: MUT })] }),
  );
  const head = new TableRow({ tableHeader: true, children: [
    cell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Image', bold: true, color: 'FFFFFF', size: 20 })] })], C_IMG, { fill: NAVY }),
    cell([new Paragraph({ children: [new TextRun({ text: 'Product & Research Notes', bold: true, color: 'FFFFFF', size: 20 })] })], C_NOTE, { fill: NAVY }),
    cell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Retail (ZAR)', bold: true, color: 'FFFFFF', size: 20 })] })], C_RET, { fill: NAVY }),
  ]});
  const rows = [head];
  g.items.forEach((item, idx) => {
    const fill = (idx % 2 === 1) ? ALT : undefined;
    const imgCell = (item.img && fs.existsSync(path.join(ROOT, item.img)))
      ? cell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ type: 'png', data: fs.readFileSync(path.join(ROOT, item.img)), transformation: { width: 78, height: 104 } })] })], C_IMG, { fill })
      : cell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'No image', italics: true, color: MUT, size: 16 })] })], C_IMG, { fill });
    const note = cell([
      new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: item.name, bold: true, size: 23, color: NAVY })] }),
      new Paragraph({ children: [new TextRun({ text: item.desc, size: 18, color: INK })] }),
    ], C_NOTE, { fill });
    const poa = item.price === 'POA';
    const price = cell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.price, bold: true, size: poa ? 18 : 22, color: poa ? MUT : NAVY })] })], C_RET, { fill });
    rows.push(new TableRow({ children: [imgCell, note, price] }));
  });
  children.push(new Table({
    width: { size: CONTENT, type: WidthType.DXA }, columnWidths: [C_IMG, C_NOTE, C_RET],
    borders: { top: grid, bottom: grid, left: grid, right: grid, insideHorizontal: grid, insideVertical: grid },
    rows,
  }));
  if (gi < data.length - 1) children.push(new Paragraph({ children: [new PageBreak()] }));
});

// ---- header / footer (suppressed on title page via titlePage + empty first) ----
const header = new Header({ children: [
  new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE, space: 4 } },
    children: [
      new ImageRun({ type: 'png', data: icon, transformation: { width: 26, height: 26 } }),
      new TextRun({ text: '  THE MOLECULE CO.', bold: true, size: 18, color: NAVY }),
    ],
  }),
]});
const footer = new Footer({ children: [
  new Paragraph({
    border: { top: { style: BorderStyle.SINGLE, size: 4, color: LINE, space: 4 } },
    tabStops: [{ type: TabStopType.RIGHT, position: CONTENT }],
    children: [
      new TextRun({ text: 'Research Use Only — Prices ZAR,', size: 16, color: MUT }),
      new TextRun({ text: '\t', size: 16 }),
      new TextRun({ text: 'Page ', size: 16, color: MUT }),
      new TextRun({ children: [PageNumber.CURRENT], size: 16, color: MUT }),
      new TextRun({ text: ' of ', size: 16, color: MUT }),
      new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: MUT }),
    ],
  }),
]});
const empty = new Paragraph({ children: [] });

const doc = new Document({
  creator: 'The Molecule Co.', title: 'The Molecule Co. — Research Compound Catalogue Price Schedule',
  sections: [{
    properties: {
      titlePage: true,
      page: { size: { width: 11906, height: 16838 }, margin: { top: 1300, bottom: 1000, left: MARGIN, right: MARGIN, header: 700, footer: 500 } },
    },
    headers: { default: header, first: new Header({ children: [empty] }) },
    footers: { default: footer, first: new Footer({ children: [new Paragraph({ children: [] })] }) },
    children,
  }],
});
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(path.join(ROOT, 'molecule-co/The_Molecule_Co_Price_Schedule_Cust.docx'), buf);
  console.log('Customer DOCX written:', buf.length, 'bytes');
});
