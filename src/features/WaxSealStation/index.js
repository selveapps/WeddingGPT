/** WaxSealStation - WeddingGPT extension (new files only) */
export { default as useWaxSealStationStore } from './store';
export { default as WaxSealStationAPI } from './api';
export { default as useWaxSealStation } from './hooks/useFeature';
export { default as FeatureList } from './components/FeatureList';
export { default as FeatureCard } from './components/FeatureCard';
export { default as FeatureForm } from './components/FeatureForm';
export { default as FeatureDetail } from './components/FeatureDetail';
export { default as EmptyState } from './components/EmptyState';
export { default as MainScreen } from './screens/MainScreen';
export * from './constants';
export * from './validators';
export * from './helpers';
export const FEATURE_NAME = 'WaxSealStation';
export const FEATURE_VERSION = '1.0.0';
