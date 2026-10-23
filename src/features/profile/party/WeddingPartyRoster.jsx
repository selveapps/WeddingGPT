import React from 'react';

import { Card, EmptyState, SectionHeader, Stack, Text, useToast } from '@/design-system/components';
import { PartyMemberCard, PartyMemberForm } from './components';
import { usePartyRoster } from './hooks/usePartyRoster';
import { summariseParty } from './lib/partyHelpers';

export function WeddingPartyRoster() {
  const toast = useToast();
  const { members, addRecord, removeRecord } = usePartyRoster();
  const summary = summariseParty(members);

  const addMember = (values) => {
    if (!addRecord(values)) {
      toast.error('Set up a wedding workspace before adding people.');
      return false;
    }
    toast.success('Person added to your wedding party.');
    return true;
  };

  const removeMember = (id) => {
    if (removeRecord(id)) toast.info('Person removed from your wedding party.');
  };

  return (
    <Stack gap="sm" testID="profile-party-roster">
      <SectionHeader
        eyebrow="Your people"
        title="Wedding party"
        subtitle={`${summary.total} people · ${summary.roles} ${summary.roles === 1 ? 'role' : 'roles'}`}
      />
      <Card>
        <PartyMemberForm onSave={addMember} />
      </Card>
      {members.length ? (
        <Stack gap="sm">
          <Text variant="caption" color="muted">
            {summary.withContact} people have contact details
          </Text>
          {members.map((member) => (
            <PartyMemberCard key={member.id} member={member} onRemove={removeMember} />
          ))}
        </Stack>
      ) : (
        <EmptyState
          icon="guests"
          compact
          title="Gather your people"
          message="Keep wedding-party roles and day-of helper details together in one place."
        />
      )}
    </Stack>
  );
}

export default WeddingPartyRoster;
