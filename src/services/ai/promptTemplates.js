/**
 * Prompt templates (PRD s.14).
 *
 * One entry per capability the PRD names. Each is a ready-made question the
 * couple can tap, grouped for the assistant home screen. The same wording is
 * understood by both providers: the on-device assistant matches it to an
 * intent, and Claude answers it with the wedding context.
 */
export const PROMPT_TEMPLATES = [
  { id: 'next_steps', group: 'Planning', icon: 'sparkle', label: 'What should we do next?' },
  { id: 'timeline', group: 'Planning', icon: 'calendar', label: 'Build a timeline for the wedding day' },
  { id: 'checklist', group: 'Planning', icon: 'checklist', label: 'Make a checklist for booking our venue' },
  { id: 'emergency', group: 'Planning', icon: 'alert', label: 'Our photographer cancelled - what do we do?' },
  { id: 'budget', group: 'Budget', icon: 'budget', label: 'Explain where our budget is going' },
  { id: 'budget_split', group: 'Budget', icon: 'budget', label: 'How should we split our budget?' },
  { id: 'vendor_questions', group: 'Vendors', icon: 'vendors', label: 'What should we ask a photographer?' },
  { id: 'guest_message', group: 'Guests', icon: 'mail', label: 'Draft an RSVP reminder' },
  { id: 'venue_message', group: 'Guests', icon: 'mail', label: 'Draft a message asking our venue about parking' },
  { id: 'etiquette', group: 'Etiquette', icon: 'heart', label: 'How do we word a no-children invitation?' },
  { id: 'plus_ones', group: 'Etiquette', icon: 'guests', label: 'Do we have to give everyone a plus-one?' },
  { id: 'app_help', group: 'Using WeddingGPT', icon: 'info', label: 'How do I add guests?' },
];

export const PROMPT_GROUPS = [...new Set(PROMPT_TEMPLATES.map((t) => t.group))];
