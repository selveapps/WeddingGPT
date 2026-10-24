import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';

/**
 * Main screen for menu module.
 * Integrates with the corresponding store once wired in store/index.js.
 */

const DEMO_ITEMS = [
  { id: '1', title: 'Sample item one', subtitle: 'Tap to open details' },
  { id: '2', title: 'Sample item two', subtitle: 'Long-press for actions' },
  { id: '3', title: 'Sample item three', subtitle: 'Replace with real data from store' },
];

export default function Screen() {
  const router = useRouter();

  const stats = useMemo(
    () => ({
      total: DEMO_ITEMS.length,
      ready: 2,
      pending: 1,
    }),
    []
  );

  const handleAdd = useCallback(() => {
    console.log('[menu] add pressed');
  }, []);

  const handleOpen = useCallback((item) => {
    console.log('[menu] open', item.id);
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen
        options={{
          title: 'menu',
          headerRight: () => (
            <Pressable onPress={handleAdd} hitSlop={12}>
              <Text style={styles.headerAction}>Add</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>menu</Text>
          <Text style={styles.heroSubtitle}>
            New WeddingGPT module. Wire this screen to the matching zustand store
            and replace demo data with live entities.
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.ready}</Text>
            <Text style={styles.statLabel}>Ready</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Items</Text>
        {DEMO_ITEMS.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => handleOpen(item)}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
          </Pressable>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Tip: register this route in your tab or tools navigator and import the
            store from src/store.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF7F5' },
  content: { padding: 20, paddingBottom: 48 },
  hero: { marginBottom: 24 },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    textTransform: 'capitalize',
    marginBottom: 8,
  },
  heroSubtitle: { fontSize: 15, color: '#6B5E5A', lineHeight: 22 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EDE6E3',
    alignItems: 'center',
  },
  statValue: { fontSize: 22, fontWeight: '700', color: '#C93862' },
  statLabel: { fontSize: 12, color: '#8A7E7A', marginTop: 4 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B5E5A',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EDE6E3',
  },
  cardPressed: { backgroundColor: '#F8F4F2' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  cardSubtitle: { fontSize: 13, color: '#6B5E5A', marginTop: 4 },
  headerAction: { color: '#C93862', fontWeight: '600', fontSize: 16, marginRight: 8 },
  footer: { marginTop: 32, padding: 16, backgroundColor: '#F0EBE8', borderRadius: 12 },
  footerText: { fontSize: 13, color: '#6B5E5A', lineHeight: 20 },
});
