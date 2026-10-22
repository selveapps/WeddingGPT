/**
 * Minimal CSV writer for exports that open in Excel, Numbers or Sheets.
 *
 * Cells are quoted when they contain a comma, quote or newline. Cells that
 * start with = + - @ get a leading apostrophe so a spreadsheet does not run a
 * guest's name as a formula (CSV injection).
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
