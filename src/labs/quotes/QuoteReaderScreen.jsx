import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';

import {
  Stack,
  Row,
  Text,
  Card,
  Badge,
  Chip,
  Button,
  TextField,
  ListRow,
  SectionHeader,
  useToast,
} from '@/design-system/components';
import { VENDOR_CATEGORIES } from '@/models';
import { formatMoney } from '@/lib/currency';
import { formatMediumDate } from '@/lib/date';

import { LabScreen } from '../shared/LabScreen';
import { shareText } from '../shared/share';
import { useLabVendorStore } from '../vendors/store';
import { SAMPLE_QUOTE, extractQuote, hasFindings, quoteSummary, toLabVendor } from './model';

export default function QuoteReaderScreen() {
  const router = useRouter();
  const toast = useToast();
  const addVendor = useLabVendorStore((state) => state.add);

  const [text, setText] = useState('');
  const [categoryKey, setCategoryKey] = useState(null);
  const result = useMemo(() => (text.trim() ? extractQuote(text) : null), [text]);

  const share = async () => {
    const ok = await shareText(quoteSummary(result), 'Quote summary');
    if (!ok) toast.error('Sharing is not available here');
  };

  const saveToVendors = () => {
    addVendor(toLabVendor(result, categoryKey));
    toast.success('Saved to the Labs vendor manager');
    router.push('/labs/vendors');
  };

  return (
    <LabScreen
      title="Quote reader"
      intro="Paste a quote or contract and get the numbers, the dates and the fine print worth a second look. Always check against the original."
    >
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

      {result && !hasFindings(result) ? (
        <Text variant="bodySm" color="muted">
          No prices or dates found yet. Make sure the amounts include a $ sign.
        </Text>
      ) : null}

      {result && hasFindings(result) ? (
        <>
          <Card tone="brand">
            <Stack gap="sm">
              {result.vendorName ? <Text variant="h3">{result.vendorName}</Text> : null}
              <Row justify="space-between">
                <Stat label="Total" value={result.total} />
                <Stat
                  label={result.depositPercent ? `Deposit (${result.depositPercent}%)` : 'Deposit'}
                  value={result.deposit}
                />
                <Stat label="Balance" value={result.balance} />
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
                  <ListRow key={`${date.label}-${date.iso}`} title={date.label} meta={formatMediumDate(date.iso)} showChevron={false} />
                ))}
                {result.eventDate ? (
                  <ListRow title="Event date" meta={formatMediumDate(result.eventDate)} showChevron={false} />
                ) : null}
                {result.expiresOn ? (
                  <ListRow title="Quote valid until" meta={formatMediumDate(result.expiresOn)} showChevron={false} />
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
                    meta={formatMoney(item.amount)}
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
            <SectionHeader title="Save it" subtitle="Pick a category to add this vendor to the Labs vendor manager." />
            <Row gap="xs" wrap>
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
            <Button label="Save to vendor manager" onPress={saveToVendors} disabled={!categoryKey || !result.total} />
            <Button label="Share summary" variant="secondary" iconLeft="send" onPress={share} />
          </Stack>
        </>
      ) : null}
    </LabScreen>
  );
}

function Stat({ label, value }) {
  return (
    <Stack gap="hair">
      <Text variant="caption" color="muted">
        {label}
      </Text>
      <Text variant="bodyStrong">{value === null ? '-' : formatMoney(value)}</Text>
    </Stack>
  );
}
