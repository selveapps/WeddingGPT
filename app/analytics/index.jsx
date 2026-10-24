import React from 'react';
import {SafeAreaView,ScrollView,StyleSheet,Text} from 'react-native';
import {Stack} from 'expo-router';
import {ExtendedSummaryCard,ExtendedEmptyState} from '../../src/features/analytics/extendedIndex';
export default function Screen(){return(<SafeAreaView style={styles.safe}><Stack.Screen options={{title:'Analytics'}}/><ScrollView contentContainerStyle={styles.c}><Text style={{fontSize:36}}>📊</Text><Text style={{fontSize:22,fontWeight:'700',marginVertical:8}}>Analytics</Text><ExtendedSummaryCard title="Analytics" metric={0}/><ExtendedEmptyState/></ScrollView></SafeAreaView>);}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:'#FAF7F5'},c:{padding:20}});
