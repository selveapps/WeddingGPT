import React,{useEffect,useMemo,useState} from 'react';
import {Alert,Share,View} from 'react-native';
import {KEYS,readValue,writeValue,makeId,money} from '@/features/featurePack5/storage';
import {Page,Card,Field,Button,Metrics,Entry} from '@/features/featurePack5/FeatureUI';
import {normalizeGift,upsertGift,filterGifts,summarizeGifts,exportGifts,GIFT_STATUSES} from '@/features/featurePack5/giftModel';
const blank={name:'',category:'Home',storeUrl:'',requestedBy:'',contributor:'',estimated:'',actual:'',status:'Idea',notes:''};
export default function GiftRegistryScreen(){
 const[items,setItems]=useState([]),[loaded,setLoaded]=useState(false),[draft,setDraft]=useState(blank),[editing,setEditing]=useState(''),[query,setQuery]=useState(''),[filter,setFilter]=useState('All');
 useEffect(()=>{let ok=true;readValue(KEYS.gifts,[]).then(v=>{if(ok){setItems(Array.isArray(v)?v:[]);setLoaded(true)}});return()=>{ok=false}},[]);useEffect(()=>{if(loaded)writeValue(KEYS.gifts,items)},[items,loaded]);
 const summary=useMemo(()=>summarizeGifts(items),[items]),visible=useMemo(()=>filterGifts(items,query,filter),[items,query,filter]);
 const set=(k,v)=>setDraft(d=>({...d,[k]:v})),reset=()=>{setDraft(blank);setEditing('')};
 function save(){if(!draft.name.trim())return Alert.alert('Gift name required','Enter a gift name before saving.');setItems(old=>upsertGift(old,normalizeGift({...draft,id:editing||makeId('gift')})));reset()}
 async function share(){try{await Share.share({message:exportGifts(visible)})}catch{Alert.alert('Share unavailable','Please try again.')}}
 function remove(item){Alert.alert('Delete gift?',`${item.name} will be removed.`,[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:()=>setItems(old=>old.filter(x=>x.id!==item.id))}])}
 return <Page title="Gift registry" subtitle="Track gift ideas, purchase links, contributors, spend and thank-you progress.">
 <Metrics items={[{label:'Items',value:summary.total},{label:'Received',value:summary.received},{label:'Thanked',value:summary.thanked},{label:'Estimate',value:money(summary.estimated)},{label:'Actual',value:money(summary.actual)}]}/>
 <Card title={editing?'Edit gift':'Add a gift'}><Field label="Gift name *" value={draft.name} onChangeText={v=>set('name',v)}/><Field label="Category" value={draft.category} onChangeText={v=>set('category',v)}/><Field label="Product URL" value={draft.storeUrl} onChangeText={v=>set('storeUrl',v)} keyboardType="url"/><Field label="Requested by" value={draft.requestedBy} onChangeText={v=>set('requestedBy',v)}/><Field label="Contributor / giver" value={draft.contributor} onChangeText={v=>set('contributor',v)}/><View style={{flexDirection:'row',gap:8}}><View style={{flex:1}}><Field label="Estimated ₹" value={draft.estimated} onChangeText={v=>set('estimated',v)} keyboardType="numeric"/></View><View style={{flex:1}}><Field label="Actual ₹" value={draft.actual} onChangeText={v=>set('actual',v)} keyboardType="numeric"/></View></View><Field label="Status" value={draft.status} onChangeText={v=>set('status',v)} placeholder={GIFT_STATUSES.join(' / ')}/><Field label="Notes / thank-you details" value={draft.notes} onChangeText={v=>set('notes',v)} multiline/><View style={{flexDirection:'row',gap:8}}><Button label={editing?'Save changes':'Add gift'} onPress={save}/>{editing?<Button label="Cancel" soft onPress={reset}/>:null}</View></Card>
 <Card title={`Registry (${visible.length})`}><Field label="Search" value={query} onChangeText={setQuery}/><Field label="Status filter (or All)" value={filter} onChangeText={setFilter}/><Button label="Share registry" onPress={share}/>
 {visible.map(item=><Entry key={item.id} title={item.name} subtitle={`${item.category} · Estimate ${money(item.estimated)} · Actual ${money(item.actual)} · ${item.contributor||'No contributor'}`} body={`${item.storeUrl}${item.notes?'\n'+item.notes:''}`} status={item.status} actions={<><Button label="Edit" soft onPress={()=>{setDraft({...blank,...item});setEditing(item.id)}}/><Button label="Delete" soft onPress={()=>remove(item)}/></>}/>)}
 </Card></Page>
}
