import React from 'react';

import { useEventStore, useGuestStore, useWeddingStore, selectAllGuests } from '@/store';
import { createGuest, createWedding, MealPreference, PlusOneStatus, RsvpStatus } from '@/models';
import { press, renderWithProviders, shownTexts } from '@/test/render';

import { MealsScreen } from '../MealsScreen';

const mockRouter = { push: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

const mockExport = jest.fn(async () => 'downloaded');
jest.mock('@/services/files', () => ({
  datedFilename: (stem) => `${stem}-2027-01-04.csv`,
  exportTextFile: (...args) => mockExport(...args),
}));

beforeEach(() => {
  jest.clearAllMocks();
  useGuestStore.getState().reset();
  const wedding = createWedding({ ownerName: 'Priya' });
  useWeddingStore.setState({ wedding });
  const add = (fields) =>
    useGuestStore.getState().addGuest(createGuest({ weddingId: wedding.id, ...fields }));
  add({
    firstName: 'Meera',
    rsvpStatus: RsvpStatus.ATTENDING,
    mealPreference: MealPreference.VEGAN,
    dietaryNotes: 'Peanut allergy',
    plusOneStatus: PlusOneStatus.CONFIRMED,
    plusOneName: 'Anika',
  });
  add({ firstName: 'Ravi', rsvpStatus: RsvpStatus.ATTENDING, isChild: true });
  add({ firstName: 'Declined', rsvpStatus: RsvpStatus.DECLINED, dietaryNotes: 'shellfish' });
});

describe('MealsScreen', () => {
  it('counts plates for attending guests and plus-ones, and flags allergies', async () => {
    const tree = await renderWithProviders(<MealsScreen />);
    const shown = shownTexts(tree);
    expect(shown).toContain('3');
    expect(shown).toContain('Nuts');
    expect(shown).not.toContain('Shellfish');
  });

  it('exports the caterer list as a CSV file', async () => {
    const tree = await renderWithProviders(<MealsScreen />);
    await press(tree, 'Export as a spreadsheet (CSV)');
    expect(mockExport).toHaveBeenCalledWith(expect.objectContaining({ filename: 'catering-2027-01-04.csv' }));
    const csv = mockExport.mock.calls[0][0].text;
    expect(csv.split('\n')[0]).toBe('Name,Meal,Child,Dietary notes,Allergens,Plus one of');
    expect(csv).toContain('Anika');
  });

  it('says so when nobody is attending yet', async () => {
    useGuestStore.getState().reset();
    const tree = await renderWithProviders(<MealsScreen />);
    expect(shownTexts(tree)).toContain('No one is attending yet');
  });
});

describe('MealsScreen per event (G1)', () => {
  it('shows one event’s plates and exports its list', async () => {
    useEventStore.getState().reset();
    const [meera] = selectAllGuests(useGuestStore.getState());
    const mehndi = useEventStore
      .getState()
      .addEvent({ kind: 'mehndi', guestScope: 'invited', invitedGuestIds: [meera.id] });
    const tree = await renderWithProviders(<MealsScreen />);
    await press(tree, 'Mehndi');
    // Meera and her plus-one, not Ravi, who is not invited to the mehndi.
    expect(shownTexts(tree)).toContain('2');
    await press(tree, 'Export as a spreadsheet (CSV)');
    const [file] = mockExport.mock.calls.at(-1);
    expect(file.filename).toBe('catering-mehndi-2027-01-04.csv');
    expect(file.text).toContain('Meera');
    expect(file.text).not.toContain('Ravi');
    expect(mehndi.id).toBeTruthy();
  });

  it('says so when no one is coming to the event yet', async () => {
    useEventStore.getState().reset();
    useEventStore.getState().addEvent({ kind: 'brunch', guestScope: 'invited', invitedGuestIds: [] });
    const tree = await renderWithProviders(<MealsScreen />);
    await press(tree, 'Farewell brunch');
    expect(shownTexts(tree)).toContain('No one is attending the farewell brunch yet');
  });
});
