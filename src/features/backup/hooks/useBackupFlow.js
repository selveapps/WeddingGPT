import { useCallback, useState } from 'react';
import { useBackupStore } from '../../../store/backupStore';
import { runBackupJob, estimateBackupSize } from '../backupService';

/**
 * getters: { collectionName: () => storeSlice }
 * saveFn: async (text) => 'shared' | 'saved' | 'failed' | 'cancelled'
 */
export function useBackupFlow({ getters, saveFn, deviceName } = {}) {
  const addHistory = useBackupStore((s) => s.addHistory);
  const setJob = useBackupStore((s) => s.setJob);
  const lastJob = useBackupStore((s) => s.lastJob);
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);

  const estimate = useCallback(() => {
    if (!getters) return { bytes: 0, label: '—' };
    return estimateBackupSize(getters);
  }, [getters]);

  const runBackup = useCallback(async () => {
    if (!getters) return null;
    setBusy(true);
    const { job, history, result } = await runBackupJob({
      getters,
      label: label || 'Manual backup',
      deviceName,
      saveFn,
      onProgress: setJob,
    });
    if (history) addHistory(history);
    setBusy(false);
    return { job, history, result };
  }, [getters, label, deviceName, saveFn, addHistory, setJob]);

  return { label, setLabel, busy, lastJob, estimate, runBackup };
}
