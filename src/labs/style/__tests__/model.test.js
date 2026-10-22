import {
  STYLE_QUIZ,
  MoodItemKind,
  normaliseLink,
  quizProgress,
  quizResult,
  rankPalettes,
  styleBrief,
} from '../model';

const RUSTIC = { setting: 'barn', mood: 'calm', dress: 'flowing', table: 'long', detail: 'lighting' };

describe('quiz', () => {
  it('only scores options that exist on the questions', () => {
    for (const question of STYLE_QUIZ) {
      for (const option of question.options) {
        expect(Object.keys(option.weights).length).toBeGreaterThan(0);
      }
    }
  });

  it('tracks progress', () => {
    expect(quizProgress({})).toEqual({ answered: 0, total: 5, complete: false });
    expect(quizProgress(RUSTIC).complete).toBe(true);
  });

  it('ranks the obvious answer first with shares summing to 1', () => {
    const result = quizResult(RUSTIC);
    expect(result[0].key).toBe('rustic');
    expect(result.reduce((sum, entry) => sum + entry.share, 0)).toBeCloseTo(1);
  });
});

it('puts suggested palettes first', () => {
  const palettes = rankPalettes('coastal');
  expect(palettes.slice(0, 2).map((p) => p.key)).toEqual(['blush_sage', 'sea_glass']);
  expect(palettes.filter((p) => p.suggested)).toHaveLength(2);
});

describe('normaliseLink', () => {
  it('adds a scheme and rejects non-links', () => {
    expect(normaliseLink('pinterest.com/us')).toBe('https://pinterest.com/us');
    expect(normaliseLink('http://a.co')).toBe('http://a.co');
    expect(normaliseLink('not a link')).toBeNull();
    expect(normaliseLink('hello')).toBeNull();
  });
});

it('writes a brief with style, palette, notes and links', () => {
  const brief = styleBrief({
    answers: RUSTIC,
    paletteKey: 'ivory_gilt',
    items: [
      { kind: MoodItemKind.NOTE, text: 'Candles on every table' },
      { kind: MoodItemKind.LINK, text: 'https://pinterest.com/us' },
    ],
  });
  expect(brief).toContain('Rustic warmth');
  expect(brief).toContain('Palette: Ivory and gilt');
  expect(brief).toContain('- Candles on every table');
  expect(brief).toContain('- https://pinterest.com/us');
});
