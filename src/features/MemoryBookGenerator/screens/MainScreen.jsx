import React, { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import FeatureList from '../components/FeatureList';
import FeatureForm from '../components/FeatureForm';
import FeatureDetail from '../components/FeatureDetail';
import useMemoryBookGenerator from '../hooks/useFeature';

export default function MainScreen() {
  const [mode, setMode] = useState('list');
  const [editing, setEditing] = useState(null);
  const { selectItem, selected, deleteItem, clearSelection } = useMemoryBookGenerator();

  const openCreate = () => {
    setEditing(null);
    setMode('form');
  };
  const openEdit = (item) => {
    setEditing(item);
    setMode('form');
  };
  const openDetail = (item) => {
    selectItem(item.id);
    setMode('detail');
  };
  const handleDelete = async (item) => {
    await deleteItem(item.id);
    clearSelection();
    setMode('list');
  };

  return (
    <SafeAreaView style={styles.container}>
      {mode === 'list' ? <FeatureList onItemPress={openDetail} onAddPress={openCreate} /> : null}
      {mode === 'form' ? (
        <FeatureForm
          initialValues={editing}
          mode={editing ? 'edit' : 'create'}
          onSuccess={() => {
            setMode('list');
            setEditing(null);
          }}
          onCancel={() => setMode(editing ? 'detail' : 'list')}
        />
      ) : null}
      {mode === 'detail' && selected ? (
        <FeatureDetail
          item={selected}
          onEdit={openEdit}
          onDelete={handleDelete}
          onBack={() => {
            clearSelection();
            setMode('list');
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
});
