import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';

import {
  Card,
  Chip,
  EmptyState,
  PageHeader,
  Row,
  Screen,
  SectionHeader,
  Stack,
  Text,
  TextField,
} from '@/design-system/components';
import { Routes } from '@/navigation/routes';
import { VENDOR_CATEGORIES } from '@/models';
import { BookingFilters } from './components/BookingFilters';
import { BookingPipeline } from './components/BookingPipeline';
import { BookingRow } from './components/BookingRow';
import { BookingTips } from './components/BookingTips';
import { BookingFilter, BOOKING_COPY, BOOKING_SORT, BOOKING_SORT_OPTIONS } from './lib/bookingConstants';
import { useBookings } from './hooks/useBookings';
import { usePlanningStore, selectAllTasks } from '@/store/planningStore';
import { BookingCategories } from './components/BookingCategories';
import { BookingTimeline } from './components/BookingTimeline';

export function Booking() {
  const router = useRouter();
  const [filter, setFilter] = useState(BookingFilter.ALL);
  const [sort, setSort] = useState(BOOKING_SORT.UPDATED);
  const [categoryKey, setCategoryKey] = useState(null);
  const [query, setQuery] = useState('');
  const { bookings, allBookings, summary, currency, wedding } = useBookings({ filter, sort });
  const tasks = usePlanningStore(selectAllTasks);

  const visibleBookings = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return bookings.filter((booking) => {
      const matchesCategory = !categoryKey || booking.categoryKey === categoryKey;
      const matchesQuery =
        !term ||
        [booking.name, booking.contactName, booking.city, booking.notes]
          .filter(Boolean)
          .some((value) => value.toLocaleLowerCase().includes(term));
      return matchesCategory && matchesQuery;
    });
  }, [bookings, categoryKey, query]);

  if (!wedding) {
    return (
      <Screen>
        <Stack gap="lg">
          <PageHeader eyebrow={BOOKING_COPY.screenEyebrow} title={BOOKING_COPY.screenTitle} />
          <EmptyState
            icon="vendors"
            title="Set up your wedding first"
            message="Your booking list is part of your wedding workspace."
            actionLabel="Go to setup"
            onAction={() => router.push(Routes.onboarding)}
          />
        </Stack>
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack gap="lg">
        <PageHeader
          eyebrow={BOOKING_COPY.screenEyebrow}
          title={BOOKING_COPY.screenTitle}
          subtitle={BOOKING_COPY.screenSubtitle}
          actionLabel={BOOKING_COPY.addLabel}
          actionIcon="plus"
          onActionPress={() => router.push(Routes.bookingAdd)}
        />

        <BookingPipeline summary={summary} currency={currency} />

        <BookingTimeline
          weddingDate={wedding.date}
          tasks={tasks}
          onCategoryPress={setCategoryKey}
        />
        <BookingCategories bookings={allBookings} onCategoryPress={setCategoryKey} />
        <BookingTips />

        <Stack gap="sm">
          <SectionHeader eyebrow={BOOKING_COPY.filterEyebrow} title="Your shortlist" />
          <BookingFilters value={filter} onChange={setFilter} />
          <TextField
            label="Search vendors"
            value={query}
            onChangeText={setQuery}
            placeholder="Name, contact or city"
            icon="search"
            autoCapitalize="none"
          />
          <Stack gap="xs">
            <Text variant="eyebrow" color="subtle">Sort by</Text>
            <BookingFiltersSort value={sort} onChange={setSort} options={BOOKING_SORT_OPTIONS} />
          </Stack>
          <Stack gap="xs">
            <Text variant="eyebrow" color="subtle">Category</Text>
            <BookingCategoryFilter value={categoryKey} onChange={setCategoryKey} />
          </Stack>
        </Stack>

        <Stack gap="sm">
          <SectionHeader
            eyebrow={BOOKING_COPY.listEyebrow}
            title={BOOKING_COPY.listTitle}
            subtitle={`${visibleBookings.length} ${visibleBookings.length === 1 ? 'vendor' : 'vendors'}`}
          />
          {visibleBookings.length ? (
            <Card padding="md">
              <Stack gap="none">
                {visibleBookings.map((booking) => (
                  <BookingRow
                    key={booking.id}
                    booking={booking}
                    currency={currency}
                    onPress={(item) => router.push(Routes.bookingDetail(item.id))}
                  />
                ))}
              </Stack>
            </Card>
          ) : (
            <EmptyState
              icon="vendors"
              compact
              title={bookings.length ? BOOKING_COPY.emptyFilteredTitle : BOOKING_COPY.heroEmptyTitle}
              message={bookings.length ? BOOKING_COPY.emptyFilteredBody : BOOKING_COPY.heroEmptyBody}
              actionLabel={bookings.length ? 'Clear filters' : BOOKING_COPY.addLabel}
              onAction={
                bookings.length
                  ? () => {
                      setFilter(BookingFilter.ALL);
                      setCategoryKey(null);
                      setQuery('');
                    }
                  : () => router.push(Routes.bookingAdd)
              }
            />
          )}
        </Stack>
      </Stack>
    </Screen>
  );
}

function BookingFiltersSort({ value, onChange, options }) {
  return (
    <Row gap="xs" wrap align="flex-start">
      {options.map((option) => (
        <Chip
          key={option.value}
          label={option.label}
          size="sm"
          selected={value === option.value}
          onPress={() => onChange(option.value)}
        />
      ))}
    </Row>
  );
}

function BookingCategoryFilter({ value, onChange }) {
  return (
    <Row gap="xs" wrap align="flex-start">
      <Chip label="All types" size="sm" selected={value === null} onPress={() => onChange(null)} />
      {VENDOR_CATEGORIES.map((category) => (
        <Chip
          key={category.key}
          label={category.name}
          size="sm"
          selected={value === category.key}
          onPress={() => onChange(category.key)}
        />
      ))}
    </Row>
  );
}

export default Booking;
