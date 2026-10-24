import React, { useMemo } from 'react';
import { SafeAreaView, StyleSheet, Pressable, Text } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { AttireItemDetail, AttireItemForm } from '../../../src/features/attire';
import { useAttireStore } from '../../../src/store/attireStore';

export default function AttireItemScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const isNew = id === 'new';
  const item = useAttireStore((s) => (isNew ? null : s.getItem(id)));
  const createItem = useAttireStore((s) => s.createItem);
  const updateItem = useAttireStore((s) => s.updateItem);
  const setItemStatus = useAttireStore((s) => s.setItemStatus);
  const fittings = useAttireStore((s) => s.fittingsForItem(isNew ? null : id));
  const accessories = useAttireStore((s) => s.accessoriesForItem(isNew ? null : id));
  const [editing, setEditing] = React.useState(isNew);

  if (isNew || editing) {
    return (
      <SafeAreaView style={styles.safe}>
        <Stack.Screen options={{ title: isNew ? 'New outfit' : 'Edit outfit' }} />
        <AttireItemForm
          initial={item || {}}
          submitLabel={isNew ? 'Create' : 'Save'}
          onCancel={isNew ? () => router.back() : () => setEditing(false)}
          onSubmit={(values) => {
            if (isNew) {
              const created = createItem(values);
              router.replace(`/attire/item/${created.id}`);
            } else {
              updateItem(id, values);
              setEditing(false);
            }
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen
        options={{
          title: item?.title || 'Outfit',
          headerRight: () => (
            <Pressable onPress={() => setEditing(true)} hitSlop={12}>
              <Text style={styles.edit}>Edit</Text>
            </Pressable>
          ),
        }}
      />
      <AttireItemDetail
        item={item}
        fittings={fittings}
        accessories={accessories}
        onEdit={() => setEditing(true)}
        onStatusChange={(status) => setItemStatus(id, status)}
        onAddFitting={() => router.push({ pathname: '/attire/fitting/new', params: { attireItemId: id } })}
        onAddAccessory={() => {}}
        onOpenFitting={() => router.push('/attire/fitting')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF7F5' },
  edit: { color: '#C93862', fontWeight: '600', marginRight: 8 },
});
