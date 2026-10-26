/**
 * VirtualWeddingSupport Feature Module Index - WeddingGPT Extension
 * Added without modifying any existing files
 */
export { default as useVirtualWeddingSupportStore } from './store';
export { default as VirtualWeddingSupportAPI } from './services/api';
export { default as useVirtualWeddingSupport } from './hooks/useFeature';
export { default as useVirtualWeddingSupportList } from './hooks/useFeatureList';
export { default as FeatureList } from './components/FeatureList';
export { default as FeatureCard } from './components/FeatureCard';
export { default as FeatureForm } from './components/FeatureForm';
export { default as FeatureDetail } from './components/FeatureDetail';
export { default as EmptyState } from './components/EmptyState';
export { default as MainScreen } from './screens/MainScreen';
export { default as DetailScreen } from './screens/DetailScreen';
export * from './constants';
export * from './validators';
export * from './utils/helpers';
export * from './utils/formatters';
export * from './types';
export const FEATURE_NAME = 'VirtualWeddingSupport';
export const FEATURE_VERSION = '1.0.0';
