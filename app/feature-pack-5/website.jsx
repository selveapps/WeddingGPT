import React,{useEffect,useMemo,useState} from 'react';
import {Alert,Share,Text,View} from 'react-native';
import {KEYS,readValue,writeValue,makeId} from '@/features/featurePack5/storage';
import {Page,Card,Field,Button,Metrics} from '@/features/featurePack5/FeatureUI';
import {DEFAULT_SECTIONS,normalizeSections,websiteProgress,websiteCopy} from '@/features/featurePack5/websiteModel';
const blankMeta={title:'Our Wedding',coupleNames:'',date:'',city:''};
export default function WeddingWebsiteStudioScreen(){
 const[sections,setSections]=useState(DEFAULT_SECTIONS),[meta,setMeta]=useState(blankMeta),[loaded,setLoaded]=useState(false),[active,setActive]=useState('welcome');
 useEffect(()=>{let ok=true;Promise.all([readValue(KEYS.website,DEFAULT_SECTIONS),readValue(KEYS.websiteMeta,blankMeta)]).then(([a,b])=>{if(ok){setSections(normalizeSections(a));setMeta({...blankMeta,...b});setLoaded(true)}});return()=>{ok=false}},[]);
 useEffect(()=>{if(loaded){writeValue(KEYS.website,sections);writeValue(KEYS.websiteMeta,meta)}},[sections,meta,loaded]);
 const progress=useMemo(()=>websiteProgress(sections),[sections]),preview=useMemo(()=>websiteCopy(meta,sections),[meta,sections]),current=sections.find(x=>x.id===active)||sections[0];
 const setMetaField=(k,v)=>setMeta(m=>({...m,[k]:v})),update=(id,k,v)=>setSections(s=>s.map(x=>x.id===id?{...x,[k]:v}:x));
 function add(){const id=makeId('section');setSections(s=>[...s,{id,title:'New section',body:''}]);setActive(id)}
 function remove(){if(sections.length<=1)return Alert.alert('Keep one section','The page needs at least one content section.');Alert.alert('Remove section?',current.title,[{text:'Cancel',style:'cancel'},{text:'Remove',style:'destructive',onPress:()=>{setSections(s=>s.filter(x=>x.id!==current.id));setActive(sections.find(x=>x.id!==current.id)?.id||'welcome')}}])}
 async function share(){try{await Share.share({message:preview})}catch{Alert.alert('Share unavailable','Please try again.')}}
 return <Page title="Wedding website studio" subtitle="Write and preview the guest-facing copy for your wedding page. This creates content, not a hosted website.">
 <Metrics items={[{label:'Sections filled',value:`${progress.complete}/${progress.total}`},{label:'Content progress',value:`${progress.percent}%`}]}/>
 <Card title="Page details"><Field label="Page title" value={meta.title} onChangeText={v=>setMetaField('title',v)}/><Field label="Couple names" value={meta.coupleNames} onChangeText={v=>setMetaField('coupleNames',v)}/><Field label="Wedding date" value={meta.date} onChangeText={v=>setMetaField('date',v)}/><Field label="City / destination" value={meta.city} onChangeText={v=>setMetaField('city',v)}/></Card>
 <Card title="Edit sections"><View style={{flexDirection:'row',flexWrap:'wrap',gap:7,marginBottom:12}}>{sections.map(s=><Button key={s.id} label={s.title||'Untitled'} soft onPress={()=>setActive(s.id)}/>)}</View>{current?<><Field label="Section heading" value={current.title} onChangeText={v=>update(current.id,'title',v)}/><Field label="Section copy" value={current.body} onChangeText={v=>update(current.id,'body',v)} multiline/><View style={{flexDirection:'row',gap:8}}><Button label="Add section" onPress={add}/><Button label="Remove section" soft onPress={remove}/></View></>:null}</Card>
 <Card title="Guest-facing preview"><View style={{backgroundColor:'#FAF6F1',padding:15,borderRadius:13,borderWidth:1,borderColor:'#E7DDD5'}}><Text style={{fontSize:24,fontWeight:'800',color:'#292421'}}>{meta.title||'Our Wedding'}</Text>{meta.coupleNames?<Text style={{fontSize:16,color:'#8B5948',marginTop:6}}>{meta.coupleNames}</Text>:null}<Text style={{fontSize:12,color:'#7B716A',marginTop:5}}>{[meta.date,meta.city].filter(Boolean).join(' · ')}</Text>{sections.map(s=><View key={s.id} style={{marginTop:16}}><Text style={{fontSize:12,fontWeight:'900',letterSpacing:1,color:'#8B5948'}}>{s.title.toUpperCase()}</Text><Text style={{fontSize:13,lineHeight:20,color:'#4F4741',marginTop:5}}>{s.body||'Add content to this section.'}</Text></View>)}</View><View style={{marginTop:12}}><Button label="Share website copy" onPress={share}/></View></Card>
 </Page>
}
