/**
 * Safe HTML for the public pages (design E §5, threat W3).
 *
 * Every value interpolated into `html` is escaped. The only way to insert
 * markup is another `html` result (or `raw`, used only for constant strings in
 * this folder), so a guest's name or a couple's FAQ text can never become a
 * script, an attribute or a tag.
 */

const ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;',
};

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"'`]/g, (char) => ESCAPES[char]);
}

class SafeHtml {
  constructor(value) {
    this.value = value;
  }

  toString() {
    return this.value;
  }
}

/** Mark a constant string as markup. Never pass user input here. */
export const raw = (value) => new SafeHtml(String(value));

function render(value) {
  if (value instanceof SafeHtml) return value.value;
  if (Array.isArray(value)) return value.map(render).join('');
  if (value === null || value === undefined || value === false) return '';
  return escapeHtml(value);
}

/** Tagged template: `html\`<p>${name}</p>\`` escapes `name`. */
export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i += 1) out += render(values[i]) + strings[i + 1];
  return new SafeHtml(out);
}

/**
 * Headers for every public page: no framing, no sniffing, no referrer (tokens
 * are in the URL), no indexing, no caching of personal pages, and a CSP that
 * allows no script at all.
 */
export const PAGE_HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  'Content-Security-Policy':
    "default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow',
  'Cache-Control': 'no-store',
};

/** The same headers, minus the noindex, for a website the couple chose to list in search (D9). */
export function pageHeaders({ indexable = false } = {}) {
  if (!indexable) return PAGE_HEADERS;
  const { 'X-Robots-Tag': _hidden, ...rest } = PAGE_HEADERS;
  return rest;
}

const STYLES = raw(`
  :root { color-scheme: light dark; --ink: #2b2220; --muted: #6f625e; --line: #e8ddd8; --bg: #fffbf7; --card: #ffffff; --brand: #b4485f; }
  @media (prefers-color-scheme: dark) { :root { --ink: #f3ebe7; --muted: #b9aca7; --line: #3a302d; --bg: #191413; --card: #241d1b; --brand: #f49ab3; } }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  main { max-width: 560px; margin: 0 auto; padding: 32px 16px 64px; }
  h1 { font-family: Georgia, "Times New Roman", serif; font-weight: 500; font-size: 30px; line-height: 1.2; margin: 0 0 4px; }
  .muted { color: var(--muted); }
  .card { background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 20px; margin: 20px 0; }
  fieldset { border: 0; margin: 0 0 20px; padding: 0; }
  legend { font-weight: 600; margin-bottom: 8px; }
  label { display: block; margin: 8px 0 4px; }
  .choice { display: inline-flex; align-items: center; gap: 6px; margin-right: 18px; }
  input[type=text], select, textarea { width: 100%; padding: 10px 12px; border: 1px solid var(--line); border-radius: 10px; background: var(--bg); color: var(--ink); font: inherit; }
  textarea { min-height: 96px; }
  button { background: var(--brand); color: #fff; border: 0; border-radius: 999px; padding: 14px 24px; font: inherit; font-weight: 600; width: 100%; cursor: pointer; }
  .error { color: #c0392b; }
  .ok { color: #2e7d4f; }
  h2 { font-family: Georgia, "Times New Roman", serif; font-weight: 500; font-size: 22px; margin: 32px 0 8px; }
  a { color: var(--brand); }
  .event { border-top: 1px solid var(--line); padding: 12px 0; }
  .event:first-child { border-top: 0; }
  .button { display: block; text-align: center; background: var(--brand); color: #fff; border-radius: 999px; padding: 14px 24px; font-weight: 600; text-decoration: none; margin: 20px 0; }
  dt { font-weight: 600; margin-top: 12px; }
  dd { margin: 4px 0 0; }
`);

/** The page shell. `title` and `body` follow the same escaping rules. */
export function page({ title, body, lang = 'en', indexable = false }) {
  return html`<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${indexable ? '' : raw('<meta name="robots" content="noindex, nofollow">')}
<title>${title}</title>
<style>${STYLES}</style>
</head>
<body><main>${body}</main></body>
</html>`;
}
