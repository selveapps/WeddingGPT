export function normalizeChipValues(value) {
  return Array.isArray(value) ? [...new Set(value)] : [];
}

export function isChipOptionSelected(value, optionValue, multiple) {
  return multiple
    ? normalizeChipValues(value).includes(optionValue)
    : value === optionValue;
}

export function toggleChipOption(value, optionValue) {
  const current = normalizeChipValues(value);
  return current.includes(optionValue)
    ? current.filter((item) => item !== optionValue)
    : [...current, optionValue];
}

export function selectedChipDescriptions(options, value) {
  const selectedValues = new Set(normalizeChipValues(value));
  return options
    .filter((option) => selectedValues.has(option.value) && option.description)
    .map((option) => option.description);
}
