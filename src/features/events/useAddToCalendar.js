import { useToast } from '@/design-system/components';
import { useWeddingStore, selectWedding } from '@/store';
import { calendarEntries } from '@/models';
import { addToCalendar } from '@/services/calendar';

/**
 * "Add to calendar" for some events, with the toast that says what happened.
 * Returns `[add, count]`: `count` is how many of them have a date and can go
 * in a calendar, so screens can hide the button when it is 0.
 */
export function useAddToCalendar(events = []) {
  const toast = useToast();
  const wedding = useWeddingStore(selectWedding);
  const entries = calendarEntries({ events, wedding });

  const add = async () => {
    if (!entries.length) return;
    const { status, added, updated } = await addToCalendar(entries);
    if (status === 'downloaded') toast.success('Calendar file downloaded');
    else if (status === 'saved') {
      const parts = [added && `${added} added`, updated && `${updated} updated`].filter(Boolean).join(', ');
      toast.success(`In your calendar: ${parts}`);
    } else if (status === 'denied') {
      toast.info('Allow calendar access for WeddingGPT in Settings to add your events.');
    } else if (status === 'no_calendar') {
      toast.error('There is no calendar on this phone that can take new events.');
    } else toast.error('Could not add to your calendar');
  };

  return [add, entries.length];
}
