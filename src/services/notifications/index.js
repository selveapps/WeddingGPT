import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import {
  NotificationType,
  isTaskOpen,
  hasExactDate,
  buildCateringReport,
  eventGuestSummary,
  eventName,
  eventWhen,
  appointmentLabel,
  upcomingAppointments,
  planDailyChecklists,
  summariseDailyTasks,
} from '../../models';
import { Routes } from '../../navigation/routes';
import { formatTime, fromClock } from '../../lib/time';
import { toISODate } from '../../lib/date';

/**
 * Local reminders.
 *
 * Everything is scheduled on the device from the workspace - there is no push
 * server. Whenever the plan, budget, wedding date or preferences change,
 * `syncReminders` throws the whole schedule away and rebuilds it, which is
 * simpler and safer than diffing: a task completed or re-dated is never left
 * with a stale reminder.
 *
 * `buildReminderSchedule` is pure, so what gets scheduled is easy to reason
 * about. The daily checklist lands at 8am, other reminders at 9am (or 6pm for
 * the weekly catch-up), all well outside the default quiet hours.
 *
 * To stay welcome rather than noisy, reminders of one kind on the same day
 * are merged into one, and no day gets more than MAX_PER_DAY in total.
 *
 * Web has no local scheduling, so every call there is a no-op.
 */

export const NOTIFICATIONS_SUPPORTED = Platform.OS === 'ios' || Platform.OS === 'android';

const CHANNEL_ID = 'reminders';
/** iOS keeps at most 64 pending; leave headroom. */
const MAX_SCHEDULED = 60;
/** Never more than this many reminders on one day, the weekly check-in included. */
const MAX_PER_DAY = 3;
const MORNING_HOUR = 9;
const DAILY_HOUR = 8;
/** How many mornings ahead the daily checklist is scheduled. */
const DAILY_DAYS = 14;
const MILESTONE_DAYS = [365, 180, 100, 30, 7, 1, 0];
/** Days before an event for "the mehndi is in 3 days". */
const EVENT_SOON_DAYS = 3;
/** Caterers usually want final plates about a week out. */
const CATERER_DAYS = 7;
/** Appointment reminders land the evening before, when there is still time to prepare. */
const EVENING_HOUR = 18;

let configured = false;

/** Show reminders even while the app is open, and set up the Android channel. */
export async function configureNotifications() {
  if (!NOTIFICATIONS_SUPPORTED || configured) return;
  configured = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Wedding reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    }).catch(() => {});
  }
}

/** 'granted' | 'denied' | 'undetermined' | 'unsupported' */
export async function getPermissionStatus() {
  if (!NOTIFICATIONS_SUPPORTED) return 'unsupported';
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  } catch {
    return 'undetermined';
  }
}

/** Ask the OS. Resolves to the resulting status. */
export async function requestPermission() {
  if (!NOTIFICATIONS_SUPPORTED) return 'unsupported';
  await configureNotifications();
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status;
  } catch {
    return 'denied';
  }
}

/** A local Date at `hour`:00, `offsetDays` from an ISO date. */
function at(iso, offsetDays, hour = MORNING_HOUR) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d + offsetDays, hour, 0, 0);
}

/**
 * Everything that should be scheduled, soonest first. Each entry is
 * `{ type, title, body, url, date }` or, for the weekly catch-up,
 * `{ type, title, body, url, weekly: { weekday, hour } }`.
 */
export function buildReminderSchedule({
  wedding,
  tasks = [],
  expenses = [],
  /** The wedding's events (workstream C), each reminded from its own date (G2). */
  events = [],
  guests = [],
  /** Vendors, for their appointments (H1). */
  vendors = [],
  preferences,
  /** Today's checklist as shown in the app, so this morning's note matches it. */
  todayTasks = null,
  now = new Date(),
}) {
  if (!preferences?.enabled) return [];
  const on = (type) => preferences.types?.[type] !== false;
  const items = [];

  if (on(NotificationType.DAILY_CHECKLIST)) {
    const days = planDailyChecklists(tasks, { from: now, days: DAILY_DAYS, firstDay: todayTasks });
    for (const { date, tasks: picked } of days) {
      items.push({
        type: NotificationType.DAILY_CHECKLIST,
        title:
          picked.length === 1 ? "Today's checklist: one small thing" : `Today's checklist: ${picked.length} small things`,
        body: summariseDailyTasks(picked),
        url: Routes.home,
        date: new Date(date.getFullYear(), date.getMonth(), date.getDate(), DAILY_HOUR, 0, 0),
      });
    }
  }

  for (const task of tasks) {
    if (!isTaskOpen(task) || !task.dueDate) continue;
    if (on(NotificationType.TASK_DUE)) {
      items.push({
        type: NotificationType.TASK_DUE,
        title: 'Coming up in 2 days',
        body: task.title,
        name: task.title,
        url: Routes.taskDetail(task.id),
        date: at(task.dueDate, -2),
      });
    }
    if (on(NotificationType.TASK_OVERDUE)) {
      items.push({
        type: NotificationType.TASK_OVERDUE,
        title: 'This one slipped - no stress',
        body: `${task.title}. Do it, snooze it, or skip it.`,
        name: task.title,
        url: Routes.taskDetail(task.id),
        date: at(task.dueDate, 1),
      });
    }
  }

  if (on(NotificationType.PAYMENT_DUE)) {
    for (const expense of expenses) {
      if (!expense.dueDate || (expense.paidAmount ?? 0) >= (expense.amount ?? 0)) continue;
      items.push({
        type: NotificationType.PAYMENT_DUE,
        title: 'Payment due in 3 days',
        body: expense.vendorName ? `${expense.title} - ${expense.vendorName}` : expense.title,
        name: expense.title,
        url: Routes.expenseDetail(expense.id),
        date: at(expense.dueDate, -3),
      });
    }
  }

  if (on(NotificationType.MILESTONES) && wedding?.date && hasExactDate(wedding)) {
    for (const days of MILESTONE_DAYS) {
      items.push({
        type: NotificationType.MILESTONES,
        title: days === 0 ? 'Today is the day!' : days === 1 ? 'Tomorrow is the day!' : `${days} days to go`,
        body:
          days === 0
            ? 'Congratulations. Enjoy every minute - we have the rest.'
            : days === 1
              ? 'Breathe, hydrate, and get some sleep. You are ready.'
              : 'A little countdown moment. Open your plan to see what is next.',
        url: Routes.countdown,
        date: at(wedding.date, -days),
      });
    }
  }

  for (const event of events) {
    if (!event.date) continue;
    const name = eventName(event);

    if (on(NotificationType.EVENT_SOON)) {
      const when = eventWhen(event);
      const place = event.venueName?.trim();
      const details = [when && place ? `${when} at ${place}` : when || place, event.dressCode?.trim() && `Dress code: ${event.dressCode.trim()}`];
      items.push({
        type: NotificationType.EVENT_SOON,
        title: `${name} is in ${EVENT_SOON_DAYS} days`,
        body: details.filter(Boolean).join('. ') || 'Open the event to check the details.',
        name,
        url: Routes.eventDetail(event.id),
        date: at(event.date, -EVENT_SOON_DAYS),
      });
    }

    // Only worth a nudge once someone is invited; the numbers are this event's own (G1).
    const { invited, awaiting } = eventGuestSummary(event, guests);
    if (on(NotificationType.CATERER_NUMBERS) && invited > 0) {
      const { headcount } = buildCateringReport(guests, { event });
      const plates = headcount === 1 ? '1 plate' : `${headcount} plates`;
      items.push({
        type: NotificationType.CATERER_NUMBERS,
        title: `Final numbers for the ${name}`,
        body: awaiting > 0 ? `${plates} so far, ${awaiting} still to answer.` : `${plates}. Everyone has answered.`,
        name,
        url: Routes.guestMealsFor(event.id),
        date: at(event.date, -CATERER_DAYS),
      });
    }
  }

  if (on(NotificationType.VENDOR_APPOINTMENT)) {
    const today = toISODate(now);
    for (const appointment of upcomingAppointments(vendors, { today, limit: Infinity })) {
      const label = appointmentLabel(appointment);
      const minutes = fromClock(appointment.time);
      const details = [minutes === null ? '' : formatTime(minutes), appointment.place].filter(Boolean).join(' at ');
      items.push({
        type: NotificationType.VENDOR_APPOINTMENT,
        title: `Tomorrow: ${label.toLowerCase()} with ${appointment.vendorName}`,
        body: [details, appointment.notes].filter(Boolean).join('. ') || 'Open the vendor to check the details.',
        name: `${label} with ${appointment.vendorName}`,
        url: Routes.vendorDetail(appointment.vendorId),
        date: at(appointment.date, -1, EVENING_HOUR),
      });
    }
  }

  const weeklyOn = on(NotificationType.WEEKLY_DIGEST);
  const dated = capPerDay(
    mergeSameDay(items.filter((item) => item.date.getTime() > now.getTime())),
    weeklyOn
  ).sort((a, b) => a.date - b.date);

  const weekly = weeklyOn
    ? [
        {
          type: NotificationType.WEEKLY_DIGEST,
          title: 'Your weekly wedding check-in',
          body: 'Five calm minutes: see what is next and tick something off.',
          url: Routes.home,
          weekly: { weekday: 1, hour: 18 }, // Sunday, 6pm
        },
      ]
    : [];

  return [...weekly, ...dated].slice(0, MAX_SCHEDULED);
}

/** Per-type wording for several reminders folded into one. */
const MERGED_TITLES = {
  [NotificationType.TASK_DUE]: (n) => `${n} tasks coming up in 2 days`,
  [NotificationType.TASK_OVERDUE]: (n) => `${n} tasks slipped - no stress`,
  [NotificationType.PAYMENT_DUE]: (n) => `${n} payments due in 3 days`,
  [NotificationType.EVENT_SOON]: (n) => `${n} events in ${EVENT_SOON_DAYS} days`,
  [NotificationType.CATERER_NUMBERS]: (n) => `Final numbers for ${n} events`,
  [NotificationType.VENDOR_APPOINTMENT]: (n) => `${n} vendor appointments tomorrow`,
};

/** Several things: the right screen is the overview, not one of them. */
const MERGED_URLS = {
  [NotificationType.PAYMENT_DUE]: Routes.budget,
  [NotificationType.EVENT_SOON]: Routes.events,
  [NotificationType.CATERER_NUMBERS]: Routes.guestMeals,
  [NotificationType.VENDOR_APPOINTMENT]: Routes.vendors,
};

function dayKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/**
 * Fold same-type reminders landing on the same day into one notification,
 * so five tasks due together read as one nudge, not five.
 */
function mergeSameDay(items) {
  const groups = new Map();
  for (const item of items) {
    const key = `${item.type}|${dayKey(item.date)}`;
    const group = groups.get(key);
    if (group) group.push(item);
    else groups.set(key, [item]);
  }

  return [...groups.values()].map((group) => {
    const merge = MERGED_TITLES[group[0].type];
    if (group.length === 1 || !merge) return group[0];
    const names = group.slice(0, 3).map((item) => item.name ?? item.body);
    const more = group.length > 3 ? ` and ${group.length - 3} more` : '';
    return {
      ...group[0],
      title: merge(group.length),
      body: `${names.join(', ')}${more}.`,
      url: MERGED_URLS[group[0].type] ?? Routes.planning,
    };
  });
}

/** Most important first: what survives when a day is over the cap. */
const PRIORITY = [
  NotificationType.MILESTONES,
  NotificationType.EVENT_SOON,
  NotificationType.CATERER_NUMBERS,
  NotificationType.VENDOR_APPOINTMENT,
  NotificationType.PAYMENT_DUE,
  NotificationType.TASK_OVERDUE,
  NotificationType.TASK_DUE,
  NotificationType.DAILY_CHECKLIST,
];

/**
 * Keep at most MAX_PER_DAY reminders on any one day, dropping the least
 * important. Sunday leaves a slot for the weekly check-in when it is on.
 */
function capPerDay(items, weeklyOn) {
  const byDay = new Map();
  for (const item of items) {
    const key = dayKey(item.date);
    const day = byDay.get(key);
    if (day) day.push(item);
    else byDay.set(key, [item]);
  }

  const kept = [];
  for (const day of byDay.values()) {
    const isSunday = day[0].date.getDay() === 0;
    const limit = weeklyOn && isSunday ? MAX_PER_DAY - 1 : MAX_PER_DAY;
    day.sort((a, b) => PRIORITY.indexOf(a.type) - PRIORITY.indexOf(b.type));
    kept.push(...day.slice(0, limit));
  }
  return kept;
}

/**
 * Replace every scheduled reminder with the current schedule. Without
 * permission (or with the master switch off) this just clears the schedule.
 * Resolves to the number of reminders scheduled.
 */
export async function syncReminders(input) {
  if (!NOTIFICATIONS_SUPPORTED) return 0;
  try {
    await configureNotifications();
    await Notifications.cancelAllScheduledNotificationsAsync();
    if ((await getPermissionStatus()) !== 'granted') return 0;

    const schedule = buildReminderSchedule(input);
    for (const item of schedule) {
      const trigger = item.weekly
        ? {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: item.weekly.weekday,
            hour: item.weekly.hour,
            minute: 0,
            channelId: CHANNEL_ID,
          }
        : { type: Notifications.SchedulableTriggerInputTypes.DATE, date: item.date, channelId: CHANNEL_ID };

      await Notifications.scheduleNotificationAsync({
        content: { title: item.title, body: item.body, data: { url: item.url, type: item.type } },
        trigger,
      });
    }
    return schedule.length;
  } catch (error) {
    if (__DEV__) console.warn('[notifications] Could not sync reminders', error);
    return 0;
  }
}

/** Subscribe to taps on a reminder. The callback receives the deep-link path. */
export function onReminderOpened(callback) {
  if (!NOTIFICATIONS_SUPPORTED) return () => {};
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const url = response?.notification?.request?.content?.data?.url;
    if (typeof url === 'string') callback(url);
  });
  return () => subscription.remove();
}
