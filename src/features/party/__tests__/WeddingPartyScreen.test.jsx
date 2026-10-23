import React from 'react';

import { useGuestStore, usePartyStore, useWeddingStore, selectPartyMembers } from '@/store';
import { createGuest, createWedding } from '@/models';
import { act, press, pressables, renderWithProviders, shownTexts } from '@/test/render';

import { WeddingPartyScreen } from '../WeddingPartyScreen';

const mockShare = jest.fn(async () => true);
jest.mock('@/services/share', () => ({ shareText: (...args) => mockShare(...args) }));

const members = () => selectPartyMembers(usePartyStore.getState());
const field = (tree, label) =>
  tree.root.find((n) => n.props.label === label && typeof n.props.onChangeText === 'function');
const type = (tree, label, text) => act(async () => field(tree, label).props.onChangeText(text));
const segment = (tree, value) =>
  act(async () => tree.root.find((n) => n.props.options && n.props.onChange).props.onChange(value));

let meera;
beforeEach(() => {
  jest.clearAllMocks();
  usePartyStore.getState().reset();
  usePartyStore.setState({ labsImportedAt: 'done' });
  useGuestStore.getState().reset();
  useWeddingStore.setState({ wedding: createWedding({ ownerName: 'Priya', partnerName: 'Sam' }) });
  meera = useGuestStore
    .getState()
    .addGuest(createGuest({ firstName: 'Meera', lastName: 'Shah', phone: '555 0100' }));
});

const render = () => renderWithProviders(<WeddingPartyScreen />);

describe('WeddingPartyScreen', () => {
  it('adds someone from the guest list with the jobs of their role', async () => {
    const tree = await render();
    await press(tree, 'Add someone');
    await press(tree, 'Maid or matron of honor');
    await press(tree, 'Meera Shah');

    expect(members()).toHaveLength(1);
    expect(members()[0]).toMatchObject({ name: 'Meera Shah', guestId: meera.id, phone: '555 0100' });
    expect(shownTexts(tree)).toEqual(expect.arrayContaining(['Plan the shower', 'Prepare a toast']));

    // Already in the party: not offered again.
    await press(tree, 'Add someone');
    expect(pressables(tree, 'Meera Shah')).toHaveLength(0);
  });

  it('adds someone new by name, checking the email', async () => {
    const tree = await render();
    await press(tree, 'Add someone');
    await segment(tree, 'new');
    await type(tree, 'Name', 'Jo Kim');
    await type(tree, 'Email (optional)', 'jo@');
    await press(tree, 'Add');
    expect(members()).toEqual([]);
    expect(shownTexts(tree)).toContain('That email address looks incomplete.');

    await type(tree, 'Email (optional)', 'jo@kim.dev');
    await press(tree, 'Add');
    expect(members()[0]).toMatchObject({ name: 'Jo Kim', email: 'jo@kim.dev', roleKey: 'bridesmaid' });
  });

  it('ticks jobs off from the list', async () => {
    usePartyStore.getState().addMember({ name: 'Sam', roleKey: 'usher' });
    const tree = await render();
    await press(tree, 'Learn the seating plan');
    expect(members()[0].todos[0].done).toBe(true);
    expect(shownTexts(tree)).toContain('1 of 2 done');
  });

  it('edits outfit and jobs, and removes only after confirming', async () => {
    usePartyStore.getState().addMember({ name: 'Sam', roleKey: 'usher' });
    const tree = await render();
    await press(tree, 'Edit Sam');
    await type(tree, 'Outfit', 'Navy suit');
    await type(tree, 'Add a job', 'Collect buttonholes');
    await press(tree, 'Add job');
    await press(tree, 'Remove the job Hand out programs');
    await press(tree, 'Save');
    expect(members()[0]).toMatchObject({ outfit: 'Navy suit' });
    expect(members()[0].todos.map((t) => t.title)).toEqual(['Learn the seating plan', 'Collect buttonholes']);

    await press(tree, 'Edit Sam');
    await press(tree, 'Remove from the wedding party');
    expect(members()).toHaveLength(1);
    await press(tree, 'Remove');
    expect(members()).toEqual([]);
  });

  it('sends each person their open jobs', async () => {
    usePartyStore.getState().addMember({ name: 'Sam Lee', roleKey: 'reader' });
    const tree = await render();
    await press(tree, 'Send Sam Lee their list');
    const [message, title] = mockShare.mock.calls[0];
    expect(title).toBe('Your wedding party list');
    expect(message).toContain('Hi Sam!');
    expect(message).toContain('- Choose and practise the reading');
  });
});
