import React, { useEffect, useState } from 'react';

import { BottomSheet, Button } from '@/design-system/components';
import { DateType } from '@/models';
import haptics from '@/lib/haptics';
import { DateAnswer } from '@/features/onboarding/DateAnswer';

/**
 * Set or change the wedding date from the dashboard.
 *
 * Onboarding lets a couple skip the date, so the dashboard has to be the place
 * they can add it later - in a sheet, in context, without re-running anything.
 * Uses the same precision-first picker as onboarding.
 */
export function DateSheet({ visible, onClose, wedding, onSave }) {
  const [date, setDate] = useState(wedding?.date ?? null);
  const [dateType, setDateType] = useState(wedding?.dateType);

  // Start from the saved answer each time the sheet opens.
  useEffect(() => {
    if (!visible) return;
    setDate(wedding?.date ?? null);
    setDateType(wedding?.date ? wedding.dateType : undefined);
  }, [visible, wedding]);

  const canSave = dateType === DateType.UNDECIDED || Boolean(date);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="When is the big day?"
      subtitle="A rough idea is plenty."
      footer={
        <Button
          label="Save date"
          disabled={!canSave}
          onPress={() => {
            haptics.success();
            onSave({ date, dateType: dateType ?? DateType.UNDECIDED });
          }}
        />
      }
    >
      <DateAnswer
        value={date}
        dateType={dateType}
        onChange={(next) => {
          setDate(next.date);
          setDateType(next.dateType);
        }}
      />
    </BottomSheet>
  );
}

export default DateSheet;
