/**
 * Formatters for MenuTastingScheduler
 */
import { formatCurrency, formatDate } from './helpers';
export function formatMenuTastingSchedulerItemSummary(item) {
  if (!item) return '';
  const parts = [item.name];
  if (item.status) parts.push(`[${item.status}]`);
  if (item.budget != null) parts.push(formatCurrency(item.budget));
  return parts.join(' · ');
}
export function formatMenuTastingSchedulerListTitle(count, status) {
  if (status && status !== 'all') return `${count} ${status} item${count === 1 ? '' : 's'}`;
  return `${count} item${count === 1 ? '' : 's'}`;
}
export function buildMenuTastingSchedulerShareText(item) {
  if (!item) return '';
  let text = `*${item.name}*\n`;
  if (item.description) text += `${item.description}\n`;
  if (item.status) text += `Status: ${item.status}\n`;
  if (item.budget != null) text += `Budget: ${formatCurrency(item.budget)}\n`;
  text += `\n— Shared from WeddingGPT MenuTastingScheduler`;
  return text;
}
export default { formatMenuTastingSchedulerItemSummary, formatMenuTastingSchedulerListTitle, buildMenuTastingSchedulerShareText };
