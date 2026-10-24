import React,{useMemo,useCallback} from 'react';
import {View,Text,StyleSheet,ScrollView,Pressable,SafeAreaView} from 'react-native';
import {Stack} from 'expo-router';
const DEMO=[{id:'1',title:'Sample one',subtitle:'Wire to store'},{id:'2',title:'Sample two',subtitle:'Coming soon'},{id:'3',title:'Sample three',subtitle:'Live data next'}];
export default function Screen(){
  const stats=useMemo(()=>({total:DEMO.length,ready:2,pending:1}),[]);
  const onAdd=useCallback(()=>console.log('[rehearsal] add'),[]);
  const onOpen=useCallback((item)=>console.log('[rehearsal]',item.id),[]);
  return(<SafeAreaView style={{flex:1,backgroundColor:'#FAF7F5'}}>
    <Stack.Screen options={{title:'Rehearsal Dinner Planner',headerRight:()=>(<Pressable onPress={onAdd} hitSlop={12}><Text style={{color:'#C93862',fontWeight:'600',marginRight:8}}>Add</Text></Pressable>)}}/>
    <ScrollView contentContainerStyle={{padding:20,paddingBottom:48}}>
      <Text style={{fontSize:36,marginBottom:8}}>🍷</Text>
      <Text style={{fontSize:26,fontWeight:'700',color:'#1A1A1A',marginBottom:8}}>Rehearsal Dinner Planner</Text>
      <Text style={{fontSize:15,color:'#6B5E5A',lineHeight:22,marginBottom:24}}>New WeddingGPT module. Connect useRehearsalStore and replace demo data.</Text>
      <View style={{flexDirection:'row',gap:12,marginBottom:28}}>
        {['Total','Ready','Pending'].map((lab,i)=>(<View key={lab} style={{flex:1,backgroundColor:'#FFF',borderRadius:14,padding:14,borderWidth:1,borderColor:'#EDE6E3',alignItems:'center'}}><Text style={{fontSize:22,fontWeight:'700',color:'#C93862'}}>{[stats.total,stats.ready,stats.pending][i]}</Text><Text style={{fontSize:12,color:'#8A7E7A',marginTop:4}}>{lab}</Text></View>))}
      </View>
      <Text style={{fontSize:13,fontWeight:'600',color:'#6B5E5A',textTransform:'uppercase',marginBottom:12}}>Items</Text>
      {DEMO.map(item=>(<Pressable key={item.id} onPress={()=>onOpen(item)} style={{backgroundColor:'#FFF',borderRadius:14,padding:16,marginBottom:10,borderWidth:1,borderColor:'#EDE6E3'}}><Text style={{fontSize:16,fontWeight:'600'}}>{item.title}</Text><Text style={{fontSize:13,color:'#6B5E5A',marginTop:4}}>{item.subtitle}</Text></Pressable>))}
      <View style={{marginTop:32,padding:16,backgroundColor:'#F0EBE8',borderRadius:12}}><Text style={{fontSize:13,color:'#6B5E5A'}}>Route: /rehearsal · Store: useRehearsalStore</Text></View>
    </ScrollView>
  </SafeAreaView>);
}
