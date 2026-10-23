import { CHECKIN_PROMPTS, MAX_CHECKIN_RESPONSE, MAX_CHECKIN_TITLE } from './checkinConstants';

export function validateCheckIn(values = {}) {
  const errors = {};
  const prompt = typeof values.prompt === 'string' ? values.prompt.trim() : '';
  const first = typeof values.firstResponse === 'string' ? values.firstResponse.trim() : '';
  const second = typeof values.secondResponse === 'string' ? values.secondResponse.trim() : '';
  if (!prompt) errors.prompt = 'Add a question for this check-in.';
  else if (prompt.length > MAX_CHECKIN_TITLE)
    errors.prompt = `Keep the prompt under ${MAX_CHECKIN_TITLE} characters.`;
  if (!first && !second) errors.responses = 'Add a thought from at least one of you.';
  if (first.length > MAX_CHECKIN_RESPONSE || second.length > MAX_CHECKIN_RESPONSE) {
    errors.responses = `Each response must be under ${MAX_CHECKIN_RESPONSE} characters.`;
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}

export function sortCheckIns(items = []) {
  return [...items].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
}

export function chooseCheckInPrompt(items = [], random = Math.random) {
  const used = new Set(items.map((item) => item.prompt));
  const freshPrompts = CHECKIN_PROMPTS.filter((prompt) => !used.has(prompt));
  const available = freshPrompts.length ? freshPrompts : CHECKIN_PROMPTS;
  return available[Math.floor(random() * available.length)];
}

export function countCheckInResponses(item) {
  return [item?.firstResponse, item?.secondResponse].filter(
    (response) => typeof response === 'string' && response.trim().length > 0
  ).length;
}
