import { chooseCheckInPrompt, countCheckInResponses, sortCheckIns, validateCheckIn } from '../checkinHelpers';
import { CHECKIN_PROMPTS } from '../checkinConstants';

describe('couple check-in helpers', () => {
  it('requires at least one response and bounds all text', () => {
    expect(validateCheckIn({ prompt: 'How are we?', firstResponse: 'Good' }).isValid).toBe(true);
    expect(validateCheckIn({ prompt: 'How are we?' }).errors.responses).toBeTruthy();
  });

  it('prefers unused prompts and safely repeats when all prompts have been used', () => {
    expect(chooseCheckInPrompt([{ prompt: CHECKIN_PROMPTS[0] }], () => 0)).toBe(CHECKIN_PROMPTS[1]);
    expect(
      chooseCheckInPrompt(
        CHECKIN_PROMPTS.map((prompt) => ({ prompt })),
        () => 0
      )
    ).toBe(CHECKIN_PROMPTS[0]);
  });

  it('counts contributed responses and sorts newest first', () => {
    expect(countCheckInResponses({ firstResponse: 'A', secondResponse: '  ' })).toBe(1);
    expect(sortCheckIns([{ createdAt: '2024' }, { createdAt: '2026' }])[0].createdAt).toBe('2026');
  });
});
