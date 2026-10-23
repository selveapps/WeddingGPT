export const PHOTO_SHOTS_FIELD = 'profileWeddingPhotoShots';
export const SHOT_PRIORITIES = ['must-have', 'important', 'nice-to-have'];

export function validatePhotoShot(values = {}) {
  const errors = {};
  const shot = typeof values.shot === 'string' ? values.shot.trim() : '';
  if (!shot) errors.shot = 'Describe the photo you want.';
  else if (shot.length > 120) errors.shot = 'Keep the shot description under 120 characters.';
  if (String(values.group ?? '').length > 60)
    errors.group = 'Keep the group or category under 60 characters.';
  if (!SHOT_PRIORITIES.includes(values.priority)) errors.priority = 'Choose a priority.';
  return { isValid: Object.keys(errors).length === 0, errors };
}

export function normalisePhotoShot(values = {}) {
  return {
    shot: values.shot.trim(),
    group: String(values.group ?? '').trim(),
    priority: SHOT_PRIORITIES.includes(values.priority) ? values.priority : 'important',
    completed: Boolean(values.completed),
  };
}

export function filterPhotoShots(records = [], filter = 'all', query = '') {
  const term = String(query).trim().toLocaleLowerCase();
  return records.filter(
    (item) =>
      (filter === 'all' || (filter === 'complete' ? item.completed : !item.completed)) &&
      (!term ||
        [item.shot, item.group, item.priority].some((value) =>
          String(value ?? '')
            .toLocaleLowerCase()
            .includes(term)
        ))
  );
}

export function summarisePhotoShots(records = []) {
  const completed = records.filter((item) => item.completed).length;
  return {
    total: records.length,
    completed,
    remaining: records.length - completed,
    mustHave: records.filter((item) => item.priority === 'must-have').length,
  };
}
