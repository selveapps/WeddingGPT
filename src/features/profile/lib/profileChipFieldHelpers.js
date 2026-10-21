export function normalizeChipValues(value) {
  return Array.isArray(value) ? [...new Set(value)] : [];
}

export function isChipOptionSelected(value, optionValue, multiple) {
  return multiple ? normalizeChipValues(value).includes(optionValue) : value === optionValue;
}

export function isChipSelectionLimitReached(value, optionValue, maxSelections) {
  const current = normalizeChipValues(value);
  return (
    !current.includes(optionValue) &&
    Number.isInteger(maxSelections) &&
    maxSelections >= 0 &&
    current.length >= maxSelections
  );
}

export function toggleChipOption(value, optionValue, maxSelections) {
  const current = normalizeChipValues(value);
  if (current.includes(optionValue)) {
    return current.filter((item) => item !== optionValue);
  }
  if (Number.isInteger(maxSelections) && maxSelections >= 0 && current.length >= maxSelections) {
    return current;
  }
  return [...current, optionValue];
}

export function selectedChipDescriptions(options, value) {
  const selectedValues = new Set(normalizeChipValues(value));
  return options
    .filter((option) => selectedValues.has(option.value) && option.description)
    .map((option) => option.description);
}
