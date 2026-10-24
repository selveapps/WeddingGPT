import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STORAGE_KEYS, loadStoredValue, saveStoredValue } from '@/features/featurePack4/storage';
import { addExpense, BUDGET_CATEGORIES, effectiveCost, exportBudgetReport, filterExpenses, getBudgetSummary, getUpcomingPayments, groupExpensesByCategory, removeExpense, updateExpense, validateExpense } from '@/features/featurePack4/budgetModel';

const T = { bg: '#F6F2EE', card: '#FFFFFF', ink: '#282320', muted: '#7C716A', accent: '#875541', line: '#E7DDD5', green: '#327356', red: '#A83D34' };
const BLANK = { title: '', category: 'Venue', estimated: '', actual: '', paid: '0', dueDate: '', vendor: '', notes: '', priority: 'medium' };
const cash = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function BudgetPlannerScreen() {
  const [items, setItems] = useState([]);
  const [limit, setLimit] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState(BLANK);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [payment, setPayment] = useState('all');
  const [priority, setPriority] = useState('all');

  useEffect(() => {
    let active = true;
    loadStoredValue(STORAGE_KEYS.budget, { items: [], limit: '' }).then((data) => {
      if (!active) return;
      setItems(Array.isArray(data.items) ? data.items : []);
      setLimit(String(data.limit ?? ''));
      setLoaded(true);
    });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (loaded) saveStoredValue(STORAGE_KEYS.budget, { items, limit });
  }, [items, limit, loaded]);

  const summary = useMemo(() => getBudgetSummary(items, limit), [items, limit]);
  const visible = useMemo(() => filterExpenses(items, { query, category, payment, priority }), [items, query, category, payment, priority]);
  const categoryGroups = useMemo(() => groupExpensesByCategory(items), [items]);
  const upcoming = useMemo(() => getUpcomingPayments(items).slice(0, 4), [items]);

  const setField = (key, value) => setDraft((old) => ({ ...old, [key]: value }));
  const clearDraft = () => { setDraft(BLANK); setEditing(null); };
  const save = () => {
    const errors = validateExpense(draft);
    if (Object.keys(errors).length) return Alert.alert('Please check the form', Object.values(errors).join('\n'));
    const data = { ...draft, estimated: Number(draft.estimated || 0), actual: Number(draft.actual || 0), paid: Number(draft.paid || 0) };
    setItems((old) => editing ? updateExpense(old, editing, data) : addExpense(old, data));
    clearDraft();
  };
  const startEdit = (item) => {
    setEditing(item.id);
    setDraft({ ...item, estimated: String(item.estimated), actual: String(item.actual), paid: String(item.paid) });
  };
  const share = async () => {
    try { await Share.share({ message: exportBudgetReport(items, Number(limit) || 0) }); }
    catch { Alert.alert('Could not share', 'Please try again.'); }
  };
  const confirmDelete = (item) => Alert.alert('Delete expense?', `Remove "${item.title}" from the budget?`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => setItems((old) => removeExpense(old, item.id)) },
  ]);

  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Text style={styles.kicker}>WEDDING WORKSPACE / FINANCES</Text>
    <Text style={styles.title}>Budget planner</Text>
    <Text style={styles.subtitle}>See what you planned, what vendors actually cost, and which payments still need attention.</Text>

    <View style={styles.panel}>
      <Text style={styles.label}>Total wedding budget (₹)</Text>
      <TextInput value={limit} onChangeText={setLimit} keyboardType="decimal-pad" placeholder="Set your budget cap" style={styles.input} />
      <View style={styles.metricGrid}>
        <Metric label="Current spend" value={cash(summary.actual)} />
        <Metric label="Paid so far" value={cash(summary.paid)} />
        <Metric label="Still owed" value={cash(summary.unpaid)} />
        <Metric label="Planned" value={cash(summary.planned)} />
      </View>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.min(100, summary.percentage)}%`, backgroundColor: summary.overBudget ? T.red : T.accent }]} /></View>
      <Text style={summary.overBudget ? styles.errorText : styles.goodText}>
        {summary.limit > 0 ? `${summary.percentage}% of budget used · ${summary.overBudget ? `${cash(-summary.remaining)} over budget` : `${cash(summary.remaining)} remaining`}` : 'Set a budget cap to track how much remains.'}
      </Text>
      <Text style={styles.small}>{summary.fullyPaidCount} of {summary.count} expenses fully paid</Text>
      <Pressable style={styles.secondaryButton} onPress={share}><Text style={styles.secondaryText}>Share full budget report</Text></Pressable>
    </View>

    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{editing ? 'Edit expense' : 'Add an expense'}</Text>
      <TextInput value={draft.title} onChangeText={(v) => setField('title', v)} placeholder="Expense name (e.g. venue deposit)" style={styles.input} />
      <Text style={styles.label}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {BUDGET_CATEGORIES.map((value) => <Chip key={value} label={value} active={draft.category === value} onPress={() => setField('category', value)} />)}
      </ScrollView>
      <View style={styles.twoCol}>
        <Field label="Estimated ₹" value={draft.estimated} onChangeText={(v) => setField('estimated', v)} />
        <Field label="Actual cost ₹" value={draft.actual} onChangeText={(v) => setField('actual', v)} />
      </View>
      <View style={styles.twoCol}>
        <Field label="Paid ₹" value={draft.paid} onChangeText={(v) => setField('paid', v)} />
        <Field label="Due date" value={draft.dueDate} onChangeText={(v) => setField('dueDate', v)} placeholder="YYYY-MM-DD" />
      </View>
      <TextInput value={draft.vendor} onChangeText={(v) => setField('vendor', v)} placeholder="Vendor / company" style={styles.input} />
      <TextInput value={draft.notes} onChangeText={(v) => setField('notes', v)} placeholder="Notes, contract details, or reminders" multiline style={[styles.input, styles.multiline]} />
      <Text style={styles.label}>Priority</Text>
      <View style={styles.chipRow}>{['high', 'medium', 'low'].map((value) => <Chip key={value} label={value} active={draft.priority === value} onPress={() => setField('priority', value)} />)}</View>
      <Pressable onPress={save} style={styles.primaryButton}><Text style={styles.primaryText}>{editing ? 'Save changes' : 'Add expense'}</Text></Pressable>
      {editing ? <Pressable onPress={clearDraft} style={styles.secondaryButton}><Text style={styles.secondaryText}>Cancel editing</Text></Pressable> : null}
    </View>

    {upcoming.length > 0 && <View style={styles.panel}>
      <Text style={styles.panelTitle}>Upcoming payments</Text>
      {upcoming.map((item) => <View key={item.id} style={styles.dueRow}><View style={styles.grow}><Text style={styles.itemTitle}>{item.title}</Text><Text style={styles.small}>{item.vendor || 'Vendor not added'} · due {item.dueDate}</Text></View><Text style={styles.amount}>{cash(Math.max(0, effectiveCost(item) - item.paid))}</Text></View>)}
    </View>}

    <Text style={styles.sectionTitle}>Category breakdown</Text>
    {categoryGroups.length === 0 ? <Text style={styles.empty}>Your category totals will appear after you add expenses.</Text> : categoryGroups.map((group) => <View key={group.category} style={styles.categoryRow}><View style={styles.grow}><Text style={styles.itemTitle}>{group.category}</Text><Text style={styles.small}>{group.count} item(s) · {cash(group.paid)} paid</Text></View><Text style={styles.amount}>{cash(group.actual)}</Text></View>)}

    <Text style={styles.sectionTitle}>All expenses</Text>
    <TextInput value={query} onChangeText={setQuery} placeholder="Search name, notes, or vendor..." style={styles.input} />
    <Text style={styles.label}>Category filter</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>{['All', ...BUDGET_CATEGORIES].map((value) => <Chip key={value} label={value} active={category === value} onPress={() => setCategory(value)} />)}</ScrollView>
    <View style={styles.chipRow}>{[['all', 'All payments'], ['paid', 'Paid'], ['unpaid', 'Unpaid']].map(([value, label]) => <Chip key={value} label={label} active={payment === value} onPress={() => setPayment(value)} />)}</View>
    <View style={styles.chipRow}>{[['all', 'Any priority'], ['high', 'High'], ['medium', 'Medium'], ['low', 'Low']].map(([value, label]) => <Chip key={value} label={label} active={priority === value} onPress={() => setPriority(value)} />)}</View>
    {visible.length === 0 ? <Text style={styles.empty}>No expenses match those filters.</Text> : visible.map((item) => <View key={item.id} style={styles.expenseCard}>
      <View style={styles.grow}><Text style={styles.itemTitle}>{item.title}</Text><Text style={styles.small}>{item.category} · {item.vendor || 'No vendor'} · {item.priority} priority</Text><Text style={styles.amount}>{cash(effectiveCost(item))} <Text style={styles.small}>· paid {cash(item.paid)}</Text></Text>{item.dueDate ? <Text style={styles.small}>Due {item.dueDate}</Text> : null}{item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}</View>
      <View style={styles.actionColumn}><Pressable onPress={() => startEdit(item)}><Text style={styles.link}>Edit</Text></Pressable><Pressable onPress={() => confirmDelete(item)}><Text style={[styles.link, styles.errorText]}>Delete</Text></Pressable></View>
    </View>)}
    <Text style={styles.footnote}>Data is stored on this device. Back up important contracts and receipts independently.</Text>
  </ScrollView></SafeAreaView>;
}

function Metric({ label, value }) { return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>; }
function Field({ label, value, onChangeText, placeholder = '0' }) { return <View style={styles.grow}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChangeText} keyboardType={label.includes('₹') ? 'decimal-pad' : 'default'} placeholder={placeholder} style={styles.input} /></View>; }
function Chip({ label, active, onPress }) { return <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}><Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text></Pressable>; }

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:T.bg},page:{padding:17,paddingBottom:50,gap:12},kicker:{fontSize:10,fontWeight:'800',letterSpacing:1.7,color:T.accent,marginTop:8},title:{fontSize:30,fontWeight:'900',color:T.ink},subtitle:{fontSize:14,lineHeight:21,color:T.muted,marginBottom:4},
  panel:{backgroundColor:T.card,borderRadius:16,borderWidth:1,borderColor:T.line,padding:14,gap:10},panelTitle:{fontSize:18,fontWeight:'800',color:T.ink},label:{fontSize:12,fontWeight:'700',color:T.muted,marginBottom:3},input:{backgroundColor:'#FFFEFC',borderWidth:1,borderColor:T.line,borderRadius:10,paddingHorizontal:12,paddingVertical:11,color:T.ink,fontSize:14},multiline:{minHeight:72,textAlignVertical:'top'},
  metricGrid:{flexDirection:'row',flexWrap:'wrap',gap:8},metric:{width:'48%',flexGrow:1,backgroundColor:T.bg,borderRadius:10,padding:10},metricValue:{fontSize:17,fontWeight:'900',color:T.ink},metricLabel:{fontSize:11,color:T.muted,marginTop:4},progressTrack:{height:8,borderRadius:8,backgroundColor:T.line,overflow:'hidden'},progressFill:{height:8,borderRadius:8},goodText:{fontSize:12,color:T.green,fontWeight:'800'},errorText:{fontSize:12,color:T.red,fontWeight:'800'},small:{fontSize:11,color:T.muted,marginTop:3},
  chipRow:{flexDirection:'row',gap:7,alignItems:'center',paddingVertical:2},chip:{borderWidth:1,borderColor:T.line,borderRadius:20,paddingHorizontal:10,paddingVertical:8,backgroundColor:T.card},chipActive:{backgroundColor:T.accent,borderColor:T.accent},chipLabel:{fontSize:11,fontWeight:'700',color:T.ink},chipLabelActive:{color:'#fff'},
  twoCol:{flexDirection:'row',gap:9},primaryButton:{backgroundColor:T.accent,borderRadius:10,padding:13,alignItems:'center'},primaryText:{color:'#fff',fontWeight:'800'},secondaryButton:{borderWidth:1,borderColor:T.line,borderRadius:10,padding:11,alignItems:'center'},secondaryText:{color:T.accent,fontWeight:'800'},
  sectionTitle:{fontSize:21,fontWeight:'900',color:T.ink,marginTop:8},categoryRow:{flexDirection:'row',alignItems:'center',padding:12,backgroundColor:T.card,borderRadius:11,borderWidth:1,borderColor:T.line},dueRow:{flexDirection:'row',alignItems:'center',paddingVertical:7,borderBottomWidth:1,borderBottomColor:T.line},grow:{flex:1},itemTitle:{fontSize:14,fontWeight:'800',color:T.ink},amount:{fontSize:14,fontWeight:'900',color:T.accent},expenseCard:{flexDirection:'row',gap:12,backgroundColor:T.card,borderRadius:13,borderWidth:1,borderColor:T.line,padding:12},actionColumn:{gap:12,alignItems:'flex-end'},link:{fontSize:12,fontWeight:'800',color:T.accent},notes:{fontSize:12,color:T.muted,marginTop:6},empty:{padding:16,color:T.muted,textAlign:'center',backgroundColor:T.card,borderRadius:12},footnote:{fontSize:11,color:T.muted,lineHeight:17,marginTop:8},
});
