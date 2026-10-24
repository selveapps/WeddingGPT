import React, { useCallback } from 'react';
import { View, StyleSheet, Pressable, Text, SafeAreaView, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  AttireSummaryHeader, AttireFilterBar, AttireBoard, NextFittingCard, ReadinessIssues,
} from '../../src/features/attire';
import { useAttireBoard } from '../../src/features/attire/hooks';
import { useAttireStore } from '../../src/store/attireStore';

export default function AttireHomeScreen() {
  const router = useRouter();
  const board = useAttireBoard();
  const fittings = useAttireStore((s) => s.listFittings());
  const accessories = useAttireStore((s) => s.listAccessories());
  const next = board.nextFitting;
  const itemsById = Object.fromEntries(board.items.map((i) => [i.id, i]));

  const openItem = useCallback((item) => {
    router.push(`/attire/item/${item.id}`);
  }, [router]);

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen
        options={{
          title: 'Attire',
          headerRight: () => (
            <Pressable onPress={() => router.push('/attire/item/new')} hitSlop={12}>
              <Text style={styles.add}>Add</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <AttireSummaryHeader stats={board.stats} />
        <NextFittingCard
          fitting={next}
          outfitTitle={next ? itemsById[next.attireItemId]?.title : null}
          onPress={() => router.push('/attire/fitting')}
        />
        <AttireFilterBar
          query={board.query}
          onQueryChange={board.setQuery}
          role={board.role}
          onRoleChange={board.setRole}
          status={board.status}
          onStatusChange={board.setStatus}
          rentalOnly={board.rentalOnly}
          onRentalOnlyChange={board.setRentalOnly}
          needsFitting={board.needsFitting}
          onNeedsFittingChange={board.setNeedsFitting}
        />
        <View style={styles.links}>
          <LinkBtn label="Fittings" onPress={() => router.push('/attire/fitting')} />
          <LinkBtn label="Palette" onPress={() => router.push('/attire/palette')} />
          <LinkBtn label="Pack list" onPress={() => router.push('/attire/pack')} />
        </View>
        <AttireBoard items={board.filtered} onPressItem={openItem} onAdd={() => router.push('/attire/item/new')} />
        <ReadinessIssues items={board.items} fittings={fittings} accessories={accessories} onPressItem={(id) => router.push(`/attire/item/${id}`)} />
      </ScrollView>
    </SafeAreaView>
  );
}

function LinkBtn({ label, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.linkBtn}>
      <Text style={styles.linkText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF7F5' },
  content: { padding: 16, paddingBottom: 48 },
  add: { color: '#C93862', fontWeight: '600', fontSize: 16, marginRight: 8 },
  links: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  linkBtn: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EDE6E3', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  linkText: { fontSize: 13, fontWeight: '600', color: '#57534E' },
});
