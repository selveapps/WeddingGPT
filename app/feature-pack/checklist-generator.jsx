import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STORAGE_KEYS, readJson, writeJson } from '@/features/featurePack3/storage';
import { addChecklistTask, deleteChecklistTask, exportChecklist, generateChecklist, summarizeChecklist, toggleChecklistTask } from '@/features/featurePack3/checklistModel';

const C = { bg: '#F7F4F0', card: '#FFFFFF', ink: '#292421', muted: '#7B716A', accent: '#8C5B49', border: '#E8DFD8', danger: '#A33B32', green: '#39745C' };

export default function ChecklistGeneratorScreen() {
  const [tasks, setTasks] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [weddingDate, setWeddingDate] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newCategory, setNewCategory] = useState('Custom');
  const [newPriority, setNewPriority] = useState('medium');
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let alive = true;
    readJson(STORAGE_KEYS.checklist, []).then((saved) => { if (alive) { setTasks(Array.isArray(saved) ? saved : []); setLoaded(true); } });
    return () => { alive = false; };
  }, []);
  useEffect(() => { if (loaded) writeJson(STORAGE_KEYS.checklist, tasks); }, [tasks, loaded]);

  const summary = useMemo(() => summarizeChecklist(tasks), [tasks]);
  const visible = useMemo(() => tasks.filter((task) => {
    const statusMatch = filter === 'all' || (filter === 'done' && task.done) || (filter === 'open' && !task.done) || (filter === 'overdue' && !task.done && task.overdue);
    return statusMatch && `${task.title} ${task.category}`.toLowerCase().includes(query.toLowerCase());
  }), [tasks, filter, query]);

  function generate() {
    const result = generateChecklist(weddingDate);
    if (result.error) return Alert.alert('Check wedding date', result.error);
    Alert.alert('Generate checklist?', `This creates ${result.tasks.length} starter tasks. Existing tasks will be replaced.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Generate', onPress: () => setTasks(result.tasks) },
    ]);
  }
  function addTask() {
    const result = addChecklistTask(tasks, { title: newTitle, dueDate: newDate, category: newCategory, priority: newPriority });
    if (result.error) return Alert.alert('Task title needed', result.error);
    setTasks(result.tasks); setNewTitle(''); setNewDate('');
  }
  async function share() {
    try { await Share.share({ message: exportChecklist(tasks) }); }
    catch { Alert.alert('Share unavailable', 'Try again in a moment.'); }
  }

  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
    <Text style={s.eyebrow}>WEDDING TOOLS</Text><Text style={s.heading}>Checklist generator</Text><Text style={s.subheading}>Generate a practical starter plan from your wedding date, then make it yours.</Text>
    <View style={s.stats}><Stat label="Total tasks" value={summary.total} /><Stat label="Completed" value={summary.done} /><Stat label="Overdue" value={summary.overdue} /></View>
    <View style={s.progressTrack}><View style={[s.progressFill, { width: `${summary.percent}%` }]} /></View><Text style={s.progressLabel}>{summary.percent}% complete · {summary.remaining} remaining</Text>
    <View style={s.card}><Text style={s.cardTitle}>Create a date-based plan</Text><Text style={s.helper}>Use YYYY-MM-DD, for example 2027-06-12. This generates a general wedding checklist; dates should be adjusted to your venue and local requirements.</Text><TextInput value={weddingDate} onChangeText={setWeddingDate} placeholder="YYYY-MM-DD" style={s.input} /><Pressable onPress={generate} style={s.primary}><Text style={s.primaryText}>Generate starter checklist</Text></Pressable></View>
    <View style={s.card}><Text style={s.cardTitle}>Add your own task</Text><TextInput value={newTitle} onChangeText={setNewTitle} placeholder="Task name" style={s.input} /><View style={s.row}><View style={s.flex}><Text style={s.label}>Due date (optional)</Text><TextInput value={newDate} onChangeText={setNewDate} placeholder="YYYY-MM-DD" style={s.input} /></View><View style={s.flex}><Text style={s.label}>Category</Text><TextInput value={newCategory} onChangeText={setNewCategory} placeholder="Custom" style={s.input} /></View></View><Text style={s.label}>Priority</Text><View style={s.row}>{['low', 'medium', 'high'].map((priority) => <Pressable key={priority} onPress={() => setNewPriority(priority)} style={[s.priorityChip, newPriority === priority && s.priorityActive]}><Text style={[s.priorityText, newPriority === priority && s.priorityTextActive]}>{priority}</Text></Pressable>)}</View><Pressable onPress={addTask} style={s.primary}><Text style={s.primaryText}>Add task</Text></Pressable></View>
    <View style={s.toolbar}><Text style={s.sectionTitle}>Your tasks</Text><Pressable onPress={share} style={s.shareButton}><Text style={s.shareText}>Share</Text></Pressable></View>
    <TextInput value={query} onChangeText={setQuery} placeholder="Search tasks or categories..." style={s.input} />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>{[['all', 'All'], ['open', 'Open'], ['done', 'Done'], ['overdue', 'Overdue']].map(([value, label]) => <Pressable key={value} onPress={() => setFilter(value)} style={[s.filter, filter === value && s.filterActive]}><Text style={[s.filterText, filter === value && s.filterTextActive]}>{label}</Text></Pressable>)}</ScrollView>
    {visible.length === 0 ? <Text style={s.empty}>No tasks here yet. Generate a checklist or add a task above.</Text> : visible.map((task) => <View key={task.id} style={s.taskCard}>
      <Pressable onPress={() => setTasks((current) => toggleChecklistTask(current, task.id))} style={[s.checkbox, task.done && s.checkboxDone]}><Text style={s.checkmark}>{task.done ? '✓' : ''}</Text></Pressable>
      <View style={s.taskBody}><Text style={[s.taskTitle, task.done && s.taskDone]}>{task.title}</Text><Text style={s.meta}>{task.dueDate || 'No due date'} · {task.category} · {task.priority} priority</Text>{task.overdue && !task.done ? <Text style={s.overdue}>Overdue — review the due date</Text> : null}</View>
      <Pressable onPress={() => Alert.alert('Delete task?', task.title, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => setTasks((current) => deleteChecklistTask(current, task.id)) }])}><Text style={s.delete}>×</Text></Pressable>
    </View>)}
    <Pressable onPress={() => Alert.alert('Clear checklist?', 'This permanently removes all checklist tasks stored on this device.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Clear all', style: 'destructive', onPress: () => setTasks([]) }])} style={s.clear}><Text style={s.clearText}>Clear all tasks</Text></Pressable>
    <Text style={s.footer}>Locally saved on this device. The generated schedule is a starting point, not legal or vendor-specific advice.</Text>
  </ScrollView></SafeAreaView>;
}

function Stat({ label, value }) { return <View style={s.stat}><Text style={s.statValue}>{value}</Text><Text style={s.statLabel}>{label}</Text></View>; }

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg }, container: { padding: 20, paddingBottom: 48, gap: 14 },
  eyebrow: { color: C.accent, fontWeight: '800', letterSpacing: 2, fontSize: 11, marginTop: 8 }, heading: { color: C.ink, fontSize: 30, fontWeight: '800' },
  subheading: { color: C.muted, lineHeight: 21 }, stats: { flexDirection: 'row', gap: 8 }, stat: { flex: 1, padding: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 13 },
  statValue: { fontSize: 20, fontWeight: '800', color: C.ink }, statLabel: { color: C.muted, fontSize: 11, marginTop: 4 },
  progressTrack: { height: 8, backgroundColor: '#E8DFD8', borderRadius: 9, overflow: 'hidden' }, progressFill: { height: 8, backgroundColor: C.green, borderRadius: 9 }, progressLabel: { color: C.muted, fontSize: 12 },
  card: { padding: 15, borderRadius: 16, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, gap: 10 }, cardTitle: { color: C.ink, fontSize: 18, fontWeight: '800' },
  helper: { color: C.muted, fontSize: 12, lineHeight: 18 }, input: { backgroundColor: '#FFFEFC', borderColor: C.border, borderWidth: 1, borderRadius: 11, padding: 12, color: C.ink, fontSize: 14 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' }, flex: { flex: 1 }, label: { color: C.muted, fontSize: 12, fontWeight: '700', marginBottom: 5 },
  primary: { backgroundColor: C.accent, borderRadius: 11, alignItems: 'center', padding: 14 }, primaryText: { color: '#fff', fontWeight: '800' },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, sectionTitle: { color: C.ink, fontWeight: '800', fontSize: 21 },
  shareButton: { backgroundColor: C.accent, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 10 }, shareText: { color: '#fff', fontWeight: '800' },
  filter: { borderRadius: 18, borderWidth: 1, borderColor: C.border, paddingHorizontal: 13, paddingVertical: 8, backgroundColor: C.card },
  filterActive: { backgroundColor: C.accent, borderColor: C.accent }, filterText: { color: C.ink, fontWeight: '700', fontSize: 12 }, filterTextActive: { color: '#fff' },
  priorityChip: { flex: 1, borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: C.border }, priorityActive: { backgroundColor: C.accent, borderColor: C.accent },
  priorityText: { color: C.ink, fontWeight: '700', textTransform: 'capitalize' }, priorityTextActive: { color: '#fff' },
  empty: { color: C.muted, backgroundColor: C.card, padding: 18, borderRadius: 12 }, taskCard: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 13, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 13 },
  checkbox: { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }, checkboxDone: { backgroundColor: C.green, borderColor: C.green },
  checkmark: { color: '#fff', fontWeight: '900' }, taskBody: { flex: 1, gap: 4 }, taskTitle: { color: C.ink, fontWeight: '800', fontSize: 14 }, taskDone: { textDecorationLine: 'line-through', color: C.muted },
  meta: { color: C.muted, fontSize: 11, lineHeight: 16 }, overdue: { color: C.danger, fontWeight: '700', fontSize: 11 }, delete: { color: C.danger, fontSize: 24, paddingHorizontal: 4, fontWeight: '700' },
  clear: { borderWidth: 1, borderColor: '#E9B9B0', borderRadius: 10, padding: 12, alignItems: 'center' }, clearText: { color: C.danger, fontWeight: '800' },
  footer: { color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
});
