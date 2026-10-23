export const FAQ_CATEGORIES = [
  { value: 'travel', label: 'Travel & arrival' },
  { value: 'schedule', label: 'Schedule' },
  { value: 'attire', label: 'What to wear' },
  { value: 'accommodations', label: 'Accommodations' },
  { value: 'food', label: 'Food & access' },
  { value: 'other', label: 'Other details' },
];

export function validateFaq(values) {
  const errors = {};
  if (!String(values.question ?? '').trim()) errors.question = 'Write a guest question.';
  if (!String(values.answer ?? '').trim()) errors.answer = 'Add the answer guests need.';
  if (!FAQ_CATEGORIES.some((category) => category.value === values.category))
    errors.category = 'Choose a category.';
  if (values.order !== '' && (!Number.isInteger(Number(values.order)) || Number(values.order) < 1))
    errors.order = 'Use a positive whole number.';
  return { isValid: Object.keys(errors).length === 0, errors };
}

export function normalizeFaq(values, fallbackOrder = 1) {
  return {
    question: String(values.question ?? '').trim(),
    answer: String(values.answer ?? '').trim(),
    category: FAQ_CATEGORIES.some((category) => category.value === values.category)
      ? values.category
      : 'other',
    visible: values.visible !== false,
    order:
      values.order === '' || values.order == null
        ? fallbackOrder
        : Math.max(1, Math.floor(Number(values.order) || fallbackOrder)),
  };
}

export function searchFaq(records, query) {
  const term = String(query ?? '')
    .trim()
    .toLocaleLowerCase();
  return term
    ? records.filter((record) =>
        [record.question, record.answer, record.category].some((value) =>
          String(value ?? '')
            .toLocaleLowerCase()
            .includes(term)
        )
      )
    : records;
}

export function sortFaq(records) {
  return [...records].sort(
    (a, b) => (Number(a.order) || 1) - (Number(b.order) || 1) || a.question.localeCompare(b.question)
  );
}

export function summarizeFaq(records) {
  return {
    total: records.length,
    published: records.filter((record) => record.visible).length,
    categories: new Set(records.map((record) => record.category)).size,
  };
}

export function faqCategoryLabel(value) {
  return FAQ_CATEGORIES.find((category) => category.value === value)?.label ?? 'Other details';
}
