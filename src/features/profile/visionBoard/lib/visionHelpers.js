import { MAX_VISION_NOTE, MAX_VISION_TITLE, VISION_CATEGORIES, VISION_MOODS } from './visionConstants';

export function normaliseVisionTags(value) {
  if (!Array.isArray(value)) return [];
  const allowed = new Set(VISION_MOODS.map((mood) => mood.value));
  return [...new Set(value.filter((tag) => typeof tag === 'string' && allowed.has(tag)))];
}

export function validateVisionIdea(values = {}) {
  const errors = {};
  const title = typeof values.title === 'string' ? values.title.trim() : '';
  const note = typeof values.note === 'string' ? values.note.trim() : '';
  if (!title) errors.title = 'Give this idea a short title.';
  else if (title.length > MAX_VISION_TITLE)
    errors.title = `Keep the title under ${MAX_VISION_TITLE} characters.`;
  if (note.length > MAX_VISION_NOTE) errors.note = `Keep notes under ${MAX_VISION_NOTE} characters.`;
  if (!VISION_CATEGORIES.some((category) => category.value === values.category)) {
    errors.category = 'Choose an idea category.';
  }
  if (
    values.moods &&
    (!Array.isArray(values.moods) ||
      values.moods.some((mood) => !VISION_MOODS.some((option) => option.value === mood)))
  ) {
    errors.moods = 'Choose moods from the list.';
  }
  if (values.photo != null && typeof values.photo?.key !== 'string') {
    errors.photo = 'Choose the photo again.';
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}

export function filterVisionIdeas(ideas = [], { category = 'all', mood = 'all', savedOnly = false } = {}) {
  return ideas.filter((idea) => {
    if (category !== 'all' && idea.category !== category) return false;
    if (mood !== 'all' && !normaliseVisionTags(idea.moods).includes(mood)) return false;
    return !savedOnly || Boolean(idea.saved);
  });
}

export function searchVisionIdeas(ideas = [], query = '') {
  const term = String(query).trim().toLocaleLowerCase();
  if (!term) return [...ideas];
  return ideas.filter((idea) =>
    [
      idea.title,
      idea.note,
      visionCategoryLabel(idea.category),
      ...(idea.moods ?? []).map(visionMoodLabel),
    ].some((value) =>
      String(value ?? '')
        .toLocaleLowerCase()
        .includes(term)
    )
  );
}

export function sortVisionIdeas(ideas = [], sortBy = 'recent') {
  return [...ideas].sort((a, b) => {
    if (Boolean(a.saved) !== Boolean(b.saved)) return a.saved ? -1 : 1;
    if (sortBy === 'title') {
      return (a.title ?? '').localeCompare(b.title ?? '', undefined, { sensitivity: 'base' });
    }
    return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
  });
}

export function summariseVision(ideas = []) {
  const categoryCounts = ideas.reduce((counts, idea) => {
    if (idea.category) counts[idea.category] = (counts[idea.category] ?? 0) + 1;
    return counts;
  }, {});
  return {
    total: ideas.length,
    saved: ideas.filter((idea) => idea.saved).length,
    photos: visionPhotoKeys(ideas).length,
    categories: new Set(ideas.map((idea) => idea.category).filter(Boolean)).size,
    categoryCounts,
  };
}

/** Every photo key on the board: what this phone's photo folder keeps. */
export function visionPhotoKeys(ideas = []) {
  return ideas.map((idea) => idea.photo?.key).filter((key) => typeof key === 'string');
}

/**
 * Width over height for showing a photo, kept between a tall 3:4 and a wide
 * 16:9 so one odd panorama cannot take over the board. Square when unknown.
 */
export function visionPhotoAspect(photo) {
  const ratio = photo?.width && photo?.height ? photo.width / photo.height : 1;
  return Math.min(16 / 9, Math.max(3 / 4, ratio));
}

export function visionCategoryLabel(value) {
  return VISION_CATEGORIES.find((category) => category.value === value)?.label ?? 'Idea';
}

export function visionMoodLabel(value) {
  return VISION_MOODS.find((mood) => mood.value === value)?.label ?? value;
}
