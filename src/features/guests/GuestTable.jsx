import React, { useMemo } from 'react';
import { View } from 'react-native';

import { Badge, Card, Checkbox, Icon, Row, Text, Touchable } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { INVITATION_STATUS_META, RSVP_STATUS_META, guestFullName } from '@/models';

import { GUEST_TABLE_COLUMNS, GuestColumn, mealLabel, nextSort, selectionState } from './lib/guestTable';

/**
 * The guest list as a table, for wide screens.
 *
 * On a phone the list is rows built for scanning one status (`GuestRow`). With
 * a keyboard and a big screen the job changes to comparing and fixing many
 * guests at once, so every column is visible, headers sort, and a checkbox
 * column replaces long-press selection.
 */
export function GuestTable({
  guests,
  householdNameById,
  sort,
  onSortChange,
  selectedIds,
  onSelectionChange,
  onOpen,
}) {
  const { colors, spacing, borderWidths } = useTheme();
  const visibleIds = useMemo(() => guests.map((guest) => guest.id), [guests]);
  const allState = selectionState(visibleIds, selectedIds);

  const toggleAll = () => {
    if (allState === 'all') onSelectionChange(selectedIds.filter((id) => !visibleIds.includes(id)));
    else onSelectionChange([...new Set([...selectedIds, ...visibleIds])]);
  };

  const toggleOne = (id) =>
    onSelectionChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);

  const cell = (flex) => ({ flex, paddingHorizontal: spacing.xs, justifyContent: 'center' });
  const rowStyle = {
    minHeight: 48,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: borderWidths.hairline,
    borderBottomColor: colors.border,
  };

  return (
    <Card padding="none" accessibilityRole="list">
      <Row align="center" style={[rowStyle, { backgroundColor: colors.surfaceSunken }]}>
        <View style={{ width: 40 }}>
          <Checkbox
            checked={allState === 'all'}
            onChange={toggleAll}
            label={allState === 'all' ? 'Clear selection' : 'Select every guest shown'}
            size={20}
          />
        </View>
        {GUEST_TABLE_COLUMNS.map((column) => {
          const active = sort.column === column.key;
          const header = (
            <Row gap="hair" align="center">
              <Text variant="eyebrow" color={active ? 'default' : 'subtle'}>
                {column.label}
              </Text>
              {active ? (
                <Icon
                  name={sort.direction === 'asc' ? 'chevronUp' : 'chevronDown'}
                  size="xs"
                  color="inkMuted"
                />
              ) : null}
            </Row>
          );
          return (
            <View key={column.key} style={cell(column.flex)}>
              {column.sortable === false ? (
                header
              ) : (
                <Touchable
                  onPress={() => onSortChange(nextSort(sort, column.key))}
                  scaleOnPress={false}
                  accessibilityRole="button"
                  accessibilityLabel={`Sort by ${column.label}${active ? `, currently ${sort.direction === 'asc' ? 'ascending' : 'descending'}` : ''}`}
                >
                  {header}
                </Touchable>
              )}
            </View>
          );
        })}
      </Row>

      {guests.map((guest) => {
        const selected = selectedIds.includes(guest.id);
        const rsvp = RSVP_STATUS_META[guest.rsvpStatus] ?? RSVP_STATUS_META.pending;
        const invitation = INVITATION_STATUS_META[guest.invitationStatus];
        const name = guestFullName(guest) || 'Unnamed guest';

        return (
          <Row
            key={guest.id}
            align="center"
            style={[rowStyle, selected ? { backgroundColor: colors.brandSoft } : null]}
          >
            <View style={{ width: 40 }}>
              <Checkbox
                checked={selected}
                onChange={() => toggleOne(guest.id)}
                label={`Select ${name}`}
                size={20}
              />
            </View>
            <Touchable
              onPress={() => onOpen(guest)}
              scaleOnPress={false}
              accessibilityRole="button"
              accessibilityLabel={`${name}, ${rsvp.label}. Opens guest details.`}
              style={cell(GUEST_TABLE_COLUMNS[0].flex)}
            >
              <Text variant="bodyStrong" numberOfLines={1}>
                {name}
              </Text>
              {guest.isChild ? (
                <Text variant="caption" color="subtle">
                  Child
                </Text>
              ) : null}
            </Touchable>
            <View style={cell(2)}>
              <Text variant="bodySm" color="muted" numberOfLines={1}>
                {householdNameById.get(guest.householdId) ?? ''}
              </Text>
            </View>
            <View style={[cell(2), { alignItems: 'flex-start' }]}>
              <Badge label={rsvp.label} tone={rsvp.tone} />
            </View>
            <View style={cell(2)}>
              <Text variant="bodySm" numberOfLines={1}>
                {mealLabel(guest)}
              </Text>
            </View>
            <View style={cell(2)}>
              <Text variant="bodySm" color="muted" numberOfLines={1}>
                {invitation?.label ?? ''}
              </Text>
            </View>
            <View style={cell(2)}>
              <Text variant="caption" color="subtle" numberOfLines={1}>
                {(guest.tags ?? []).join(', ')}
              </Text>
            </View>
          </Row>
        );
      })}
    </Card>
  );
}

export { GuestColumn };
export default GuestTable;
