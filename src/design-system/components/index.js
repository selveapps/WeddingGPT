/**
 * The WeddingGPT component library.
 *
 * Screens import from here and nowhere else in the design system. If a screen
 * needs a visual that is not in this barrel, the right move is to add it here
 * rather than to write bespoke styles in the screen - that is the rule in PRD
 * s.20 and the thing that keeps 100+ screens looking like one product.
 */

// --- Primitives ------------------------------------------------------------
export { default as Text } from './Text';
export { default as Icon, iconNames } from './Icon';
export { default as Touchable } from './Touchable';
export { Stack, Row, Spacer } from './Stack';

// --- Controls --------------------------------------------------------------
export { default as Button } from './Button';
export { default as Checkbox } from './Checkbox';
export { default as Chip } from './Chip';
export { default as TextField } from './TextField';
export { default as SegmentedControl } from './SegmentedControl';

// --- Surfaces --------------------------------------------------------------
export { default as Screen } from './Screen';
export { default as Card } from './Card';
export { default as BottomSheet } from './BottomSheet';
export { default as ConfirmSheet } from './ConfirmSheet';

// --- Content ---------------------------------------------------------------
export { default as Badge } from './Badge';
export { default as Avatar, initialsFrom } from './Avatar';
export { default as Divider } from './Divider';
export { default as ListRow } from './ListRow';
export { default as SectionHeader } from './SectionHeader';
export { default as ScreenHeader } from './ScreenHeader';

// --- Progress and numbers --------------------------------------------------
export { default as ProgressBar } from './ProgressBar';
export { default as ProgressRing } from './ProgressRing';
export { default as AnimatedNumber } from './AnimatedNumber';

// --- Feedback and states ---------------------------------------------------
export { default as Skeleton, SkeletonRow, SkeletonCard } from './Skeleton';
export { EmptyState, ErrorState, OfflineState, LoadingState } from './StateViews';
export { ToastProvider, useToast } from './Toast';
