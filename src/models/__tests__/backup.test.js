import { BACKUP_FORMAT, BACKUP_LIMITS, buildBackup, readBackup } from '../backup';

const known = [
  { collection: 'wedding', kind: 'one', label: 'Wedding' },
  { collection: 'guests', kind: 'many', label: 'Guests' },
  { collection: 'events', kind: 'many', label: 'Events' },
];

const wedding = { id: 'wed_1', ownerName: 'Priya' };
const guests = {
  byId: { guest_1: { id: 'guest_1', firstName: 'Meera' }, guest_2: { id: 'guest_2', firstName: 'Ravi' } },
  allIds: ['guest_1', 'guest_2'],
};
const backup = () =>
  buildBackup(
    [
      { collection: 'wedding', kind: 'one', value: wedding },
      { collection: 'guests', kind: 'many', value: guests },
      { collection: 'events', kind: 'many', value: { byId: {}, allIds: [] } },
    ],
    { createdAt: '2027-01-04T10:00:00.000Z' }
  );

/** Edit the parsed backup and re-sign it, as someone hand-crafting a file would. */
function crafted(change) {
  const raw = JSON.parse(backup());
  change(raw.collections, raw);
  const { checksum } = JSON.parse(
    buildBackup(Object.entries(raw.collections).map(([collection, value]) => ({ collection, value })))
  );
  return JSON.stringify({ ...raw, checksum });
}

describe('backups', () => {
  it('round-trips everything with counts', () => {
    const read = readBackup(backup(), known);
    expect(read.ok).toBe(true);
    expect(read.createdAt).toBe('2027-01-04T10:00:00.000Z');
    expect(read.collections.wedding).toEqual(wedding);
    expect(read.collections.guests).toEqual(guests);
    expect(read.counts).toEqual([
      { collection: 'wedding', label: 'Wedding', count: 1 },
      { collection: 'guests', label: 'Guests', count: 2 },
      { collection: 'events', label: 'Events', count: 0 },
    ]);
  });

  it('fills collections an older backup does not have, and ignores ones it does not know', () => {
    const text = crafted((collections) => {
      delete collections.events;
      collections.futureThing = { byId: {}, allIds: [] };
    });
    const read = readBackup(text, known);
    expect(read.ok).toBe(true);
    expect(read.collections.events).toEqual({ byId: {}, allIds: [] });
    expect(read.collections.futureThing).toBeUndefined();
  });

  it.each([
    ['', 'Choose a backup file'],
    ['not json', 'not a WeddingGPT backup'],
    ['[]', 'not a WeddingGPT backup'],
    [JSON.stringify({ format: 'something-else', collections: {} }), 'not a WeddingGPT backup'],
  ])('refuses %j', (text, message) => {
    const read = readBackup(text, known);
    expect(read.ok).toBe(false);
    expect(read.error).toContain(message);
  });

  it('refuses a file from a newer version', () => {
    const text = JSON.stringify({ ...JSON.parse(backup()), version: 99 });
    expect(readBackup(text, known).error).toMatch(/newer version/);
  });

  it('refuses a file that was changed or cut off', () => {
    const changed = backup().replace('Meera', 'Mallory');
    expect(readBackup(changed, known).error).toMatch(/changed or cut off/);
    const raw = JSON.parse(backup());
    delete raw.checksum;
    expect(readBackup(JSON.stringify(raw), known).error).toMatch(/changed or cut off/);
  });

  it('refuses a backup without a wedding', () => {
    expect(
      readBackup(
        crafted((c) => (c.wedding = null)),
        known
      ).error
    ).toMatch(/no wedding/);
  });

  it('refuses damaged collections even when the checksum is right', () => {
    const cases = [
      (c) => (c.guests = 'nope'),
      (c) => (c.guests = { byId: {}, allIds: ['guest_9'] }),
      (c) => (c.guests.byId.guest_1.id = 'guest_other'),
      (c) => c.guests.allIds.push('guest_1'),
      (c) => (c.guests = { byId: { 'has space': { id: 'has space' } }, allIds: ['has space'] }),
      (c) => (c.wedding = { ownerName: 'no id' }),
    ];
    for (const change of cases) {
      const read = readBackup(crafted(change), known);
      expect(read.ok).toBe(false);
      expect(read.error).toMatch(/damaged/);
    }
  });

  it('refuses ids that would reach into object prototypes', () => {
    const text = crafted((c) => {
      c.guests = JSON.parse(
        '{"byId":{"__proto__":{"id":"__proto__","polluted":true}},"allIds":["__proto__"]}'
      );
    });
    expect(readBackup(text, known).ok).toBe(false);
    expect({}.polluted).toBeUndefined();
    const constructorId = crafted((c) => {
      c.guests = { byId: { constructor: { id: 'constructor' } }, allIds: ['constructor'] };
    });
    expect(readBackup(constructorId, known).ok).toBe(false);
  });

  it('refuses huge files before reading them', () => {
    const read = readBackup(`{"format":"${BACKUP_FORMAT}"${' '.repeat(BACKUP_LIMITS.textChars)}}`, known);
    expect(read.error).toMatch(/too large/);
  });
});
