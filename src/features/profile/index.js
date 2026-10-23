/**
 * Profile feature barrel.
 *
 * Layout:
 *  - Profile.jsx          screen shell
 *  - components/          presentational pieces
 *  - fields/              form field groups
 *  - hooks/               form & screen state
 *  - lib/                 constants, helpers, validation
 */

export { Profile } from './Profile';
export { default } from './Profile';

export {
  ProfileForm,
  ProfileHero,
  ProfileHeroStats,
  ProfileCompleteness,
  ProfileSummaryCard,
  ProfileSettingsLinks,
  ProfileDangerZone,
  ProfileTips,
  ProfileStickyActions,
  ProfileSection,
  ProfileChipField,
} from './components';

export {
  PersonalFields,
  PartnerFields,
  WeddingDetailsFields,
  VisionFields,
} from './fields';

export { useProfileForm } from './hooks';

export { WeddingTimeline } from './timeline';

export {
  PROFILE_SECTIONS,
  PROFILE_SECTION_META,
  PROFILE_COPY,
  PROFILE_PLACEHOLDERS,
  EMPTY_PROFILE_VALUES,
  valuesFromWorkspace,
  calculateProfileCompleteness,
  buildWorkspacePatches,
  displayCoupleName,
  buildSummaryRows,
  validateProfileValues,
  validateProfileField,
} from './lib';
