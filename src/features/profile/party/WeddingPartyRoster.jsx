import React, { useMemo, useState } from 'react';

import {
  Card,
  Chip,
  EmptyState,
  Row,
  SectionHeader,
  Stack,
  Text,
  TextField,
  useToast,
} from '@/design-system/components';
import { PartyMemberCard, PartyMemberForm } from './components';
import { usePartyRoster } from './hooks/usePartyRoster';
import { filterPartyMembers, searchPartyMembers, summariseParty } from './lib/partyHelpers';
import { PARTY_SIDES } from './lib/partyConstants';

export function WeddingPartyRoster() {
  const toast = useToast();
  const { members, addRecord, removeRecord } = usePartyRoster();
  const [query, setQuery] = useState('');
  const [side, setSide] = useState('all');
  const summary = summariseParty(members);
  const visibleMembers = useMemo(
    () => searchPartyMembers(filterPartyMembers(members, side), query),
    [members, query, side]
  );

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
          <Row gap="xs" wrap>
            <Chip label="Everyone" selected={side === 'all'} onPress={() => setSide('all')} />
            {PARTY_SIDES.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                selected={side === option.value}
                onPress={() => setSide(option.value)}
              />
            ))}
          </Row>
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
              onAction={() => {
                setQuery('');
                setSide('all');
              }}
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
