/**
 * Constants for NameChangeHelper
 */
export const NAMECHANGEHELPER_STATUSES = [
  { value: 'pending', label: 'Pending', color: '#F59E0B' },
  { value: 'active', label: 'Active', color: '#3B82F6' },
  { value: 'completed', label: 'Completed', color: '#10B981' },
  { value: 'cancelled', label: 'Cancelled', color: '#EF4444' },
  { value: 'archived', label: 'Archived', color: '#6B7280' },
];
export const NAMECHANGEHELPER_PRIORITIES = [
  { value: 1, label: 'Lowest', color: '#9CA3AF' },
  { value: 2, label: 'Low', color: '#60A5FA' },
  { value: 3, label: 'Medium', color: '#FBBF24' },
  { value: 4, label: 'High', color: '#F97316' },
  { value: 5, label: 'Critical', color: '#EF4444' },
];
export const NAMECHANGEHELPER_SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date Created' }, { value: 'updatedAt', label: 'Last Updated' },
  { value: 'name', label: 'Name' }, { value: 'priority', label: 'Priority' },
  { value: 'budget', label: 'Budget' }, { value: 'status', label: 'Status' },
];
export const NAMECHANGEHELPER_CATEGORIES = ['General', 'Planning', 'Vendors', 'Guests', 'Budget', 'Logistics', 'Creative', 'Legal', 'Post-Wedding', 'Other'];
export const NAMECHANGEHELPER_FEATURE_CONFIG = {
  name: 'NameChangeHelper', displayName: 'NameChangeHelper', icon: 'star', color: '#8B5CF6', version: '1.0.0', modules: 18,
  description: 'Advanced NameChangeHelper management for WeddingGPT',
};
export default { STATUSES: NAMECHANGEHELPER_STATUSES, PRIORITIES: NAMECHANGEHELPER_PRIORITIES, SORT_OPTIONS: NAMECHANGEHELPER_SORT_OPTIONS, CATEGORIES: NAMECHANGEHELPER_CATEGORIES, FEATURE_CONFIG: NAMECHANGEHELPER_FEATURE_CONFIG };
