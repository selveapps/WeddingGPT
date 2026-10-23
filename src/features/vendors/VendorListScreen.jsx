import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';

import {
  Card,
  Chip,
  EmptyState,
  Row,
  Screen,
  ScreenHeader,
  SectionHeader,
  Stack,
  Text,
  TextField,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { Routes } from '@/navigation/routes';
import { VENDOR_CATEGORIES } from '@/models';
import { usePlanningStore, selectAllTasks } from '@/store/planningStore';

import { VendorFilters } from './components/VendorFilters';
import { VendorPipeline } from './components/VendorPipeline';
import { VendorRow } from './components/VendorRow';
import { VendorTips } from './components/VendorTips';
import { VendorCategories } from './components/VendorCategories';
import { VendorTimeline } from './components/VendorTimeline';
import { UpcomingPayments } from './components/UpcomingPayments';
import { VendorFilter, VENDOR_COPY, VENDOR_SORT, VENDOR_SORT_OPTIONS } from './lib/vendorConstants';
import { searchVendors } from './lib/vendorHelpers';
import { useVendors } from './hooks/useVendors';

/**
 * The couple's vendor list: where things stand, what to book next, what is
 * coming up to pay, and every vendor they are tracking.
 */
export function VendorListScreen() {
  const router = useRouter();
  const { spacing } = useTheme();
  const [filter, setFilter] = useState(VendorFilter.ALL);
  const [sort, setSort] = useState(VENDOR_SORT.UPDATED);
  const [categoryKey, setCategoryKey] = useState(null);
  const [query, setQuery] = useState('');
  const { vendors, allVendors, summary, currency, wedding, togglePaymentPaid } = useVendors({
    filter,
    sort,
  });
  const tasks = usePlanningStore(selectAllTasks);

  const visibleVendors = useMemo(
    () =>
      searchVendors(
        vendors.filter((vendor) => !categoryKey || vendor.categoryKey === categoryKey),
        query
      ),
    [vendors, categoryKey, query]
  );

  const clearFilters = () => {
    setFilter(VendorFilter.ALL);
    setCategoryKey(null);
    setQuery('');
  };

  if (!wedding) {
    return (
      <Screen bottomInset={spacing.xxl}>
        <Stack gap="lg">
          <ScreenHeader eyebrow={VENDOR_COPY.screenEyebrow} title={VENDOR_COPY.screenTitle} />
          <EmptyState
            icon="vendors"
            title="Set up your wedding first"
            message="Your vendor list is part of your wedding workspace."
            actionLabel="Go to setup"
            onAction={() => router.push(Routes.onboarding)}
          />
        </Stack>
      </Screen>
    );
  }

  return (
    <Screen bottomInset={spacing.xxl}>
      <Stack gap="lg">
        <ScreenHeader
          eyebrow={VENDOR_COPY.screenEyebrow}
          title={VENDOR_COPY.screenTitle}
          actionIcon="plus"
          actionLabel={VENDOR_COPY.addLabel}
          onActionPress={() => router.push(Routes.vendorAdd)}
        />

        <VendorPipeline summary={summary} currency={currency} />

        <UpcomingPayments
          vendors={allVendors}
          currency={currency}
          onTogglePaid={(payment) => togglePaymentPaid(payment.vendorId, payment.id)}
        />

        <VendorTimeline weddingDate={wedding.date} tasks={tasks} onCategoryPress={setCategoryKey} />
        <VendorCategories vendors={allVendors} onCategoryPress={setCategoryKey} />
        <VendorTips />

        <Stack gap="sm">
          <SectionHeader eyebrow={VENDOR_COPY.filterEyebrow} title="Your shortlist" />
          <VendorFilters value={filter} onChange={setFilter} />
          <TextField
            label="Search vendors"
            value={query}
            onChangeText={setQuery}
            placeholder="Name, contact or city"
            icon="search"
            autoCapitalize="none"
          />
          <Stack gap="xs">
            <Text variant="eyebrow" color="subtle">
              Sort by
            </Text>
            <ChipChoice value={sort} onChange={setSort} options={VENDOR_SORT_OPTIONS} />
          </Stack>
          <Stack gap="xs">
            <Text variant="eyebrow" color="subtle">
              Category
            </Text>
            <ChipChoice
              value={categoryKey}
              onChange={setCategoryKey}
              options={[
                { value: null, label: 'All types' },
                ...VENDOR_CATEGORIES.map((category) => ({ value: category.key, label: category.name })),
              ]}
            />
          </Stack>
        </Stack>

        <Stack gap="sm">
          <SectionHeader
            eyebrow={VENDOR_COPY.listEyebrow}
            title={VENDOR_COPY.listTitle}
            subtitle={`${visibleVendors.length} ${visibleVendors.length === 1 ? 'vendor' : 'vendors'}`}
          />
          {visibleVendors.length ? (
            <Card padding="md">
              <Stack gap="none">
                {visibleVendors.map((vendor) => (
                  <VendorRow
                    key={vendor.id}
                    vendor={vendor}
                    currency={currency}
                    onPress={(item) => router.push(Routes.vendorDetail(item.id))}
                  />
                ))}
              </Stack>
            </Card>
          ) : (
            <EmptyState
              icon="vendors"
              compact
              title={allVendors.length ? VENDOR_COPY.emptyFilteredTitle : VENDOR_COPY.heroEmptyTitle}
              message={allVendors.length ? VENDOR_COPY.emptyFilteredBody : VENDOR_COPY.heroEmptyBody}
              actionLabel={allVendors.length ? 'Clear filters' : VENDOR_COPY.addLabel}
              onAction={allVendors.length ? clearFilters : () => router.push(Routes.vendorAdd)}
            />
          )}
        </Stack>
      </Stack>
    </Screen>
  );
}

function ChipChoice({ value, onChange, options }) {
  return (
    <Row gap="xs" wrap align="flex-start">
      {options.map((option) => (
        <Chip
          key={option.value ?? 'all'}
          label={option.label}
          size="sm"
          selected={value === option.value}
          onPress={() => onChange(option.value)}
        />
      ))}
    </Row>
  );
}

export default VendorListScreen;
