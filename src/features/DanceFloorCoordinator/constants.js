/**
 * Constants for DanceFloorCoordinator
 */
export const DANCEFLOORCOORDINATOR_STATUSES = [
  { value: 'pending', label: 'Pending', color: '#F59E0B' },
  { value: 'active', label: 'Active', color: '#3B82F6' },
  { value: 'completed', label: 'Completed', color: '#10B981' },
  { value: 'cancelled', label: 'Cancelled', color: '#EF4444' },
  { value: 'archived', label: 'Archived', color: '#6B7280' },
];
export const DANCEFLOORCOORDINATOR_PRIORITIES = [
  { value: 1, label: 'Lowest', color: '#9CA3AF' },
  { value: 2, label: 'Low', color: '#60A5FA' },
  { value: 3, label: 'Medium', color: '#FBBF24' },
  { value: 4, label: 'High', color: '#F97316' },
  { value: 5, label: 'Critical', color: '#EF4444' },
];
export const DANCEFLOORCOORDINATOR_SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date Created' }, { value: 'updatedAt', label: 'Last Updated' },
  { value: 'name', label: 'Name' }, { value: 'priority', label: 'Priority' },
  { value: 'budget', label: 'Budget' }, { value: 'status', label: 'Status' },
];
export const DANCEFLOORCOORDINATOR_CATEGORIES = ['General', 'Planning', 'Vendors', 'Guests', 'Budget', 'Logistics', 'Creative', 'Legal', 'Post-Wedding', 'Other'];
export const DANCEFLOORCOORDINATOR_FEATURE_CONFIG = {
  name: 'DanceFloorCoordinator', displayName: 'DanceFloorCoordinator', icon: 'star', color: '#8B5CF6', version: '1.0.0', modules: 18,
  description: 'Advanced DanceFloorCoordinator management for WeddingGPT',
};
export default { STATUSES: DANCEFLOORCOORDINATOR_STATUSES, PRIORITIES: DANCEFLOORCOORDINATOR_PRIORITIES, SORT_OPTIONS: DANCEFLOORCOORDINATOR_SORT_OPTIONS, CATEGORIES: DANCEFLOORCOORDINATOR_CATEGORIES, FEATURE_CONFIG: DANCEFLOORCOORDINATOR_FEATURE_CONFIG };
