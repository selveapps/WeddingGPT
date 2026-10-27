/** ChildcareCoordinator module index - WeddingGPT extension (new file only) */
export { default as useChildcareCoordinatorStore } from './store';
export { default as ChildcareCoordinatorAPI } from './api';
export { default as useChildcareCoordinator } from './hooks/useFeature';
export { default as FeatureList } from './components/FeatureList';
export { default as FeatureCard } from './components/FeatureCard';
export { default as FeatureForm } from './components/FeatureForm';
export { default as FeatureDetail } from './components/FeatureDetail';
export { default as EmptyState } from './components/EmptyState';
export { default as MainScreen } from './screens/MainScreen';
export * from './constants';
export * from './validators';
export * from './helpers';
export const FEATURE_NAME = 'ChildcareCoordinator';
export const FEATURE_VERSION = '1.0.0';
