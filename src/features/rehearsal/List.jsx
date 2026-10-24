import React,{useCallback} from 'react';
import {View,Text,FlatList,StyleSheet,Pressable} from 'react-native';
export default function List({items=[],onPressItem,emptyMessage='Nothing here yet.',style}){
  const renderItem=useCallback(({item})=>{
    const title=item.title||item.name||item.label||'Untitled';
    const subtitle=item.subtitle||item.description||item.notes||'';
    return(<Pressable onPress={()=>onPressItem?.(item)} style={({pressed})=>[styles.row,pressed&&styles.p]}><View style={styles.b}><Text style={styles.t} numberOfLines={1}>{title}</Text>{subtitle?<Text style={styles.s} numberOfLines={2}>{subtitle}</Text>:null}</View></Pressable>);
  },[onPressItem]);
  if(!items.length)return(<View style={[styles.e,style]}><Text style={styles.et}>{emptyMessage}</Text></View>);
  return(<FlatList data={items} keyExtractor={i=>i.id} renderItem={renderItem} contentContainerStyle={style} ItemSeparatorComponent={()=><View style={styles.sep}/>}/>);
}
const styles=StyleSheet.create({row:{flexDirection:'row',paddingVertical:14,paddingHorizontal:16,backgroundColor:'#FFF'},p:{backgroundColor:'#F8F4F2'},b:{flex:1},t:{fontSize:16,fontWeight:'600',color:'#1A1A1A'},s:{fontSize:13,color:'#6B5E5A',marginTop:2},sep:{height:1,backgroundColor:'#F0EBE8',marginLeft:16},e:{padding:32,alignItems:'center'},et:{fontSize:15,color:'#8A7E7A',textAlign:'center'}});
