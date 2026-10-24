import React from 'react';
import {View,Text,StyleSheet,Pressable} from 'react-native';
export default function EmptyState({title='Nothing here yet',description='Add your first item.',ctaLabel='Add',onCta,emoji='✨'}){
  return(<View style={styles.w}><Text style={styles.e}>{emoji}</Text><Text style={styles.t}>{title}</Text><Text style={styles.d}>{description}</Text>
  {onCta?<Pressable onPress={onCta} style={({pressed})=>[styles.c,pressed&&{opacity:0.9}]}><Text style={styles.ct}>{ctaLabel}</Text></Pressable>:null}</View>);
}
const styles=StyleSheet.create({w:{flex:1,alignItems:'center',justifyContent:'center',padding:32},e:{fontSize:48,marginBottom:16},t:{fontSize:20,fontWeight:'700',color:'#1A1A1A',textAlign:'center',marginBottom:8},d:{fontSize:15,color:'#6B5E5A',textAlign:'center',lineHeight:22,marginBottom:24},c:{backgroundColor:'#C93862',paddingHorizontal:24,paddingVertical:12,borderRadius:999},ct:{color:'#FFF',fontSize:16,fontWeight:'600'}});
