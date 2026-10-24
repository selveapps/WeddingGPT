import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';

export default function PhotoStrip({ uris = [], onAdd, onPressPhoto, emptyLabel = 'No photos yet' }) {
  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <Pressable onPress={onAdd} style={styles.add}>
          <Text style={styles.addPlus}>+</Text>
          <Text style={styles.addLab}>Add</Text>
        </Pressable>
        {uris.map((uri, idx) => (
          <Pressable key={`${uri}-${idx}`} onPress={() => onPressPhoto?.(uri, idx)} style={styles.thumbWrap}>
            <Image source={{ uri }} style={styles.thumb} />
          </Pressable>
        ))}
        {!uris.length ? <Text style={styles.empty}>{emptyLabel}</Text> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginVertical: 8 },
  row: { gap: 10, paddingHorizontal: 4, alignItems: 'center' },
  add: { width: 72, height: 72, borderRadius: 12, borderWidth: 1, borderColor: '#EDE6E3', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAF7F5' },
  addPlus: { fontSize: 24, color: '#C93862', fontWeight: '600' },
  addLab: { fontSize: 11, color: '#6B5E5A' },
  thumbWrap: { width: 72, height: 72, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#EDE6E3' },
  thumb: { width: 72, height: 72 },
  empty: { fontSize: 13, color: '#8A7E7A', marginLeft: 8 },
});
