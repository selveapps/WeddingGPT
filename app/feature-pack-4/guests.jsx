import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STORAGE_KEYS, loadStoredValue, saveStoredValue } from '@/features/featurePack4/storage';
import { addGuest, exportGuestReport, filterGuests, GUEST_GROUPS, MEAL_OPTIONS, normalizeGuest, removeGuest, RSVP_STATUSES, summarizeGuests, updateGuest, validateGuest } from '@/features/featurePack4/guestModel';

const T = { bg:'#F6F2EE', card:'#FFF', ink:'#282320', muted:'#7C716A', accent:'#875541', line:'#E7DDD5', green:'#327356', red:'#A83D34' };
const BLANK = { name:'', group:'Bride side', side:'', rsvp:'Pending', plusOne:false, plusOneName:'', meal:'Not specified', dietaryNotes:'', phone:'', email:'', tableId:'', inviteSent:false, giftReceived:false, notes:'' };

export default function GuestManagerScreen() {
  const [guests, setGuests] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState(BLANK);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');
  const [rsvp, setRsvp] = useState('All');
  const [group, setGroup] = useState('All');
  const [meal, setMeal] = useState('All');
  const [invite, setInvite] = useState('all');
  useEffect(() => {
    let active = true;
    loadStoredValue(STORAGE_KEYS.guests, []).then((data) => { if (active) { setGuests(Array.isArray(data) ? data : []); setLoaded(true); } });
    return () => { active = false; };
  }, []);
  useEffect(() => { if (loaded) saveStoredValue(STORAGE_KEYS.guests, guests); }, [guests, loaded]);
  const summary = useMemo(() => summarizeGuests(guests), [guests]);
  const visible = useMemo(() => filterGuests(guests, { query, rsvp, group, meal, invite }), [guests, query, rsvp, group, meal, invite]);
  const field = (key, value) => setDraft((old) => ({ ...old, [key]: value }));
  const clear = () => { setDraft(BLANK); setEditing(null); };
  const save = () => {
    const errors = validateGuest(draft);
    if (Object.keys(errors).length) return Alert.alert('Check guest details', Object.values(errors).join('\n'));
    setGuests((old) => editing ? updateGuest(old, editing, draft) : addGuest(old, draft));
    clear();
  };
  const edit = (raw) => { const guest = normalizeGuest(raw); setEditing(guest.id); setDraft({ ...guest }); };
  const deleteGuest = (guest) => Alert.alert('Remove guest?', `Remove ${guest.name} from the list?`, [
    { text:'Cancel', style:'cancel' },
    { text:'Remove', style:'destructive', onPress:() => setGuests((old) => removeGuest(old, guest.id)) },
  ]);
  const share = async () => { try { await Share.share({ message: exportGuestReport(guests) }); } catch { Alert.alert('Share unavailable', 'Try again.'); } };
  const toggle = (key) => field(key, !draft[key]);

  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Text style={styles.kicker}>WEDDING WORKSPACE / PEOPLE</Text><Text style={styles.title}>Guest list & RSVPs</Text>
    <Text style={styles.subtitle}>Keep invitations, attendance, plus-ones, meals, and table assignments organized.</Text>
    <View style={styles.summaryGrid}>
      <Metric label="Total invited" value={summary.total} /><Metric label="Confirmed" value={summary.confirmed} /><Metric label="Awaiting reply" value={summary.pending} /><Metric label="Possible seats" value={summary.possibleSeats} />
    </View>
    <View style={styles.panel}><Text style={styles.panelTitle}>{editing ? 'Edit guest' : 'Add guest'}</Text>
      <TextInput value={draft.name} onChangeText={(v) => field('name', v)} placeholder="Full name *" style={styles.input} />
      <Text style={styles.label}>Group</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{GUEST_GROUPS.map((x) => <Chip key={x} label={x} active={draft.group === x} onPress={() => field('group', x)} />)}</ScrollView>
      <TextInput value={draft.side} onChangeText={(v) => field('side', v)} placeholder="Family branch / relationship (optional)" style={styles.input} />
      <Text style={styles.label}>RSVP status</Text><View style={styles.chips}>{RSVP_STATUSES.map((x) => <Chip key={x} label={x} active={draft.rsvp === x} onPress={() => field('rsvp', x)} />)}</View>
      <Toggle label="Allow a plus-one" value={draft.plusOne} onPress={() => toggle('plusOne')} />
      {draft.plusOne ? <TextInput value={draft.plusOneName} onChangeText={(v) => field('plusOneName', v)} placeholder="Plus-one name (optional)" style={styles.input} /> : null}
      <Text style={styles.label}>Meal preference</Text><View style={styles.chips}>{MEAL_OPTIONS.map((x) => <Chip key={x} label={x} active={draft.meal === x} onPress={() => field('meal', x)} />)}</View>
      <TextInput value={draft.dietaryNotes} onChangeText={(v) => field('dietaryNotes', v)} placeholder="Dietary requirements / allergies" style={styles.input} />
      <View style={styles.twoCol}><TextInput value={draft.phone} onChangeText={(v) => field('phone', v)} placeholder="Phone" keyboardType="phone-pad" style={[styles.input, styles.grow]} /><TextInput value={draft.email} onChangeText={(v) => field('email', v)} placeholder="Email" keyboardType="email-address" autoCapitalize="none" style={[styles.input, styles.grow]} /></View>
      <TextInput value={draft.tableId} onChangeText={(v) => field('tableId', v)} placeholder="Table name / number (optional)" style={styles.input} />
      <Toggle label="Invitation sent" value={draft.inviteSent} onPress={() => toggle('inviteSent')} />
      <Toggle label="Gift received" value={draft.giftReceived} onPress={() => toggle('giftReceived')} />
      <TextInput value={draft.notes} onChangeText={(v) => field('notes', v)} placeholder="Private planning notes" multiline style={[styles.input, styles.multiline]} />
      <Pressable style={styles.primary} onPress={save}><Text style={styles.primaryText}>{editing ? 'Save guest' : 'Add guest'}</Text></Pressable>
      {editing ? <Pressable style={styles.secondary} onPress={clear}><Text style={styles.secondaryText}>Cancel editing</Text></Pressable> : null}
    </View>
    <View style={styles.inlineHeader}><Text style={styles.sectionTitle}>Guest directory</Text><Pressable onPress={share}><Text style={styles.link}>Share / export</Text></Pressable></View>
    <TextInput value={query} onChangeText={setQuery} placeholder="Search names, email, phone, notes..." style={styles.input} />
    <Text style={styles.label}>RSVP filter</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{['All', ...RSVP_STATUSES].map((x) => <Chip key={x} label={x} active={rsvp === x} onPress={() => setRsvp(x)} />)}</ScrollView>
    <Text style={styles.label}>Group filter</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{['All', ...GUEST_GROUPS].map((x) => <Chip key={x} label={x} active={group === x} onPress={() => setGroup(x)} />)}</ScrollView>
    <Text style={styles.label}>Meal filter</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{['All', ...MEAL_OPTIONS].map((x) => <Chip key={x} label={x} active={meal === x} onPress={() => setMeal(x)} />)}</ScrollView>
    <View style={styles.chips}>{[['all','All invitations'],['sent','Sent'],['not-sent','Not sent']].map(([x,label]) => <Chip key={x} label={label} active={invite === x} onPress={() => setInvite(x)} />)}</View>
    {visible.length === 0 ? <Text style={styles.empty}>No guests match the current filters.</Text> : visible.map((raw) => {
      const guest = normalizeGuest(raw);
      return <View key={guest.id} style={styles.guestCard}><View style={styles.grow}>
        <Text style={styles.guestName}>{guest.name}</Text><Text style={styles.meta}>{guest.group}{guest.side ? ` · ${guest.side}` : ''}</Text>
        <View style={styles.badges}><Badge label={guest.rsvp} tone={guest.rsvp === 'Confirmed' ? 'green' : guest.rsvp === 'Declined' ? 'red' : 'neutral'} />{guest.plusOne ? <Badge label={`+1${guest.plusOneName ? ` ${guest.plusOneName}` : ''}`} /> : null}<Badge label={guest.meal} /></View>
        {guest.dietaryNotes ? <Text style={styles.meta}>Dietary: {guest.dietaryNotes}</Text> : null}
        {guest.phone ? <Text style={styles.meta}>☎ {guest.phone}</Text> : null}{guest.email ? <Text style={styles.meta}>{guest.email}</Text> : null}
        {guest.tableId ? <Text style={styles.meta}>Table: {guest.tableId}</Text> : null}
        <Text style={styles.meta}>Invite {guest.inviteSent ? 'sent' : 'not sent'} · Gift {guest.giftReceived ? 'received' : 'not recorded'}</Text>
        {guest.notes ? <Text style={styles.notes}>{guest.notes}</Text> : null}
      </View><View style={styles.actions}><Pressable onPress={() => edit(guest)}><Text style={styles.link}>Edit</Text></Pressable><Pressable onPress={() => deleteGuest(guest)}><Text style={styles.delete}>Delete</Text></Pressable></View></View>;
    })}
    <Text style={styles.footnote}>Guest details remain on this device. Be thoughtful about who can access this list because it may contain personal contact details.</Text>
  </ScrollView></SafeAreaView>;
}
function Metric({ label, value }) { return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>; }
function Chip({ label, active, onPress }) { return <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}><Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text></Pressable>; }
function Toggle({ label, value, onPress }) { return <Pressable onPress={onPress} style={styles.toggle}><Text style={styles.toggleLabel}>{label}</Text><Text style={[styles.toggleValue, value && styles.toggleOn]}>{value ? 'YES' : 'NO'}</Text></Pressable>; }
function Badge({ label, tone = 'neutral' }) { return <View style={[styles.badge, tone === 'green' && styles.badgeGreen, tone === 'red' && styles.badgeRed]}><Text style={styles.badgeText}>{label}</Text></View>; }
const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:T.bg},page:{padding:17,paddingBottom:50,gap:11},kicker:{fontSize:10,fontWeight:'800',letterSpacing:1.7,color:T.accent,marginTop:8},title:{fontSize:29,fontWeight:'900',color:T.ink},subtitle:{fontSize:14,lineHeight:21,color:T.muted},
  summaryGrid:{flexDirection:'row',flexWrap:'wrap',gap:8},metric:{flexGrow:1,width:'47%',backgroundColor:T.card,borderRadius:12,padding:12,borderWidth:1,borderColor:T.line},metricValue:{fontSize:23,fontWeight:'900',color:T.ink},metricLabel:{fontSize:11,color:T.muted,marginTop:3},
  panel:{backgroundColor:T.card,borderRadius:15,padding:14,borderWidth:1,borderColor:T.line,gap:10},panelTitle:{fontSize:18,fontWeight:'900',color:T.ink},label:{fontSize:12,fontWeight:'800',color:T.muted,marginTop:2},input:{backgroundColor:'#FFFEFC',borderWidth:1,borderColor:T.line,borderRadius:10,padding:11,color:T.ink,fontSize:14},multiline:{minHeight:70,textAlignVertical:'top'},chips:{flexDirection:'row',gap:7,alignItems:'center',paddingVertical:2},chip:{paddingHorizontal:10,paddingVertical:8,borderRadius:18,borderWidth:1,borderColor:T.line,backgroundColor:T.card},chipActive:{backgroundColor:T.accent,borderColor:T.accent},chipText:{fontSize:11,fontWeight:'700',color:T.ink},chipTextActive:{color:'#fff'},
  twoCol:{flexDirection:'row',gap:8},grow:{flex:1},toggle:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:11,borderWidth:1,borderColor:T.line,borderRadius:10},toggleLabel:{fontSize:13,fontWeight:'700',color:T.ink},toggleValue:{fontSize:11,fontWeight:'900',color:T.muted},toggleOn:{color:T.green},
  primary:{backgroundColor:T.accent,padding:13,borderRadius:10,alignItems:'center'},primaryText:{color:'#fff',fontWeight:'900'},secondary:{borderWidth:1,borderColor:T.line,padding:11,borderRadius:10,alignItems:'center'},secondaryText:{color:T.accent,fontWeight:'800'},
  inlineHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:7},sectionTitle:{fontSize:21,fontWeight:'900',color:T.ink},link:{fontSize:12,fontWeight:'900',color:T.accent},guestCard:{flexDirection:'row',gap:10,backgroundColor:T.card,borderWidth:1,borderColor:T.line,borderRadius:13,padding:12},guestName:{fontSize:16,fontWeight:'900',color:T.ink},meta:{fontSize:11,color:T.muted,marginTop:4},badges:{flexDirection:'row',flexWrap:'wrap',gap:5,marginTop:8},badge:{backgroundColor:'#F0E8E2',paddingHorizontal:7,paddingVertical:5,borderRadius:6},badgeGreen:{backgroundColor:'#DDEDE4'},badgeRed:{backgroundColor:'#F6DFDC'},badgeText:{fontSize:10,fontWeight:'800',color:T.ink},actions:{alignItems:'flex-end',gap:12},delete:{fontSize:12,fontWeight:'900',color:T.red},notes:{fontSize:12,color:T.muted,marginTop:6,lineHeight:17},empty:{textAlign:'center',padding:20,color:T.muted,backgroundColor:T.card,borderRadius:12},footnote:{fontSize:11,lineHeight:17,color:T.muted,marginTop:6},
});
