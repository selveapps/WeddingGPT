/** validators UplightingMap */
export function validateItem(payload, isUpdate = false) {
  const errors = [];
  if (!payload) return { valid: false, errors: ['Payload required'] };
  if (!isUpdate && (!payload.name || String(payload.name).trim().length < 2)) errors.push('Name min 2 chars');
  if (payload.name && String(payload.name).length > 200) errors.push('Name max 200');
  if (payload.status && !['pending','active','completed','cancelled','archived'].includes(payload.status)) errors.push('Invalid status');
  if (payload.priority != null) { const p = Number(payload.priority); if (isNaN(p) || p < 1 || p > 5) errors.push('Priority 1-5'); }
  if (payload.budget != null && (isNaN(Number(payload.budget)) || Number(payload.budget) < 0)) errors.push('Budget >= 0');
  return { valid: errors.length === 0, errors };
}
export function sanitize(input) {
  if (!input || typeof input !== 'object') return {};
  const clean = {};
  for (const k of ['name','description','status','priority','budget','date','notes','tags','category','location','contact']) {
    if (input[k] != null) clean[k] = typeof input[k] === 'string' ? input[k].trim() : input[k];
  }
  return clean;
}
