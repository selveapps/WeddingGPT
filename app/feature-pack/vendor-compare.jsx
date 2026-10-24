import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STORAGE_KEYS, readJson, writeJson } from '@/features/featurePack3/storage';
import { addVendor, DEFAULT_VENDOR_CATEGORIES, deleteVendor, filterVendors, getVendorComparison, summarizeVendorCosts, updateVendor, validateVendorDraft } from '@/features/featurePack3/vendorCompareModel';

const C = { bg: '#F7F4F0', card: '#FFFFFF', ink: '#292421', muted: '#7B716A', accent: '#8C5B49', border: '#E8DFD8', danger: '#A33B32', green: '#39745C' };
const initialDraft = { name: '', category: 'Venue', quote: '', deposit: '0', rating: '3', available: true, includes: '', excludes: '', contact: '', notes: '' };

export default function VendorCompareScreen() {
  const [vendors, setVendors] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState(initialDraft);
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [priceWeight, setPriceWeight] = useState('45');
  const [ratingWeight, setRatingWeight] = useState('35');
  const [availabilityWeight, setAvailabilityWeight] = useState('20');

  useEffect(() => {
    let alive = true;
    readJson(STORAGE_KEYS.vendors, []).then((saved) => { if (alive) { setVendors(Array.isArray(saved) ? saved : []); setLoaded(true); } });
    return () => { alive = false; };
  }, []);
  useEffect(() => { if (loaded) writeJson(STORAGE_KEYS.vendors, vendors); }, [vendors, loaded]);

  const filtered = useMemo(() => filterVendors(vendors, { query, category, availableOnly }), [vendors, query, category, availableOnly]);
  const weights = useMemo(() => ({ price: Number(priceWeight) || 0, rating: Number(ratingWeight) || 0, availability: Number(availabilityWeight) || 0 }), [priceWeight, ratingWeight, availabilityWeight]);
  const ranked = useMemo(() => getVendorComparison(filtered, weights), [filtered, weights]);
  const summary = useMemo(() => summarizeVendorCosts(vendors), [vendors]);

  function setField(key, value) { setDraft((current) => ({ ...current, [key]: value })); }
  function reset() { setDraft(initialDraft); setEditingId(null); }
  function save() {
    const errors = validateVendorDraft(draft);
    if (Object.keys(errors).length) return Alert.alert('Check vendor details', Object.values(errors).join('\n'));
    const clean = { ...draft, quote: Number(draft.quote), deposit: Number(draft.deposit || 0), rating: Number(draft.rating) };
    setVendors((current) => editingId ? updateVendor(current, editingId, clean) : addVendor(current, clean));
    reset();
  }
  function edit(vendor) {
    setEditingId(vendor.id);
    setDraft({ ...vendor, quote: String(vendor.quote), deposit: String(vendor.deposit), rating: String(vendor.rating) });
  }
  async function share() {
    try { await Share.share({ message: getVendorComparison(vendors, weights).map((v, i) => `${i + 1}. ${v.name} — ${v.category} — Quote ${v.quote} — Deposit ${v.deposit} — Balance ${v.balance} — Rating ${v.rating}/5 — ${v.available ? 'Available' : 'Unavailable'} — Score ${v.score}`).join('\n') || 'No vendor quotes yet.' }); }
    catch { Alert.alert('Share unavailable', 'Try again in a moment.'); }
  }

  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
    <Text style={s.eyebrow}>WEDDING TOOLS</Text><Text style={s.heading}>Vendor comparison</Text><Text style={s.subheading}>Compare quotes side by side instead of choosing from memory.</Text>
    <View style={s.stats}><Stat label="Vendors" value={summary.count} /><Stat label="Available" value={summary.availableCount} /><Stat label="Outstanding" value={summary.outstanding.toLocaleString('en-IN', { maximumFractionDigits: 0 })} /></View>
    <View style={s.card}><Text style={s.cardTitle}>{editingId ? 'Edit vendor' : 'Add a vendor quote'}</Text>
      <TextInput value={draft.name} onChangeText={(v) => setField('name', v)} placeholder="Vendor or business name" style={s.input} />
      <Text style={s.label}>Category</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>{DEFAULT_VENDOR_CATEGORIES.map((item) => <Chip key={item} label={item} active={draft.category === item} onPress={() => setField('category', item)} />)}</ScrollView>
      <View style={s.row}><View style={s.flex}><Text style={s.label}>Quote amount</Text><TextInput value={draft.quote} onChangeText={(v) => setField('quote', v)} keyboardType="decimal-pad" placeholder="0" style={s.input} /></View><View style={s.flex}><Text style={s.label}>Deposit paid</Text><TextInput value={draft.deposit} onChangeText={(v) => setField('deposit', v)} keyboardType="decimal-pad" placeholder="0" style={s.input} /></View></View>
      <View style={s.row}><View style={s.flex}><Text style={s.label}>Rating (0–5)</Text><TextInput value={draft.rating} onChangeText={(v) => setField('rating', v)} keyboardType="decimal-pad" style={s.input} /></View><View style={[s.flex, s.switchRow]}><Text style={s.label}>Available?</Text><Switch value={draft.available} onValueChange={(v) => setField('available', v)} trackColor={{ true: C.accent }} /></View></View>
      <TextInput value={draft.includes} onChangeText={(v) => setField('includes', v)} placeholder="What's included?" style={s.input} />
      <TextInput value={draft.excludes} onChangeText={(v) => setField('excludes', v)} placeholder="What's excluded?" style={s.input} />
      <TextInput value={draft.contact} onChangeText={(v) => setField('contact', v)} placeholder="Contact details" style={s.input} />
      <TextInput value={draft.notes} onChangeText={(v) => setField('notes', v)} placeholder="Notes, questions, package details..." multiline style={[s.input, s.multiline]} />
      <Pressable onPress={save} style={s.primary}><Text style={s.primaryText}>{editingId ? 'Save vendor' : 'Add vendor'}</Text></Pressable>{editingId && <Pressable onPress={reset} style={s.secondary}><Text style={s.secondaryText}>Cancel</Text></Pressable>}
    </View>
    <View style={s.card}><Text style={s.cardTitle}>Comparison priorities</Text><Text style={s.helper}>Set relative importance. Scores are decision support, not a guarantee of quality.</Text><Weight label="Price importance (%)" value={priceWeight} onChange={setPriceWeight} /><Weight label="Rating importance (%)" value={ratingWeight} onChange={setRatingWeight} /><Weight label="Availability importance (%)" value={availabilityWeight} onChange={setAvailabilityWeight} /><Pressable onPress={share} style={s.secondary}><Text style={s.secondaryText}>Share ranked comparison</Text></Pressable></View>
    <TextInput value={query} onChangeText={setQuery} placeholder="Search vendors, notes, included services..." style={s.input} />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>{['All', ...DEFAULT_VENDOR_CATEGORIES].map((item) => <Chip key={item} label={item} active={category === item} onPress={() => setCategory(item)} />)}</ScrollView>
    <View style={s.switchRow}><Text style={s.label}>Available vendors only</Text><Switch value={availableOnly} onValueChange={setAvailableOnly} trackColor={{ true: C.accent }} /></View>
    <Text style={s.sectionTitle}>Ranked shortlist</Text>
    {ranked.length === 0 ? <Text style={s.empty}>No vendors yet. Add your first quote above.</Text> : ranked.map((v, index) => <View key={v.id} style={s.vendorCard}>
      <View style={s.vendorHeader}><View style={s.flex}><Text style={s.rank}>#{index + 1} · {v.score}/100 score</Text><Text style={s.vendorName}>{v.name}</Text><Text style={s.meta}>{v.category} · {v.available ? 'Available' : 'Not available'}</Text></View><Text style={s.quote}>{v.quote.toLocaleString('en-IN')}</Text></View>
      <View style={s.moneyRow}><Money label="Deposit" value={v.deposit} /><Money label="Balance" value={v.balance} /><Money label="Rating" value={`${v.rating}/5`} /></View>
      {v.includes ? <Text style={s.detail}><Text style={s.bold}>Includes: </Text>{v.includes}</Text> : null}{v.excludes ? <Text style={s.detail}><Text style={s.bold}>Excludes: </Text>{v.excludes}</Text> : null}{v.contact ? <Text style={s.detail}><Text style={s.bold}>Contact: </Text>{v.contact}</Text> : null}{v.notes ? <Text style={s.detail}>{v.notes}</Text> : null}
      <View style={s.actions}><Pressable onPress={() => edit(v)}><Text style={s.action}>Edit</Text></Pressable><Pressable onPress={() => Alert.alert('Delete vendor?', v.name, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => { setVendors((current) => deleteVendor(current, v.id)); if (editingId === v.id) reset(); } }])}><Text style={[s.action, s.danger]}>Delete</Text></Pressable></View>
    </View>)}
    <Text style={s.footer}>Vendor data stays on this device. Verify contracts, taxes, cancellation terms, and deliverables directly with each vendor.</Text>
  </ScrollView></SafeAreaView>;
}

function Stat({ label, value }) { return <View style={s.stat}><Text style={s.statValue}>{value}</Text><Text style={s.statLabel}>{label}</Text></View>; }
function Chip({ label, active, onPress }) { return <Pressable onPress={onPress} style={[s.chip, active && s.chipActive]}><Text style={[s.chipText, active && s.chipTextActive]}>{label}</Text></Pressable>; }
function Money({ label, value }) { return <View style={s.money}><Text style={s.label}>{label}</Text><Text style={s.moneyValue}>{typeof value === 'number' ? value.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : value}</Text></View>; }
function Weight({ label, value, onChange }) { return <View style={s.weight}><Text style={s.label}>{label}</Text><TextInput value={value} onChangeText={onChange} keyboardType="number-pad" style={[s.input, { width: 90 }]} /></View>; }

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg }, container: { padding: 20, paddingBottom: 48, gap: 14 },
  eyebrow: { color: C.accent, fontWeight: '800', letterSpacing: 2, fontSize: 11, marginTop: 8 },
  heading: { color: C.ink, fontSize: 30, fontWeight: '800' }, subheading: { color: C.muted, lineHeight: 21 },
  stats: { flexDirection: 'row', gap: 8 }, stat: { flex: 1, padding: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 13 },
  statValue: { fontSize: 17, fontWeight: '800', color: C.ink }, statLabel: { color: C.muted, fontSize: 11, marginTop: 4 },
  card: { padding: 15, borderRadius: 16, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, gap: 10 },
  cardTitle: { color: C.ink, fontSize: 18, fontWeight: '800' }, input: { backgroundColor: '#FFFEFC', borderColor: C.border, borderWidth: 1, borderRadius: 11, padding: 12, color: C.ink, fontSize: 14 },
  multiline: { minHeight: 70, textAlignVertical: 'top' }, row: { flexDirection: 'row', gap: 10 }, flex: { flex: 1 }, label: { color: C.muted, fontSize: 12, fontWeight: '700', marginBottom: 5 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, chips: { flexDirection: 'row', gap: 7, paddingVertical: 2 },
  chip: { borderRadius: 20, borderWidth: 1, borderColor: C.border, paddingHorizontal: 11, paddingVertical: 8, backgroundColor: C.card },
  chipActive: { backgroundColor: C.accent, borderColor: C.accent }, chipText: { color: C.ink, fontSize: 12, fontWeight: '700' }, chipTextActive: { color: '#fff' },
  primary: { backgroundColor: C.accent, borderRadius: 11, alignItems: 'center', padding: 14 }, primaryText: { color: '#fff', fontWeight: '800' },
  secondary: { borderColor: C.border, borderWidth: 1, padding: 12, borderRadius: 11, alignItems: 'center' }, secondaryText: { color: C.accent, fontWeight: '800' },
  helper: { color: C.muted, fontSize: 12, lineHeight: 17 }, weight: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: C.ink, fontWeight: '800', fontSize: 21 }, empty: { color: C.muted, backgroundColor: C.card, padding: 18, borderRadius: 12 },
  vendorCard: { backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 15, padding: 15, gap: 10 },
  vendorHeader: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' }, rank: { color: C.green, fontWeight: '800', fontSize: 11 },
  vendorName: { color: C.ink, fontWeight: '800', fontSize: 17, marginTop: 3 }, meta: { color: C.muted, fontSize: 12, marginTop: 3 },
  quote: { color: C.accent, fontWeight: '800', fontSize: 18 }, moneyRow: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 10 },
  money: { flex: 1 }, moneyValue: { color: C.ink, fontWeight: '800', fontSize: 14 }, detail: { color: C.ink, fontSize: 13, lineHeight: 18 }, bold: { fontWeight: '800' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20 }, action: { color: C.accent, fontWeight: '800', paddingVertical: 5 }, danger: { color: C.danger },
  footer: { color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
});
