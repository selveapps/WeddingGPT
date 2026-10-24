import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

export default function EmptyState({
  title = 'Nothing here yet',
  description = 'Add your first item to get started.',
  ctaLabel = 'Add',
  onCta,
  emoji = '✨',
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.desc}>{description}</Text>
      {onCta ? (
        <Pressable onPress={onCta} style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}>
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', textAlign: 'center', marginBottom: 8 },
  desc: { fontSize: 15, color: '#6B5E5A', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  cta: { backgroundColor: '#C93862', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999 },
  ctaText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
