/**
 * SpeechWriterAI MainScreen
 */
import React, { useState } from 'react';
import { StyleSheet, SafeAreaView } from 'react-native';
import FeatureList from '../components/FeatureList';
import FeatureForm from '../components/FeatureForm';
import FeatureDetail from '../components/FeatureDetail';
import useSpeechWriterAI from '../hooks/useFeature';

export default function MainScreen() {
  const [mode, setMode] = useState('list');
  const [editing, setEditing] = useState(null);
  const { selectItem, selected, deleteItem, clearSelection } = useSpeechWriterAI();
  const openCreate = () => { setEditing(null); setMode('form'); };
  const openEdit = (item) => { setEditing(item); setMode('form'); };
  const openDetail = (item) => { selectItem(item.id); setMode('detail'); };
  const handleSuccess = () => { setMode('list'); setEditing(null); };
  const handleDelete = async (item) => { await deleteItem(item.id); clearSelection(); setMode('list'); };
  return (
    <SafeAreaView style={styles.container}>
      {mode === 'list' && <FeatureList onItemPress={openDetail} onAddPress={openCreate} />}
      {mode === 'form' && <FeatureForm initialValues={editing} mode={editing ? 'edit' : 'create'} onSuccess={handleSuccess} onCancel={() => setMode(editing ? 'detail' : 'list')} />}
      {mode === 'detail' && selected && <FeatureDetail item={selected} onEdit={openEdit} onDelete={handleDelete} onBack={() => { clearSelection(); setMode('list'); }} />}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#F9FAFB' } });
