import React, { useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView,
} from 'react-native';
import { Stack } from 'expo-router';

const DEMO = [
  { id: '1', title: 'Sample one', subtitle: 'Wire to store for real data' },
  { id: '2', title: 'Sample two', subtitle: 'Long-press actions coming soon' },
  { id: '3', title: 'Sample three', subtitle: 'Replace with live entities' },
];

export default function Screen() {
  const stats = useMemo(() => ({ total: DEMO.length, ready: 2, pending: 1 }), []);
  const onAdd = useCallback(() => console.log('[after-party] add'), []);
  const onOpen = useCallback((item) => console.log('[after-party] open', item.id), []);

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen
        options={{
          title: 'After-Party & Late Night',
          headerRight: () => (
            <Pressable onPress={onAdd} hitSlop={12}>
              <Text style={styles.headerAction}>Add</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>🌙</Text>
          <Text style={styles.heroTitle}>After-Party & Late Night</Text>
          <Text style={styles.heroSub}>
            New WeddingGPT module. Connect the matching zustand store and
            replace demo rows with live data.
          </Text>
        </View>
        <View style={styles.stats}>
          <View style={styles.stat}><Text style={styles.statV}>{stats.total}</Text><Text style={styles.statL}>Total</Text></View>
          <View style={styles.stat}><Text style={styles.statV}>{stats.ready}</Text><Text style={styles.statL}>Ready</Text></View>
          <View style={styles.stat}><Text style={styles.statV}>{stats.pending}</Text><Text style={styles.statL}>Pending</Text></View>
        </View>
        <Text style={styles.section}>Items</Text>
        {DEMO.map((item) => (
          <Pressable key={item.id} onPress={() => onOpen(item)} style={({ pressed }) => [styles.card, pressed && styles.cardP]}>
            <Text style={styles.cardT}>{item.title}</Text>
            <Text style={styles.cardS}>{item.subtitle}</Text>
          </Pressable>
        ))}
        <View style={styles.foot}>
          <Text style={styles.footT}>Route: /after-party · Store: useAfterPartyStore</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF7F5' },
  content: { padding: 20, paddingBottom: 48 },
  hero: { marginBottom: 24 },
  heroEmoji: { fontSize: 36, marginBottom: 8 },
  heroTitle: { fontSize: 26, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  heroSub: { fontSize: 15, color: '#6B5E5A', lineHeight: 22 },
  stats: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  stat: { flex: 1, backgroundColor: '#FFF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#EDE6E3', alignItems: 'center' },
  statV: { fontSize: 22, fontWeight: '700', color: '#C93862' },
  statL: { fontSize: 12, color: '#8A7E7A', marginTop: 4 },
  section: { fontSize: 13, fontWeight: '600', color: '#6B5E5A', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 },
  card: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#EDE6E3' },
  cardP: { backgroundColor: '#F8F4F2' },
  cardT: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  cardS: { fontSize: 13, color: '#6B5E5A', marginTop: 4 },
  headerAction: { color: '#C93862', fontWeight: '600', fontSize: 16, marginRight: 8 },
  foot: { marginTop: 32, padding: 16, backgroundColor: '#F0EBE8', borderRadius: 12 },
  footT: { fontSize: 13, color: '#6B5E5A', lineHeight: 20 },
});
