import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from '@/design-system/theme';
import { ToastProvider } from '@/design-system/components';
import { useGuestStore, useWeddingStore, selectAllGuests, selectAllHouseholds } from '@/store';
import { createGuest, createWedding, RsvpStatus } from '@/models';

import { GuestSpreadsheetScreen } from '../GuestSpreadsheetScreen';

const mockRouter = { back: jest.fn(), push: jest.fn(), replace: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

const CSV = [
  'Name,Email,RSVP,Household',
  'Meera Shah,meera@example.com,Yes,The Shahs',
  'Ravi Shah,,no,The Shahs',
  'Sam Lee,sam@,maybe,',
  'Existing Guest,,,',
].join('\n');

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function render() {
  let tree;
  act(() => {
    tree = renderer.create(
      <SafeAreaProvider initialMetrics={METRICS}>
        <ThemeProvider>
          <ToastProvider>
            <GuestSpreadsheetScreen />
          </ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    );
  });
  return tree;
}

const pressable = (tree, label) =>
  tree.root.find(
    (node) => node.props.accessibilityLabel === label && typeof node.props.onPress === 'function'
  );
const textField = (tree) =>
  tree.root.find((node) => node.props.multiline && typeof node.props.onChangeText === 'function');
const shownTexts = (tree) =>
  tree.root.findAll((node) => typeof node.children?.[0] === 'string').map((node) => node.children.join(''));

beforeEach(() => {
  jest.useFakeTimers();
  mockRouter.back.mockClear();
  useGuestStore.getState().reset();
  const wedding = createWedding({ ownerName: 'Priya' });
  useWeddingStore.setState({ wedding });
  useGuestStore
    .getState()
    .addGuest(createGuest({ weddingId: wedding.id, firstName: 'Existing', lastName: 'Guest' }));
});

afterEach(() => {
  jest.useRealTimers();
});

describe('GuestSpreadsheetScreen', () => {
  it('imports pasted rows, skipping duplicates and rows that need a fix', () => {
    const tree = render();

    act(() => textField(tree).props.onChangeText(CSV));
    act(() => pressable(tree, 'Read these rows').props.onPress());

    const shown = shownTexts(tree);
    expect(shown).toContain('2 to add · 1 already on your list · 1 need a fix · 1 households');
    expect(shown).toContain('Row 4: Email "sam@" looks incomplete');

    act(() => pressable(tree, 'Import 2 guests').props.onPress());

    const guests = selectAllGuests(useGuestStore.getState());
    const households = selectAllHouseholds(useGuestStore.getState());
    expect(guests.map((g) => [g.firstName, g.rsvpStatus])).toEqual([
      ['Existing', RsvpStatus.PENDING],
      ['Meera', RsvpStatus.ATTENDING],
      ['Ravi', RsvpStatus.DECLINED],
    ]);
    expect(households.map((h) => h.name)).toEqual(['The Shahs']);
    expect(guests[1].householdId).toBe(households[0].id);
    expect(guests[2].householdId).toBe(households[0].id);
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('will not import without a name column', () => {
    const tree = render();
    act(() => textField(tree).props.onChangeText('Email,RSVP\na@example.com,yes'));
    act(() => pressable(tree, 'Read these rows').props.onPress());

    expect(shownTexts(tree)).toContain('Pick the column with first names, or a full name, to import.');
    const button = pressable(tree, 'Nothing to import yet');
    expect(button.props.disabled).toBe(true);
  });

  it('lets a column be remapped, and starting over clears the import', () => {
    const tree = render();
    act(() => textField(tree).props.onChangeText('Who,Mail\nMeera Shah,meera@example.com'));
    act(() => pressable(tree, 'Read these rows').props.onPress());
    expect(shownTexts(tree)).toContain("Don't import");

    // "Who" is not a header we recognise; map it to Full name by hand.
    act(() => tree.root.find((node) => node.props.title === 'Who' && node.props.onPress).props.onPress());
    act(() => pressable(tree, 'Full name').props.onPress());
    expect(pressable(tree, 'Import 1 guest').props.disabled).toBe(false);

    act(() => pressable(tree, 'Start over').props.onPress());
    expect(tree.root.findAll((node) => node.props.accessibilityLabel === 'Import 1 guest')).toHaveLength(0);
  });
});
