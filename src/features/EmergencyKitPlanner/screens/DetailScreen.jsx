/**
 * EmergencyKitPlanner DetailScreen
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FeatureDetail from '../components/FeatureDetail';
import useEmergencyKitPlannerStore from '../store';

export default function DetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const items = useEmergencyKitPlannerStore((s) => s.items);
  const selectItem = useEmergencyKitPlannerStore((s) => s.selectItem);
  const deleteItem = useEmergencyKitPlannerStore((s) => s.deleteItem);
  const loading = useEmergencyKitPlannerStore((s) => s.loading);
  const item = items.find((i) => i.id === id);
  useEffect(() => { if (id) selectItem(id); }, [id]);
  if (loading && !item) return (<View style={styles.centered}><ActivityIndicator size="large" color="#8B5CF6" /></View>);
  return (
    <View style={styles.container}>
      <FeatureDetail item={item} onEdit={(it) => router.push(`/emergencykitplanner/edit?id=${it.id}`)} onDelete={async (it) => { await deleteItem(it.id); router.back(); }} onBack={() => router.back()} />
    </View>
  );
}
const styles = StyleSheet.create({ container: { flex: 1 }, centered: { flex: 1, justifyContent: 'center', alignItems: 'center' } });
