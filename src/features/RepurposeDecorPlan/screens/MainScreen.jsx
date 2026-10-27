/** RepurposeDecorPlan MainScreen */
import React, { useState } from 'react';
import { StyleSheet, SafeAreaView } from 'react-native';
import FeatureList from '../components/FeatureList';
import FeatureForm from '../components/FeatureForm';
import FeatureDetail from '../components/FeatureDetail';
import useRepurposeDecorPlan from '../hooks/useFeature';
export default function MainScreen() {
  const [mode, setMode] = useState('list'); const [editing, setEditing] = useState(null);
  const { selectItem, selected, deleteItem, clearSelection } = useRepurposeDecorPlan();
  return (
    <SafeAreaView style={s.wrap}>
      {mode === 'list' && <FeatureList onItemPress={(it) => { selectItem(it.id); setMode('detail'); }} onAddPress={() => { setEditing(null); setMode('form'); }} />}
      {mode === 'form' && <FeatureForm initialValues={editing} mode={editing ? 'edit' : 'create'} onSuccess={() => { setMode('list'); setEditing(null); }} onCancel={() => setMode(editing ? 'detail' : 'list')} />}
      {mode === 'detail' && selected && <FeatureDetail item={selected} onEdit={(it) => { setEditing(it); setMode('form'); }} onDelete={async (it) => { await deleteItem(it.id); clearSelection(); setMode('list'); }} onBack={() => { clearSelection(); setMode('list'); }} />}
    </SafeAreaView>
  );
}
const s = StyleSheet.create({ wrap: { flex: 1, backgroundColor: '#F9FAFB' } });
