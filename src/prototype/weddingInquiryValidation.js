// Return field-keyed messages so each TextField can show its own validation error.
export function validateWeddingInquiry(form) {
  const errors = {};
  const email = form.email.trim();
  const weddingDate = form.weddingDate.trim();

  if (!form.coupleNames.trim()) errors.coupleNames = 'Enter both names.';
  if (!email) {
    errors.email = 'Enter an email address.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Enter a valid email address.';
  }
  // The prototype checks YYYY-MM-DD shape, not whether it is a real calendar date.
  if (!weddingDate) {
    errors.weddingDate = 'Enter your wedding date.';
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(weddingDate)) {
    errors.weddingDate = 'Use YYYY-MM-DD format.';
  }

  return errors;
}