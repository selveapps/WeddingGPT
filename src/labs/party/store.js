import { createId } from '@/lib/id';

import { createCollectionStore } from '../shared/createCollectionStore';

export const useLabPartyStore = createCollectionStore({
  key: 'party',
  prefix: 'lparty',
  extend: (set, get) => ({
    toggleTodo(memberId, todoId) {
      return get().update(memberId, (member) => ({
        todos: member.todos.map((todo) => (todo.id === todoId ? { ...todo, done: !todo.done } : todo)),
      }));
    },

    addTodo(memberId, title) {
      const text = title?.trim();
      if (!text) return null;
      return get().update(memberId, (member) => ({
        todos: [...(member.todos ?? []), { id: createId('todo'), title: text, done: false }],
      }));
    },
  }),
});
