export const PRIVACY_OPTIONS = [
  {
    key: 'showContactDetails',
    title: 'Show contact details in profile summaries',
    description: 'Keep email and phone out of quick-share profile summaries when switched off.',
  },
  {
    key: 'showWeddingLocation',
    title: 'Include the wedding location',
    description: 'Choose whether your city appears in profile summary cards.',
  },
  {
    key: 'showGuestEstimate',
    title: 'Include the guest estimate',
    description: 'Control whether your approximate guest count appears in profile summaries.',
  },
];

export const DEFAULT_PRIVACY_SETTINGS = {
  showContactDetails: false,
  showWeddingLocation: true,
  showGuestEstimate: true,
};

export const PRIVACY_NOTICE =
  'These choices describe profile-summary preferences only. They do not change device access, account permissions, or information already shared elsewhere.';
