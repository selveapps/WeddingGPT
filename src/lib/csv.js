/**
 * CSV reading and writing, for files that open in Excel, Numbers or Sheets.
 *
 * Writing: cells are quoted when they contain a comma, quote or newline. Cells
 * that start with = + - @ get a leading apostrophe so a spreadsheet does not
 * run a guest's name as a formula (CSV injection).
 *
 * Reading follows RFC 4180 - quoted fields may contain commas, doubled quotes
 * and line breaks - and copes with what real exports contain: a byte-order mark
 * from Excel, CRLF line endings, blank lines, and semicolon or tab separators
 * from locales that use a decimal comma.
 */

export function csvCell(value) {
  if (value === null || value === undefined) return '';
  let text = String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows = []) {
  return rows.map((row) => row.map(csvCell).join(',')).join('\n');
}

/** Undo `csvCell`'s formula guard when reading back a file we wrote. */
export function unguardCell(text) {
  return /^'[=+\-@]/.test(text) ? text.slice(1) : text;
}

const DELIMITERS = [',', ';', '\t'];

/**
 * Pick the separator that splits the first line into the most columns,
 * ignoring separators inside quotes. Commas win ties.
 */
export function detectDelimiter(text) {
  const firstLine = [];
  let inQuotes = false;
  for (const char of text) {
    if (char === '"') inQuotes = !inQuotes;
    else if (!inQuotes && (char === '\n' || char === '\r')) break;
    firstLine.push(inQuotes ? '' : char);
  }
  let best = ',';
  let bestCount = 0;
  for (const delimiter of DELIMITERS) {
    const count = firstLine.filter((char) => char === delimiter).length;
    if (count > bestCount) {
      best = delimiter;
      bestCount = count;
    }
  }
  return best;
}

/**
 * Parse CSV text into rows of strings. Blank lines are dropped; every row is
 * padded to the widest row so columns line up.
 */
export function parseCsv(text, { delimiter } = {}) {
  const source = String(text ?? '').replace(/^﻿/, '');
  if (!source.trim()) return [];
  const separator = delimiter ?? detectDelimiter(source);

  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  const endCell = () => {
    row.push(cell);
    cell = '';
  };
  const endRow = () => {
    endCell();
    if (row.some((value) => value.trim() !== '')) rows.push(row);
    row = [];
  };

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];

    if (inQuotes) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"' && cell === '') inQuotes = true;
    else if (char === separator) endCell();
    else if (char === '\n') endRow();
    else if (char === '\r') {
      if (source[i + 1] === '\n') i += 1;
      endRow();
    } else cell += char;
  }
  if (cell !== '' || row.length) endRow();

  const width = Math.max(0, ...rows.map((r) => r.length));
  return rows.map((r) => (r.length < width ? [...r, ...Array(width - r.length).fill('')] : r));
}
