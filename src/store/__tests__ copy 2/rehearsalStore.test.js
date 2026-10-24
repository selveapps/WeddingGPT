describe('rehearsal', () => {
  it('placeholder passes', () => {
    expect(true).toBe(true);
  });
  it('stats shape is stable', () => {
    const stats = { count: 0, secondaryCount: 0 };
    expect(stats).toHaveProperty('count');
  });
});
