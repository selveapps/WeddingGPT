import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function EmptyState({
  title = 'Nothing here yet',
  message = 'Add your first item to get started.',
  onAction,
  actionLabel = 'Add new',
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onAction ? (
        <TouchableOpacity style={styles.button} onPress={onAction}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: 28 },
  title: { color: '#111827', fontSize: 17, fontWeight: '700' },
  message: { color: '#6B7280', fontSize: 14, marginTop: 6, textAlign: 'center' },
  button: {
    backgroundColor: '#8B5CF6',
    borderRadius: 10,
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});