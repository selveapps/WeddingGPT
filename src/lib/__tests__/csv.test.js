import { csvCell, detectDelimiter, parseCsv, toCsv, unguardCell } from '../csv';

describe('writing', () => {
  it('quotes cells with commas, quotes and newlines', () => {
    expect(csvCell('Shah, Meera')).toBe('"Shah, Meera"');
    expect(csvCell('the "big" day')).toBe('"the ""big"" day"');
    expect(csvCell('line\nbreak')).toBe('"line\nbreak"');
    expect(csvCell(null)).toBe('');
    expect(csvCell(42)).toBe('42');
  });

  it('guards cells a spreadsheet would run as a formula', () => {
    expect(csvCell('=HYPERLINK("http://evil")')).toBe('"\'=HYPERLINK(""http://evil"")"');
    expect(csvCell('+44 20 7946 0000')).toBe("'+44 20 7946 0000");
    expect(csvCell('@me')).toBe("'@me");
  });

  it('joins rows', () => {
    expect(
      toCsv([
        ['a', 'b'],
        ['c', 'd,e'],
      ])
    ).toBe('a,b\nc,"d,e"');
  });
});

describe('unguardCell', () => {
  it('removes only the formula guard', () => {
    expect(unguardCell("'+44 20")).toBe('+44 20');
    expect(unguardCell("'=SUM(A1)")).toBe('=SUM(A1)');
    expect(unguardCell("O'Brien")).toBe("O'Brien");
    expect(unguardCell("'quoted'")).toBe("'quoted'");
  });
});

describe('detectDelimiter', () => {
  it('picks the separator that splits the header most', () => {
    expect(detectDelimiter('a,b,c\n1,2,3')).toBe(',');
    expect(detectDelimiter('a;b;c\n1;2;3')).toBe(';');
    expect(detectDelimiter('a\tb\tc')).toBe('\t');
  });

  it('ignores separators inside quotes', () => {
    expect(detectDelimiter('"a,b,c";d;e')).toBe(';');
  });

  it('defaults to a comma', () => {
    expect(detectDelimiter('single')).toBe(',');
  });
});

describe('parseCsv', () => {
  it('reads quoted fields with commas, doubled quotes and line breaks', () => {
    expect(parseCsv('name,notes\n"Shah, Meera","said ""yes""\nby text"')).toEqual([
      ['name', 'notes'],
      ['Shah, Meera', 'said "yes"\nby text'],
    ]);
  });

  it('handles a byte-order mark, CRLF endings and blank lines', () => {
    expect(parseCsv('﻿a,b\r\n1,2\r\n\r\n3,4\r\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
      ['3', '4'],
    ]);
  });

  it('reads semicolon files and pads short rows', () => {
    expect(parseCsv('a;b;c\n1;2')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', ''],
    ]);
  });

  it('keeps empty cells and a trailing empty cell', () => {
    expect(parseCsv('a,,c,\n')).toEqual([['a', '', 'c', '']]);
  });

  it('returns nothing for empty input', () => {
    expect(parseCsv('')).toEqual([]);
    expect(parseCsv('  \n ')).toEqual([]);
    expect(parseCsv(undefined)).toEqual([]);
  });

  it('round-trips what toCsv writes', () => {
    const rows = [
      ['First name', 'Notes'],
      ['Meera', 'Allergic to nuts, shellfish'],
      ['Sam', 'He said "maybe"'],
    ];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });
});
