import React, { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { EmptyState, Screen, ScreenHeader, Stack, useToast } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { selectVendorById, useVendorStore } from '@/store/vendorStore';
import { Routes } from '@/navigation/routes';

import { useVendors } from './hooks/useVendors';
import { useVendorForm } from './hooks/useVendorForm';
import { VendorForm } from './components/VendorForm';
import { VENDOR_COPY } from './lib/vendorConstants';

/** Add a vendor (no `id` param) or edit one (`/vendors/[id]/edit`). */
export function VendorFormScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const toast = useToast();
  const { spacing } = useTheme();
  const id = String(params.id ?? '');
  const vendor = useVendorStore(selectVendorById(id));
  const editing = Boolean(id);
  const { createVendor, saveVendor, currency } = useVendors();
  const [saving, setSaving] = useState(false);

  const save = useCallback(
    (values) => {
      setSaving(true);
      try {
        if (editing && vendor) {
          saveVendor(vendor, values);
          toast.success(VENDOR_COPY.saveSuccess);
          router.back();
        } else {
          const created = createVendor(values);
          toast.success(VENDOR_COPY.saveSuccess);
          router.replace(Routes.vendorDetail(created.id));
        }
      } finally {
        setSaving(false);
      }
    },
    [createVendor, editing, router, saveVendor, toast, vendor]
  );

  const form = useVendorForm(editing ? vendor : null, save);

  if (editing && !vendor) {
    return (
      <Screen bottomInset={spacing.xxl}>
        <Stack gap="lg">
          <ScreenHeader eyebrow={VENDOR_COPY.formEyebrowEdit} title="" />
          <EmptyState
            icon="vendors"
            title={VENDOR_COPY.notFoundTitle}
            message={VENDOR_COPY.notFoundBody}
            actionLabel={VENDOR_COPY.backToList}
            onAction={() => router.replace(Routes.vendors)}
          />
        </Stack>
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen bottomInset={spacing.xxl}>
        <Stack gap="lg">
          <ScreenHeader
            eyebrow={editing ? VENDOR_COPY.formEyebrowEdit : VENDOR_COPY.formEyebrowAdd}
            title={editing ? VENDOR_COPY.formTitleEdit : VENDOR_COPY.formTitleAdd}
          />
          <VendorForm
            values={form.values}
            errors={form.errors}
            currency={currency}
            editing={editing}
            saving={saving}
            onChange={form.setField}
            onBlur={form.blurField}
            onSubmit={form.submit}
            onCancel={() => router.back()}
          />
        </Stack>
      </Screen>
    </KeyboardAvoidingView>
  );
}

export default VendorFormScreen;
