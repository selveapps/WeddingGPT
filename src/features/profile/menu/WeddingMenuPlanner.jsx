import React, { useMemo, useState } from 'react';
import {
  Card,
  Chip,
  EmptyState,
  Row,
  SectionHeader,
  Stack,
  TextField,
  useToast,
} from '@/design-system/components';
import { MenuItemCard, MenuItemForm } from './components';
import { useWeddingMenu } from './hooks';
import { filterMenu, summariseMenu } from './lib/menuHelpers';

export function WeddingMenuPlanner() {
  const toast = useToast();
  const { records, addRecord, updateRecord, removeRecord } = useWeddingMenu();
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const summary = summariseMenu(records);
  const visible = useMemo(() => filterMenu(records, filter, query), [records, filter, query]);
  const save = (values) => {
    const result = editing ? updateRecord(editing.id, values) : addRecord(values);
    if (!result) {
      toast.error('Set up a wedding workspace before saving menu items.');
      return false;
    }
    toast.success(editing ? 'Menu item updated.' : 'Menu item added.');
    setEditing(null);
    setFormKey((key) => key + 1);
    return true;
  };
  const remove = (id) => {
    if (removeRecord(id)) {
      toast.info('Menu item removed.');
      if (editing?.id === id) setEditing(null);
    } else toast.error('Could not remove this menu item.');
  };
  return (
    <Stack gap="sm" testID="wedding-menu-planner">
      <SectionHeader
        eyebrow="Food & drink"
        title="Menu planner"
        subtitle={`${summary.total} items · ${summary.confirmed} confirmed · ${summary.dietaryNotes} dietary notes`}
      />
      <Card padding="md">
        <MenuItemForm
          key={`${editing?.id || 'new'}-${formKey}`}
          initialValue={editing}
          onSave={save}
          onCancel={editing ? () => setEditing(null) : undefined}
        />
      </Card>
      {records.length ? (
        <Stack gap="sm">
          <TextField
            label="Search menu"
            value={query}
            onChangeText={setQuery}
            placeholder="Dish, course or dietary note"
            icon="search"
            testID="menu-search"
          />
          <Row gap="xs" wrap>
            {[
              ['all', 'All status'],
              ['planned', 'Planned'],
              ['confirmed', 'Confirmed'],
              ['served', 'Served'],
            ].map(([value, label]) => (
              <Chip key={value} label={label} selected={filter === value} onPress={() => setFilter(value)} />
            ))}
          </Row>
          {visible.length ? (
            visible.map((item) => (
              <MenuItemCard key={item.id} item={item} onEdit={setEditing} onRemove={remove} />
            ))
          ) : (
            <EmptyState
              icon="search"
              compact
              title="No menu items found"
              message="Adjust your search or status filter."
              actionLabel="Clear filters"
              onAction={() => {
                setQuery('');
                setFilter('all');
              }}
            />
          )}
        </Stack>
      ) : (
        <EmptyState
          icon="sparkle"
          compact
          title="Build your menu"
          message="Organize courses, dietary needs, allergens and serving preferences."
        />
      )}
    </Stack>
  );
}

export default WeddingMenuPlanner;
