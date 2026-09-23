import { createEntity } from './base';

/**
 * Style profile, inspiration and moodboards.
 *
 * Inspiration items reference artwork by a `paletteKey` and a generated
 * gradient rather than bundling photography: the PRD requires entirely original
 * visual assets, and shipping stock wedding photos would breach that. Real
 * imagery can be attached later through `imageUri` without changing the model.
 */

export const WEDDING_STYLES = [
  { key: 'garden', name: 'Garden romantic', blurb: 'Soft, green, a little overgrown in the best way.' },
  { key: 'classic', name: 'Timeless classic', blurb: 'Symmetry, ivory, nothing that will date.' },
  { key: 'modern', name: 'Modern minimal', blurb: 'Clean lines, restraint, one strong gesture.' },
  { key: 'rustic', name: 'Rustic warmth', blurb: 'Wood, candlelight, long shared tables.' },
  { key: 'coastal', name: 'Coastal light', blurb: 'Open air, pale sand, everything breezy.' },
  { key: 'heritage', name: 'Heritage and ritual', blurb: 'Colour, ceremony, family at the centre.' },
  { key: 'glamour', name: 'Evening glamour', blurb: 'Deep tones, shine, a proper party.' },
  { key: 'whimsical', name: 'Playful and whimsical', blurb: 'Colour clashes on purpose. Joyful.' },
];

/** Original palettes, authored for this product. */
export const COLOR_PALETTES = [
  { key: 'blush_sage', name: 'Blush and sage', colors: ['#F3DDD9', '#D9A79C', '#8FA189', '#3F4A3C'] },
  { key: 'ivory_gilt', name: 'Ivory and gilt', colors: ['#FBF5EC', '#EADCC3', '#C79A4B', '#4A3B22'] },
  { key: 'plum_dusk', name: 'Plum dusk', colors: ['#F0E2E8', '#C489A0', '#7A4058', '#33202A'] },
  { key: 'sea_glass', name: 'Sea glass', colors: ['#EAF2F0', '#B3D3CC', '#5E948B', '#2C433F'] },
  { key: 'marigold', name: 'Marigold and rose', colors: ['#FFF0D9', '#F2B544', '#C6416B', '#4A1B2C'] },
  { key: 'slate_rose', name: 'Slate and rose', colors: ['#EFEDEE', '#C9BFC4', '#8C6B75', '#3A3134' ] },
];

export function createStyleProfile({
  weddingId,
  stylePreferences = [],
  colorPaletteKey = null,
  quizAnswers = {},
  /** Ordered style keys with scores, highest first. */
  quizResults = [],
} = {}) {
  return createEntity('style', {
    weddingId,
    stylePreferences,
    colorPaletteKey,
    quizAnswers,
    quizResults,
    completedAt: null,
  });
}

export function createInspirationItem({
  weddingId,
  title,
  category = 'general',
  styleKey = null,
  paletteKey = null,
  imageUri = null,
  sourceUrl = null,
  notes = '',
  isSaved = true,
} = {}) {
  return createEntity('insp', {
    weddingId,
    title,
    category,
    styleKey,
    paletteKey,
    imageUri,
    sourceUrl,
    notes,
    isSaved,
  });
}

export function createMoodboard({ weddingId, name = 'Our vision', itemIds = [] } = {}) {
  return createEntity('mood', { weddingId, name, itemIds });
}

/**
 * Turn quiz answers into a ranked style result.
 * Each answer contributes weight to one or more style keys; ties resolve by the
 * canonical order in WEDDING_STYLES so results are deterministic.
 */
export function scoreStyleQuiz(answers = {}, questions = []) {
  const scores = {};

  for (const question of questions) {
    const answerKey = answers[question.id];
    if (!answerKey) continue;
    const option = question.options.find((o) => o.key === answerKey);
    if (!option?.weights) continue;
    for (const [styleKey, weight] of Object.entries(option.weights)) {
      scores[styleKey] = (scores[styleKey] ?? 0) + weight;
    }
  }

  return WEDDING_STYLES.map((style) => ({
    key: style.key,
    name: style.name,
    blurb: style.blurb,
    score: scores[style.key] ?? 0,
  }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);
}
