import {
  toMinor,
  toMajor,
  parseMoneyInput,
  percentOf,
  formatMoney,
  formatMoneyCompact,
} from '../currency';

describe('toMinor / toMajor', () => {
  it('converts between major and minor units', () => {
    expect(toMinor(12.5)).toBe(1250);
    expect(toMajor(1250)).toBe(12.5);
  });

  it('rounds away floating point noise', () => {
    expect(toMinor(0.1 + 0.2)).toBe(30);
  });

  it('treats non-numbers as zero rather than NaN', () => {
    expect(toMinor('abc')).toBe(0);
    expect(toMinor(Infinity)).toBe(0);
    expect(toMajor(undefined)).toBe(0);
  });
});

describe('parseMoneyInput', () => {
  it('tolerates symbols, spaces and grouping separators', () => {
    expect(parseMoneyInput('$45,000')).toBe(4500000);
    expect(parseMoneyInput(' 1 250.50 ')).toBe(125050);
  });

  it('returns null for empty input so callers can tell empty from zero', () => {
    expect(parseMoneyInput('')).toBeNull();
    expect(parseMoneyInput('$')).toBeNull();
    expect(parseMoneyInput('.')).toBeNull();
    expect(parseMoneyInput(null)).toBeNull();
  });

  it('parses zero as zero', () => {
    expect(parseMoneyInput('0')).toBe(0);
  });
});

describe('percentOf', () => {
  it('is safe when the total is zero', () => {
    expect(percentOf(50, 0)).toBe(0);
  });

  it('clamps to 0-100', () => {
    expect(percentOf(150, 100)).toBe(100);
    expect(percentOf(-10, 100)).toBe(0);
    expect(percentOf(25, 100)).toBe(25);
  });
});

describe('formatMoney', () => {
  it('formats whole amounts without decimals', () => {
    expect(formatMoney(4500000, 'USD')).toBe('$45,000');
  });
});

describe('formatMoneyCompact', () => {
  it('leaves amounts under a thousand in full', () => {
    expect(formatMoneyCompact(95000)).toBe('$950');
  });

  it('condenses thousands, millions and billions', () => {
    expect(formatMoneyCompact(4500000)).toBe('$45K');
    expect(formatMoneyCompact(120000000)).toBe('$1.2M');
    expect(formatMoneyCompact(300000000000)).toBe('$3B');
  });

  it('keeps one decimal and drops a trailing zero', () => {
    expect(formatMoneyCompact(450000)).toBe('$4.5K');
    expect(formatMoneyCompact(400000)).toBe('$4K');
  });

  it('moves up a unit when rounding reaches a thousand', () => {
    expect(formatMoneyCompact(99996000)).toBe('$1M');
    expect(formatMoneyCompact(96000000)).toBe('$960K');
  });

  it('keeps the sign on negative amounts', () => {
    expect(formatMoneyCompact(-4500000)).toBe('-$45K');
  });
});
