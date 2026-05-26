type Primitive = string | number | boolean | null | undefined;

/** Encode one cell — wraps in quotes when needed, escapes internal quotes. */
function encodeCell(value: Primitive): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Build a CSV string from headers + rows.
 * Prepends a UTF-8 BOM so Excel renders accents correctly.
 */
export function toCsv(headers: string[], rows: Primitive[][]): string {
  const lines: string[] = [];
  lines.push(headers.map(encodeCell).join(','));
  for (const r of rows) lines.push(r.map(encodeCell).join(','));
  return '﻿' + lines.join('\r\n');
}

export function csvFilename(prefix: string): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${prefix}-${yyyy}-${mm}-${dd}.csv`;
}
