import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SyncedWorkspaceWarning({ visible }) {
  if (!visible) return null;
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Synced wedding</Text>
      <Text style={styles.body}>
        This phone is linked to a cloud workspace. Local restore is disabled so you don’t overwrite
        shared data by accident. Sign out to manage a phone-only plan, or use workspace tools to export.
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { backgroundColor: '#FFF9F2', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#F5D0A9', marginBottom: 16 },
  title: { fontSize: 15, fontWeight: '700', color: '#92400E', marginBottom: 6 },
  body: { fontSize: 13, color: '#78350F', lineHeight: 19 },
});
