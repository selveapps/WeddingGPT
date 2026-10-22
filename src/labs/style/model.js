import { WEDDING_STYLES, COLOR_PALETTES, scoreStyleQuiz } from '@/models';

/**
 * Style quiz and moodboard (Labs).
 *
 * Five quick questions weight the eight styles in `WEDDING_STYLES`; the
 * scoring itself is the existing `scoreStyleQuiz`. The moodboard holds notes,
 * links and palette picks - no bundled photography, per the PRD's originality
 * rule, so a link out to the couple's own Pinterest board stands in for images.
 */

export const STYLE_QUIZ = [
  {
    id: 'setting',
    prompt: 'Where do you picture it?',
    options: [
      { key: 'garden', label: 'In a garden', weights: { garden: 3, whimsical: 1 } },
      { key: 'ballroom', label: 'A grand ballroom', weights: { classic: 2, glamour: 2 } },
      { key: 'barn', label: 'A barn or vineyard', weights: { rustic: 3 } },
      { key: 'beach', label: 'By the water', weights: { coastal: 3 } },
      { key: 'gallery', label: 'A loft or gallery', weights: { modern: 3 } },
      { key: 'family', label: 'A family or cultural venue', weights: { heritage: 3 } },
    ],
  },
  {
    id: 'mood',
    prompt: 'What should guests feel?',
    options: [
      { key: 'romance', label: 'Swept up in romance', weights: { garden: 2, classic: 1 } },
      { key: 'party', label: 'Ready to dance all night', weights: { glamour: 2, whimsical: 1 } },
      { key: 'calm', label: 'Relaxed and unhurried', weights: { coastal: 2, rustic: 1 } },
      { key: 'awe', label: 'A little in awe', weights: { modern: 2, classic: 1 } },
      { key: 'belonging', label: 'Part of the family', weights: { heritage: 2, rustic: 1 } },
    ],
  },
  {
    id: 'dress',
    prompt: 'Pick an outfit mood',
    options: [
      { key: 'timeless', label: 'Timeless and tailored', weights: { classic: 2, modern: 1 } },
      { key: 'flowing', label: 'Light and flowing', weights: { coastal: 2, garden: 1 } },
      { key: 'statement', label: 'A real statement', weights: { glamour: 2, whimsical: 1 } },
      { key: 'traditional', label: 'Traditional dress', weights: { heritage: 3 } },
    ],
  },
  {
    id: 'table',
    prompt: 'Dinner looks like...',
    options: [
      { key: 'long', label: 'Long shared tables', weights: { rustic: 2, heritage: 1 } },
      { key: 'rounds', label: 'Formal round tables', weights: { classic: 2, glamour: 1 } },
      { key: 'stations', label: 'Food stations and lounges', weights: { modern: 1, whimsical: 2 } },
      { key: 'picnic', label: 'A picnic on the lawn', weights: { garden: 2, coastal: 1 } },
    ],
  },
  {
    id: 'detail',
    prompt: 'The detail you will splurge on',
    options: [
      { key: 'flowers', label: 'Flowers everywhere', weights: { garden: 2, classic: 1 } },
      { key: 'lighting', label: 'Lighting and candles', weights: { rustic: 1, glamour: 2 } },
      { key: 'music', label: 'A live band', weights: { glamour: 1, whimsical: 1, heritage: 1 } },
      { key: 'design', label: 'One bold design moment', weights: { modern: 3 } },
    ],
  },
];

export function quizProgress(answers = {}) {
  const answered = STYLE_QUIZ.filter((question) => answers[question.id]).length;
  return { answered, total: STYLE_QUIZ.length, complete: answered === STYLE_QUIZ.length };
}

/** Ranked styles with each one's share of the total score, 0-1. */
export function quizResult(answers = {}) {
  const ranked = scoreStyleQuiz(answers, STYLE_QUIZ);
  const total = ranked.reduce((sum, entry) => sum + entry.score, 0);
  return ranked.map((entry) => ({ ...entry, share: total > 0 ? entry.score / total : 0 }));
}

const PALETTE_SUGGESTIONS = {
  garden: ['blush_sage', 'sea_glass'],
  classic: ['ivory_gilt', 'slate_rose'],
  modern: ['slate_rose', 'sea_glass'],
  rustic: ['ivory_gilt', 'marigold'],
  coastal: ['sea_glass', 'blush_sage'],
  heritage: ['marigold', 'plum_dusk'],
  glamour: ['plum_dusk', 'ivory_gilt'],
  whimsical: ['marigold', 'blush_sage'],
};

/** Every palette, the ones that suit `styleKey` first and flagged. */
export function rankPalettes(styleKey) {
  const suggested = PALETTE_SUGGESTIONS[styleKey] ?? [];
  return [...COLOR_PALETTES]
    .map((palette) => ({ ...palette, suggested: suggested.includes(palette.key) }))
    .sort((a, b) => Number(b.suggested) - Number(a.suggested));
}

export const MoodItemKind = {
  NOTE: 'note',
  LINK: 'link',
};

/**
 * Tidy a pasted link: adds https:// when missing, returns null for anything
 * that does not look like a web address.
 */
export function normaliseLink(text) {
  const trimmed = (text ?? '').trim();
  if (!trimmed || /\s/.test(trimmed)) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return /^https?:\/\/[^/.\s]+\.[^/\s]+/i.test(withScheme) ? withScheme : null;
}

/** A plain-text brief the couple can send a planner, florist or designer. */
export function styleBrief({ answers = {}, paletteKey = null, items = [] } = {}) {
  const [top, second] = quizResult(answers);
  const palette = COLOR_PALETTES.find((entry) => entry.key === paletteKey);
  const lines = ['Our wedding style'];

  if (top) {
    lines.push('', `${top.name}${second ? `, with a touch of ${second.name.toLowerCase()}` : ''}.`, top.blurb);
  }
  if (palette) lines.push('', `Palette: ${palette.name} (${palette.colors.join(', ')})`);

  const notes = items.filter((item) => item.kind === MoodItemKind.NOTE);
  const links = items.filter((item) => item.kind === MoodItemKind.LINK);
  if (notes.length) lines.push('', 'What we love:', ...notes.map((item) => `- ${item.text}`));
  if (links.length) lines.push('', 'Inspiration:', ...links.map((item) => `- ${item.text}`));

  return lines.join('\n');
}

export { WEDDING_STYLES };
