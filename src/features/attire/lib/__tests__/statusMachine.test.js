import { nextStatus, prevStatus, STATUS_FLOW, advanceStatus } from '../statusMachine';

describe('statusMachine', () => {
  it('advances along flow', () => {
    expect(nextStatus('idea')).toBe('researching');
    expect(nextStatus('packed')).toBe(null);
  });

  it('goes back', () => {
    expect(prevStatus('ordered')).toBe('researching');
    expect(prevStatus('idea')).toBe(null);
  });

  it('advanceStatus stays at end', () => {
    expect(advanceStatus('packed')).toBe('packed');
  });

  it('flow length', () => {
    expect(STATUS_FLOW.length).toBeGreaterThanOrEqual(7);
  });
});
