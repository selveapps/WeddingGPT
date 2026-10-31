import {
  APPOINTMENT_LIMITS,
  AppointmentKind,
  LEGACY_MEETING_ID,
  addAppointment,
  appointmentWhen,
  removeAppointment,
  upcomingAppointments,
  updateAppointment,
  validateAppointment,
  vendorAppointments,
} from '../appointments';

const appt = (id, date, fields = {}) => ({
  id,
  kind: AppointmentKind.TASTING,
  date,
  time: null,
  place: '',
  notes: '',
  outcome: '',
  ...fields,
});

const caterer = {
  id: 'v1',
  name: 'Spice Route',
  appointments: [appt('b', '2027-03-06', { time: '14:00' }), appt('a', '2027-03-06', { time: '11:00' })],
};

describe('vendorAppointments', () => {
  it('sorts by date, then time', () => {
    expect(vendorAppointments(caterer).map((a) => a.id)).toEqual(['a', 'b']);
  });

  it("reads a vendor's pre-H1 meeting date as its first appointment", () => {
    const [meeting] = vendorAppointments({ meetingAt: '2027-02-01' });
    expect(meeting).toEqual(
      expect.objectContaining({ id: LEGACY_MEETING_ID, kind: 'meeting', date: '2027-02-01' })
    );
  });
});

describe('changing appointments', () => {
  it('adds one, moving the old meeting into the list and clearing it', () => {
    const patch = addAppointment(
      { meetingAt: '2027-02-01' },
      { kind: AppointmentKind.FITTING, date: '2027-04-01' }
    );
    expect(patch.meetingAt).toBeNull();
    expect(patch.appointments.map((a) => a.kind)).toEqual(['meeting', 'fitting']);
  });

  it('never brings back a deleted old meeting', () => {
    const patch = removeAppointment({ meetingAt: '2027-02-01' }, LEGACY_MEETING_ID);
    expect(vendorAppointments({ ...patch })).toEqual([]);
  });

  it('updates one by id and keeps the rest', () => {
    const patch = updateAppointment(caterer, 'a', { outcome: 'Lemon sponge', id: 'ignored' });
    expect(patch.appointments.find((a) => a.id === 'a').outcome).toBe('Lemon sponge');
    expect(patch.appointments).toHaveLength(2);
  });

  it('stops at the limit', () => {
    const full = {
      appointments: Array.from({ length: APPOINTMENT_LIMITS.perVendor }, (_, i) => appt(`x${i}`, null)),
    };
    expect(addAppointment(full, { date: '2027-04-01' })).toBeNull();
  });
});

describe('upcomingAppointments', () => {
  it('lists dated appointments from today on, across vendors, soonest first', () => {
    const rows = upcomingAppointments(
      [
        caterer,
        {
          id: 'v2',
          name: 'Bloom',
          appointments: [appt('c', '2027-03-01'), appt('old', '2027-01-01'), appt('tbd', null)],
        },
      ],
      { today: '2027-02-01' }
    );
    expect(rows.map((row) => `${row.vendorName}:${row.id}`)).toEqual([
      'Bloom:c',
      'Spice Route:a',
      'Spice Route:b',
    ]);
    expect(rows[0].key).toBe('v2:c');
  });
});

describe('validateAppointment', () => {
  it('stores a typed time as a clock', () => {
    const { errors, fields } = validateAppointment({
      kind: 'call',
      date: '2027-03-06',
      timeText: '11am',
      place: ' Zoom ',
    });
    expect(errors).toEqual({});
    expect(fields).toEqual({
      kind: 'call',
      date: '2027-03-06',
      time: '11:00',
      place: 'Zoom',
      notes: '',
      outcome: '',
    });
  });

  it('asks for a real time, and a date to go with it', () => {
    expect(validateAppointment({ date: '2027-03-06', timeText: 'noonish' }).errors.time).toBeTruthy();
    expect(validateAppointment({ timeText: '11am' }).errors.date).toBe('Add the date too.');
  });
});

it('says when, with the time if there is one', () => {
  const format = (iso) => `[${iso}]`;
  expect(appointmentWhen(appt('a', '2027-03-06', { time: '11:00' }), format)).toBe(
    '[2027-03-06] at 11:00 AM'
  );
  expect(appointmentWhen(appt('a', '2027-03-06'), format)).toBe('[2027-03-06]');
  expect(appointmentWhen(appt('a', null), format)).toBe('');
});
