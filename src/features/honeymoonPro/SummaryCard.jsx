import React from 'react';
import {View,Text,StyleSheet,Pressable} from 'react-native';
export default function SummaryCard({title='Summary',metric,metricLabel,secondary=[],onPress,tone='default',style}){
  const body=(<View style={[styles.card,style]}><Text style={styles.title}>{title}</Text>
  {metric!=null&&<View style={styles.mr}><Text style={styles.m}>{String(metric)}</Text>{metricLabel?<Text style={styles.ml}>{metricLabel}</Text>:null}</View>}
  {secondary.length>0&&<View style={styles.sr}>{secondary.map((s,i)=><View key={i} style={styles.si}><Text style={styles.sv}>{s.value}</Text><Text style={styles.sl}>{s.label}</Text></View>)}</View>}
  </View>);
  return onPress?<Pressable onPress={onPress} style={({pressed})=>pressed&&{opacity:0.85}}>{body}</Pressable>:body;
}
const styles=StyleSheet.create({card:{backgroundColor:'#FFF',borderRadius:16,padding:16,borderWidth:1,borderColor:'#EDE6E3'},title:{fontSize:13,fontWeight:'600',color:'#6B5E5A',textTransform:'uppercase',marginBottom:8},mr:{flexDirection:'row',alignItems:'baseline',gap:8,marginBottom:12},m:{fontSize:28,fontWeight:'700',color:'#1A1A1A'},ml:{fontSize:14,color:'#6B5E5A'},sr:{flexDirection:'row',flexWrap:'wrap',gap:16},si:{minWidth:64},sv:{fontSize:16,fontWeight:'600'},sl:{fontSize:12,color:'#8A7E7A',marginTop:2}});
