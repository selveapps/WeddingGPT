import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Checkbox } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { guestFullName, INVITATION_STATUS_META, RSVP_STATUS_META } from '@/models';
import { GuestColumn } from './lib/guestTable';

const COLUMNS = [
  { key: GuestColumn.NAME, label: 'Guest', flex: 2 },
  { key: GuestColumn.HOUSEHOLD, label: 'Household', flex: 1.5 },
  { key: GuestColumn.RSVP, label: 'RSVP', flex: 1.2 },
  { key: GuestColumn.INVITATION, label: 'Invitation', flex: 1.4 },
];

export function GuestTable({
  guests,
  householdNameById,
  sort,
  onSortChange,
  selectedIds,
  onSelectionChange,
  onOpen,
}) {
  const { colors, spacing, radii } = useTheme();
  const allSelected = guests.length > 0 && guests.every((guest) => selectedIds.includes(guest.id));

  const toggleGuest = (guestId) => {
    onSelectionChange(
      selectedIds.includes(guestId)
        ? selectedIds.filter((id) => id !== guestId)
        : [...selectedIds, guestId]
    );
  };

  const toggleAll = () => {
    if (allSelected) {
      const visibleIds = new Set(guests.map((guest) => guest.id));
      onSelectionChange(selectedIds.filter((id) => !visibleIds.has(id)));
    } else {
      onSelectionChange([...new Set([...selectedIds, ...guests.map((guest) => guest.id)])]);
    }
  };

  const headerTextStyle = {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: '700',
  };
  const cellTextStyle = {
    color: colors.ink,
    fontSize: 14,
  };
  const rowStyle = {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 54,
    paddingHorizontal: spacing.md,
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator>
      <View
        accessibilityRole="table"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radii.md,
          borderWidth: 1,
          minWidth: 680,
          overflow: 'hidden',
        }}
      >
        <View accessibilityRole="row" style={[rowStyle, { backgroundColor: colors.surfaceMuted }]}>
          <View style={{ alignItems: 'center', width: 48 }}>
            <Checkbox
              checked={allSelected}
              onChange={toggleAll}
              size={20}
              label={allSelected ? 'Deselect all visible guests' : 'Select all visible guests'}
            />
          </View>
          {COLUMNS.map((column) => {
            const active = sort.column === column.key;
            const nextDirection = active && sort.direction === 'asc' ? 'desc' : 'asc';
            return (
              <Pressable
                key={column.key}
                accessibilityRole="button"
                accessibilityLabel={`Sort by ${column.label}`}
                onPress={() => onSortChange({ column: column.key, direction: nextDirection })}
                style={{ flex: column.flex, paddingHorizontal: spacing.sm }}
              >
                <Text style={headerTextStyle}>
                  {column.label}
                  {active ? (sort.direction === 'desc' ? ' ↓' : ' ↑') : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {guests.map((guest) => {
          const selected = selectedIds.includes(guest.id);
          const rsvp = RSVP_STATUS_META[guest.rsvpStatus]?.label || 'Unknown';
          const invitation = INVITATION_STATUS_META[guest.invitationStatus]?.label || 'Unknown';

          return (
            <View
              key={guest.id}
              accessibilityRole="row"
              style={[
                rowStyle,
                {
                  backgroundColor: selected ? colors.brandSoft : colors.surface,
                  borderBottomWidth: 0,
                },
              ]}
            >
              <View style={{ alignItems: 'center', width: 48 }}>
                <Checkbox
                  checked={selected}
                  onChange={() => toggleGuest(guest.id)}
                  size={20}
                  label={`Select ${guestFullName(guest) || 'guest'}`}
                />
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => onOpen(guest)}
                style={{ flex: COLUMNS[0].flex, paddingHorizontal: spacing.sm }}
              >
                <Text numberOfLines={1} style={[cellTextStyle, { fontWeight: '600' }]}>
                  {guestFullName(guest) || 'Unnamed guest'}
                </Text>
                {guest.email ? (
                  <Text numberOfLines={1} style={{ color: colors.inkSubtle, fontSize: 12 }}>
                    {guest.email}
                  </Text>
                ) : null}
              </Pressable>
              <Text numberOfLines={1} style={[cellTextStyle, { flex: COLUMNS[1].flex, paddingHorizontal: spacing.sm }]}>
                {householdNameById.get(guest.householdId) || '—'}
              </Text>
              <Text numberOfLines={1} style={[cellTextStyle, { flex: COLUMNS[2].flex, paddingHorizontal: spacing.sm }]}>
                {rsvp}
              </Text>
              <Text numberOfLines={1} style={[cellTextStyle, { flex: COLUMNS[3].flex, paddingHorizontal: spacing.sm }]}>
                {invitation}
              </Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

export default GuestTable;
