import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  Screen,
  Stack,
  Row,
  Text,
  Button,
  TextField,
  BottomSheet,
  ScreenHeader,
  ListRow,
  Card,
  useToast,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { Routes } from '@/navigation/routes';
import { CONTACTS_SUPPORTED } from '@/services/contacts';
import {
  useGuestStore,
  useWeddingStore,
  selectAllHouseholds,
  selectWeddingId,
} from '@/store';
import { GuestForm } from '@/features/guests/GuestForm';

/**
 * Add a guest.
 *
 * Households can be created from here rather than on a separate screen. The
 * moment you discover you need one is while you are adding the second person
 * from the same address, and sending someone away to a different screen at that
 * point usually loses the guest they were halfway through typing.
 */
export default function AddGuestScreen() {
  const router = useRouter();
  const toast = useToast();
  const { spacing } = useTheme();
  const params = useLocalSearchParams();

  const households = useGuestStore(selectAllHouseholds);
  const addGuest = useGuestStore((state) => state.addGuest);
  const addHousehold = useGuestStore((state) => state.addHousehold);
  const weddingId = useWeddingStore(selectWeddingId);

  const [householdOpen, setHouseholdOpen] = useState(false);
  const [householdName, setHouseholdName] = useState('');

  const handleSubmit = (values) => {
    addGuest({ ...values, weddingId });
    toast.success(`${values.firstName} added`);
    router.back();
  };

  const createHousehold = () => {
    const name = householdName.trim();
    if (!name) return;
    addHousehold({ weddingId, name });
    setHouseholdName('');
    setHouseholdOpen(false);
    toast.success(`${name} created`);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen bottomInset={spacing.xxl}>
        <Stack gap="lg">
          <ScreenHeader eyebrow="Guests" title="New guest" />

          <Row justify="space-between" align="flex-end">
            <Text variant="h1" heading style={{ flex: 1 }}>
              Add a guest
            </Text>
            <Text
              variant="actionSm"
              color="brand"
              onPress={() => setHouseholdOpen(true)}
            >
              New household
            </Text>
          </Row>

          {CONTACTS_SUPPORTED ? (
            <Card tone="sunken" padding="none">
              <ListRow
                icon="userPlus"
                title="Import from contacts"
                subtitle="Add several people from your phone at once"
                onPress={() => router.replace(Routes.guestImport)}
              />
            </Card>
          ) : null}

          <GuestForm
            initial={
              params.householdId ? { householdId: String(params.householdId) } : undefined
            }
            households={households}
            submitLabel="Add guest"
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
          />
        </Stack>
      </Screen>

      <BottomSheet
        visible={householdOpen}
        onClose={() => setHouseholdOpen(false)}
        title="New household"
        subtitle="A family, a couple, a shared address - whoever gets one invitation between them."
        footer={
          <Button
            label="Create household"
            disabled={!householdName.trim()}
            onPress={createHousehold}
          />
        }
      >
        <TextField
          label="Household name"
          value={householdName}
          onChangeText={setHouseholdName}
          placeholder="The Millers"
          autoCapitalize="words"
        />
      </BottomSheet>
    </KeyboardAvoidingView>
  );
}
