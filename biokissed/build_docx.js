// BioKissed SA price schedule (Word). Same layout as the Molecule Co reference
// (title page, image | product notes | retail table, running header/footer) recoloured
// to the BioKissed palette, inverted teal logo on white, Montserrat.
// Usage: node build_docx.js cust   |   node build_docx.js internal
const fs = require('fs');
const path = require('path');
const NM = '/tmp/claude-0/-home-user-skills-introduction-to-github/22b8bf91-6862-5a5e-96a1-c366166d9778/scratchpad/node_modules/docx';
const {
  Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell,
  WidthType, BorderStyle, ShadingType, ImageRun, PageBreak, Header, Footer, PageNumber,
  TabStopType, VerticalAlign,
} = require(NM);

const MODE = process.argv[2] || 'cust';
const INTERNAL = MODE === 'internal';
const ROOT = path.resolve(__dirname);
const data = JSON.parse(fs.readFileSync(path.join(ROOT, '_bk_data.json'), 'utf8'));
const logo = fs.readFileSync(path.join(ROOT, 'assets/logo_lockup_teal.png'));
const icon = fs.readFileSync(path.join(ROOT, 'assets/butterfly_teal.png'));
const F = 'Montserrat';

const TEAL = '5E7E92', TERRA = '9F6652', NAVY = '1A2A49', MUT = '6E7A84',
      INK = '333A40', LINE = 'DDE4E8', ALT = 'F5F7F8';
const PAGE_W = 11906, MARGIN = 851;
const CONTENT = PAGE_W - 2 * MARGIN;
const C_IMG = 1700, C_RET = 1500, C_NOTE = CONTENT - C_IMG - C_RET;
const grid = { style: BorderStyle.SINGLE, size: 4, color: LINE };

function cell(children, w, opts = {}) {
  return new TableCell({
    width: { size: w, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER,
    margins: { top: 90, bottom: 90, left: 130, right: 130 },
    shading: opts.fill ? { type: ShadingType.CLEAR, color: 'auto', fill: opts.fill } : undefined,
    children,
  });
}
const R = (o) => new TextRun(Object.assign({ font: F }, o));
const spacedTitle = 'RESEARCH  COMPOUND  CATALOGUE'.split('').join(' ');

const children = [];
// ---- Title page ----
children.push(
  new Paragraph({ spacing: { before: 3000, after: 60 }, alignment: AlignmentType.CENTER,
    children: [new ImageRun({ type: 'png', data: logo, transformation: { width: 320, height: 320 * 235 / 1859 } })] }),
  new Paragraph({ spacing: { after: 120 }, alignment: AlignmentType.CENTER,
    children: [R({ text: 'loving nature', size: 24, color: TEAL })] }),
  new Paragraph({ spacing: { after: 60 }, alignment: AlignmentType.CENTER,
    children: [R({ text: spacedTitle, bold: true, size: 26, color: TERRA })] }),
  new Paragraph({ alignment: AlignmentType.CENTER,
    children: [R({ text: INTERNAL ? 'Internal Price Schedule' : 'Price Schedule', size: 26, color: TEAL })] }),
  new Paragraph({ spacing: { before: 160 }, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: TERRA, space: 6 } }, children: [] }),
  new Paragraph({ spacing: { before: 1400, after: 200 }, alignment: AlignmentType.CENTER,
    children: [R({ text: 'Prepared: 30 July 2026', size: 22, color: MUT })] }),
  new Paragraph({ spacing: { after: 20 }, alignment: AlignmentType.CENTER,
    children: [R({ text: 'Pricing in South African Rand (ZAR),', bold: true, size: 30, color: NAVY })] }),
  new Paragraph({ spacing: { after: 220 }, alignment: AlignmentType.CENTER,
    children: [R({ text: 'Reconstituted (Pen).', bold: true, size: 30, color: NAVY })] }),
  new Paragraph({ spacing: { after: 10 }, alignment: AlignmentType.CENTER,
    children: [R({ text: 'Excludes courier delivery.', size: 20, color: MUT })] }),
  new Paragraph({ alignment: AlignmentType.CENTER,
    children: [R({ text: 'Subject to change without notice.', size: 20, color: MUT })] }),
);
if (INTERNAL) children.push(new Paragraph({ spacing: { before: 400 }, alignment: AlignmentType.CENTER,
  children: [R({ text: 'CONFIDENTIAL — INTERNAL USE (product codes shown)', bold: true, size: 18, color: TERRA })] }));
children.push(new Paragraph({ children: [new PageBreak()] }));

// ---- Category tables ----
data.forEach((g, gi) => {
  children.push(
    new Paragraph({ spacing: { before: gi === 0 ? 40 : 160, after: 0 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: TERRA, space: 4 } },
      children: [R({ text: `${gi + 1}.  ${g.category}`, bold: true, size: 30, color: NAVY })] }),
    new Paragraph({ spacing: { before: 80, after: 140 },
      children: [R({ text: g.sub, size: 21, color: MUT })] }),
  );
  const head = new TableRow({ tableHeader: true, children: [
    cell([new Paragraph({ alignment: AlignmentType.CENTER, children: [R({ text: 'Image', bold: true, color: 'FFFFFF', size: 20 })] })], C_IMG, { fill: TEAL }),
    cell([new Paragraph({ children: [R({ text: 'Product & Research Notes', bold: true, color: 'FFFFFF', size: 20 })] })], C_NOTE, { fill: TEAL }),
    cell([new Paragraph({ alignment: AlignmentType.CENTER, children: [R({ text: 'Retail (ZAR)', bold: true, color: 'FFFFFF', size: 20 })] })], C_RET, { fill: TEAL }),
  ]});
  const rows = [head];
  g.items.forEach((item, idx) => {
    const fill = (idx % 2 === 1) ? ALT : undefined;
    const imgPath = path.join(ROOT, '..', item.img);
    const imgCell = fs.existsSync(imgPath)
      ? cell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ type: 'png', data: fs.readFileSync(imgPath), transformation: { width: 78, height: 104 } })] })], C_IMG, { fill })
      : cell([new Paragraph({ alignment: AlignmentType.CENTER, children: [R({ text: 'No image', color: MUT, size: 16 })] })], C_IMG, { fill });
    const noteKids = [new Paragraph({ spacing: { after: INTERNAL ? 20 : 40 }, children: [R({ text: item.name, bold: true, size: 23, color: NAVY })] })];
    if (INTERNAL) noteKids.push(new Paragraph({ spacing: { after: 40 }, children: [R({ text: 'Product Code: ' + item.code, bold: true, size: 15, color: TEAL })] }));
    noteKids.push(new Paragraph({ children: [R({ text: item.desc, size: 18, color: INK })] }));
    const note = cell(noteKids, C_NOTE, { fill });
    const poa = item.price === 'POA';
    const price = cell([new Paragraph({ alignment: AlignmentType.CENTER, children: [R({ text: item.price, bold: true, size: poa ? 18 : 22, color: poa ? MUT : TEAL })] })], C_RET, { fill });
    rows.push(new TableRow({ children: [imgCell, note, price] }));
  });
  children.push(new Table({
    width: { size: CONTENT, type: WidthType.DXA }, columnWidths: [C_IMG, C_NOTE, C_RET],
    borders: { top: grid, bottom: grid, left: grid, right: grid, insideHorizontal: grid, insideVertical: grid },
    rows,
  }));
  if (gi < data.length - 1) children.push(new Paragraph({ children: [new PageBreak()] }));
});

const header = new Header({ children: [
  new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE, space: 4 } },
    children: [
      new ImageRun({ type: 'png', data: icon, transformation: { width: 22, height: 22 } }),
      R({ text: '  BIOKISSED SA', bold: true, size: 18, color: TEAL }),
    ] }),
]});
const footer = new Footer({ children: [
  new Paragraph({ border: { top: { style: BorderStyle.SINGLE, size: 4, color: LINE, space: 4 } },
    tabStops: [{ type: TabStopType.RIGHT, position: CONTENT }],
    children: [
      R({ text: 'Research Use Only — Prices ZAR' + (INTERNAL ? '  ·  Internal' : ''), size: 16, color: MUT }),
      R({ text: '\t', size: 16 }),
      R({ text: 'Page ', size: 16, color: MUT }),
      new TextRun({ children: [PageNumber.CURRENT], font: F, size: 16, color: MUT }),
      R({ text: ' of ', size: 16, color: MUT }),
      new TextRun({ children: [PageNumber.TOTAL_PAGES], font: F, size: 16, color: MUT }),
    ] }),
]});

const doc = new Document({
  creator: 'BioKissed SA', title: 'BioKissed SA — Research Compound Price Schedule',
  sections: [{
    properties: { titlePage: true, page: { size: { width: 11906, height: 16838 }, margin: { top: 1300, bottom: 1000, left: MARGIN, right: MARGIN, header: 700, footer: 500 } } },
    headers: { default: header, first: new Header({ children: [new Paragraph({ children: [] })] }) },
    footers: { default: footer, first: new Footer({ children: [new Paragraph({ children: [] })] }) },
    children,
  }],
});
const fn = INTERNAL ? 'BioKissed_SA_Price_Schedule_Internal.docx' : 'BioKissed_SA_Price_List.docx';
Packer.toBuffer(doc).then(buf => { fs.writeFileSync(path.join(ROOT, fn), buf); console.log('DOCX written:', fn, buf.length, 'bytes'); });
