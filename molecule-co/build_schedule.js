const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, ImageRun, PageBreak
} = require('docx');

const ROOT = '/home/user/skills-introduction-to-github';
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'molecule-co/_schedule_data.json'), 'utf8'));

const NAVY = '17335A', ACC = '0A66C2', MUT = '5A6B8C', LINE = 'D6DEEA';
const PAGE_W = 12240, MARGIN = 1080;               // US Letter portrait, 0.75" margins
const CONTENT = PAGE_W - 2 * MARGIN;               // usable width
const C_IMG = 1500, C_RET = 1500, C_NOTE = CONTENT - C_IMG - C_RET;

function tcell(children, w, opts = {}) {
  return new TableCell({
    width: { size: w, type: WidthType.DXA },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign: 'center',
    shading: opts.shading ? { type: ShadingType.CLEAR, color: 'auto', fill: opts.shading } : undefined,
    children,
  });
}
function imgCell(item) {
  if (item.img && fs.existsSync(path.join(ROOT, item.img))) {
    return tcell([new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new ImageRun({ type: 'png', data: fs.readFileSync(path.join(ROOT, item.img)), transformation: { width: 92, height: 122 } })],
    })], C_IMG);
  }
  return tcell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'No image', italics: true, color: MUT, size: 16 })] })], C_IMG);
}
function noteCell(item) {
  return tcell([
    new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: item.name, bold: true, size: 24, color: NAVY })] }),
    new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'Product Code: ' + item.code, bold: true, size: 16, color: ACC })] }),
    new Paragraph({ children: [new TextRun({ text: item.desc, size: 18, color: '333333' })] }),
  ], C_NOTE);
}
function retCell(item) {
  const poa = item.price === 'POA';
  return tcell([new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: item.price, bold: true, size: poa ? 18 : 22, color: poa ? MUT : NAVY })],
  })], C_RET);
}
const noBorderPara = (runs, opts = {}) => new Paragraph({ ...opts, children: runs });

const children = [];

// ---- Title page ----
children.push(
  new Paragraph({ spacing: { before: 2600, after: 0 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'THE MOLECULE CO.', bold: true, size: 52, color: NAVY })] }),
  new Paragraph({ spacing: { before: 200, after: 0 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'RESEARCH COMPOUND CATALOGUE', bold: true, size: 32, color: ACC })] }),
  new Paragraph({ spacing: { before: 80 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Price Schedule', size: 28, color: MUT, italics: true })] }),
  new Paragraph({ spacing: { before: 1400 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Prepared: 28 July 2026', size: 22, color: '333333' })] }),
  new Paragraph({ spacing: { before: 200 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Pricing in South African Rand (ZAR), Reconstituted (Pen).', size: 20, color: MUT })] }),
  new Paragraph({ alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Excludes courier delivery. Subject to change without notice.', size: 20, color: MUT })] }),
  new Paragraph({ children: [new PageBreak()] }),
);

// ---- Compliance notice ----
children.push(
  new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: 'Research Use & Compliance Notice', bold: true, size: 28, color: NAVY })] }),
  new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: 'Every compound in this catalogue is sold strictly for laboratory and research purposes. None of these products are registered medicines, and they have not been evaluated by SAHPRA, the FDA, or any equivalent regulatory body. The research notes in this document describe published research interest in each compound.', size: 20, color: '333333' })] }),
  new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: 'How to read this catalogue', bold: true, size: 24, color: NAVY })] }),
  new Paragraph({ spacing: { after: 240 }, children: [new TextRun({ text: 'Products are grouped by research category. Each entry shows the product image, a unique product code, a plain-English summary of what researchers study the compound for, and the Retail reference price in ZAR. “POA” means Price On Application.', size: 20, color: '333333' })] }),
);
// Contents
children.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: 'Contents', bold: true, size: 26, color: NAVY })] }));
data.forEach((g, i) => {
  children.push(new Paragraph({ spacing: { after: 40 }, children: [
    new TextRun({ text: `${i + 1}.  ${g.category}`, size: 20, color: '333333' }),
    new TextRun({ text: `   —   ${g.items.length} product${g.items.length > 1 ? 's' : ''}`, size: 20, color: MUT }),
  ] }));
});
children.push(new Paragraph({ children: [new PageBreak()] }));

// ---- Category tables ----
data.forEach((g, gi) => {
  children.push(new Paragraph({ spacing: { before: gi === 0 ? 0 : 200, after: 120 },
    children: [new TextRun({ text: `${gi + 1}. ${g.category}`, bold: true, size: 28, color: NAVY })] }));

  const headRow = new TableRow({
    tableHeader: true,
    children: [
      tcell([noBorderPara([new TextRun({ text: 'Image', bold: true, color: 'FFFFFF', size: 20 })], { alignment: AlignmentType.CENTER })], C_IMG, { shading: NAVY }),
      tcell([noBorderPara([new TextRun({ text: 'Product & Research Notes', bold: true, color: 'FFFFFF', size: 20 })])], C_NOTE, { shading: NAVY }),
      tcell([noBorderPara([new TextRun({ text: 'Retail (ZAR)', bold: true, color: 'FFFFFF', size: 20 })], { alignment: AlignmentType.CENTER })], C_RET, { shading: NAVY }),
    ],
  });
  const rows = [headRow];
  g.items.forEach((item, idx) => {
    rows.push(new TableRow({ children: [imgCell(item), noteCell(item), retCell(item)],
      // shade alternate rows lightly
    }));
  });

  const border = { style: BorderStyle.SINGLE, size: 4, color: LINE };
  children.push(new Table({
    width: { size: CONTENT, type: WidthType.DXA },
    columnWidths: [C_IMG, C_NOTE, C_RET],
    borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
    rows,
  }));
  if (gi < data.length - 1) children.push(new Paragraph({ children: [new PageBreak()] }));
});

const doc = new Document({
  creator: 'The Molecule Co.',
  title: 'The Molecule Co. — Research Compound Catalogue Price Schedule',
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } } },
    children,
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(path.join(ROOT, 'molecule-co/The_Molecule_Co_Price_Schedule.docx'), buf);
  console.log('DOCX written:', buf.length, 'bytes');
});
