/** GroomGiftRegistry FeatureList */
import React, { useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import useGroomGiftRegistry from '../hooks/useFeature';
import FeatureCard from './FeatureCard';
import EmptyState from './EmptyState';
export default function FeatureList({ onItemPress, onAddPress }) {
  const { filteredItems, loading, error, refresh, stats, progress } = useGroomGiftRegistry();
  const renderItem = useCallback(({ item }) => <FeatureCard item={item} onPress={() => onItemPress?.(item)} />, [onItemPress]);
  if (loading && !filteredItems.length) return <View style={s.center}><ActivityIndicator size="large" color="#8B5CF6" /><Text style={s.muted}>Loading GroomGiftRegistry...</Text></View>;
  return (
    <View style={s.wrap}>
      <View style={s.header}><Text style={s.title}>GroomGiftRegistry</Text><Text style={s.sub}>{stats.total} items · {progress}% done</Text>{error ? <Text style={s.err}>{error}</Text> : null}</View>
      <FlatList data={filteredItems} renderItem={renderItem} keyExtractor={(i) => i.id} contentContainerStyle={s.list}
        ListEmptyComponent={<EmptyState onAction={onAddPress} />} refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#8B5CF6" />} />
    </View>
  );
}
const s = StyleSheet.create({ wrap: { flex: 1, backgroundColor: '#F9FAFB' }, center: { flex: 1, justifyContent: 'center', alignItems: 'center' }, muted: { marginTop: 12, color: '#6B7280' }, header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }, title: { fontSize: 20, fontWeight: '700', color: '#111827' }, sub: { fontSize: 13, color: '#6B7280', marginTop: 4 }, err: { color: '#EF4444', marginTop: 6, fontSize: 12 }, list: { padding: 12, paddingBottom: 40 } });
