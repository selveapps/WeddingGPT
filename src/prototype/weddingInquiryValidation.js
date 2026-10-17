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
  if (!weddingDate) {
    errors.weddingDate = 'Enter your wedding date.';
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(weddingDate)) {
    errors.weddingDate = 'Use YYYY-MM-DD format.';
  }

  return errors;
}