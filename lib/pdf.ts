/**
 * A small, dependency-free PDF 1.4 writer.
 *
 * Emits a valid, multi-page, text-based PDF using the core Helvetica / Courier
 * font families — enough for the civic brief and the grievance annexure,
 * without pulling a PDF library into the bundle.
 *
 * The standard fonts are WinAnsi-encoded, so callers should transliterate
 * Indic text before rendering; non-Latin code points are replaced with `?`
 * rather than emitting an unencodable glyph.
 */

export type Align = 'left' | 'center' | 'right';

export interface PdfLine {
  text: string;
  size?: number;
  bold?: boolean;
  align?: Align;
  /** extra vertical space after the line, in points */
  gap?: number;
  /** draw a horizontal rule above the line */
  rule?: boolean;
  mono?: boolean;
  /** start a new page before drawing this line */
  pageBreak?: boolean;
}

const PAGE_WIDTH = 595.28; // A4 portrait
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 48;
const MARGIN_TOP = 56;
const MARGIN_BOTTOM = 56;
const LINE_HEIGHT = 15;

// Resource tags used inside the content stream …
const FONT_REGULAR = 'F1';
const FONT_BOLD = 'F2';
const FONT_MONO = 'F3';
// … and the base fonts they resolve to.
const FONT_BASE_REGULAR = 'Helvetica';
const FONT_BASE_BOLD = 'Helvetica-Bold';
const FONT_BASE_MONO = 'Courier';

const BODY_RGB = '0.09 0.09 0.15';
const MUTED_RGB = '0.39 0.45 0.55';

export { MUTED_RGB, BODY_RGB };
const RULE_RGB = '0.85 0.86 0.88';

function wrap(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];
  const lines: string[] = [];
  let current = words[0];
  for (let i = 1; i < words.length; i += 1) {
    if ((current + ' ' + words[i]).length <= maxChars) current += ' ' + words[i];
    else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}

/**
 * Typographic characters that have a WinAnsi code point. Anything outside
 * WinAnsi (Indic scripts, emoji) becomes '?' rather than an unencodable glyph,
 * so callers should transliterate before rendering.
 */
const WIN_ANSI_FOLD: Record<string, string> = {
  '\u2018': "'",
  '\u2019': "'",
  '\u201C': '"',
  '\u201D': '"',
  '\u2013': '-',
  '\u2014': '-',
  '\u2026': '...',
  '\u00A0': ' ',
  '\u2212': '-',
  '\u2265': '>=',
  '\u2264': '<=',
  '\u00D7': 'x',
};

function escapeText(value: string): string {
  return value
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, (ch) => WIN_ANSI_FOLD[ch] ?? '?')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

export interface PdfOptions {
  title: string;
  author: string;
  subject?: string;
  footer?: string;
}

export function buildPdf(lines: PdfLine[], options: PdfOptions): Buffer {
  const pages: string[] = [];
  let ops: string[] = [];
  let y = PAGE_HEIGHT - MARGIN_TOP;

  const startPage = () => {
    ops = [];
    y = PAGE_HEIGHT - MARGIN_TOP;
  };

  const approxWidth = (text: string, size: number) => text.length * size * 0.5;

  const drawText = (text: string, size: number, bold: boolean, align: Align, mono: boolean) => {
    let x = MARGIN_X;
    if (align === 'center') x = (PAGE_WIDTH - approxWidth(text, size)) / 2;
    else if (align === 'right') x = PAGE_WIDTH - MARGIN_X - approxWidth(text, size);
    const font = mono ? FONT_MONO : bold ? FONT_BOLD : FONT_REGULAR;
    ops.push(`/${font} ${size} Tf`);
    ops.push(`1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm`);
    ops.push(`(${escapeText(text)}) Tj`);
    y -= LINE_HEIGHT;
  };

  const ensureRoom = (needed: number) => {
    if (y - needed >= MARGIN_BOTTOM) return;
    pages.push(ops.join('\n'));
    startPage();
  };

  startPage();

  for (const line of lines) {
    if (line.pageBreak) {
      pages.push(ops.join('\n'));
      startPage();
    }
    if (line.rule) {
      ensureRoom(6);
      ops.push(`${RULE_RGB} RG 0.6 w`);
      ops.push(`${MARGIN_X} ${(y + 6).toFixed(2)} m ${(PAGE_WIDTH - MARGIN_X).toFixed(2)} ${(y + 6).toFixed(2)} l S`);
      y -= 6;
    }
    const size = line.size ?? 10.5;
    const maxChars = Math.max(
      24,
      Math.floor((PAGE_WIDTH - MARGIN_X * 2) / (size * 0.5))
    );
    for (const piece of line.text ? wrap(line.text, maxChars) : ['']) {
      ensureRoom(LINE_HEIGHT);
      drawText(piece, size, Boolean(line.bold), line.align ?? 'left', Boolean(line.mono));
    }
    y -= line.gap ?? 2;
  }
  pages.push(ops.join('\n'));

  return assemble(pages, options);
}

function assemble(pages: string[], options: PdfOptions): Buffer {
  const objects: string[] = [];
  const push = (body: string) => {
    objects.push(body);
    return objects.length;
  };

  const fontRegular = push(
    `<< /Type /Font /Subtype /Type1 /BaseFont /${FONT_BASE_REGULAR} /Encoding /WinAnsiEncoding >>`
  );
  const fontBold = push(
    `<< /Type /Font /Subtype /Type1 /BaseFont /${FONT_BASE_BOLD} /Encoding /WinAnsiEncoding >>`
  );
  const fontMono = push(
    `<< /Type /Font /Subtype /Type1 /BaseFont /${FONT_BASE_MONO} /Encoding /WinAnsiEncoding >>`
  );

  const pageObjNums: number[] = [];
  const contentObjNums: number[] = pages.map((stream) =>
    push(`<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`)
  );

  // Reserve the Pages object number now so /Parent can be back-referenced.
  const pagesObjNum = objects.length + pages.length + 1;

  for (let i = 0; i < pages.length; i += 1) {
    const footer = options.footer
      ? `\n${BODY_RGB} rg\n/${FONT_REGULAR} 8 Tf\n1 0 0 1 ${MARGIN_X} ${MARGIN_BOTTOM - 22} Tm\n(${escapeText(`${options.footer}   |   page ${i + 1} of ${pages.length}`)}) Tj`
      : '';
    const stream = pages[i] + footer;
    // Replace the reserved content object with a version that carries the footer.
    const objIndex = contentObjNums[i] - 1;
    objects[objIndex] = `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`;

    pageObjNums.push(
      push(
        `<< /Type /Page /Parent ${pagesObjNum} 0 R ` +
          `/MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
          `/Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R /F3 ${fontMono} 0 R >> >> ` +
          `/Contents ${contentObjNums[i]} 0 R >>`
      )
    );
  }

  push(
    `<< /Type /Pages /Kids [${pageObjNums.map((n) => `${n} 0 R`).join(' ')}] /Count ${pageObjNums.length} >>`
  );
  const infoObjNum = push(
    `<< /Title (${escapeText(options.title)}) /Author (${escapeText(options.author)}) ` +
      `/Subject (${escapeText(options.subject ?? options.title)}) /Producer (UrbanMind PDF writer) >>`
  );
  const catalogObjNum = push(`<< /Type /Catalog /Pages ${pagesObjNum} 0 R >>`);

  let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const offsets: number[] = [];
  objects.forEach((body, index) => {
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefStart = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  pdf +=
    `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObjNum} 0 R /Info ${infoObjNum} 0 R >>\n` +
    `startxref\n${xrefStart}\n%%EOF\n`;

  return Buffer.from(pdf, 'latin1');
}
