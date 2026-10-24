import React,{useMemo,useCallback} from 'react';
import {View,Text,StyleSheet,ScrollView,Pressable,SafeAreaView} from 'react-native';
import {Stack} from 'expo-router';
const DEMO=[{id:'1',title:'Sample one',subtitle:'Wire to store'},{id:'2',title:'Sample two',subtitle:'Coming soon'}];
export default function Screen(){
  const stats=useMemo(()=>({total:2,ready:1,pending:1}),[]);
  return(<SafeAreaView style={{flex:1,backgroundColor:'#FAF7F5'}}>
    <Stack.Screen options={{title:'Kids & Family Coordinator'}}/>
    <ScrollView contentContainerStyle={{padding:20}}>
      <Text style={{fontSize:36}}>👶</Text>
      <Text style={{fontSize:26,fontWeight:'700',marginVertical:8}}>Kids & Family Coordinator</Text>
      <Text style={{color:'#6B5E5A',marginBottom:20}}>New module. Store: useKidsCrewStore. Route: /kids-crew</Text>
      {DEMO.map(i=>(<View key={i.id} style={{backgroundColor:'#FFF',padding:16,borderRadius:14,marginBottom:10,borderWidth:1,borderColor:'#EDE6E3'}}><Text style={{fontWeight:'600'}}>{i.title}</Text><Text style={{color:'#6B5E5A',marginTop:4}}>{i.subtitle}</Text></View>))}
    </ScrollView>
  </SafeAreaView>);
}
