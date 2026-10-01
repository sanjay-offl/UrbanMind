/**
 * Minimal, dependency-free CSV handling.
 *
 * Handles quoted fields, embedded commas, escaped double quotes, CRLF line
 * endings and a UTF-8 BOM — the things that break naive `split(',')` parsers
 * on real government data exports.
 */

export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
  /** 1-based line numbers, for error reporting */
  lineNumbers: number[];
  errors: { line: number; message: string }[];
}

export function parseCsv(text: string, maxRows = 5000): ParsedCsv {
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const records: { fields: string[]; line: number }[] = [];
  const errors: ParsedCsv['errors'] = [];

  let field = '';
  let record: string[] = [];
  let inQuotes = false;
  let line = 1;
  let recordStartLine = 1;
  let sawAnyChar = false;

  const pushField = () => {
    record.push(field);
    field = '';
  };
  const pushRecord = () => {
    pushField();
    if (record.length === 1 && record[0].trim() === '') {
      record = [];
      return;
    }
    records.push({ fields: record, line: recordStartLine });
    record = [];
  };

  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    sawAnyChar = true;

    if (inQuotes) {
      if (ch === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        if (ch === '\n') line += 1;
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      if (field.length === 0) recordStartLine = line;
      inQuotes = true;
      continue;
    }
    if (ch === ',') {
      pushField();
      continue;
    }
    if (ch === '\r') continue;
    if (ch === '\n') {
      pushRecord();
      line += 1;
      continue;
    }
    if (field.length === 0) recordStartLine = line;
    field += ch;
  }

  if (field.length > 0 || record.length > 0) pushRecord();
  if (inQuotes) errors.push({ line: recordStartLine, message: 'Unterminated quoted field' });
  if (!sawAnyChar) errors.push({ line: 1, message: 'The file is empty' });

  if (records.length === 0) {
    return { headers: [], rows: [], lineNumbers: [], errors };
  }

  const headers = records[0].fields.map((h) => h.trim());
  const rows: Record<string, string>[] = [];
  const lineNumbers: number[] = [];

  for (let r = 1; r < records.length; r += 1) {
    if (rows.length >= maxRows) {
      errors.push({
        line: records[r].line,
        message: `Row skipped: the file exceeds the ${maxRows}-row processing limit`,
      });
      break;
    }
    const rec: Record<string, string> = {};
    for (let c = 0; c < headers.length; c += 1) {
      rec[headers[c]] = (records[r].fields[c] ?? '').trim();
    }
    if (headers.length !== records[r].fields.length) {
      errors.push({
        line: records[r].line,
        message: `Expected ${headers.length} columns, found ${records[r].fields.length}`,
      });
    }
    rows.push(rec);
    lineNumbers.push(records[r].line);
  }

  return { headers, rows, lineNumbers, errors };
}

/** Renders rows back to CSV (used for the "download analysed copy" action). */
export function toCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n');
}
