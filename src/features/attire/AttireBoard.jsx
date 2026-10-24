import React, { useMemo } from 'react';
import { View, Text, StyleSheet, SectionList } from 'react-native';
import AttireItemCard from './AttireItemCard';
import EmptyState from './EmptyState';
import { boardSections } from './lib/attireSelectors';

export default function AttireBoard({ items = [], onPressItem, onAdd }) {
  const sections = useMemo(() => {
    const raw = boardSections(items);
    return raw.map((s) => ({
      title: s.title,
      data: s.roles.flatMap((r) => r.items.map((item) => ({ ...item, _roleLabel: r.label }))),
    })).filter((s) => s.data.length);
  }, [items]);

  if (!items.length) {
    return <EmptyState onCta={onAdd} />;
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderSectionHeader={({ section }) => (
        <Text style={styles.section}>{section.title}</Text>
      )}
      renderItem={({ item }) => (
        <AttireItemCard item={item} onPress={onPressItem} />
      )}
      contentContainerStyle={styles.content}
      stickySectionHeadersEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40 },
  section: { fontSize: 13, fontWeight: '700', color: '#6B5E5A', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 16, marginBottom: 8 },
});
