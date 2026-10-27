/** EmptyState PetAttireDesigner */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
export default function EmptyState({ title, message, onAction, actionLabel = 'Add' }) {
  return (
    <View style={s.wrap}>
      <Text style={s.icon}>📋</Text>
      <Text style={s.title}>{title || 'Nothing here yet'}</Text>
      <Text style={s.msg}>{message || 'Add your first PetAttireDesigner item.'}</Text>
      {onAction ? <TouchableOpacity style={s.btn} onPress={onAction}><Text style={s.btnT}>{actionLabel}</Text></TouchableOpacity> : null}
    </View>
  );
}
const s = StyleSheet.create({ wrap: { alignItems: 'center', padding: 40, marginTop: 30 }, icon: { fontSize: 36, marginBottom: 12 }, title: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 6 }, msg: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 16 }, btn: { backgroundColor: '#8B5CF6', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }, btnT: { color: '#fff', fontWeight: '600' } });
