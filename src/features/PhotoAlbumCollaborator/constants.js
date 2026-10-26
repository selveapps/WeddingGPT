/**
 * Constants for PhotoAlbumCollaborator
 */
export const PHOTOALBUMCOLLABORATOR_STATUSES = [
  { value: 'pending', label: 'Pending', color: '#F59E0B' },
  { value: 'active', label: 'Active', color: '#3B82F6' },
  { value: 'completed', label: 'Completed', color: '#10B981' },
  { value: 'cancelled', label: 'Cancelled', color: '#EF4444' },
  { value: 'archived', label: 'Archived', color: '#6B7280' },
];
export const PHOTOALBUMCOLLABORATOR_PRIORITIES = [
  { value: 1, label: 'Lowest', color: '#9CA3AF' },
  { value: 2, label: 'Low', color: '#60A5FA' },
  { value: 3, label: 'Medium', color: '#FBBF24' },
  { value: 4, label: 'High', color: '#F97316' },
  { value: 5, label: 'Critical', color: '#EF4444' },
];
export const PHOTOALBUMCOLLABORATOR_SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date Created' }, { value: 'updatedAt', label: 'Last Updated' },
  { value: 'name', label: 'Name' }, { value: 'priority', label: 'Priority' },
  { value: 'budget', label: 'Budget' }, { value: 'status', label: 'Status' },
];
export const PHOTOALBUMCOLLABORATOR_CATEGORIES = ['General', 'Planning', 'Vendors', 'Guests', 'Budget', 'Logistics', 'Creative', 'Legal', 'Post-Wedding', 'Other'];
export const PHOTOALBUMCOLLABORATOR_FEATURE_CONFIG = {
  name: 'PhotoAlbumCollaborator', displayName: 'PhotoAlbumCollaborator', icon: 'star', color: '#8B5CF6', version: '1.0.0', modules: 18,
  description: 'Advanced PhotoAlbumCollaborator management for WeddingGPT',
};
export default { STATUSES: PHOTOALBUMCOLLABORATOR_STATUSES, PRIORITIES: PHOTOALBUMCOLLABORATOR_PRIORITIES, SORT_OPTIONS: PHOTOALBUMCOLLABORATOR_SORT_OPTIONS, CATEGORIES: PHOTOALBUMCOLLABORATOR_CATEGORIES, FEATURE_CONFIG: PHOTOALBUMCOLLABORATOR_FEATURE_CONFIG };
