import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';

import {
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
import {
  useEventStore,
  useGuestStore,
  usePartyStore,
  useRunOfShowStore,
  useSeatingStore,
  useVendorStore,
  useWeddingStore,
  selectAllGuests,
  selectAllVendors,
  selectEvents,
  selectPartyMembers,
  selectRunOfShow,
  selectSeatingTables,
  selectWedding,
} from '@/store';
import {
  buildEventPlan,
  coupleDisplayName,
  eventName,
  eventPlanHtml,
  eventPlanText,
  sortEvents,
} from '@/models';
import { CAN_PRINT, printPage } from '@/services/files';
import { Routes } from '@/navigation/routes';

/**
 * One page per event (slice G3): when and where, the run of show, the
 * caterer's numbers, who sits where and who to call - for the planner, the
 * venue or a parent. In a browser it prints (or saves as PDF); on a phone it
 * goes to the share sheet as text.
 */
export function EventPlanScreen({ initialEventId = null }) {
  const router = useRouter();
  const toast = useToast();
  const { spacing } = useTheme();

  const wedding = useWeddingStore(selectWedding);
  const events = useEventStore(selectEvents);
  const guests = useGuestStore(selectAllGuests);
  const tables = useSeatingStore(selectSeatingTables);
  const runOfShow = useRunOfShowStore(selectRunOfShow);
  const vendors = useVendorStore(selectAllVendors);
  const party = usePartyStore(selectPartyMembers);

  const [eventId, setEventId] = useState(initialEventId);
  const sortedEvents = useMemo(() => sortEvents(events), [events]);
  // An event deleted elsewhere falls back to the wedding day.
  const event = sortedEvents.find((entry) => entry.id === eventId) ?? null;

  const plan = useMemo(
    () => buildEventPlan({ event, wedding, guests, tables, runOfShow, vendors, party }),
    [event, wedding, guests, tables, runOfShow, vendors, party]
  );
  const title = wedding ? `${coupleDisplayName(wedding)}'s wedding` : '';
  const empty =
    !plan.schedule.length && !plan.seating.length && !plan.guests.invited && !plan.contacts.length;

  const print = async () => {
    const result = await printPage({
      html: eventPlanHtml(plan, { title }),
      text: [title, eventPlanText(plan)].filter(Boolean).join('\n\n'),
      title: plan.name,
    });
    if (result === 'failed')
      toast.error(CAN_PRINT ? 'Could not open the print dialog' : 'Sharing is not available here');
  };

  return (
    <Screen
      bottomInset={spacing.xxl}
      footer={
        empty ? null : (
          <Button
            label={CAN_PRINT ? 'Print or save as PDF' : 'Share the plan'}
            iconLeft={CAN_PRINT ? 'note' : 'send'}
            onPress={print}
          />
        )
      }
    >
      <Stack gap="lg">
        <ScreenHeader eyebrow="Planning" title="Printable plan" />

        {sortedEvents.length ? (
          <Row gap="xs" wrap align="flex-start">
            <Chip label="The wedding day" size="sm" selected={!event} onPress={() => setEventId(null)} />
            {sortedEvents.map((entry) => (
              <Chip
                key={entry.id}
                label={eventName(entry)}
                size="sm"
                selected={event?.id === entry.id}
                onPress={() => setEventId(entry.id)}
              />
            ))}
          </Row>
        ) : null}

        {empty ? (
          <EmptyState
            icon="checklist"
            title="Nothing to print yet"
            message={`Add a run of show, guests or tables for ${event ? `the ${plan.name.toLowerCase()}` : 'the day'} and they will appear here.`}
            actionLabel="Plan the run of show"
            onAction={() => router.push(Routes.runOfShow(event?.id ?? null))}
          />
        ) : (
          <>
            <Card>
              <Stack gap="xxs">
                <Text variant="displaySm">{plan.name}</Text>
                {[
                  [plan.date, plan.when].filter(Boolean).join(', '),
                  [plan.venue, plan.address].filter(Boolean).join(', '),
                ]
                  .filter(Boolean)
                  .map((line) => (
                    <Text key={line} variant="bodySm" color="muted">
                      {line}
                    </Text>
                  ))}
                {plan.dressCode ? <Text variant="bodySm">{`Dress code: ${plan.dressCode}`}</Text> : null}
                <Text variant="bodyStrong">
                  {`${plan.guests.attending} attending of ${plan.guests.invited} invited · ${plan.catering.headcount} plates`}
                </Text>
              </Stack>
            </Card>

            {plan.schedule.length ? (
              <Stack gap="xs">
                <SectionHeader title="Schedule" />
                <Card>
                  <Stack gap="xs">
                    {plan.schedule.map((item, index) => (
                      <Row key={`${item.time}-${index}`} gap="md" align="flex-start">
                        <Text variant="labelStrong" style={{ width: 150 }}>
                          {item.time}
                        </Text>
                        <Stack gap="hair" style={{ flex: 1 }}>
                          <Text variant="body">{item.title}</Text>
                          {item.details ? (
                            <Text variant="caption" color="muted">
                              {item.details}
                            </Text>
                          ) : null}
                        </Stack>
                      </Row>
                    ))}
                  </Stack>
                </Card>
              </Stack>
            ) : null}

            {plan.catering.allergens.length ? (
              <Stack gap="xs">
                <SectionHeader title="Allergies to check" />
                <Card tone="accent">
                  <Stack gap="xxs">
                    {plan.catering.allergens.map((allergen) => (
                      <Text key={allergen.label} variant="bodySm">
                        {`${allergen.label}: ${allergen.guests.join(', ')}`}
                      </Text>
                    ))}
                  </Stack>
                </Card>
              </Stack>
            ) : null}

            {plan.seating.length ? (
              <Stack gap="xs">
                <SectionHeader
                  title="Seating"
                  subtitle={plan.unseated ? `${plan.unseated} without a seat yet` : undefined}
                />
                <Card>
                  <Stack gap="xs">
                    {plan.seating.map((table) => (
                      <Stack key={table.name} gap="hair">
                        <Text variant="labelStrong">{`${table.name} · ${table.guests.length}/${table.capacity}`}</Text>
                        <Text variant="bodySm" color="muted">
                          {table.guests.join(', ') || 'Empty'}
                        </Text>
                      </Stack>
                    ))}
                  </Stack>
                </Card>
              </Stack>
            ) : null}

            {plan.contacts.length ? (
              <Stack gap="xs">
                <SectionHeader title="Contacts" />
                <Card>
                  <Stack gap="xs">
                    {plan.contacts.map((contact) => (
                      <Stack key={`${contact.name}-${contact.role}`} gap="hair">
                        <Text variant="bodyStrong">{`${contact.name} · ${contact.role}`}</Text>
                        <Text variant="caption" color="muted">
                          {[contact.phone, contact.email].filter(Boolean).join(' · ')}
                        </Text>
                      </Stack>
                    ))}
                  </Stack>
                </Card>
              </Stack>
            ) : null}
          </>
        )}
      </Stack>
    </Screen>
  );
}
