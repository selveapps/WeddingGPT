/**
 * WeddingContactsScreen — searchable directory with roles, day-of pack, CSV export.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Share, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Screen, Stack, Row, Text, Card, Button, Badge, ScreenHeader, SectionHeader,
  TextField, ListRow, ConfirmSheet, useToast,
} from '@/design-system/components';
import { storage } from '@/services/storage';
import {
  CONTACTS_STORAGE_KEY, emptyContactsState, normaliseContactsState, createContact,
  filterContacts, sortContacts, dayOfPack, exportContactsCsv, seedStarterContacts,
  contactStats, validateContact, ROLE_META, ContactRole, ContactPriority,
} from './weddingContactsModel';

export function WeddingContactsScreen() {
  const router = useRouter();
  const toast = useToast();
  const [state, setState] = useState(emptyContactsState);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState(null);
  const [dayOfOnly, setDayOfOnly] = useState(false);
  const [form, setForm] = useState(null);
  const [confirmSeed, setConfirmSeed] = useState(false);

  useEffect(() => {
    let a = true;
    storage.get(CONTACTS_STORAGE_KEY).then((raw) => {
      if (a) setState(normaliseContactsState(raw));
    }).finally(() => { if (a) setLoaded(true); });
    return () => { a = false; };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    storage.set(CONTACTS_STORAGE_KEY, { ...state, updatedAt: new Date().toISOString() }).catch(() => {});
  }, [state, loaded]);

  const stats = useMemo(() => contactStats(state.contacts), [state.contacts]);
  const visible = useMemo(
    () => sortContacts(filterContacts(state.contacts, { query, role: roleFilter, dayOfOnly })),
    [state.contacts, query, roleFilter, dayOfOnly]
  );
  const pack = useMemo(() => dayOfPack(state.contacts), [state.contacts]);

  const saveForm = useCallback(() => {
    const errors = validateContact(form || {});
    if (errors.name) { toast.error(errors.name); return; }
    if (errors.email) { toast.error(errors.email); return; }
    setState((s) => {
      const exists = s.contacts.some((c) => c.id === form.id);
      const contacts = exists
        ? s.contacts.map((c) => (c.id === form.id ? form : c))
        : [...s.contacts, form];
      return { ...s, contacts };
    });
    setForm(null);
    toast.success('Contact saved');
  }, [form, toast]);

  const remove = useCallback((id) => {
    setState((s) => ({ ...s, contacts: s.contacts.filter((c) => c.id !== id) }));
  }, []);

  const onExport = useCallback(async () => {
    try {
      await Share.share({ message: exportContactsCsv(state.contacts), title: 'Wedding contacts' });
    } catch { toast.error('Share failed'); }
  }, [state.contacts, toast]);

  const applySeed = useCallback(() => {
    setState((s) => ({ ...s, contacts: [...s.contacts, ...seedStarterContacts()] }));
    setConfirmSeed(false);
    toast.success('Starter contacts added');
  }, [toast]);

  return (
    <Screen testID="wedding-contacts" edges={['top', 'bottom']}>
      <ScreenHeader
        title="Important contacts"
        subtitle={`${stats.total} contacts · ${stats.dayOf} day-of`}
        onBack={() => router.back()}
        trailing={<Button variant="ghost" size="sm" label="CSV" onPress={onExport} />}
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <Stack gap="md">
          <Card>
            <Stack gap="sm">
              <Row style={styles.between}>
                <Text variant="caption" color="muted">Critical</Text>
                <Text>{stats.critical}</Text>
              </Row>
              <Row style={styles.between}>
                <Text variant="caption" color="muted">Missing phone</Text>
                <Text>{stats.missingPhone}</Text>
              </Row>
            </Stack>
          </Card>

          <TextField
            value={query}
            onChangeText={setQuery}
            placeholder="Search name, phone, notes…"
            autoCapitalize="none"
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Row gap="sm">
              <Button size="sm" variant={!roleFilter && !dayOfOnly ? 'primary' : 'secondary'} label="All" onPress={() => { setRoleFilter(null); setDayOfOnly(false); }} />
              <Button size="sm" variant={dayOfOnly ? 'primary' : 'secondary'} label="Day-of pack" onPress={() => { setDayOfOnly(true); setRoleFilter(null); }} />
              {Object.values(ContactRole).map((r) => (
                <Button key={r} size="sm" variant={roleFilter === r ? 'primary' : 'secondary'} label={ROLE_META[r].label} onPress={() => { setRoleFilter(r); setDayOfOnly(false); }} />
              ))}
            </Row>
          </ScrollView>

          <Row gap="sm">
            <Button label="Add contact" onPress={() => setForm(createContact({ dayOf: true, priority: ContactPriority.HIGH }))} />
            <Button variant="secondary" label="Seed starters" onPress={() => setConfirmSeed(true)} />
          </Row>

          {dayOfOnly || pack.length ? (
            <SectionHeader title="Day-of quick list" subtitle="Critical + marked day-of" />
          ) : null}
          {(dayOfOnly ? pack : []).length === 0 && dayOfOnly ? (
            <Card><Text color="muted">Mark contacts as day-of to build this pack.</Text></Card>
          ) : null}

          {form ? (
            <Card>
              <Stack gap="md">
                <TextField label="Name" value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} />
                <TextField label="Role" value={form.role} onChangeText={(v) => setForm((f) => ({ ...f, role: v }))} />
                <TextField label="Title" value={form.title} onChangeText={(v) => setForm((f) => ({ ...f, title: v }))} />
                <TextField label="Company" value={form.company} onChangeText={(v) => setForm((f) => ({ ...f, company: v }))} />
                <TextField label="Phone" value={form.phone} onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))} keyboardType="phone-pad" />
                <TextField label="Alt phone" value={form.phoneAlt} onChangeText={(v) => setForm((f) => ({ ...f, phoneAlt: v }))} keyboardType="phone-pad" />
                <TextField label="Email" value={form.email} onChangeText={(v) => setForm((f) => ({ ...f, email: v }))} keyboardType="email-address" autoCapitalize="none" />
                <TextField label="Priority (critical/high/normal/low)" value={form.priority} onChangeText={(v) => setForm((f) => ({ ...f, priority: v }))} />
                <TextField label="Notes" value={form.notes} onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))} multiline />
                <Row gap="sm">
                  <Button label={form.dayOf ? 'Day-of: Yes' : 'Day-of: No'} variant="secondary" onPress={() => setForm((f) => ({ ...f, dayOf: !f.dayOf }))} />
                </Row>
                <Row gap="sm">
                  <Button label="Save" onPress={saveForm} />
                  <Button variant="secondary" label="Cancel" onPress={() => setForm(null)} />
                </Row>
              </Stack>
            </Card>
          ) : null}

          <Card padding="none">
            {visible.map((c) => (
              <ListRow
                key={c.id}
                title={c.name}
                subtitle={[ROLE_META[c.role]?.label || c.role, c.phone, c.title].filter(Boolean).join(' · ')}
                trailing={
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    {c.dayOf ? <Badge label="Day-of" tone="brand" /> : null}
                    <Badge label={c.priority} tone={c.priority === 'critical' ? 'danger' : 'neutral'} />
                  </View>
                }
                onPress={() => setForm({ ...c })}
                onLongPress={() => remove(c.id)}
              />
            ))}
            {!visible.length && loaded ? (
              <View style={{ padding: 16 }}>
                <Text color="muted">No contacts match. Add one or seed starters.</Text>
              </View>
            ) : null}
          </Card>
        </Stack>
      </ScrollView>
      <ConfirmSheet
        open={confirmSeed}
        title="Add starter contacts?"
        body="Adds venue, photographer, party and emergency placeholders you can edit."
        confirmLabel="Add"
        onConfirm={applySeed}
        onCancel={() => setConfirmSeed(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});

export default WeddingContactsScreen;
