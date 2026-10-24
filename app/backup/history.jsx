import React from 'react';
import { SafeAreaView, StyleSheet, Pressable, Text } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { BackupHistoryList } from '../../src/features/backup';
import { useBackupStore } from '../../src/store/backupStore';

export default function BackupHistoryScreen() {
  const router = useRouter();
  const history = useBackupStore((s) => s.listHistory());
  const removeHistory = useBackupStore((s) => s.removeHistory);

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ title: 'Backup history' }} />
      <BackupHistoryList
        history={history}
        onDelete={removeHistory}
        onBackup={() => router.push('/backup')}
        onPress={() => {}}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF7F5' },
});
