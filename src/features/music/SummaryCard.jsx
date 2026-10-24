import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

/**
 * Reusable summary card for dashboard widgets.
 * Displays title, primary metric, secondary metrics, and optional CTA.
 */
export default function SummaryCard({
  title = 'Summary',
  metric,
  metricLabel,
  secondary = [],
  onPress,
  tone = 'default',
  style,
}) {
  const toneStyles = {
    default: styles.card,
    success: [styles.card, styles.cardSuccess],
    warning: [styles.card, styles.cardWarning],
    info: [styles.card, styles.cardInfo],
  };

  const content = (
    <View style={[toneStyles[tone] || styles.card, style]}>
      <Text style={styles.title}>{title}</Text>
      {metric != null && (
        <View style={styles.metricRow}>
          <Text style={styles.metric}>{String(metric)}</Text>
          {metricLabel ? <Text style={styles.metricLabel}>{metricLabel}</Text> : null}
        </View>
      )}
      {secondary.length > 0 && (
        <View style={styles.secondaryRow}>
          {secondary.map((s, i) => (
            <View key={i} style={styles.secondaryItem}>
              <Text style={styles.secondaryValue}>{s.value}</Text>
              <Text style={styles.secondaryLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
        {content}
      </Pressable>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EDE6E3',
    shadowColor: '#1A1A1A',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardSuccess: { borderColor: '#B8E0D2', backgroundColor: '#F4FBF8' },
  cardWarning: { borderColor: '#F5D0A9', backgroundColor: '#FFF9F2' },
  cardInfo: { borderColor: '#A8D5E5', backgroundColor: '#F2F9FC' },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B5E5A',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  metricRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 12 },
  metric: { fontSize: 28, fontWeight: '700', color: '#1A1A1A' },
  metricLabel: { fontSize: 14, color: '#6B5E5A' },
  secondaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  secondaryItem: { minWidth: 64 },
  secondaryValue: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  secondaryLabel: { fontSize: 12, color: '#8A7E7A', marginTop: 2 },
  pressed: { opacity: 0.85 },
});
