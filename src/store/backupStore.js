/**
 * Backup UI state + local history of backups created on device.
 * Does not hold the full backup payloads (too large) — only metadata.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '../services/storage';
import {
  createBackupHistoryEntry,
  createBackupJob,
  BackupJobStatus,
  BACKUP_LIMITS,
} from '../models/backup';

const initial = {
  history: [],
  lastJob: null,
  autoBackupEnabled: false,
  autoBackupIntervalDays: 7,
  lastAutoBackupAt: null,
  preferShareSheet: true,
  meta: {},
};

export const useBackupStore = create()(
  persist(
    (set, get) => ({
      ...initial,

      listHistory: () => get().history.slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))),

      addHistory: (entry) => {
        const row = entry?.id ? entry : createBackupHistoryEntry(entry || {});
        set((s) => {
          const history = [row, ...s.history].slice(0, BACKUP_LIMITS.historyEntries);
          return { history };
        });
        return row;
      },

      removeHistory: (id) => {
        set((s) => ({ history: s.history.filter((h) => h.id !== id) }));
      },

      clearHistory: () => set({ history: [] }),

      setJob: (job) => set({ lastJob: job }),

      updateJob: (patch) => {
        const cur = get().lastJob || createBackupJob();
        set({ lastJob: { ...cur, ...patch } });
      },

      setAutoBackupEnabled: (enabled) => set({ autoBackupEnabled: !!enabled }),
      setAutoBackupIntervalDays: (days) => set({ autoBackupIntervalDays: Math.max(1, Number(days) || 7) }),
      setLastAutoBackupAt: (iso) => set({ lastAutoBackupAt: iso }),
      setPreferShareSheet: (v) => set({ preferShareSheet: !!v }),

      setMeta: (key, value) => set((s) => ({ meta: { ...s.meta, [key]: value } })),

      getStats: () => {
        const history = get().history;
        return {
          historyCount: history.length,
          lastBackupAt: history[0]?.createdAt || get().lastAutoBackupAt,
          autoBackupEnabled: get().autoBackupEnabled,
          lastJobStatus: get().lastJob?.status || BackupJobStatus.IDLE,
        };
      },

      reset: () => set(initial),
    }),
    {
      name: 'weddinggpt-backup-ui',
      storage: zustandStorage,
      partialize: (s) => ({
        history: s.history,
        autoBackupEnabled: s.autoBackupEnabled,
        autoBackupIntervalDays: s.autoBackupIntervalDays,
        lastAutoBackupAt: s.lastAutoBackupAt,
        preferShareSheet: s.preferShareSheet,
        meta: s.meta,
      }),
    }
  )
);
