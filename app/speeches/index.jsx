import React from 'react';
import {SafeAreaView,ScrollView,StyleSheet,Text} from 'react-native';
import {Stack} from 'expo-router';
import {ExtendedSummaryCard,ExtendedEmptyState} from '../../src/features/speeches/extendedIndex';
export default function Screen(){return(<SafeAreaView style={styles.safe}><Stack.Screen options={{title:'Speeches'}}/><ScrollView contentContainerStyle={styles.c}><Text style={{fontSize:22,fontWeight:'700'}}>Speeches</Text><ExtendedSummaryCard title="Speeches" metric={0}/><ExtendedEmptyState/></ScrollView></SafeAreaView>);}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:'#FAF7F5'},c:{padding:20}});
