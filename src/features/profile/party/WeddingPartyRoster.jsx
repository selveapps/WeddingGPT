import React, { useMemo, useState } from 'react';

import {
  Card,
  EmptyState,
  SectionHeader,
  Stack,
  Text,
  TextField,
  useToast,
} from '@/design-system/components';
import { PartyMemberCard, PartyMemberForm } from './components';
import { usePartyRoster } from './hooks/usePartyRoster';
import { searchPartyMembers, summariseParty } from './lib/partyHelpers';

export function WeddingPartyRoster() {
  const toast = useToast();
  const { members, addRecord, removeRecord } = usePartyRoster();
  const [query, setQuery] = useState('');
  const summary = summariseParty(members);
  const visibleMembers = useMemo(() => searchPartyMembers(members, query), [members, query]);

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
          <TextField
            label="Find someone"
            value={query}
            onChangeText={setQuery}
            placeholder="Search names, email, phone or notes"
            icon="search"
          />
          {visibleMembers.length ? (
            visibleMembers.map((member) => (
              <PartyMemberCard key={member.id} member={member} onRemove={removeMember} />
            ))
          ) : (
            <EmptyState
              icon="search"
              compact
              title="No people found"
              message="Try another name or contact detail."
              actionLabel="Clear search"
              onAction={() => setQuery('')}
            />
          )}
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
