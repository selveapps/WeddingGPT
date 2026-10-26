/**
 * LiveStreamingManager FeatureList
 */
import React, { useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import useLiveStreamingManager from '../hooks/useFeature';
import EmptyState from './EmptyState';
import FeatureCard from './FeatureCard';

export default function FeatureList({ onItemPress, onAddPress }) {
  const { filteredItems, loading, error, refresh, stats, progress } = useLiveStreamingManager();
  const renderItem = useCallback(({ item }) => <FeatureCard item={item} onPress={() => onItemPress?.(item)} />, [onItemPress]);
  const keyExtractor = useCallback((item) => item.id, []);

  if (loading && filteredItems.length === 0) {
    return (<View style={styles.centered}><ActivityIndicator size="large" color="#8B5CF6" /><Text style={styles.loadingText}>Loading LiveStreamingManager...</Text></View>);
  }
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>LiveStreamingManager</Text>
        <Text style={styles.subtitle}>{stats.total} items · {progress}% complete</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
      <FlatList data={filteredItems} renderItem={renderItem} keyExtractor={keyExtractor} contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState title="No items yet" message="Add your first LiveStreamingManager entry." onAction={onAddPress} actionLabel="Add New" />}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#8B5CF6" />} />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' }, centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#6B7280' }, header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' }, subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  error: { color: '#EF4444', marginTop: 8, fontSize: 13 }, list: { padding: 12, paddingBottom: 40 },
});
