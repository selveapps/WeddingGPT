import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { PaletteBuilder } from '../../../src/features/attire';
import { useAttireStore } from '../../../src/store/attireStore';

export default function PaletteScreen() {
  const palettes = useAttireStore((s) => s.listPalettes());
  const createPalette = useAttireStore((s) => s.createPalette);
  const addSwatch = useAttireStore((s) => s.addSwatch);
  const removeSwatch = useAttireStore((s) => s.removeSwatch);
  const primary = palettes.find((p) => p.isPrimary) || palettes[0] || null;

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ title: 'Color palette' }} />
      <PaletteBuilder
        palette={primary}
        onCreatePalette={(p) => createPalette({ ...p, isPrimary: true })}
        onAddSwatch={addSwatch}
        onRemoveSwatch={removeSwatch}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF7F5' },
});
