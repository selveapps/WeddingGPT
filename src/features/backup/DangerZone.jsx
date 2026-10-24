import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

export default function DangerZone({ onClearHistory, onResetSettings }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.wrap}>
      <Pressable onPress={() => setOpen(!open)}>
        <Text style={styles.header}>Danger zone</Text>
      </Pressable>
      {open ? (
        <View style={styles.body}>
          <Text style={styles.warn}>These actions only affect backup history and preferences on this phone — not your wedding data.</Text>
          {onClearHistory ? (
            <Pressable onPress={onClearHistory} style={styles.btn}>
              <Text style={styles.btnText}>Clear backup history</Text>
            </Pressable>
          ) : null}
          {onResetSettings ? (
            <Pressable onPress={onResetSettings} style={styles.btn}>
              <Text style={styles.btnText}>Reset backup settings</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { marginTop: 24, borderTopWidth: 1, borderTopColor: '#F0EBE8', paddingTop: 16 },
  header: { fontSize: 13, fontWeight: '700', color: '#B91C1C', textTransform: 'uppercase' },
  body: { marginTop: 12, gap: 8 },
  warn: { fontSize: 12, color: '#6B5E5A', marginBottom: 8, lineHeight: 18 },
  btn: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  btnText: { color: '#B91C1C', fontWeight: '600' },
});
