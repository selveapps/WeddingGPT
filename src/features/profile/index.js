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

export { PersonalFields, PartnerFields, WeddingDetailsFields, VisionFields } from './fields';

export { useProfileForm } from './hooks';

export { WeddingTimeline } from './timeline';
export { ProfilePrivacy } from './privacy';
export { ProfilePreferences } from './preferences';
export { CoupleJournal } from './journal';
export { KeepsakeCollection } from './keepsakes';
export { RelationshipMilestones } from './milestones';
export { CoupleGoals } from './goals';
export { ProfileShareSummary } from './sharing';
export { WeddingDocuments } from './documents';
export { CoupleCheckIns } from './checkins';
export { ProfileBudgetSnapshot } from './budget';
export { WeddingCountdown } from './countdown';
export { WeddingPartyRoster } from './party';
export { WeddingDecisionLog } from './decisions';
export { WeddingVisionBoard } from './visionBoard';

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
