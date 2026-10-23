import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandStorage } from '../services/storage';
import {
  PARTY_LIMITS,
  createPartyMember,
  createPartyTodo,
  denormalise,
  emptyCollection,
  removeById,
  touchEntity,
  upsert,
  upsertMany,
} from '../models';

/**
 * The wedding party (graduated from Labs): who is standing with the couple,
 * their jobs and their outfits. Synced as `partyMembers`; each member's jobs
 * live on the member, so ticking one off is one record change.
 */

const initialState = {
  members: emptyCollection(),
  /** ISO time the Labs wedding party's data was imported, or null. */
  labsImportedAt: null,
};

export const usePartyStore = create()(
  persist(
    (set, get) => {
      const save = (member) => {
        set((state) => ({ members: upsert(state.members, member) }));
        return member;
      };
      const patchTodos = (memberId, change) => {
        const member = get().members.byId[memberId];
        if (!member) return null;
        const todos = change(member.todos ?? []);
        return todos ? save(touchEntity(member, { todos })) : null;
      };

      return {
        ...initialState,

        /** Add a member (or a prepared one, e.g. from `memberFromGuest`). */
        addMember(fieldsOrMember) {
          if (get().members.allIds.length >= PARTY_LIMITS.members) return null;
          const member = fieldsOrMember?.id ? fieldsOrMember : createPartyMember(fieldsOrMember);
          return save(member);
        },

        updateMember(id, patch) {
          const existing = get().members.byId[id];
          return existing ? save(touchEntity(existing, patch)) : null;
        },

        removeMember(id) {
          set((state) => ({ members: removeById(state.members, id) }));
        },

        toggleTodo(memberId, todoId) {
          return patchTodos(memberId, (todos) =>
            todos.map((todo) => (todo.id === todoId ? { ...todo, done: !todo.done } : todo))
          );
        },

        addTodo(memberId, title) {
          const todo = createPartyTodo(title);
          if (!todo) return null;
          return patchTodos(memberId, (todos) =>
            todos.length >= PARTY_LIMITS.todosPerMember ? null : [...todos, todo]
          );
        },

        removeTodo(memberId, todoId) {
          return patchTodos(memberId, (todos) => todos.filter((todo) => todo.id !== todoId));
        },

        /** Bring over members saved in the Labs wedding party. Returns how many came across. */
        importLabs({ weddingId, members = [] }) {
          const created = members
            .filter((member) => member && typeof member.name === 'string' && member.name.trim())
            .slice(0, PARTY_LIMITS.members)
            .map((member) =>
              createPartyMember({
                weddingId,
                name: member.name,
                roleKey: member.roleKey,
                phone: member.phone ?? '',
                outfit: member.outfit ?? '',
                size: member.size ?? '',
                todos: Array.isArray(member.todos)
                  ? member.todos
                      .filter((todo) => todo && typeof todo.title === 'string')
                      .map((todo) => ({ ...createPartyTodo(todo.title), done: Boolean(todo.done) }))
                      .filter((todo) => todo.id)
                  : undefined,
              })
            );
          if (created.length) set((state) => ({ members: upsertMany(state.members, created) }));
          set({ labsImportedAt: new Date().toISOString() });
          return created.length;
        },

        reset() {
          set({ ...initialState, members: emptyCollection() });
        },
      };
    },
    {
      name: 'party:store',
      storage: zustandStorage,
      version: 1,
      partialize: (state) => ({ members: state.members, labsImportedAt: state.labsImportedAt }),
    }
  )
);

export const selectPartyMembers = (state) => denormalise(state.members);
export const selectPartyMemberById = (id) => (state) => state.members.byId[id] ?? null;
