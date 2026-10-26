/**
 * Formatters for PhotoAlbumCollaborator
 */
import { formatCurrency, formatDate } from './helpers';
export function formatPhotoAlbumCollaboratorItemSummary(item) {
  if (!item) return '';
  const parts = [item.name];
  if (item.status) parts.push(`[${item.status}]`);
  if (item.budget != null) parts.push(formatCurrency(item.budget));
  return parts.join(' · ');
}
export function formatPhotoAlbumCollaboratorListTitle(count, status) {
  if (status && status !== 'all') return `${count} ${status} item${count === 1 ? '' : 's'}`;
  return `${count} item${count === 1 ? '' : 's'}`;
}
export function buildPhotoAlbumCollaboratorShareText(item) {
  if (!item) return '';
  let text = `*${item.name}*\n`;
  if (item.description) text += `${item.description}\n`;
  if (item.status) text += `Status: ${item.status}\n`;
  if (item.budget != null) text += `Budget: ${formatCurrency(item.budget)}\n`;
  text += `\n— Shared from WeddingGPT PhotoAlbumCollaborator`;
  return text;
}
export default { formatPhotoAlbumCollaboratorItemSummary, formatPhotoAlbumCollaboratorListTitle, buildPhotoAlbumCollaboratorShareText };
