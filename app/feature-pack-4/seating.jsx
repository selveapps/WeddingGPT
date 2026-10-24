import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STORAGE_KEYS, loadStoredValue, saveStoredValue } from '@/features/featurePack4/storage';
import { normalizeGuest, RSVP_STATUSES } from '@/features/featurePack4/guestModel';
import { addTable, assignGuest, exportSeatingPlan, getSeatingSummary, normalizeTable, removeTable, unassignGuest, updateTable, validateSeating } from '@/features/featurePack4/seatingModel';

const T = { bg:'#F6F2EE', card:'#FFF', ink:'#282320', muted:'#7C716A', accent:'#875541', line:'#E7DDD5', green:'#327356', red:'#A83D34' };

export default function SeatingPlannerScreen() {
  const [tables, setTables] = useState([]);
  const [guests, setGuests] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [tableName, setTableName] = useState('');
  const [capacity, setCapacity] = useState('8');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const [selectedTable, setSelectedTable] = useState('All');
  useEffect(() => {
    let active = true;
    Promise.all([loadStoredValue(STORAGE_KEYS.seating, []), loadStoredValue(STORAGE_KEYS.guests, [])]).then(([savedTables, savedGuests]) => {
      if (!active) return;
      setTables(Array.isArray(savedTables) ? savedTables : []);
      setGuests(Array.isArray(savedGuests) ? savedGuests : []);
      setLoaded(true);
    });
    return () => { active = false; };
  }, []);
  useEffect(() => { if (loaded) saveStoredValue(STORAGE_KEYS.seating, tables); }, [tables, loaded]);
  useEffect(() => { if (loaded) saveStoredValue(STORAGE_KEYS.guests, guests); }, [guests, loaded]);

  const summary = useMemo(() => getSeatingSummary(tables, guests), [tables, guests]);
  const guestMap = useMemo(() => new Map(guests.map((raw) => { const guest = normalizeGuest(raw); return [guest.id, guest]; })), [guests]);
  const eligible = useMemo(() => guests.map(normalizeGuest).filter((guest) => guest.rsvp !== 'Declined'), [guests]);
  const unassigned = useMemo(() => eligible.filter((guest) => !tables.some((table) => table.guestIds.includes(guest.id))), [eligible, tables]);
  const validation = useMemo(() => validateSeating(tables, guests), [tables, guests]);
  const filteredUnassigned = unassigned.filter((guest) => {
    const q = query.trim().toLowerCase();
    return (!q || `${guest.name} ${guest.group} ${guest.email}`.toLowerCase().includes(q)) && (status === 'All' || guest.rsvp === status);
  });

  const createTable = () => {
    if (!tableName.trim()) return Alert.alert('Table name required', 'Enter a name or number for this table.');
    const size = Number(capacity);
    if (!Number.isInteger(size) || size < 1 || size > 30) return Alert.alert('Invalid capacity', 'Capacity must be a whole number between 1 and 30.');
    setTables((old) => addTable(old, { name: tableName, capacity: size, location, notes }));
    setTableName(''); setCapacity('8'); setLocation(''); setNotes('');
  };
  const seat = (guest, table) => {
    const result = assignGuest(tables, guests, guest.id, table.id);
    if (result.error) return Alert.alert('Cannot assign guest', result.error);
    setTables(result.tables); setGuests(result.guests);
  };
  const unseat = (guest) => {
    const result = unassignGuest(tables, guests, guest.id);
    setTables(result.tables); setGuests(result.guests);
  };
  const deleteTable = (table) => Alert.alert('Delete table?', `${table.name} will be removed. Guests will become unassigned.`, [
    { text:'Cancel', style:'cancel' },
    { text:'Delete', style:'destructive', onPress:() => {
      const removedIds = new Set(table.guestIds);
      setTables((old) => removeTable(old, table.id));
      setGuests((old) => old.map((guest) => removedIds.has(guest.id) ? { ...guest, tableId:'' } : guest));
    } },
  ]);
  const renameTable = (table) => Alert.prompt
    ? Alert.prompt('Rename table', 'Enter a new table name', (name) => { if (name?.trim()) setTables((old) => updateTable(old, table.id, { name: name.trim() })); }, 'plain-text', table.name)
    : Alert.alert('Rename table', 'Use the table editor in your app to rename this table on Android.');
  const share = async () => { try { await Share.share({ message: exportSeatingPlan(tables, guests) }); } catch { Alert.alert('Share unavailable', 'Please try again.'); } };

  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Text style={styles.kicker}>WEDDING WORKSPACE / RECEPTION</Text><Text style={styles.title}>Seating planner</Text>
    <Text style={styles.subtitle}>Create tables, check capacity, and assign guests without double-booking seats.</Text>
    <View style={styles.stats}>
      <Metric label="Tables" value={summary.tableCount} /><Metric label="Seat capacity" value={summary.capacity} /><Metric label="Occupied" value={summary.occupied} /><Metric label="Unassigned" value={summary.unassignedCount} />
    </View>
    <View style={styles.panel}><Text style={styles.panelTitle}>Create a table</Text>
      <TextInput value={tableName} onChangeText={setTableName} placeholder="Table name (e.g. Family A)" style={styles.input} />
      <View style={styles.twoCol}><View style={styles.grow}><Text style={styles.label}>Seat capacity</Text><TextInput value={capacity} onChangeText={setCapacity} keyboardType="number-pad" style={styles.input} /></View><View style={styles.grow}><Text style={styles.label}>Location / zone</Text><TextInput value={location} onChangeText={setLocation} placeholder="Near stage" style={styles.input} /></View></View>
      <TextInput value={notes} onChangeText={setNotes} placeholder="Accessibility, family grouping, notes..." style={styles.input} />
      <Pressable style={styles.primary} onPress={createTable}><Text style={styles.primaryText}>Add table</Text></Pressable>
    </View>
    {validation.length > 0 ? <View style={styles.warning}><Text style={styles.warningTitle}>Review seating</Text>{validation.map((error, index) => <Text key={`${error}-${index}`} style={styles.warningText}>• {error}</Text>)}</View> : <View style={styles.success}><Text style={styles.successText}>No duplicate assignments or capacity problems detected.</Text></View>}
    <View style={styles.inlineHeader}><Text style={styles.section}>Tables</Text><Pressable onPress={share}><Text style={styles.link}>Share plan</Text></Pressable></View>
    {tables.length === 0 ? <Text style={styles.empty}>Create your first table above, then assign confirmed or pending guests.</Text> : tables.map((raw) => {
      const table = normalizeTable(raw);
      const assigned = table.guestIds.map((id) => guestMap.get(id)).filter(Boolean);
      const full = assigned.length >= table.capacity;
      return <View key={table.id} style={styles.tableCard}>
        <View style={styles.tableHeader}><View style={styles.grow}><Text style={styles.tableName}>{table.name}</Text><Text style={styles.meta}>{assigned.length}/{table.capacity} seats used{table.location ? ` · ${table.location}` : ''}</Text></View><Text style={[styles.capacity, full && styles.red]}>{full ? 'FULL' : `${table.capacity - assigned.length} LEFT`}</Text></View>
        <View style={styles.track}><View style={[styles.fill, { width:`${Math.min(100, assigned.length / table.capacity * 100)}%`, backgroundColor:full ? T.red : T.accent }]} /></View>
        {table.notes ? <Text style={styles.meta}>{table.notes}</Text> : null}
        {assigned.length ? assigned.map((guest) => <View key={guest.id} style={styles.seatedRow}><View style={styles.grow}><Text style={styles.guestName}>{guest.name}</Text><Text style={styles.meta}>{guest.group} · {guest.rsvp}</Text></View><Pressable onPress={() => unseat(guest)}><Text style={styles.link}>Unassign</Text></Pressable></View>) : <Text style={styles.emptySmall}>No guests assigned yet.</Text>}
        <Text style={styles.label}>Assign an unseated guest</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.guestChips}>
          {unassigned.slice(0, 30).map((guest) => <Pressable key={guest.id} disabled={full} onPress={() => seat(guest, table)} style={[styles.guestChip, full && styles.disabled]}><Text style={styles.guestChipText}>{guest.name}</Text></Pressable>)}
        </ScrollView>
        <View style={styles.actions}><Pressable onPress={() => renameTable(table)}><Text style={styles.link}>Rename</Text></Pressable><Pressable onPress={() => deleteTable(table)}><Text style={styles.delete}>Delete table</Text></Pressable></View>
      </View>;
    })}
    <Text style={styles.section}>Unassigned guests</Text>
    <TextInput value={query} onChangeText={setQuery} placeholder="Search unassigned guests..." style={styles.input} />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.guestChips}>{['All', ...RSVP_STATUSES.filter((x) => x !== 'Declined')].map((x) => <Chip key={x} label={x} active={status === x} onPress={() => setStatus(x)} />)}</ScrollView>
    {filteredUnassigned.length === 0 ? <Text style={styles.empty}>No guests need a table right now.</Text> : filteredUnassigned.map((guest) => <View key={guest.id} style={styles.unassignedRow}><View style={styles.grow}><Text style={styles.guestName}>{guest.name}</Text><Text style={styles.meta}>{guest.group} · {guest.rsvp}</Text></View><Text style={styles.meta}>Not seated</Text></View>)}
    <Text style={styles.footnote}>This is a list-based planner, not a visual floor-plan editor. Keep an offline copy of your final seating chart for venue staff.</Text>
  </ScrollView></SafeAreaView>;
}
function Metric({ label, value }) { return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>; }
function Chip({ label, active, onPress }) { return <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}><Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text></Pressable>; }
const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:T.bg},page:{padding:17,paddingBottom:50,gap:11},kicker:{fontSize:10,fontWeight:'800',letterSpacing:1.7,color:T.accent,marginTop:8},title:{fontSize:29,fontWeight:'900',color:T.ink},subtitle:{fontSize:14,lineHeight:21,color:T.muted},stats:{flexDirection:'row',flexWrap:'wrap',gap:8},metric:{flexGrow:1,width:'47%',padding:12,backgroundColor:T.card,borderWidth:1,borderColor:T.line,borderRadius:12},metricValue:{fontSize:22,fontWeight:'900',color:T.ink},metricLabel:{fontSize:11,color:T.muted,marginTop:4},
  panel:{backgroundColor:T.card,borderRadius:15,padding:14,borderWidth:1,borderColor:T.line,gap:10},panelTitle:{fontSize:18,fontWeight:'900',color:T.ink},label:{fontSize:12,fontWeight:'800',color:T.muted,marginTop:5},input:{backgroundColor:'#FFFEFC',borderWidth:1,borderColor:T.line,borderRadius:10,padding:11,color:T.ink,fontSize:14},twoCol:{flexDirection:'row',gap:8},grow:{flex:1},primary:{backgroundColor:T.accent,borderRadius:10,padding:13,alignItems:'center'},primaryText:{color:'#fff',fontWeight:'900'},
  warning:{backgroundColor:'#F8E5E2',padding:13,borderRadius:12,gap:5},warningTitle:{fontSize:14,fontWeight:'900',color:T.red},warningText:{fontSize:12,color:T.red},success:{backgroundColor:'#E0EFE6',padding:12,borderRadius:12},successText:{fontSize:12,fontWeight:'800',color:T.green},inlineHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:7},section:{fontSize:21,fontWeight:'900',color:T.ink},link:{fontSize:12,fontWeight:'900',color:T.accent},
  tableCard:{backgroundColor:T.card,borderWidth:1,borderColor:T.line,borderRadius:14,padding:13,gap:10},tableHeader:{flexDirection:'row',alignItems:'center',gap:10},tableName:{fontSize:17,fontWeight:'900',color:T.ink},meta:{fontSize:11,color:T.muted,marginTop:3},capacity:{fontSize:10,fontWeight:'900',color:T.green},red:{color:T.red},track:{height:7,borderRadius:7,backgroundColor:T.line,overflow:'hidden'},fill:{height:7,borderRadius:7},seatedRow:{flexDirection:'row',alignItems:'center',paddingVertical:8,borderBottomWidth:1,borderBottomColor:T.line},guestName:{fontSize:13,fontWeight:'800',color:T.ink},emptySmall:{fontSize:11,color:T.muted,paddingVertical:6},guestChips:{flexDirection:'row',gap:6,paddingVertical:3},guestChip:{backgroundColor:'#F0E8E2',paddingHorizontal:9,paddingVertical:7,borderRadius:16},guestChipText:{fontSize:11,fontWeight:'700',color:T.ink},disabled:{opacity:0.4},actions:{flexDirection:'row',justifyContent:'flex-end',gap:16,paddingTop:3},delete:{fontSize:12,fontWeight:'900',color:T.red},chip:{paddingHorizontal:10,paddingVertical:8,borderRadius:18,borderWidth:1,borderColor:T.line,backgroundColor:T.card},chipActive:{backgroundColor:T.accent,borderColor:T.accent},chipText:{fontSize:11,fontWeight:'700',color:T.ink},chipTextActive:{color:'#fff'},unassignedRow:{flexDirection:'row',alignItems:'center',padding:12,backgroundColor:T.card,borderRadius:10,borderWidth:1,borderColor:T.line},empty:{padding:17,textAlign:'center',color:T.muted,backgroundColor:T.card,borderRadius:12},footnote:{fontSize:11,color:T.muted,lineHeight:17,marginTop:7},
});
