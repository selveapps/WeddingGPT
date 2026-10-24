import React,{useEffect,useMemo,useState} from 'react';
import {Alert,Share,View} from 'react-native';
import {KEYS,readValue,writeValue,makeId,money} from '@/features/featurePack5/storage';
import {Page,Card,Field,Button,Metrics,Entry} from '@/features/featurePack5/FeatureUI';
import {normalizeVendor,upsertVendor,filterVendors,summarizeVendors,exportVendors,VENDOR_STATUSES} from '@/features/featurePack5/vendorModel';
const blank={name:'',category:'Venue',contact:'',phone:'',email:'',website:'',quote:'',paid:'',status:'Researching',rating:'',notes:''};
export default function VendorCRMScreen(){
 const[items,setItems]=useState([]),[loaded,setLoaded]=useState(false),[draft,setDraft]=useState(blank),[editing,setEditing]=useState(''),[query,setQuery]=useState(''),[category,setCategory]=useState('All'),[status,setStatus]=useState('All');
 useEffect(()=>{let ok=true;readValue(KEYS.vendors,[]).then(v=>{if(ok){setItems(Array.isArray(v)?v:[]);setLoaded(true)}});return()=>{ok=false}},[]);
 useEffect(()=>{if(loaded)writeValue(KEYS.vendors,items)},[items,loaded]);
 const summary=useMemo(()=>summarizeVendors(items),[items]),visible=useMemo(()=>filterVendors(items,query,category,status),[items,query,category,status]);
 const set=(k,v)=>setDraft(d=>({...d,[k]:v})),reset=()=>{setDraft(blank);setEditing('')};
 function save(){if(!draft.name.trim())return Alert.alert('Vendor name required','Enter a business name first.');setItems(old=>upsertVendor(old,normalizeVendor({...draft,id:editing||makeId('vendor')})));reset()}
 function remove(item){Alert.alert('Delete vendor?',`${item.name} will be removed.`,[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:()=>setItems(old=>old.filter(x=>x.id!==item.id))}])}
 async function share(){try{await Share.share({message:exportVendors(visible)})}catch{Alert.alert('Share unavailable','Please try again.')}}
 return <Page title="Vendor CRM" subtitle="Manage supplier contacts, quotes, payment progress and booking decisions.">
 <Metrics items={[{label:'Vendors',value:summary.total},{label:'Booked',value:summary.booked},{label:'Shortlisted',value:summary.shortlisted},{label:'Quotes',value:money(summary.quotes)},{label:'Paid',value:money(summary.paid)}]}/>
 <Card title={editing?'Edit vendor':'Add a vendor'}>
 {['name','category','contact','phone','email','website'].map((k)=><Field key={k} label={`${k==='name'?'Vendor name *':k[0].toUpperCase()+k.slice(1)}`} value={draft[k]} onChangeText={v=>set(k,v)}/> )}
 <View style={{flexDirection:'row',gap:8}}><View style={{flex:1}}><Field label="Quote ₹" value={draft.quote} onChangeText={v=>set('quote',v)} keyboardType="numeric"/></View><View style={{flex:1}}><Field label="Paid ₹" value={draft.paid} onChangeText={v=>set('paid',v)} keyboardType="numeric"/></View></View>
 <Field label="Status" value={draft.status} onChangeText={v=>set('status',v)} placeholder={VENDOR_STATUSES.join(' / ')}/><Field label="Rating 0–5" value={draft.rating} onChangeText={v=>set('rating',v)} keyboardType="numeric"/><Field label="Notes / contract questions" value={draft.notes} onChangeText={v=>set('notes',v)} multiline/>
 <View style={{flexDirection:'row',gap:8}}><Button label={editing?'Save changes':'Add vendor'} onPress={save}/>{editing?<Button label="Cancel" soft onPress={reset}/>:null}</View></Card>
 <Card title={`Supplier list (${visible.length})`}><Field label="Search" value={query} onChangeText={setQuery}/><Field label="Category filter (or All)" value={category} onChangeText={setCategory}/><Field label="Status filter (or All)" value={status} onChangeText={setStatus}/><Button label="Share filtered shortlist" onPress={share}/>
 {visible.map(item=><Entry key={item.id} title={item.name} subtitle={`${item.category} · ${item.contact||'No contact'} · Quote ${money(item.quote)} · Paid ${money(item.paid)}\n${item.phone} ${item.email}`} body={item.notes} status={item.status} actions={<><Button label="Edit" soft onPress={()=>{setDraft({...blank,...item});setEditing(item.id)}}/><Button label="Delete" soft onPress={()=>remove(item)}/></>}/>)}
 </Card></Page>
}
