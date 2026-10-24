import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

/** ADDITIVE component for launch/LaunchScreen — safe to merge; does not replace existing files. */
export default function LaunchScreen({ title, items = [], stats, onPress, onAdd, children, style }) {
  return (
    <View style={[styles.wrap, style]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {stats ? (
        <View style={styles.stats}>
          {Object.entries(stats).map(([k, v]) => (
            <View key={k} style={styles.stat}>
              <Text style={styles.statVal}>{String(v)}</Text>
              <Text style={styles.statLab}>{k}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {items.map((item, idx) => (
        <Pressable key={item.id || item.key || idx} onPress={() => onPress?.(item)} style={styles.row}>
          <Text style={styles.rowTitle} numberOfLines={1}>{item.title || item.name || item.label || 'Item'}</Text>
          {item.subtitle || item.description ? (
            <Text style={styles.rowSub} numberOfLines={2}>{item.subtitle || item.description}</Text>
          ) : null}
        </Pressable>
      ))}
      {children}
      {onAdd ? (
        <Pressable onPress={onAdd} style={styles.add}><Text style={styles.addText}>Add</Text></Pressable>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  title: { fontSize: 13, fontWeight: '700', color: '#6B5E5A', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  stat: { backgroundColor: '#FFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#EDE6E3', minWidth: 72, alignItems: 'center' },
  statVal: { fontSize: 16, fontWeight: '700', color: '#C93862' },
  statLab: { fontSize: 11, color: '#8A7E7A', marginTop: 2 },
  row: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#EDE6E3', marginBottom: 8 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  rowSub: { fontSize: 13, color: '#6B5E5A', marginTop: 2 },
  add: { marginTop: 10, alignSelf: 'flex-start', backgroundColor: '#C93862', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999 },
  addText: { color: '#FFF', fontWeight: '600' },
});
