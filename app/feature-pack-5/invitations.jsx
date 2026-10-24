import React,{useEffect,useMemo,useState} from 'react';
import {Alert,Share,View} from 'react-native';
import {KEYS,readValue,writeValue,makeId} from '@/features/featurePack5/storage';
import {Page,Card,Field,Button,Metrics,Entry} from '@/features/featurePack5/FeatureUI';
import {normalizeInvitation,upsertInvitation,filterInvitations,summarizeInvitations,buildInvitation,INVITE_STATUSES} from '@/features/featurePack5/invitationModel';
const blank={title:'Wedding invitation',recipient:'',channel:'WhatsApp',status:'Draft',deadline:'',message:'Together with our families, we invite you to celebrate our wedding. We would be delighted to have you with us.',notes:''};
export default function InvitationStudioScreen(){
 const[items,setItems]=useState([]),[loaded,setLoaded]=useState(false),[draft,setDraft]=useState(blank),[editing,setEditing]=useState(''),[query,setQuery]=useState(''),[filter,setFilter]=useState('All');
 useEffect(()=>{let ok=true;readValue(KEYS.invitations,[]).then(v=>{if(ok){setItems(Array.isArray(v)?v:[]);setLoaded(true)}});return()=>{ok=false}},[]);useEffect(()=>{if(loaded)writeValue(KEYS.invitations,items)},[items,loaded]);
 const summary=useMemo(()=>summarizeInvitations(items),[items]),visible=useMemo(()=>filterInvitations(items,query,filter),[items,query,filter]);
 const set=(k,v)=>setDraft(d=>({...d,[k]:v})),reset=()=>{setDraft(blank);setEditing('')};
 function save(){if(!draft.title.trim()||!draft.message.trim())return Alert.alert('Add a title and message','Both fields are required.');setItems(old=>upsertInvitation(old,normalizeInvitation({...draft,id:editing||makeId('invite')})));reset()}
 async function share(item){try{await Share.share({message:buildInvitation(item)})}catch{Alert.alert('Share unavailable','Please try again.')}}
 function remove(item){Alert.alert('Delete draft?',`${item.title} will be removed.`,[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:()=>setItems(old=>old.filter(x=>x.id!==item.id))}])}
 return <Page title="Invitation studio" subtitle="Draft personalised invitation copy and track the sending process and RSVP deadline.">
 <Metrics items={[{label:'Total',value:summary.total},{label:'Drafts',value:summary.drafts},{label:'Sent',value:summary.sent},{label:'Responded',value:summary.responded}]}/>
 <Card title={editing?'Edit invitation':'Create invitation'}>
 <Field label="Draft title *" value={draft.title} onChangeText={v=>set('title',v)}/><Field label="Recipient / group" value={draft.recipient} onChangeText={v=>set('recipient',v)} placeholder="e.g. Friends from college"/><Field label="Channel" value={draft.channel} onChangeText={v=>set('channel',v)} placeholder="WhatsApp / Email / Printed card"/><Field label="Status" value={draft.status} onChangeText={v=>set('status',v)} placeholder={INVITE_STATUSES.join(' / ')}/><Field label="RSVP deadline" value={draft.deadline} onChangeText={v=>set('deadline',v)} placeholder="e.g. 10 Dec 2026"/><Field label="Invitation message *" value={draft.message} onChangeText={v=>set('message',v)} multiline/><Field label="Private tracking notes" value={draft.notes} onChangeText={v=>set('notes',v)} multiline/>
 <View style={{flexDirection:'row',gap:8}}><Button label={editing?'Save changes':'Save draft'} onPress={save}/>{editing?<Button label="Cancel" soft onPress={reset}/>:null}</View></Card>
 <Card title={`Invitation tracker (${visible.length})`}><Field label="Search" value={query} onChangeText={setQuery}/><Field label="Status filter (or All)" value={filter} onChangeText={setFilter}/>
 {visible.map(item=><Entry key={item.id} title={item.title} subtitle={`${item.recipient||'No recipient'} · ${item.channel} · RSVP by ${item.deadline||'not set'}`} body={item.message} status={item.status} actions={<><Button label="Share draft" soft onPress={()=>share(item)}/><Button label="Edit" soft onPress={()=>{setDraft({...blank,...item});setEditing(item.id)}}/><Button label="Delete" soft onPress={()=>remove(item)}/></>}/>)}
 </Card></Page>
}
