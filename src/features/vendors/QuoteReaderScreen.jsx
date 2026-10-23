import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';

import {
  Badge,
  Button,
  Card,
  Chip,
  ConfirmSheet,
  ListRow,
  Row,
  Screen,
  ScreenHeader,
  SectionHeader,
  Stack,
  Text,
  TextField,
  useToast,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { Routes } from '@/navigation/routes';
import { useBudgetStore, useVendorStore, useWeddingStore, selectBudget, selectWedding } from '@/store';
import {
  SAMPLE_QUOTE,
  VENDOR_CATEGORIES,
  extractQuote,
  hasFindings,
  quotePatchForVendor,
  quoteSummary,
  toVendorDraft,
} from '@/models';
import { formatMoney } from '@/lib/currency';
import { formatMediumDate } from '@/lib/date';
import { shareText } from '@/services/share';

/**
 * Read a quote (graduated from the Labs quote reader): paste a vendor's quote
 * or contract and get the total, deposit, balance, line items, due dates and
 * the fine print worth a second look. Nothing is saved until the couple
 * chooses to: as a new vendor, or as the quote of the vendor it was opened
 * from. Always worth checking against the original.
 */
export function QuoteReaderScreen({ vendorId = null }) {
  const router = useRouter();
  const toast = useToast();
  const { spacing } = useTheme();
  const wedding = useWeddingStore(selectWedding);
  const budget = useBudgetStore(selectBudget);
  const vendor = useVendorStore((state) => (vendorId ? (state.vendors.byId[vendorId] ?? null) : null));
  const { addVendor, updateVendor } = useVendorStore.getState();

  const [text, setText] = useState('');
  const [categoryKey, setCategoryKey] = useState(vendor?.categoryKey ?? null);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const result = useMemo(() => (text.trim() ? extractQuote(text) : null), [text]);
  const currency = budget?.currency ?? wedding?.currency;
  const money = (minor) => formatMoney(minor, currency);
  const found = result && hasFindings(result);
  const unpaid = (vendor?.payments ?? []).filter((payment) => !payment.paidAt).length;

  const share = async () => {
    const ok = await shareText(quoteSummary(result), 'Quote summary');
    if (!ok) toast.error('Sharing is not available here');
  };

  const saveNew = () => {
    const saved = addVendor({ ...toVendorDraft(result, categoryKey), weddingId: wedding?.id ?? null });
    toast.success('Saved to your vendors');
    router.replace(Routes.vendorDetail(saved.id));
  };

  const saveToVendor = () => {
    updateVendor(vendor.id, quotePatchForVendor(result, vendor));
    setConfirmReplace(false);
    toast.success(`Quote saved to ${vendor.name}`);
    router.back();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen bottomInset={spacing.xxl}>
        <Stack gap="lg">
          <ScreenHeader eyebrow={vendor ? vendor.name : 'Vendors'} title="Read a quote" />
          <Text variant="body" color="muted">
            Paste the text of a quote or contract. You get the numbers, the dates and the fine print to look
            at twice - always check them against the original.
          </Text>

          <TextField
            label="Paste the quote"
            value={text}
            onChangeText={setText}
            multiline
            numberOfLines={8}
            placeholder="Copy the text from the vendor's email or PDF"
          />
          {!text ? (
            <Button label="Try a sample quote" variant="ghost" onPress={() => setText(SAMPLE_QUOTE)} />
          ) : null}

          {result && !found ? (
            <Text variant="bodySm" color="muted">
              No prices or dates found yet. Make sure the amounts include a currency sign, like $1,200.
            </Text>
          ) : null}

          {found ? (
            <>
              <Card tone="raised">
                <Stack gap="sm">
                  {result.vendorName ? <Text variant="h3">{result.vendorName}</Text> : null}
                  <Row justify="space-between">
                    <Stat label="Total" value={result.total} money={money} />
                    <Stat
                      label={result.depositPercent ? `Deposit (${result.depositPercent}%)` : 'Deposit'}
                      value={result.deposit}
                      money={money}
                    />
                    <Stat label="Balance" value={result.balance} money={money} />
                  </Row>
                </Stack>
              </Card>

              {result.warnings.length ? (
                <Card tone="accent">
                  <Stack gap="xxs">
                    <Text variant="bodyStrong">Questions to ask</Text>
                    {result.warnings.map((warning) => (
                      <Text key={warning} variant="bodySm">
                        {warning}
                      </Text>
                    ))}
                  </Stack>
                </Card>
              ) : null}

              {result.dates.length || result.eventDate || result.expiresOn ? (
                <Stack gap="sm">
                  <SectionHeader title="Dates" />
                  <Card padding="none">
                    {result.dates.map((date) => (
                      <ListRow
                        key={`${date.label}-${date.iso}`}
                        title={date.label}
                        meta={formatMediumDate(date.iso)}
                        showChevron={false}
                      />
                    ))}
                    {result.eventDate ? (
                      <ListRow
                        title="Event date"
                        meta={formatMediumDate(result.eventDate)}
                        showChevron={false}
                      />
                    ) : null}
                    {result.expiresOn ? (
                      <ListRow
                        title="Quote valid until"
                        meta={formatMediumDate(result.expiresOn)}
                        showChevron={false}
                      />
                    ) : null}
                  </Card>
                </Stack>
              ) : null}

              {result.lineItems.length ? (
                <Stack gap="sm">
                  <SectionHeader title="Line items" />
                  <Card padding="none">
                    {result.lineItems.map((item, index) => (
                      <ListRow
                        key={`${item.label}-${index}`}
                        title={item.label}
                        meta={money(item.amount)}
                        trailing={item.isFee ? <Badge label="Fee" tone="neutral" /> : null}
                        showChevron={false}
                      />
                    ))}
                  </Card>
                </Stack>
              ) : null}

              {result.finePrint.length ? (
                <Stack gap="sm">
                  <SectionHeader title="Read carefully" />
                  {result.finePrint.map((flag) => (
                    <Card key={flag.key} tone="muted">
                      <Stack gap="xxs">
                        <Badge label={flag.label} tone="warning" />
                        <Text variant="bodySm">{flag.line}</Text>
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              ) : null}

              <Stack gap="sm">
                {vendor ? (
                  <Button
                    label={`Save as ${vendor.name}'s quote`}
                    disabled={!result.total}
                    onPress={() => (unpaid ? setConfirmReplace(true) : saveToVendor())}
                  />
                ) : (
                  <>
                    <SectionHeader
                      title="Save it"
                      subtitle="Pick a category to add this vendor to your list."
                    />
                    <Row gap="xs" wrap align="flex-start">
                      {VENDOR_CATEGORIES.map((category) => (
                        <Chip
                          key={category.key}
                          size="sm"
                          label={category.name}
                          selected={categoryKey === category.key}
                          onPress={() => setCategoryKey(category.key)}
                        />
                      ))}
                    </Row>
                    <Button
                      label="Save to my vendors"
                      onPress={saveNew}
                      disabled={!categoryKey || !result.total}
                    />
                  </>
                )}
                <Button label="Share summary" variant="secondary" iconLeft="send" onPress={share} />
              </Stack>
            </>
          ) : null}
        </Stack>

        {vendor ? (
          <ConfirmSheet
            visible={confirmReplace}
            onClose={() => setConfirmReplace(false)}
            onConfirm={saveToVendor}
            title="Replace the payment plan?"
            message={`${vendor.name}'s ${unpaid} unpaid ${unpaid === 1 ? 'payment' : 'payments'} will be replaced by this quote's deposit and balance. Payments already made are kept.`}
            confirmLabel="Replace"
          />
        ) : null}
      </Screen>
    </KeyboardAvoidingView>
  );
}

function Stat({ label, value, money }) {
  return (
    <Stack gap="hair">
      <Text variant="caption" color="muted">
        {label}
      </Text>
      <Text variant="bodyStrong">{value === null ? '-' : money(value)}</Text>
    </Stack>
  );
}

export default QuoteReaderScreen;
