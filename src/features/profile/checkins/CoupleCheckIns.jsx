import React from 'react';

import { Card, EmptyState, SectionHeader, Stack, Text, useToast } from '@/design-system/components';
import { CheckInCard, CheckInForm } from './components';
import { useCoupleCheckIns } from './hooks/useCoupleCheckIns';

export function CoupleCheckIns() {
  const toast = useToast();
  const { checkIns, addRecord, removeRecord } = useCoupleCheckIns();

  const save = (values) => {
    if (!addRecord(values)) {
      toast.error('Set up a wedding workspace before saving a check-in.');
      return false;
    }
    toast.success('Check-in saved.');
    return true;
  };

  const remove = (id) => {
    if (removeRecord(id)) toast.info('Check-in removed.');
  };

  return (
    <Stack gap="sm" testID="profile-checkins">
      <SectionHeader
        eyebrow="Make room to talk"
        title="Couple check-ins"
        subtitle="Capture a shared reflection or decision before the details pile up."
      />
      <Card>
        <CheckInForm previous={checkIns} onSave={save} />
      </Card>
      {checkIns.length ? (
        <Stack gap="sm">
          <Text variant="label" color="muted">
            {checkIns.length} saved check-ins
          </Text>
          {checkIns.map((checkIn) => (
            <CheckInCard key={checkIn.id} checkIn={checkIn} onRemove={remove} />
          ))}
        </Stack>
      ) : (
        <EmptyState
          icon="heart"
          compact
          title="Start with one honest question"
          message="Use a prompt or write your own and add a response from either or both of you."
        />
      )}
    </Stack>
  );
}

export default CoupleCheckIns;
