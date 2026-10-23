export const DAY_CHECKLIST_CATEGORIES = [
  { value: 'getting-ready', label: 'Getting ready', icon: 'user' },
  { value: 'ceremony', label: 'Ceremony', icon: 'rings' },
  { value: 'reception', label: 'Reception', icon: 'music' },
  { value: 'send-off', label: 'Send-off', icon: 'sparkle' },
  { value: 'other', label: 'Other', icon: 'checklist' },
];

export const DAY_CHECKLIST_PRIORITIES = [
  { value: 'high', label: 'Must do' },
  { value: 'normal', label: 'Important' },
  { value: 'low', label: 'If there is time' },
];

export const DAY_CHECKLIST_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'To do' },
  { value: 'done', label: 'Done' },
];

export const EMPTY_DAY_CHECKLIST_TASK = {
  title: '',
  category: 'getting-ready',
  time: '',
  owner: '',
  priority: 'normal',
  note: '',
};

export const DAY_CHECKLIST_COPY = {
  title: 'Wedding-day checklist',
  subtitle: 'A calm, shared list for the little things that make the day run smoothly.',
  emptyTitle: 'Start with the essentials',
  emptyMessage: 'Add your own tasks or load a starter checklist to make the list yours.',
  sampleButton: 'Add starter checklist',
  addTask: 'Add task',
  editTask: 'Edit task',
  saveTask: 'Save task',
  taskCount: (count) => `${count} ${count === 1 ? 'task' : 'tasks'}`,
  completedCount: (count) => `${count} done`,
};

export const STARTER_DAY_CHECKLIST = [
  { title: 'Set aside rings and vow books', category: 'getting-ready', time: '08:00', priority: 'high' },
  { title: 'Eat breakfast and drink water', category: 'getting-ready', time: '08:30', priority: 'high' },
  { title: 'Give the wedding party their personal items', category: 'getting-ready', time: '10:00' },
  {
    title: 'Confirm bouquets and boutonnieres arrived',
    category: 'getting-ready',
    time: '10:30',
    priority: 'high',
  },
  { title: 'Hand marriage license to the officiant', category: 'ceremony', time: '12:30', priority: 'high' },
  { title: 'Check ceremony music and microphone', category: 'ceremony', time: '13:00' },
  { title: 'Reserve seats for family members', category: 'ceremony', time: '13:15' },
  { title: 'Share family photo list with photographer', category: 'ceremony', time: '13:30' },
  { title: 'Confirm place cards and table details', category: 'reception', time: '15:30' },
  { title: 'Give the DJ the final announcements', category: 'reception', time: '16:00' },
  { title: 'Put cards and gifts in the card box', category: 'reception', time: '17:00' },
  { title: 'Pack an overnight bag and change of clothes', category: 'send-off', time: '18:00' },
  { title: 'Confirm who takes home keepsakes', category: 'send-off', time: '20:00' },
];
