import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';

import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  Row,
  Screen,
  ScreenHeader,
  SectionHeader,
  Stack,
  Text,
  useToast,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { formatMoney } from '@/lib/currency';
import { VENDOR_STATUS_META } from '@/models';
import { Routes } from '@/navigation/routes';
import { selectWedding, useWeddingStore } from '@/store/weddingStore';
import { selectAllVendors, useVendorStore } from '@/store/vendorStore';
import { shareText } from '@/services/share';

import {
  buildVendorComparison,
  vendorCategoriesForComparison,
  vendorComparisonText,
} from './lib/vendorComparison';

export function VendorCompareScreen() {
  const router = useRouter();
  const toast = useToast();
  const { spacing } = useTheme();
  const vendors = useVendorStore(selectAllVendors);
  const wedding = useWeddingStore(selectWedding);
  const currency = wedding?.currency ?? 'USD';
  const categories = useMemo(() => vendorCategoriesForComparison(vendors), [vendors]);
  const [categoryKey, setCategoryKey] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const category = categories.find((item) => item.key === categoryKey) ?? categories[0] ?? null;
  const candidates = useMemo(
    () => (category ? vendors.filter((vendor) => vendor.categoryKey === category.key) : []),
    [category, vendors]
  );
  const selected = candidates.filter((vendor) => selectedIds.includes(vendor.id));
  const comparison = buildVendorComparison(selected, currency);

  const toggleVendor = (vendorId) => {
    setSelectedIds((current) => {
      if (current.includes(vendorId)) return current.filter((id) => id !== vendorId);
      if (current.length >= 2) return current;
      return [...current, vendorId];
    });
  };

  const chooseCategory = (nextCategory) => {
    setCategoryKey(nextCategory);
    setSelectedIds([]);
  };

  const shareComparison = async () => {
    const shared = await shareText(vendorComparisonText(comparison), 'Vendor comparison');
    if (shared) toast.success('Comparison shared');
    else toast.error('Could not share the comparison.');
  };

  return (
    <Screen bottomInset={spacing.xxl}>
      <Stack gap="lg">
        <ScreenHeader eyebrow="Vendors" title="Compare quotes" />

        {categories.length === 0 ? (
          <EmptyState
            icon="vendors"
            title={vendors.length ? 'Add a second vendor in a category' : 'Start your vendor shortlist'}
            message="Compare vendors in the same category so prices, scope and payment plans are easier to weigh."
            actionLabel="Add vendor"
            onAction={() => router.push(Routes.vendorAdd)}
          />
        ) : (
          <>
            <Text variant="bodySm" color="muted">
              Compare two vendors from the same category. A lower quote is not always the better fit - check
              what each one includes.
            </Text>

            <Stack gap="sm">
              <SectionHeader eyebrow="1 of 2" title="Choose a category" />
              <Row gap="xs" wrap align="flex-start">
                {categories.map((item) => (
                  <Chip
                    key={item.key}
                    label={item.name}
                    selected={category.key === item.key}
                    onPress={() => chooseCategory(item.key)}
                  />
                ))}
              </Row>
            </Stack>

            <Stack gap="sm">
              <SectionHeader
                eyebrow="2 of 2"
                title="Choose two vendors"
                subtitle={`${selected.length} of 2 selected`}
              />
              <Row gap="xs" wrap align="flex-start">
                {candidates.map((vendor) => {
                  const isSelected = selectedIds.includes(vendor.id);
                  return (
                    <Chip
                      key={vendor.id}
                      label={vendor.name}
                      selected={isSelected}
                      disabled={!isSelected && selectedIds.length >= 2}
                      onPress={() => toggleVendor(vendor.id)}
                    />
                  );
                })}
              </Row>
            </Stack>

            {comparison ? (
              <Stack gap="md" testID="vendor-comparison">
                <SectionHeader eyebrow={category.name} title="Side-by-side" />
                {comparison.quoteDifference ? (
                  <Card tone="brand">
                    <Text variant="bodyStrong">
                      {comparison.lowerVendorName} quoted{' '}
                      {formatMoney(comparison.quoteDifference.amount, currency)} less
                    </Text>
                    <Text variant="bodySm" color="brandSoftInk">
                      Check the scope and payment terms before deciding.
                    </Text>
                  </Card>
                ) : null}
                <Row gap="sm" align="stretch">
                  {comparison.vendors.map((vendor, index) => (
                    <Card
                      key={vendor.id}
                      style={{ flex: 1, minWidth: 0 }}
                      testID={`vendor-comparison-${vendor.id}`}
                    >
                      <Stack gap="sm">
                        <Stack gap="xs">
                          <Text variant="bodyStrong">{vendor.name}</Text>
                          <Badge
                            label={VENDOR_STATUS_META[vendor.status]?.label ?? 'Not set'}
                            tone={VENDOR_STATUS_META[vendor.status]?.tone ?? 'neutral'}
                          />
                        </Stack>
                        {comparison.rows
                          .filter((row) => row.label !== 'Status')
                          .map((row) => (
                            <Stack key={row.label} gap="xxs">
                              <Text variant="eyebrow" color="subtle">
                                {row.label}
                              </Text>
                              <Text variant="bodySm">{row.values[index]}</Text>
                            </Stack>
                          ))}
                      </Stack>
                    </Card>
                  ))}
                </Row>
                <Button
                  label="Share comparison"
                  variant="secondary"
                  iconLeft="send"
                  onPress={shareComparison}
                />
              </Stack>
            ) : (
              <Card tone="muted">
                <Text variant="bodySm" color="muted">
                  Select two vendors to compare their quote, included services, booking status and payment
                  plan.
                </Text>
              </Card>
            )}
          </>
        )}
      </Stack>
    </Screen>
  );
}

export default VendorCompareScreen;
