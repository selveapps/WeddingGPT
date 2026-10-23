import { buildShareableProfile, shareSummaryFilename } from '../shareSummary';

describe('buildShareableProfile', () => {
  const values = {
    ownerName: 'Priya',
    partnerName: 'Sam',
    email: 'priya@example.com',
    phone: '555-0123',
    city: 'Austin',
    guestCountEstimate: 80,
    budgetTotal: 5000000,
    currency: 'USD',
  };

  it('includes only fields allowed by current summary privacy preferences', () => {
    const summary = buildShareableProfile(values, {
      showContactDetails: false,
      showWeddingLocation: false,
      showGuestEstimate: false,
    });
    expect(summary).toContain('Couple: Priya & Sam');
    expect(summary).not.toContain('Austin');
    expect(summary).not.toContain('555-0123');
    expect(summary).not.toContain('priya@example.com');
    expect(summary).not.toContain('Guest estimate');
  });

  it('includes enabled summary details without adding unprovided fields', () => {
    const summary = buildShareableProfile(values, {
      showContactDetails: true,
      showWeddingLocation: true,
      showGuestEstimate: true,
    });
    expect(summary).toContain('Location: Austin');
    expect(summary).toContain('Guest estimate: 80');
    expect(summary).toContain('Phone: 555-0123');
    expect(summary).not.toContain('Date:');
  });

  it('produces a date-stamped text filename', () => {
    expect(shareSummaryFilename(new Date('2026-10-23T12:00:00Z'))).toBe('wedding-profile-2026-10-23.txt');
  });
});
