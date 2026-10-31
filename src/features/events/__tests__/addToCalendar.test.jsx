import React from 'react';

import { useEventStore } from '@/store';
import { EventKind } from '@/models';
import { press, renderWithProviders, shownTexts } from '@/test/render';

import { EventsScreen } from '../EventsScreen';

const mockRouter = { push: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

const mockAdd = jest.fn(async () => ({ status: 'saved', added: 2, updated: 0 }));
jest.mock('@/services/calendar', () => ({ addToCalendar: (...args) => mockAdd(...args) }));

beforeEach(() => {
  jest.clearAllMocks();
  useEventStore.getState().reset();
});

describe('Add to calendar on Events', () => {
  it('adds every dated event and says how many', async () => {
    const { addEvent } = useEventStore.getState();
    addEvent({ kind: EventKind.MEHNDI, date: '2027-02-12', startTime: '16:00' });
    addEvent({ kind: EventKind.SANGEET, date: '2027-02-13' });
    addEvent({ kind: EventKind.BRUNCH });

    const tree = await renderWithProviders(<EventsScreen />);
    await press(tree, 'Add all 2 to my calendar');
    expect(mockAdd.mock.calls[0][0].map((entry) => entry.title)).toEqual(['Mehndi', 'Sangeet']);
    expect(shownTexts(tree)).toContain('In your calendar: 2 added');
  });

  it('is not offered when no event has a date', async () => {
    useEventStore.getState().addEvent({ kind: EventKind.BRUNCH });
    const tree = await renderWithProviders(<EventsScreen />);
    expect(shownTexts(tree).some((text) => /calendar/.test(text))).toBe(false);
  });
});
