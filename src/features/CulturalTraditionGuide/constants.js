/**
 * Constants for CulturalTraditionGuide
 */
export const CULTURALTRADITIONGUIDE_STATUSES = [
  { value: 'pending', label: 'Pending', color: '#F59E0B' },
  { value: 'active', label: 'Active', color: '#3B82F6' },
  { value: 'completed', label: 'Completed', color: '#10B981' },
  { value: 'cancelled', label: 'Cancelled', color: '#EF4444' },
  { value: 'archived', label: 'Archived', color: '#6B7280' },
];
export const CULTURALTRADITIONGUIDE_PRIORITIES = [
  { value: 1, label: 'Lowest', color: '#9CA3AF' },
  { value: 2, label: 'Low', color: '#60A5FA' },
  { value: 3, label: 'Medium', color: '#FBBF24' },
  { value: 4, label: 'High', color: '#F97316' },
  { value: 5, label: 'Critical', color: '#EF4444' },
];
export const CULTURALTRADITIONGUIDE_SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date Created' }, { value: 'updatedAt', label: 'Last Updated' },
  { value: 'name', label: 'Name' }, { value: 'priority', label: 'Priority' },
  { value: 'budget', label: 'Budget' }, { value: 'status', label: 'Status' },
];
export const CULTURALTRADITIONGUIDE_CATEGORIES = ['General', 'Planning', 'Vendors', 'Guests', 'Budget', 'Logistics', 'Creative', 'Legal', 'Post-Wedding', 'Other'];
export const CULTURALTRADITIONGUIDE_FEATURE_CONFIG = {
  name: 'CulturalTraditionGuide', displayName: 'CulturalTraditionGuide', icon: 'star', color: '#8B5CF6', version: '1.0.0', modules: 18,
  description: 'Advanced CulturalTraditionGuide management for WeddingGPT',
};
export default { STATUSES: CULTURALTRADITIONGUIDE_STATUSES, PRIORITIES: CULTURALTRADITIONGUIDE_PRIORITIES, SORT_OPTIONS: CULTURALTRADITIONGUIDE_SORT_OPTIONS, CATEGORIES: CULTURALTRADITIONGUIDE_CATEGORIES, FEATURE_CONFIG: CULTURALTRADITIONGUIDE_FEATURE_CONFIG };
