export const MENU_FIELD = 'profileWeddingMenu';
export const MENU_STATUSES = ['planned', 'confirmed', 'served'];

export function validateMenuItem(values = {}) {
  const errors = {};
  const dish = typeof values.dish === 'string' ? values.dish.trim() : '';
  if (!dish) errors.dish = 'Add a dish or menu item.';
  else if (dish.length > 90) errors.dish = 'Keep the dish name under 90 characters.';
  if (String(values.course ?? '').trim().length > 40) errors.course = 'Keep the course under 40 characters.';
  if (!MENU_STATUSES.includes(values.status)) errors.status = 'Choose a menu status.';
  for (const key of ['dietary', 'serving']) {
    if (String(values[key] ?? '').length > 180) errors[key] = 'Keep this note under 180 characters.';
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}

export function normaliseMenuItem(values = {}) {
  return {
    dish: values.dish.trim(),
    course: String(values.course ?? '').trim(),
    dietary: String(values.dietary ?? '').trim(),
    serving: String(values.serving ?? '').trim(),
    status: MENU_STATUSES.includes(values.status) ? values.status : 'planned',
  };
}

export function filterMenu(records = [], filter = 'all', query = '') {
  const term = String(query).trim().toLocaleLowerCase();
  return records.filter(
    (item) =>
      (filter === 'all' || item.status === filter) &&
      (!term ||
        [item.dish, item.course, item.dietary, item.serving].some((value) =>
          String(value ?? '')
            .toLocaleLowerCase()
            .includes(term)
        ))
  );
}

export function summariseMenu(records = []) {
  return {
    total: records.length,
    confirmed: records.filter((item) => item.status === 'confirmed').length,
    dietaryNotes: records.filter((item) => item.dietary).length,
  };
}
