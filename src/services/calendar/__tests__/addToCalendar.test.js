import * as Calendar from 'expo-calendar/legacy';

import { workspaceStorage } from '../../storage';
import { addToCalendar } from '../index';

const entry = (key, title = key) => ({
  key,
  title,
  allDay: false,
  start: new Date(2027, 1, 12, 16),
  end: new Date(2027, 1, 12, 21),
  location: 'The Rose Garden',
  notes: '',
});

// The phone's calendar: event id -> details.
let phoneEvents;
let nextId;

beforeEach(async () => {
  jest.clearAllMocks();
  phoneEvents = new Map();
  nextId = 1;
  await workspaceStorage.adapter.removeItem('calendar:links');
  Calendar.requestCalendarPermissionsAsync.mockResolvedValue({ status: 'granted' });
  Calendar.getDefaultCalendarAsync.mockResolvedValue({ id: 'default', allowsModifications: true });
  Calendar.createEventAsync.mockImplementation(async (calendarId, details) => {
    const id = `cal-${nextId++}`;
    phoneEvents.set(id, { id, calendarId, ...details });
    return id;
  });
  Calendar.getEventAsync.mockImplementation(async (id) => {
    if (!phoneEvents.has(id)) throw new Error('not found');
    return phoneEvents.get(id);
  });
  Calendar.updateEventAsync.mockImplementation(async (id, details) => {
    phoneEvents.set(id, { ...phoneEvents.get(id), ...details });
  });
});

describe('addToCalendar on a phone', () => {
  it('adds each event to the default calendar', async () => {
    const result = await addToCalendar([entry('ev1', 'Mehndi'), entry('ev2', 'Sangeet')]);
    expect(result).toEqual({ status: 'saved', added: 2, updated: 0 });
    expect(Calendar.createEventAsync).toHaveBeenCalledWith(
      'default',
      expect.objectContaining({ title: 'Mehndi', location: 'The Rose Garden', notes: null, allDay: false })
    );
  });

  it('updates what it added before instead of adding copies', async () => {
    await addToCalendar([entry('ev1', 'Mehndi')]);
    const result = await addToCalendar([entry('ev1', 'Mehndi (moved)')]);
    expect(result).toEqual({ status: 'saved', added: 0, updated: 1 });
    expect(Calendar.createEventAsync).toHaveBeenCalledTimes(1);
    expect(phoneEvents.get('cal-1').title).toBe('Mehndi (moved)');
  });

  it('adds an event back if it was deleted from the calendar', async () => {
    await addToCalendar([entry('ev1')]);
    phoneEvents.clear();
    const result = await addToCalendar([entry('ev1')]);
    expect(result).toEqual({ status: 'saved', added: 1, updated: 0 });
  });

  it('adds nothing without permission', async () => {
    Calendar.requestCalendarPermissionsAsync.mockResolvedValue({ status: 'denied' });
    expect(await addToCalendar([entry('ev1')])).toEqual({ status: 'denied', added: 0, updated: 0 });
    expect(Calendar.createEventAsync).not.toHaveBeenCalled();
  });

  it('says so when the calendar refuses, and still never adds copies of what it did add', async () => {
    const original = Calendar.createEventAsync.getMockImplementation();
    Calendar.createEventAsync.mockImplementationOnce(original).mockRejectedValueOnce(new Error('read-only'));
    expect((await addToCalendar([entry('ev1'), entry('ev2')])).status).toBe('failed');

    const again = await addToCalendar([entry('ev1'), entry('ev2')]);
    expect(again).toEqual({ status: 'saved', added: 1, updated: 1 });
  });
});
