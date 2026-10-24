import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STORAGE_KEYS, readJson, writeJson } from '@/features/featurePack3/storage';
import { DEFAULT_TIMELINE, addTimelineItem, buildTimelineText, findTimelineConflicts, sortTimeline, updateTimelineItem, deleteTimelineItem } from '@/features/featurePack3/timelineModel';

const palette = { background: '#F7F4F0', card: '#FFFFFF', ink: '#292421', muted: '#7B716A', accent: '#8C5B49', border: '#E8DFD8', danger: '#A33B32', green: '#39745C' };

export default function WeddingTimelineScreen() {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState('Wedding day');
  const [draftTitle, setDraftTitle] = useState('');
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState('30');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let alive = true;
    readJson(STORAGE_KEYS.timeline, DEFAULT_TIMELINE).then((saved) => {
      if (alive) { setItems(sortTimeline(Array.isArray(saved) ? saved : DEFAULT_TIMELINE)); setLoaded(true); }
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (loaded) writeJson(STORAGE_KEYS.timeline, items);
  }, [items, loaded]);

  const conflicts = useMemo(() => findTimelineConflicts(items), [items]);
  const visibleItems = useMemo(() => sortTimeline(items).filter((item) => `${item.title} ${item.location} ${item.notes}`.toLowerCase().includes(search.toLowerCase())), [items, search]);

  function resetForm() {
    setDraftTitle(''); setTime('09:00'); setDuration('30'); setLocation(''); setNotes(''); setEditingId(null);
  }

  function saveItem() {
    if (!draftTitle.trim()) return Alert.alert('Add an event name', 'Enter a title before saving.');
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return Alert.alert('Check the time', 'Use 24-hour time such as 14:30.');
    const minutes = Number(duration);
    if (!Number.isFinite(minutes) || minutes < 5 || minutes > 720) return Alert.alert('Check duration', 'Duration must be between 5 and 720 minutes.');
    const draft = { title: draftTitle, time, duration: minutes, location, notes, done: false };
    setItems((current) => editingId ? updateTimelineItem(current, editingId, draft) : addTimelineItem(current, draft));
    resetForm();
  }

  function editItem(item) {
    setEditingId(item.id); setDraftTitle(item.title); setTime(item.time); setDuration(String(item.duration)); setLocation(item.location); setNotes(item.notes);
  }

  async function shareTimeline() {
    try { await Share.share({ message: buildTimelineText(items, title) }); }
    catch (error) { Alert.alert('Could not share', 'Please try again.'); }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>WEDDING TOOLS</Text>
        <Text style={styles.heading}>Timeline builder</Text>
        <Text style={styles.subheading}>Build a clear run-of-show for the couple, family, and vendors.</Text>
        <TextInput value={title} onChangeText={setTitle} placeholder="Timeline title" style={styles.input} />
        <View style={styles.summaryRow}>
          <View style={styles.summary}><Text style={styles.summaryNumber}>{items.length}</Text><Text style={styles.summaryLabel}>Events</Text></View>
          <View style={styles.summary}><Text style={[styles.summaryNumber, conflicts.length ? styles.danger : null]}>{conflicts.length}</Text><Text style={styles.summaryLabel}>Timing overlaps</Text></View>
          <Pressable style={styles.shareButton} onPress={shareTimeline}><Text style={styles.shareText}>Share</Text></Pressable>
        </View>
        {conflicts.length > 0 && <View style={styles.warning}><Text style={styles.warningTitle}>Review overlapping events</Text>{conflicts.map((conflict) => <Text key={`${conflict.firstId}-${conflict.secondId}`} style={styles.warningText}>{conflict.firstTitle} overlaps {conflict.secondTitle} by {conflict.overlapMinutes} min.</Text>)}</View>}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{editingId ? 'Edit event' : 'Add an event'}</Text>
          <TextInput value={draftTitle} onChangeText={setDraftTitle} placeholder="Event name (e.g. Family photos)" style={styles.input} />
          <View style={styles.formRow}>
            <View style={styles.flex}><Text style={styles.label}>Start time (24h)</Text><TextInput value={time} onChangeText={setTime} placeholder="15:30" style={styles.input} /></View>
            <View style={styles.flex}><Text style={styles.label}>Duration (min)</Text><TextInput value={duration} onChangeText={setDuration} keyboardType="number-pad" style={styles.input} /></View>
          </View>
          <TextInput value={location} onChangeText={setLocation} placeholder="Location (optional)" style={styles.input} />
          <TextInput value={notes} onChangeText={setNotes} placeholder="Notes for the team (optional)" multiline style={[styles.input, styles.multiline]} />
          <Pressable onPress={saveItem} style={styles.primaryButton}><Text style={styles.primaryText}>{editingId ? 'Save changes' : 'Add to timeline'}</Text></Pressable>
          {editingId && <Pressable onPress={resetForm} style={styles.secondaryButton}><Text style={styles.secondaryText}>Cancel editing</Text></Pressable>}
        </View>
        <TextInput value={search} onChangeText={setSearch} placeholder="Search events, locations, notes..." style={styles.input} />
        <Text style={styles.sectionTitle}>Your schedule</Text>
        {visibleItems.length === 0 ? <Text style={styles.empty}>No events match. Add an event above to get started.</Text> : visibleItems.map((item, index) => (
          <View key={item.id} style={styles.eventCard}>
            <View style={styles.timeColumn}><Text style={styles.eventTime}>{item.time}</Text><Text style={styles.duration}>{item.duration} min</Text></View>
            <View style={styles.eventContent}><Text style={styles.eventTitle}>{item.title}</Text>{item.location ? <Text style={styles.meta}>{item.location}</Text> : null}{item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}{index < visibleItems.length - 1 ? <Text style={styles.meta}>Next: {visibleItems[index + 1].time}</Text> : null}</View>
            <View style={styles.actions}><Pressable onPress={() => editItem(item)}><Text style={styles.action}>Edit</Text></Pressable><Pressable onPress={() => Alert.alert('Delete event?', item.title, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => { setItems((current) => deleteTimelineItem(current, item.id)); if (editingId === item.id) resetForm(); } }])}><Text style={[styles.action, styles.danger]}>Delete</Text></Pressable></View>
          </View>
        ))}
        <Text style={styles.footer}>Saved on this device. Share a copy with vendors so everyone works from the same schedule.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  container: { padding: 20, paddingBottom: 44, gap: 14 },
  eyebrow: { color: palette.accent, fontWeight: '800', letterSpacing: 2, fontSize: 11, marginTop: 8 },
  heading: { color: palette.ink, fontSize: 30, fontWeight: '800' },
  subheading: { color: palette.muted, lineHeight: 21, marginBottom: 4 },
  input: { backgroundColor: palette.card, borderColor: palette.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 12, color: palette.ink, fontSize: 15 },
  multiline: { minHeight: 76, textAlignVertical: 'top' },
  formRow: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
  label: { color: palette.muted, fontSize: 12, marginBottom: 6, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', gap: 10, alignItems: 'stretch' },
  summary: { flex: 1, backgroundColor: palette.card, padding: 13, borderRadius: 14, borderWidth: 1, borderColor: palette.border },
  summaryNumber: { color: palette.ink, fontSize: 22, fontWeight: '800' },
  summaryLabel: { color: palette.muted, fontSize: 11, marginTop: 3 },
  shareButton: { justifyContent: 'center', backgroundColor: palette.accent, borderRadius: 12, paddingHorizontal: 18 },
  shareText: { color: '#fff', fontWeight: '800' },
  warning: { backgroundColor: '#FFF0ED', borderColor: '#E9B9B0', borderWidth: 1, padding: 14, borderRadius: 12, gap: 5 },
  warningTitle: { color: palette.danger, fontWeight: '800' },
  warningText: { color: palette.ink, fontSize: 13 },
  card: { backgroundColor: palette.card, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: palette.border, gap: 10 },
  cardTitle: { color: palette.ink, fontWeight: '800', fontSize: 18 },
  primaryButton: { backgroundColor: palette.accent, padding: 14, borderRadius: 12, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '800' },
  secondaryButton: { padding: 10, alignItems: 'center' },
  secondaryText: { color: palette.accent, fontWeight: '700' },
  sectionTitle: { fontSize: 20, color: palette.ink, fontWeight: '800', marginTop: 5 },
  empty: { color: palette.muted, backgroundColor: palette.card, borderRadius: 12, padding: 18 },
  eventCard: { flexDirection: 'row', gap: 12, padding: 14, backgroundColor: palette.card, borderRadius: 14, borderWidth: 1, borderColor: palette.border },
  timeColumn: { width: 62, borderRightWidth: 1, borderRightColor: palette.border, paddingRight: 8 },
  eventTime: { fontWeight: '800', color: palette.accent, fontSize: 16 },
  duration: { fontSize: 11, color: palette.muted, marginTop: 4 },
  eventContent: { flex: 1, gap: 4 },
  eventTitle: { color: palette.ink, fontWeight: '800', fontSize: 15 },
  meta: { color: palette.muted, fontSize: 12 },
  notes: { color: palette.ink, fontSize: 13, lineHeight: 18, marginTop: 2 },
  actions: { justifyContent: 'space-between', alignItems: 'flex-end' },
  action: { color: palette.accent, fontWeight: '800', fontSize: 12, paddingVertical: 4 },
  danger: { color: palette.danger },
  footer: { color: palette.muted, fontSize: 12, lineHeight: 18, marginTop: 6 },
});
