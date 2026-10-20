/**
 * Profile feature barrel.
 *
 * Layout:
 *  - Profile.jsx          screen shell
 *  - components/          presentational pieces
 *  - fields/              form field groups
 *  - hooks/               form & screen state
 *  - lib/                 constants, helpers, validation
 *  - booking/             vendor booking tracker
 */

export { Profile } from './Profile';
export { default } from './Profile';

export {
  ProfileForm,
  ProfileHero,
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

export {
  Booking,
  BookingDetail,
  BookingFormScreen,
  useBookings,
  useBookingForm,
  BookingRow,
  BookingFilters,
  BookingPipeline,
  BookingPaymentPlan,
  BookingTips,
  BookingForm,
  BookingTimeline,
  BookingCategories,
  BookingFilter,
  BOOKING_FILTER_META,
  BOOKING_STATUS_OPTIONS,
  BOOKING_CATEGORY_OPTIONS,
  BOOKING_SORT,
  BOOKING_SORT_OPTIONS,
  filterBookings,
  sortBookings,
  summariseBookings,
  validateBookingValues,
  validateBookingField,
} from './booking';
