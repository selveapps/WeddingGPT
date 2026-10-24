import { cleanText, makeId } from './storage';

export const CHECKLIST_TEMPLATES = [
  { title: 'Confirm wedding date and ceremony time', category: 'Planning', monthsBefore: 12, priority: 'high' },
  { title: 'Set overall wedding budget', category: 'Budget', monthsBefore: 12, priority: 'high' },
  { title: 'Book ceremony and reception venue', category: 'Venue', monthsBefore: 10, priority: 'high' },
  { title: 'Create guest list and estimate attendance', category: 'Guests', monthsBefore: 10, priority: 'high' },
  { title: 'Book photographer', category: 'Vendors', monthsBefore: 9, priority: 'high' },
  { title: 'Book videographer', category: 'Vendors', monthsBefore: 9, priority: 'medium' },
  { title: 'Choose wedding outfit and schedule fittings', category: 'Attire', monthsBefore: 8, priority: 'high' },
  { title: 'Book catering and confirm menu options', category: 'Food', monthsBefore: 7, priority: 'high' },
  { title: 'Choose florist and decor direction', category: 'Decor', monthsBefore: 6, priority: 'medium' },
  { title: 'Send save-the-dates', category: 'Guests', monthsBefore: 6, priority: 'medium' },
  { title: 'Book music or DJ', category: 'Vendors', monthsBefore: 5, priority: 'medium' },
  { title: 'Arrange guest transport and accommodation', category: 'Travel', monthsBefore: 4, priority: 'medium' },
  { title: 'Send invitations and track RSVPs', category: 'Guests', monthsBefore: 3, priority: 'high' },
  { title: 'Confirm final guest count with venue', category: 'Guests', monthsBefore: 1, priority: 'high' },
  { title: 'Prepare vendor contact sheet', category: 'Wedding week', monthsBefore: 1, priority: 'high' },
  { title: 'Pack emergency kit', category: 'Wedding week', monthsBefore: 0, priority: 'medium' },
  { title: 'Confirm timeline with all vendors', category: 'Wedding week', monthsBefore: 0, priority: 'high' },
  { title: 'Pack rings, documents, and personal essentials', category: 'Wedding week', monthsBefore: 0, priority: 'high' },
];

export function parseDateOnly(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ''))) return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateOnly(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function shiftMonths(date, months) {
  const result = new Date(date);
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDay));
  return result;
}

export function generateChecklist(weddingDate, options = {}) {
  const target = parseDateOnly(weddingDate);
  if (!target) return { error: 'Enter the wedding date in YYYY-MM-DD format.', tasks: [] };
  const selectedCategories = Array.isArray(options.categories) && options.categories.length
    ? new Set(options.categories)
    : null;
  const now = options.now ? new Date(options.now) : new Date();
  const templates = options.templates || CHECKLIST_TEMPLATES;
  const tasks = templates
    .filter((template) => !selectedCategories || selectedCategories.has(template.category))
    .map((template) => {
      const due = shiftMonths(target, -Math.max(0, Number(template.monthsBefore) || 0));
      const id = makeId('task');
      return {
        id,
        title: cleanText(template.title, 180),
        category: cleanText(template.category, 80),
        priority: ['high', 'medium', 'low'].includes(template.priority) ? template.priority : 'medium',
        dueDate: formatDateOnly(due),
        done: false,
        overdue: due < now && due.toDateString() !== now.toDateString(),
      };
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return { error: null, tasks };
}

export function toggleChecklistTask(tasks, id) {
  return tasks.map((task) => task.id === id ? { ...task, done: !task.done } : task);
}

export function deleteChecklistTask(tasks, id) {
  return tasks.filter((task) => task.id !== id);
}

export function addChecklistTask(tasks, draft) {
  const title = cleanText(draft.title, 180);
  if (!title) return { error: 'Task title is required.', tasks };
  const dueDate = parseDateOnly(draft.dueDate) ? draft.dueDate : null;
  return {
    error: null,
    tasks: [...tasks, {
      id: makeId('task'),
      title,
      category: cleanText(draft.category, 80) || 'Custom',
      priority: ['high', 'medium', 'low'].includes(draft.priority) ? draft.priority : 'medium',
      dueDate,
      done: false,
      overdue: false,
    }].sort((a, b) => String(a.dueDate || '9999').localeCompare(String(b.dueDate || '9999'))),
  };
}

export function summarizeChecklist(tasks = []) {
  const done = tasks.filter((task) => task.done).length;
  const overdue = tasks.filter((task) => !task.done && task.overdue).length;
  return {
    total: tasks.length,
    done,
    remaining: tasks.length - done,
    overdue,
    percent: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
  };
}

export function exportChecklist(tasks = []) {
  return ['Wedding checklist', '', ...tasks.map((task) => {
    const mark = task.done ? '[x]' : '[ ]';
    return `${mark} ${task.dueDate || 'No date'} — ${task.title} (${task.category}, ${task.priority})`;
  })].join('\n');
}
