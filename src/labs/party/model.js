import { createId } from '@/lib/id';

/**
 * Wedding party hub (Labs).
 *
 * A member is `{ name, roleKey, phone, outfit, size, todos }`. Each role
 * starts with the jobs it traditionally covers, so a new bridesmaid arrives
 * with "attend the dress fitting" already on her list. Roles are named the
 * common US way; couples rename or skip anything that does not fit them.
 */

export const PARTY_ROLES = [
  { key: 'maid_of_honor', label: 'Maid or matron of honor' },
  { key: 'best_man', label: 'Best man' },
  { key: 'bridesmaid', label: 'Bridesmaid' },
  { key: 'groomsman', label: 'Groomsman' },
  { key: 'attendant', label: 'Attendant' },
  { key: 'flower_child', label: 'Flower girl or boy' },
  { key: 'ring_bearer', label: 'Ring bearer' },
  { key: 'usher', label: 'Usher' },
  { key: 'reader', label: 'Reader' },
  { key: 'parent', label: 'Parent' },
  { key: 'other', label: 'Other' },
];

const OUTFIT_TODOS = ['Order your outfit', 'Go to the fitting'];

export const ROLE_TODOS = {
  maid_of_honor: ['Plan the shower', 'Plan the bachelorette', 'Hold the bouquet during the vows', 'Prepare a toast', ...OUTFIT_TODOS],
  best_man: ['Plan the bachelor party', 'Look after the rings', 'Prepare a toast', ...OUTFIT_TODOS],
  bridesmaid: [...OUTFIT_TODOS, 'Arrive for hair and makeup'],
  groomsman: [...OUTFIT_TODOS, 'Help guests find their seats'],
  attendant: [...OUTFIT_TODOS],
  flower_child: ['Practise the walk at the rehearsal'],
  ring_bearer: ['Practise the walk at the rehearsal'],
  usher: ['Learn the seating plan', 'Hand out programs'],
  reader: ['Choose and practise the reading'],
  parent: ['Send your guest list', 'Plan any family photos'],
  other: [],
};

export function roleLabel(key) {
  return PARTY_ROLES.find((role) => role.key === key)?.label ?? 'Wedding party';
}

export function starterTodos(roleKey) {
  return (ROLE_TODOS[roleKey] ?? []).map((title) => ({ id: createId('todo'), title, done: false }));
}

export function memberProgress(member) {
  const todos = member?.todos ?? [];
  const done = todos.filter((todo) => todo.done).length;
  return { done, total: todos.length, ratio: todos.length ? done / todos.length : 1 };
}

const needsOutfit = (member) => (ROLE_TODOS[member.roleKey] ?? []).includes(OUTFIT_TODOS[0]);

export function partySummary(members = []) {
  let todosDone = 0;
  let todosTotal = 0;
  let outfitsMissing = 0;
  for (const member of members) {
    const progress = memberProgress(member);
    todosDone += progress.done;
    todosTotal += progress.total;
    if (needsOutfit(member) && !member.outfit?.trim()) outfitsMissing++;
  }
  return { total: members.length, todosDone, todosTotal, outfitsMissing };
}

/** Members in role order (honor attendants first), then by name. */
export function sortMembers(members = []) {
  const order = (key) => {
    const index = PARTY_ROLES.findIndex((role) => role.key === key);
    return index === -1 ? PARTY_ROLES.length : index;
  };
  return [...members].sort(
    (a, b) => order(a.roleKey) - order(b.roleKey) || (a.name ?? '').localeCompare(b.name ?? '')
  );
}

/** What a member needs to know, as a message the couple can send them. */
export function memberBrief(member, { coupleName = 'us', dateText = '' } = {}) {
  const first = (member.name ?? '').trim().split(/\s+/)[0] || 'there';
  const lines = [
    `Hi ${first}!`,
    '',
    `Thank you for being our ${roleLabel(member.roleKey).toLowerCase()}${dateText ? ` on ${dateText}` : ''}. Here is what is on your list:`,
    '',
  ];
  const open = (member.todos ?? []).filter((todo) => !todo.done);
  if (open.length) lines.push(...open.map((todo) => `- ${todo.title}`));
  else lines.push('- Nothing right now - just enjoy it!');
  if (member.outfit?.trim()) {
    lines.push('', `Outfit: ${member.outfit.trim()}${member.size ? ` (size ${member.size})` : ''}`);
  }
  lines.push('', `Love, ${coupleName}`);
  return lines.join('\n');
}
