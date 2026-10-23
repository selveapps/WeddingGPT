import React from 'react';

import { useWeddingStore } from '@/store';
import { STYLE_QUIZ, createWedding } from '@/models';
import { press, pressables, renderWithProviders, shownTexts } from '@/test/render';

import { StyleScreen } from '../StyleScreen';

// The Labs import has its own tests; here it would outlive the test.
jest.mock('../labsImport', () => ({ importLabStyle: jest.fn(async () => 0) }));
const mockRouter = { push: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));
const mockShare = jest.fn(async () => true);
jest.mock('@/services/share', () => ({ shareText: (...args) => mockShare(...args) }));

const wedding = () => useWeddingStore.getState().wedding;
const RUSTIC = [
  'A barn or vineyard',
  'Relaxed and unhurried',
  'Light and flowing',
  'Long shared tables',
  'Lighting and candles',
];

beforeEach(() => {
  jest.clearAllMocks();
  useWeddingStore.setState({ wedding: createWedding({ ownerName: 'Priya', partnerName: 'Sam' }) });
});

const render = () => renderWithProviders(<StyleScreen />);

describe('StyleScreen', () => {
  it('saves answers on the wedding and shows the leading style', async () => {
    const tree = await render();
    await press(tree, 'A barn or vineyard');
    expect(wedding().styleQuizAnswers).toEqual({ setting: 'barn' });
    expect(shownTexts(tree)).toEqual(expect.arrayContaining(['Leaning towards', 'Rustic warmth']));
  });

  it('saves the result as the couple’s style only when asked', async () => {
    const tree = await render();
    for (const label of RUSTIC) await press(tree, label);
    expect(shownTexts(tree)).toContain('Your style');
    expect(wedding().styleTags ?? []).toEqual([]);

    await press(tree, 'Save as our style');
    expect(wedding().styleTags).toEqual(['rustic']);
    expect(shownTexts(tree)).toContain('Saved as your style');
  });

  it('suggests palettes for the style and saves the choice', async () => {
    const tree = await render();
    await press(tree, 'By the water');
    const suggested = tree.root.findAll((n) => n.props.label === 'Suggested' && n.props.tone === 'brand');
    expect(suggested.length).toBeGreaterThan(0);
    await press(tree, 'Sea glass palette');
    expect(wedding().paletteKey).toBe('sea_glass');
    expect(shownTexts(tree)).toContain('Chosen');
  });

  it('starts over', async () => {
    useWeddingStore.getState().updateWedding({ styleQuizAnswers: { setting: 'barn' } });
    const tree = await render();
    await press(tree, 'Start over');
    expect(wedding().styleQuizAnswers).toEqual({});
    expect(shownTexts(tree)).toContain(`0 of ${STYLE_QUIZ.length} answered`);
  });

  it('shares a brief with the style, palette and vision board ideas', async () => {
    useWeddingStore.getState().updateWedding({
      styleQuizAnswers: { setting: 'barn' },
      paletteKey: 'ivory_gilt',
      profileVisionIdeas: [{ id: 'v1', title: 'Peonies', note: '' }],
    });
    const tree = await render();
    expect(shownTexts(tree)).toContain('1 idea saved - they go in the brief too');
    await press(tree, 'Share our style brief');
    const [text] = mockShare.mock.calls[0];
    expect(text).toContain('Rustic warmth');
    expect(text).toContain('Palette: Ivory and gilt');
    expect(text).toContain('- Peonies');

    await press(tree, 'Vision board');
    expect(mockRouter.push).toHaveBeenCalledWith('/account/profile');
  });

  it('cannot share an empty brief', async () => {
    const tree = await render();
    const button = pressables(tree, 'Share our style brief')[0];
    expect(button.props.disabled ?? button.props.accessibilityState?.disabled).toBe(true);
  });
});
