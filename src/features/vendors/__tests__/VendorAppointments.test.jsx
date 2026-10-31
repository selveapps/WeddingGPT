import React from 'react';

import { useVendorStore, selectVendorById } from '@/store';
import { vendorAppointments } from '@/models';
import { todayISO, addDays } from '@/lib/date';
import { act, press, renderWithProviders, shownTexts } from '@/test/render';

import { VendorAppointments } from '../components/VendorAppointments';

const field = (tree, label) =>
  tree.root.find((node) => node.props.label === label && typeof node.props.onChangeText === 'function');

const vendor = () => selectVendorById(id)(useVendorStore.getState());
const render = () => renderWithProviders(<VendorAppointments vendor={vendor()} />);

let id;
beforeEach(() => {
  useVendorStore.getState().reset();
  id = useVendorStore.getState().addVendor({ name: 'Sugar & Co', categoryKey: 'catering' }).id;
});

describe('VendorAppointments', () => {
  it('invites the first appointment, and adds one with a typed time', async () => {
    const tree = await render();
    expect(shownTexts(tree)).toContain(
      'Tastings, fittings, site visits, calls - keep each one here with what was decided.'
    );

    await press(tree, 'Add an appointment');
    await press(tree, 'Tasting');
    await act(async () => field(tree, 'Where').props.onChangeText('The Bakery'));
    await press(tree, 'Add appointment');

    expect(vendorAppointments(vendor())).toEqual([
      expect.objectContaining({ kind: 'tasting', place: 'The Bakery', date: null }),
    ]);
  });

  it('asks what was decided only once an appointment is past, and saves it', async () => {
    useVendorStore.getState().addAppointment(id, { kind: 'tasting', date: addDays(todayISO(), -2) });
    useVendorStore.getState().addAppointment(id, { kind: 'fitting', date: addDays(todayISO(), 5) });
    const tree = await render();

    await press(tree, 'Edit fitting');
    expect(() => field(tree, 'What was decided')).toThrow();
    await press(tree, 'Save');

    await press(tree, 'Edit tasting');
    await act(async () => field(tree, 'What was decided').props.onChangeText('Lemon sponge'));
    await press(tree, 'Save');
    expect(vendorAppointments(vendor()).find((a) => a.kind === 'tasting').outcome).toBe('Lemon sponge');
  });

  it("shows a vendor's old meeting date, and deletes it for good", async () => {
    useVendorStore.getState().updateVendor(id, { meetingAt: addDays(todayISO(), 3) });
    const tree = await render();
    expect(shownTexts(tree)).toContain('Meeting');

    await press(tree, 'Edit meeting');
    await press(tree, 'Delete');
    expect(vendor().meetingAt).toBeNull();
    expect(vendorAppointments(vendor())).toEqual([]);
  });

  it('rejects a time it cannot read', async () => {
    const tree = await render();
    await press(tree, 'Add an appointment');
    await act(async () => field(tree, 'Time').props.onChangeText('after lunch'));
    await press(tree, 'Add appointment');
    expect(shownTexts(tree)).toContain('Try a time like 11am or 14:30.');
    expect(vendorAppointments(vendor())).toEqual([]);
  });
});
