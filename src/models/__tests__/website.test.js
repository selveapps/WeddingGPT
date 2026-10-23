import {
  WebsiteSection,
  createWebsite,
  createWebsiteItem,
  validateWebsiteItem,
  websiteFilledSections,
  websiteUrlError,
} from '../website';
import { useWebsiteStore } from '../../store/websiteStore';

describe('website model', () => {
  it('starts empty, with the standard envelope', () => {
    const site = createWebsite({ weddingId: 'w' });
    expect(site.id).toMatch(/^site_/);
    expect(site).toMatchObject({ weddingId: 'w', events: [], stays: [], registry: [], faq: [], travel: '' });
    expect(websiteFilledSections(site)).toEqual([]);
  });

  it('accepts only http(s) links, like the server', () => {
    expect(websiteUrlError('https://registry.example')).toBeNull();
    expect(websiteUrlError('')).toBeNull();
    expect(websiteUrlError('', { required: true })).toBe('Add the link.');
    expect(websiteUrlError('registry.example')).toBe('Links start with https://');
    expect(websiteUrlError('javascript:alert(1)')).toBe('Links start with https://');
    expect(websiteUrlError('https://')).toBe('That link does not look right.');
  });

  it('validates items per section', () => {
    expect(validateWebsiteItem(WebsiteSection.EVENTS, { name: '', place: '' })).toEqual({
      name: 'Give it a name or a place.',
    });
    expect(validateWebsiteItem(WebsiteSection.EVENTS, { place: 'Garden' })).toEqual({});
    expect(validateWebsiteItem(WebsiteSection.REGISTRY, { name: 'Gifts', url: '' })).toEqual({
      url: 'Add the link.',
    });
    expect(validateWebsiteItem(WebsiteSection.STAYS, { name: 'Hotel', url: '' })).toEqual({});
    expect(validateWebsiteItem(WebsiteSection.FAQ, { question: 'Kids?' })).toEqual({
      answer: 'Add the answer.',
    });
    expect(validateWebsiteItem(WebsiteSection.FAQ, { question: 'x'.repeat(5000), answer: 'y' })).toEqual({
      question: 'That is too long.',
    });
  });

  it('gives each item an id and the section’s empty fields', () => {
    const item = createWebsiteItem(WebsiteSection.REGISTRY, { name: 'Gifts' });
    expect(item).toEqual({ id: expect.stringMatching(/^item_/), name: 'Gifts', url: '' });
  });

  it('lists the parts that have something in them', () => {
    expect(
      websiteFilledSections({
        welcome: { title: 'Hi' },
        events: [{}],
        travel: 'Fly',
        registry: [],
        faq: [{}],
      })
    ).toEqual(['welcome', 'schedule', 'travel', 'questions']);
  });
});

describe('websiteStore', () => {
  const store = () => useWebsiteStore.getState();
  beforeEach(() => store().reset());

  it('creates the record once and edits it through touchEntity', () => {
    const first = store().ensure('w');
    expect(store().ensure('w')).toBe(first);
    const updated = store().update({ travel: 'Fly into AUS' });
    expect(updated.travel).toBe('Fly into AUS');
    expect(updated.version).toBe(first.version + 1);
  });

  it('adds, edits, moves and removes items', () => {
    store().ensure('w');
    const a = store().addItem(WebsiteSection.FAQ, { question: 'A?', answer: 'a' });
    const b = store().addItem(WebsiteSection.FAQ, { question: 'B?', answer: 'b' });
    store().updateItem(WebsiteSection.FAQ, a.id, { answer: 'changed' });
    store().moveItem(WebsiteSection.FAQ, b.id, -1);
    expect(store().website.faq.map((item) => [item.question, item.answer])).toEqual([
      ['B?', 'b'],
      ['A?', 'changed'],
    ]);
    expect(store().moveItem(WebsiteSection.FAQ, b.id, -1)).toBe(false);
    store().removeItem(WebsiteSection.FAQ, b.id);
    expect(store().website.faq).toHaveLength(1);
  });

  it('stops adding at the section limit', () => {
    store().ensure('w');
    for (let i = 0; i < 30; i += 1)
      store().addItem(WebsiteSection.REGISTRY, { name: `R${i}`, url: 'https://x.example' });
    expect(
      store().addItem(WebsiteSection.REGISTRY, { name: 'one more', url: 'https://x.example' })
    ).toBeNull();
  });

  it('does nothing before the record exists', () => {
    expect(store().update({ travel: 'x' })).toBeNull();
    expect(store().addItem(WebsiteSection.FAQ, {})).toBeNull();
  });
});
