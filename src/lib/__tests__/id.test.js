import { createId, timestampFromId, ulid } from '../id';

const CROCKFORD = /^[0-9ABCDEFGHJKMNPQRSTVWXYZ]{26}$/;

describe('ulid', () => {
  it('is 26 Crockford base32 characters', () => {
    expect(ulid()).toMatch(CROCKFORD);
  });

  it('sorts chronologically', () => {
    const earlier = ulid(1_700_000_000_000);
    const later = ulid(1_700_000_000_001);
    expect(earlier < later).toBe(true);
  });

  it('stays unique and ordered within the same millisecond', () => {
    const now = 1_800_000_000_000;
    const ids = Array.from({ length: 50 }, () => ulid(now));
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual(ids);
  });
});

describe('createId', () => {
  it('prefixes the entity type', () => {
    expect(createId('task')).toMatch(/^task_[0-9A-Z]{26}$/);
  });

  it('returns a bare ID without a prefix', () => {
    expect(createId()).toMatch(CROCKFORD);
  });
});

describe('timestampFromId', () => {
  it('recovers the creation time from bare and prefixed IDs', () => {
    const now = 1_750_000_000_123;
    expect(timestampFromId(ulid(now))).toBe(now);
    expect(timestampFromId(`guest_${ulid(now)}`)).toBe(now);
  });

  it('returns null for things that are not IDs', () => {
    expect(timestampFromId(null)).toBeNull();
    expect(timestampFromId('short')).toBeNull();
    expect(timestampFromId('task_ILOU0000000000000000000000')).toBeNull();
  });
});
