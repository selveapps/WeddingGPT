/**
 * Helpers for MenuTastingScheduler
 */
export function formatMenuTastingSchedulerStatus(status) {
  const map = { pending: 'Pending', active: 'Active', completed: 'Completed', cancelled: 'Cancelled', archived: 'Archived' };
  return map[status] || status || 'Unknown';
}
export function getMenuTastingSchedulerStatusColor(status) {
  const map = { pending: '#F59E0B', active: '#3B82F6', completed: '#10B981', cancelled: '#EF4444', archived: '#6B7280' };
  return map[status] || '#9CA3AF';
}
export function formatMenuTastingSchedulerPriority(p) { return { 1: 'Lowest', 2: 'Low', 3: 'Medium', 4: 'High', 5: 'Critical' }[p] || 'Medium'; }
export function getMenuTastingSchedulerPriorityColor(p) { return { 1: '#9CA3AF', 2: '#60A5FA', 3: '#FBBF24', 4: '#F97316', 5: '#EF4444' }[p] || '#FBBF24'; }
export function formatCurrency(amount, currency = 'USD') {
  if (amount == null || isNaN(amount)) return '—';
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount); } catch { return `$${Number(amount).toFixed(2)}`; }
}
export function formatDate(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); } catch { return String(iso); }
}
export function formatRelativeTime(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); if (d < 30) return `${d}d ago`;
  return formatDate(iso);
}
export function truncate(str, max = 100) { if (!str) return ''; return str.length <= max ? str : str.slice(0, max - 1) + '…'; }
export function filterMenuTastingSchedulerItems(items, filters = {}) {
  let result = [...(items || [])];
  if (filters.search) { const q = filters.search.toLowerCase(); result = result.filter((i) => (i.name || '').toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q)); }
  if (filters.status && filters.status !== 'all') result = result.filter((i) => i.status === filters.status);
  return result;
}
export function sortMenuTastingSchedulerItems(items, sortBy = 'createdAt', sortOrder = 'desc') {
  const order = sortOrder === 'asc' ? 1 : -1;
  return [...(items || [])].sort((a, b) => { const av = a[sortBy] ?? ''; const bv = b[sortBy] ?? ''; return av < bv ? -1 * order : av > bv ? 1 * order : 0; });
}
export function calculateMenuTastingSchedulerProgress(items) {
  if (!items || !items.length) return 0;
  return Math.round((items.filter((i) => i.status === 'completed').length / items.length) * 100);
}
export default { formatMenuTastingSchedulerStatus, getMenuTastingSchedulerStatusColor, formatMenuTastingSchedulerPriority, getMenuTastingSchedulerPriorityColor, formatCurrency, formatDate, formatRelativeTime, truncate, filterMenuTastingSchedulerItems, sortMenuTastingSchedulerItems, calculateMenuTastingSchedulerProgress };
