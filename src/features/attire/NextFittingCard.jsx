import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

export default function NextFittingCard({ fitting, outfitTitle, onPress }) {
  if (!fitting) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No upcoming fitting</Text>
      </View>
    );
  }
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}>
      <Text style={styles.kicker}>Next fitting</Text>
      <Text style={styles.title}>{outfitTitle || 'Outfit'}</Text>
      <Text style={styles.when}>{fitting.scheduledAt ? new Date(fitting.scheduledAt).toLocaleString() : 'Schedule TBD'}</Text>
      {fitting.location ? <Text style={styles.loc}>{fitting.location}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#F2F9FC', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#A8D5E5', marginBottom: 16 },
  kicker: { fontSize: 11, fontWeight: '700', color: '#1E40AF', textTransform: 'uppercase', letterSpacing: 0.6 },
  title: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginTop: 6 },
  when: { fontSize: 14, color: '#1A1A1A', marginTop: 6 },
  loc: { fontSize: 13, color: '#6B5E5A', marginTop: 2 },
  empty: { padding: 16, backgroundColor: '#F5F5F4', borderRadius: 12, marginBottom: 16 },
  emptyText: { color: '#8A7E7A', textAlign: 'center' },
});
