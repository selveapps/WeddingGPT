import { Platform } from 'react-native';
// The legacy API: the newer object API is not in Expo Go yet.
import * as Calendar from 'expo-calendar/legacy';

import { calendarIcs } from '../../models/calendar';
import { exportTextFile } from '../files';
import { workspaceStorage } from '../storage';

/**
 * Put the wedding's events in a calendar.
 *
 * In a browser that is an .ics download any calendar app opens. On a phone
 * the events go straight into the phone's default calendar. Which calendar
 * event belongs to which wedding event is remembered on this device only
 * (calendar ids mean nothing on the partner's phone), so adding again updates
 * the same entries - a moved mehndi moves in the calendar too - instead of
 * adding copies. An entry the couple deleted from their calendar is added
 * back.
 */

export const CALENDAR_NATIVE = Platform.OS === 'ios' || Platform.OS === 'android';
const LINKS_KEY = 'calendar:links';

/** The calendar new events go to: the system default on iOS, the primary writable one on Android. */
async function targetCalendar() {
  if (Platform.OS === 'ios') return Calendar.getDefaultCalendarAsync();
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const writable = calendars.filter((calendar) => calendar.allowsModifications);
  return writable.find((calendar) => calendar.isPrimary) ?? writable[0] ?? null;
}

const details = (entry) => ({
  title: entry.title,
  startDate: entry.start,
  endDate: entry.end,
  allDay: entry.allDay,
  location: entry.location || null,
  notes: entry.notes || null,
});

/**
 * Resolves `{ status, added, updated }` with status 'downloaded' (web),
 * 'saved' (phone), 'denied' (no calendar permission), 'no_calendar' or 'failed'.
 */
export async function addToCalendar(entries, { filename = 'wedding-events.ics', now = new Date() } = {}) {
  if (!CALENDAR_NATIVE) {
    const result = await exportTextFile({
      filename,
      text: calendarIcs(entries, { now }),
      mimeType: 'text/calendar',
      title: 'Wedding events',
    });
    return { status: result === 'failed' ? 'failed' : 'downloaded', added: entries.length, updated: 0 };
  }

  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') return { status: 'denied', added: 0, updated: 0 };
    const calendar = await targetCalendar();
    if (!calendar) return { status: 'no_calendar', added: 0, updated: 0 };

    const links = (await workspaceStorage.adapter.getItem(LINKS_KEY)) ?? {};
    let added = 0;
    let updated = 0;
    try {
      for (const entry of entries) {
        const linked = links[entry.key]
          ? await Calendar.getEventAsync(links[entry.key]).catch(() => null)
          : null;
        if (linked?.id) {
          await Calendar.updateEventAsync(linked.id, details(entry));
          updated++;
        } else {
          links[entry.key] = await Calendar.createEventAsync(calendar.id, details(entry));
          added++;
        }
      }
    } finally {
      // Kept even when one fails part way, so trying again never adds copies.
      await workspaceStorage.adapter.setItem(LINKS_KEY, links);
    }
    return { status: 'saved', added, updated };
  } catch (error) {
    if (__DEV__) console.warn('[calendar] Could not add events', error);
    return { status: 'failed', added: 0, updated: 0 };
  }
}
