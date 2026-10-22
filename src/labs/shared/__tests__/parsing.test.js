import { findDate, findDates } from '../dates';
import { findAmounts, findPercents } from '../money';

const FROM = new Date(2027, 0, 10); // Jan 10 2027

describe('findDate', () => {
  it.each([
    ['by 2027-03-01', '2027-03-01'],
    ['due March 3', '2027-03-03'],
    ['on Mar 3rd, 2028', '2028-03-03'],
    ['3 March', '2027-03-03'],
    ['before 3/14/2027', '2027-03-14'],
    ['by 3/14/28', '2028-03-14'],
    ['tomorrow', '2027-01-11'],
    ['next week', '2027-01-17'],
    ['in 2 weeks', '2027-01-24'],
    ['in 3 months', '2027-04-10'],
  ])('%s -> %s', (text, iso) => {
    expect(findDate(text, FROM)?.iso).toBe(iso);
  });

  it('rolls a past month-day into next year', () => {
    expect(findDate('January 2', FROM).iso).toBe('2028-01-02');
  });

  it('ignores impossible dates and text without dates', () => {
    expect(findDate('February 30', FROM)).toBeNull();
    expect(findDate('call the DJ', FROM)).toBeNull();
  });

  it('finds several dates in reading order without double counting', () => {
    const dates = findDates('Deposit due 2027-02-01, balance due June 5, 2027', FROM);
    expect(dates.map((d) => d.iso)).toEqual(['2027-02-01', '2027-06-05']);
  });
});

describe('findAmounts', () => {
  it('reads common money formats as cents', () => {
    expect(findAmounts('$2,000').map((a) => a.minor)).toEqual([200000]);
    expect(findAmounts('$1.5k')[0].minor).toBe(150000);
    expect(findAmounts('2k')[0]).toMatchObject({ minor: 200000, explicit: true });
    expect(findAmounts('300 dollars')[0]).toMatchObject({ minor: 30000, explicit: true });
    expect(findAmounts('$49.99')[0].minor).toBe(4999);
  });

  it('marks bare numbers as not explicitly money', () => {
    expect(findAmounts('spent 500 on cake')[0]).toMatchObject({ minor: 50000, explicit: false });
  });

  it('finds percentages', () => {
    expect(findPercents('a 30% deposit')).toEqual([{ percent: 30, index: 2, raw: '30%' }]);
  });
});
