/** Constants for BuffetLayoutDesigner */
export const STATUSES = [
  { value: 'pending', label: 'Pending', color: '#F59E0B' },
  { value: 'active', label: 'Active', color: '#3B82F6' },
  { value: 'completed', label: 'Completed', color: '#10B981' },
  { value: 'cancelled', label: 'Cancelled', color: '#EF4444' },
  { value: 'archived', label: 'Archived', color: '#6B7280' },
];
export const PRIORITIES = [
  { value: 1, label: 'Lowest' }, { value: 2, label: 'Low' }, { value: 3, label: 'Medium' },
  { value: 4, label: 'High' }, { value: 5, label: 'Critical' },
];
export const FEATURE_CONFIG = {
  name: 'BuffetLayoutDesigner', displayName: 'BuffetLayoutDesigner', version: '1.0.0', modules: 12,
  description: 'BuffetLayoutDesigner management module for WeddingGPT',
};
export default { STATUSES, PRIORITIES, FEATURE_CONFIG };
