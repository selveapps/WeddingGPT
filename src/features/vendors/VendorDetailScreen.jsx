import React, { useState } from 'react';
import { Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  Badge,
  Button,
  Card,
  ConfirmSheet,
  EmptyState,
  Screen,
  ScreenHeader,
  SectionHeader,
  Stack,
  Text,
  useToast,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { VENDOR_STATUS_META, VendorStatus, paymentTotals } from '@/models';
import { formatMoney } from '@/lib/currency';
import { formatMediumDate } from '@/lib/date';
import { Routes } from '@/navigation/routes';

import { VendorAppointments } from './components/VendorAppointments';
import { VendorPaymentPlan } from './components/VendorPaymentPlan';
import { VENDOR_COPY, QUICK_ACTION_DEFS } from './lib/vendorConstants';
import { contactUrl, vendorCategory } from './lib/vendorHelpers';
import { useVendors } from './hooks/useVendors';

export function VendorDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const toast = useToast();
  const { spacing } = useTheme();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmBudget, setConfirmBudget] = useState(false);
  const { allVendors, currency, setStatus, removeVendor, togglePaymentPaid, addToBudget } = useVendors();

  const vendor = allVendors.find((item) => item.id === String(id));

  if (!vendor) {
    return (
      <Screen bottomInset={spacing.xxl}>
        <Stack gap="lg">
          <ScreenHeader eyebrow={VENDOR_COPY.detailEyebrow} title="" />
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

  const category = vendorCategory(vendor.categoryKey);
  const status = VENDOR_STATUS_META[vendor.status] ?? VENDOR_STATUS_META[VendorStatus.SAVED];
  const totals = paymentTotals(vendor);
  const canAddToBudget = vendor.status === VendorStatus.BOOKED && totals.total > 0 && !vendor.expenseId;

  const changeStatus = (nextStatus) => {
    setStatus(vendor.id, nextStatus);
    toast.success(nextStatus === VendorStatus.BOOKED ? VENDOR_COPY.markBookedSuccess : 'Vendor updated');
  };

  const openContact = async (value, kind) => {
    try {
      await Linking.openURL(contactUrl(value, kind));
    } catch {
      toast.error('Could not open that contact link.');
    }
  };

  const sendToBudget = () => {
    setConfirmBudget(false);
    if (addToBudget(vendor)) toast.success(VENDOR_COPY.budgetSuccess);
    else toast.error('Could not add this to your budget.');
  };

  const deleteVendor = () => {
    removeVendor(vendor.id);
    setConfirmDelete(false);
    toast.success(VENDOR_COPY.deleteSuccess);
    router.replace(Routes.vendors);
  };

  const hasContact = vendor.contactName || vendor.email || vendor.phone || vendor.website;

  return (
    <Screen bottomInset={spacing.xxl}>
      <Stack gap="lg">
        <ScreenHeader
          eyebrow={[category?.name, vendor.city].filter(Boolean).join(' · ') || VENDOR_COPY.detailEyebrow}
          title={vendor.name}
          actionIcon="edit"
          actionLabel="Edit vendor"
          onActionPress={() => router.push(Routes.vendorEdit(vendor.id))}
        />

        <Card>
          <Stack gap="md">
            <Badge label={status.label} tone={status.tone} />
            {vendor.quotedAmount != null ? (
              <Text variant="h2" heading>
                {formatMoney(vendor.quotedAmount, currency)}
              </Text>
            ) : null}
            {vendor.priceHint ? (
              <Text variant="body" color="muted">
                {vendor.priceHint}
              </Text>
            ) : null}
            {vendor.quoteScope ? (
              <Stack gap="xxs">
                <Text variant="label">Quote includes</Text>
                <Text variant="body" color="muted">
                  {vendor.quoteScope}
                </Text>
              </Stack>
            ) : null}
            {vendor.quoteValidUntil ? (
              <Text variant="caption" color="subtle">
                Quote valid until {formatMediumDate(vendor.quoteValidUntil)}
              </Text>
            ) : null}
          </Stack>
        </Card>

        <Stack gap="sm">
          <SectionHeader eyebrow={VENDOR_COPY.paymentsEyebrow} title={VENDOR_COPY.paymentsTitle} />
          <VendorPaymentPlan
            vendor={vendor}
            currency={currency}
            onTogglePaid={(payment) => togglePaymentPaid(vendor.id, payment.id)}
          />
          {vendor.expenseId ? (
            <Text variant="caption" color="subtle">
              {VENDOR_COPY.budgetLinked}
            </Text>
          ) : null}
          <Button
            label={vendor.quotedAmount ? 'Read a new quote' : 'Read their quote'}
            variant="secondary"
            iconLeft="note"
            onPress={() => router.push(Routes.quoteReader(vendor.id))}
          />
          {canAddToBudget ? (
            <Button
              label={VENDOR_COPY.budgetLabel}
              variant="secondary"
              iconLeft="budget"
              onPress={() => setConfirmBudget(true)}
            />
          ) : null}
        </Stack>

        <Stack gap="sm">
          <SectionHeader eyebrow={VENDOR_COPY.contactEyebrow} title="Contact" />
          <Card>
            <Stack gap="sm">
              {vendor.contactName ? <Info label="Contact" value={vendor.contactName} /> : null}
              {vendor.email ? (
                <Button
                  label={vendor.email}
                  variant="ghost"
                  iconLeft="mail"
                  fullWidth={false}
                  onPress={() => openContact(vendor.email, 'mailto')}
                />
              ) : null}
              {vendor.phone ? (
                <Button
                  label={vendor.phone}
                  variant="ghost"
                  iconLeft="phone"
                  fullWidth={false}
                  onPress={() => openContact(vendor.phone, 'tel')}
                />
              ) : null}
              {vendor.website ? (
                <Button
                  label={vendor.website}
                  variant="ghost"
                  fullWidth={false}
                  onPress={() => openContact(vendor.website, 'website')}
                />
              ) : null}
              {!hasContact ? (
                <Text variant="body" color="subtle">
                  No contact details added yet.
                </Text>
              ) : null}
            </Stack>
          </Card>
        </Stack>

        <VendorAppointments vendor={vendor} />

        {vendor.notes ? (
          <Stack gap="sm">
            <SectionHeader eyebrow={VENDOR_COPY.notesEyebrow} title={VENDOR_COPY.notesTitle} />
            <Card>
              <Text variant="body" color="muted">
                {vendor.notes}
              </Text>
            </Card>
          </Stack>
        ) : null}

        <Stack gap="sm">
          <SectionHeader title={VENDOR_COPY.quickActionsTitle} />
          {QUICK_ACTION_DEFS.filter(
            (action) => action.status !== vendor.status && action.from.includes(vendor.status)
          ).map((action) => (
            <Button
              key={action.id}
              label={action.label}
              iconLeft={action.icon}
              variant={action.id === 'book' ? 'primary' : 'secondary'}
              onPress={() => changeStatus(action.status)}
            />
          ))}
        </Stack>

        <Button label={VENDOR_COPY.deleteLabel} variant="danger" onPress={() => setConfirmDelete(true)} />
      </Stack>

      <ConfirmSheet
        visible={confirmBudget}
        onClose={() => setConfirmBudget(false)}
        onConfirm={sendToBudget}
        title={VENDOR_COPY.budgetConfirmTitle}
        message={`This adds a ${formatMoney(totals.total, currency)} committed expense for ${vendor.name} to your Budget tab, with ${formatMoney(totals.paid, currency)} already paid.`}
        confirmLabel={VENDOR_COPY.budgetLabel}
        icon="budget"
      />

      <ConfirmSheet
        visible={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={deleteVendor}
        title={VENDOR_COPY.deleteConfirmTitle}
        message={VENDOR_COPY.deleteConfirmMessage}
        confirmLabel={VENDOR_COPY.deleteLabel}
        cancelLabel="Keep vendor"
        destructive
        icon="trash"
      />
    </Screen>
  );
}

function Info({ label, value }) {
  return (
    <Stack gap="xxs">
      <Text variant="eyebrow" color="subtle">
        {label}
      </Text>
      <Text variant="body">{value}</Text>
    </Stack>
  );
}

export default VendorDetailScreen;
