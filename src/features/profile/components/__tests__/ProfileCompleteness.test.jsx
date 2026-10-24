import React from 'react';

import { renderWithProviders, press, shownTexts } from '@/test/render';

import { ProfileCompleteness } from '../ProfileCompleteness';

describe('ProfileCompleteness', () => {
  it('shows the next missing detail and opens its section', async () => {
    const onMissingPress = jest.fn();
    const tree = await renderWithProviders(
      <ProfileCompleteness
        completeness={{
          percent: 45,
          filledCount: 5,
          totalCount: 11,
          missing: [
            { key: 'ownerName', section: 'personal' },
            { key: 'date', section: 'wedding' },
          ],
        }}
        onMissingPress={onMissingPress}
      />
    );

    expect(shownTexts(tree)).toContain('45%');
    expect(shownTexts(tree)).toContain('5 of 11 details filled');
    expect(shownTexts(tree)).toContain('Next up · 1 more after this');
    expect(shownTexts(tree)).toContain('Add your name');

    await press(tree, 'Next up: Add your name');

    expect(onMissingPress).toHaveBeenCalledWith('personal');
  });

  it('shows the complete state when there are no missing details', async () => {
    const tree = await renderWithProviders(
      <ProfileCompleteness completeness={{ percent: 100, filledCount: 11, totalCount: 11, missing: [] }} />
    );

    expect(shownTexts(tree)).toContain('Your profile is all set');
    expect(shownTexts(tree)).not.toContain('Next up');
  });
});
