/** helpers GlasswareInventory */
export function formatStatus(s) { return ({ pending:'Pending',active:'Active',completed:'Completed',cancelled:'Cancelled',archived:'Archived' })[s] || s || 'Unknown'; }
export function statusColor(s) { return ({ pending:'#F59E0B',active:'#3B82F6',completed:'#10B981',cancelled:'#EF4444',archived:'#6B7280' })[s] || '#9CA3AF'; }
export function formatCurrency(n) { if (n == null || isNaN(n)) return '—'; try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n); } catch { return `$${Number(n).toFixed(2)}`; } }
export function formatDate(iso) { if (!iso) return '—'; try { return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); } catch { return String(iso); } }
export function relativeTime(iso) { if (!iso) return ''; const d = Date.now() - new Date(iso).getTime(); const s = Math.floor(d / 1000); if (s < 60) return 'just now'; const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`; const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`; return formatDate(iso); }
export function truncate(str, max = 100) { return !str ? '' : str.length <= max ? str : str.slice(0, max - 1) + '…'; }
export function filterItems(items, f = {}) { let r = [...(items || [])]; if (f.search) { const q = f.search.toLowerCase(); r = r.filter((i) => (i.name || '').toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q)); } if (f.status && f.status !== 'all') r = r.filter((i) => i.status === f.status); return r; }
export function progress(items) { if (!items?.length) return 0; return Math.round((items.filter((i) => i.status === 'completed').length / items.length) * 100); }
export default { formatStatus, statusColor, formatCurrency, formatDate, relativeTime, truncate, filterItems, progress };
