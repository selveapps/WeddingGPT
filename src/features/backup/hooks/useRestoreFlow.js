import { useCallback, useState } from 'react';
import { validateBackupText, applyBackup } from '../backupService';
import { useBackupStore } from '../../../store/backupStore';

export function useRestoreFlow({ setters, canRestore = true } = {}) {
  const [visible, setVisible] = useState(false);
  const addHistory = useBackupStore((s) => s.addHistory);

  const open = useCallback(() => setVisible(true), []);
  const close = useCallback(() => setVisible(false), []);

  const restore = useCallback(async (checked) => {
    if (!canRestore) throw new Error('Restore disabled for synced workspace');
    const records = applyBackup(checked, setters || {});
    addHistory({
      label: 'Pre-restore snapshot marker',
      recordCount: records,
      source: 'pre_restore',
    });
    return records;
  }, [canRestore, setters, addHistory]);

  return { visible, open, close, restore, validate: validateBackupText, canRestore };
}
