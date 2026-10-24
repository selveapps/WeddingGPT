import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

export default function SummaryCard({
  title = 'Summary',
  metric,
  metricLabel,
  secondary = [],
  onPress,
  tone = 'default',
  style,
}) {
  const toneMap = {
    default: styles.card,
    success: [styles.card, styles.success],
    warning: [styles.card, styles.warning],
    info: [styles.card, styles.info],
  };
  const body = (
    <View style={[toneMap[tone] || styles.card, style]}>
      <Text style={styles.title}>{title}</Text>
      {metric != null && (
        <View style={styles.metricRow}>
          <Text style={styles.metric}>{String(metric)}</Text>
          {metricLabel ? <Text style={styles.metricLabel}>{metricLabel}</Text> : null}
        </View>
      )}
      {secondary.length > 0 && (
        <View style={styles.secRow}>
          {secondary.map((s, i) => (
            <View key={i} style={styles.secItem}>
              <Text style={styles.secVal}>{s.value}</Text>
              <Text style={styles.secLab}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.85 }}>
        {body}
      </Pressable>
    );
  }
  return body;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#EDE6E3',
    shadowColor: '#1A1A1A', shadowOpacity: 0.06, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  success: { borderColor: '#B8E0D2', backgroundColor: '#F4FBF8' },
  warning: { borderColor: '#F5D0A9', backgroundColor: '#FFF9F2' },
  info: { borderColor: '#A8D5E5', backgroundColor: '#F2F9FC' },
  title: { fontSize: 13, fontWeight: '600', color: '#6B5E5A', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  metricRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 12 },
  metric: { fontSize: 28, fontWeight: '700', color: '#1A1A1A' },
  metricLabel: { fontSize: 14, color: '#6B5E5A' },
  secRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  secItem: { minWidth: 64 },
  secVal: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  secLab: { fontSize: 12, color: '#8A7E7A', marginTop: 2 },
});
