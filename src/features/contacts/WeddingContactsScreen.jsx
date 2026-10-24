import React, { useMemo, useState } from 'react';
import { Alert, Linking, TextInput, View } from 'react-native';
import { Screen, Stack, Row, Text, Card, ScreenHeader, SectionHeader, Button, Badge, Divider } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { createId, usePersistentList } from '@/features/shared/persistentList';
import { CONTACT_ROLES, normalizeContact, searchContacts } from './weddingContactsModel';

const KEY = 'feature:wedding-contacts:v1';
const empty = { name: '', phone: '', role: 'Other', notes: '' };
function Field({ label, value, onChangeText, placeholder, keyboardType = 'default' }) {
  const { colors, spacing } = useTheme();
  return <Stack gap="xs"><Text variant="label" color="muted">{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} placeholder={placeholder} keyboardType={keyboardType} placeholderTextColor={colors.inkSubtle} style={{ color: colors.ink, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }} /></Stack>;
}
export default function WeddingContactsScreen() {
  const { colors } = useTheme();
  const { items, add, remove, loaded } = usePersistentList(KEY, []);
  const [form, setForm] = useState(empty);
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => searchContacts(items, query), [items, query]);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const save = () => {
    try {
      add({ ...normalizeContact(form), id: createId('contact'), createdAt: new Date().toISOString() });
      setForm(empty); setVisible(false);
    } catch (error) { Alert.alert('Check contact', error.message); }
  };
  return (
    <Screen>
      <Stack gap="lg">
        <ScreenHeader eyebrow="Wedding day toolkit" title="Important contacts" />
        <Text color="muted">Keep essential numbers ready for the couple, family and wedding team. Tap a phone number to call.</Text>
        <Field label="Search contacts" value={query} onChangeText={setQuery} placeholder="Search name, role or phone" />
        <Button label={visible ? 'Close form' : 'Add contact'} onPress={() => setVisible((value) => !value)} />
        {visible ? <Card><Stack gap="md"><SectionHeader title="New contact" /><Field label="Name / business" value={form.name} onChangeText={(v) => update('name', v)} placeholder="Venue manager" /><Field label="Phone number" value={form.phone} onChangeText={(v) => update('phone', v)} placeholder="+91 98765 43210" keyboardType="phone-pad" /><Field label="Role" value={form.role} onChangeText={(v) => update('role', v)} placeholder={CONTACT_ROLES.join(', ')} /><Field label="Notes (optional)" value={form.notes} onChangeText={(v) => update('notes', v)} placeholder="Booking reference, best time to call…" /><Button label="Save contact" onPress={save} /></Stack></Card> : null}
        <SectionHeader title="Saved contacts" trailing={String(filtered.length)} />
        {!loaded ? <Text color="muted">Loading contacts…</Text> : null}
        {loaded && filtered.length === 0 ? <Card><Text color="muted">{items.length ? 'No contacts match your search.' : 'Add your venue, planner, photographer, transport contact and trusted family members.'}</Text></Card> : null}
        {filtered.map((contact) => <Card key={contact.id}><Stack gap="sm"><Row align="center" gap="sm"><View style={{ flex: 1 }}><Text variant="h4">{contact.name}</Text><Text color="muted">{contact.phone}</Text></View><Badge label={contact.role} /></Row>{contact.notes ? <Text variant="caption" color="muted">{contact.notes}</Text> : null}<Divider /><Row gap="sm"><View style={{ flex: 1 }}><Button size="sm" label="Call" onPress={() => Linking.openURL(`tel:${contact.phone.replace(/[^+\d]/g, '')}`).catch(() => Alert.alert('Unable to call', 'This device cannot open the phone app.'))} /></View><Button size="sm" variant="ghost" label="Delete" onPress={() => Alert.alert('Delete contact?', contact.name, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => remove(contact.id) }])} /></Row></Stack></Card>)}
        <Text variant="caption" color="muted">Only save contact information you have permission to keep. For emergencies, use your local emergency number.</Text>
      </Stack>
    </Screen>
  );
}
