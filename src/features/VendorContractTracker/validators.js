/**
 * Validators for VendorContractTracker
 */
export function validateVendorContractTrackerItem(payload, isUpdate = false) {
  const errors = [];
  if (!payload) return { valid: false, errors: ['Payload required'] };
  if (!isUpdate && (!payload.name || String(payload.name).trim().length < 2)) errors.push('Name must be at least 2 characters');
  if (payload.name && String(payload.name).length > 200) errors.push('Name under 200 chars');
  if (payload.description && String(payload.description).length > 5000) errors.push('Description under 5000 chars');
  if (payload.status && !['pending', 'active', 'completed', 'cancelled', 'archived'].includes(payload.status)) errors.push('Invalid status');
  if (payload.priority !== undefined) { const p = Number(payload.priority); if (isNaN(p) || p < 1 || p > 5) errors.push('Priority 1-5'); }
  if (payload.budget !== undefined) { const b = Number(payload.budget); if (isNaN(b) || b < 0) errors.push('Budget non-negative'); }
  if (payload.date && isNaN(Date.parse(payload.date))) errors.push('Invalid date');
  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) errors.push('Invalid email');
  return { valid: errors.length === 0, errors };
}

export function sanitizeVendorContractTrackerInput(input) {
  if (!input || typeof input !== 'object') return {};
  const clean = {};
  const allowed = ['name', 'description', 'status', 'priority', 'budget', 'date', 'email', 'phone', 'notes', 'tags', 'metadata', 'location', 'contact', 'url', 'imageUrl', 'category', 'subcategory', 'assignedTo', 'dueDate'];
  for (const key of allowed) {
    if (input[key] !== undefined && input[key] !== null) clean[key] = typeof input[key] === 'string' ? input[key].trim() : input[key];
  }
  return clean;
}
