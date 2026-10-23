import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';

import {
  Badge,
  BottomSheet,
  Button,
  Card,
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
import {
  selectAllGuests,
  selectAllHouseholds,
  selectWeddingId,
  useGuestStore,
  useWeddingStore,
} from '@/store';
import { guestFullName } from '@/models';
import {
  CAN_DOWNLOAD_FILES,
  CAN_PICK_FILES,
  datedFilename,
  exportTextFile,
  pickTextFile,
} from '@/services/files';

import {
  GUEST_FIELD_META,
  GuestField,
  buildImportPreview,
  guestsToCsv,
  importDrafts,
  mappingHasName,
  readGuestCsv,
  summariseImportPreview,
} from './lib/guestCsv';

const PREVIEW_ROWS = 25;

const STATUS_BADGE = {
  ready: { label: 'Ready', tone: 'success' },
  duplicate: { label: 'Already on list', tone: 'neutral' },
  error: { label: 'Needs a fix', tone: 'danger' },
};

/**
 * Export the guest list as a spreadsheet, or import one.
 *
 * Import is three steps - load, check the columns, preview - and nothing is
 * written until the last one. Duplicates and rows with problems are shown with
 * the reason, and skipped.
 */
export function GuestSpreadsheetScreen() {
  const router = useRouter();
  const toast = useToast();
  const { spacing } = useTheme();

  const guests = useGuestStore(selectAllGuests);
  const households = useGuestStore(selectAllHouseholds);
  const weddingId = useWeddingStore(selectWeddingId);
  const { addGuests, addHousehold } = useGuestStore.getState();

  const [text, setText] = useState('');
  const [fileName, setFileName] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [mapping, setMapping] = useState([]);
  const [editingColumn, setEditingColumn] = useState(null);

  const preview = useMemo(
    () => (parsed ? buildImportPreview(parsed.rows, mapping, { existingGuests: guests }) : null),
    [parsed, mapping, guests]
  );
  const summary = preview ? summariseImportPreview(preview) : null;
  const canImport = Boolean(summary?.ready) && mappingHasName(mapping);

  // --- Export ----------------------------------------------------------------

  const exportList = async () => {
    const result = await exportTextFile({
      filename: datedFilename('guest-list'),
      text: guestsToCsv(guests, households),
      title: 'Guest list',
    });
    if (result === 'downloaded') toast.success('Guest list downloaded');
    else if (result === 'failed') toast.error('Could not export the guest list');
  };

  // --- Import ----------------------------------------------------------------

  const load = (source, name = null) => {
    const result = readGuestCsv(source);
    if (result.rows.length < 2) {
      toast.error('That needs a header row and at least one guest.');
      return;
    }
    setParsed(result);
    setMapping(result.mapping);
    setFileName(name);
  };

  const chooseFile = async () => {
    const file = await pickTextFile();
    if (!file) return;
    if (file.error === 'too_large') toast.error('That file is over 2 MB - is it the right one?');
    else if (file.error) toast.error('Could not read that file.');
    else {
      setText('');
      load(file.text, file.name);
    }
  };

  const startOver = () => {
    setParsed(null);
    setMapping([]);
    setFileName(null);
  };

  const runImport = () => {
    const added = importDrafts(preview, { weddingId, households, addHousehold, addGuests });
    toast.success(`${added.length} ${added.length === 1 ? 'guest' : 'guests'} added`);
    router.back();
  };

  const setColumnField = (column, field) => {
    setMapping((current) =>
      current.map((existing, index) => {
        if (index === column) return field;
        // One column per field, except "don't import".
        return field !== GuestField.IGNORE && existing === field ? GuestField.IGNORE : existing;
      })
    );
    setEditingColumn(null);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen
        bottomInset={spacing.xxl}
        footer={
          parsed ? (
            <Button
              label={
                canImport
                  ? `Import ${summary.ready} ${summary.ready === 1 ? 'guest' : 'guests'}`
                  : 'Nothing to import yet'
              }
              iconLeft="userPlus"
              disabled={!canImport}
              onPress={runImport}
            />
          ) : null
        }
      >
        <Stack gap="xl">
          <ScreenHeader eyebrow="Guests" title="Spreadsheet" />

          {/* --- Export ----------------------------------------------------- */}
          <Stack gap="sm">
            <SectionHeader title="Export your list" />
            <Card>
              <Stack gap="sm">
                <Text variant="bodySm" color="muted">
                  {CAN_DOWNLOAD_FILES
                    ? 'A CSV file that opens in Excel, Numbers or Google Sheets - handy for your caterer or planner.'
                    : 'Shares the list as CSV text. Save it to Files or paste it into Google Sheets.'}
                </Text>
                <Button
                  label={`Export ${guests.length} ${guests.length === 1 ? 'guest' : 'guests'}`}
                  variant="secondary"
                  iconLeft="send"
                  disabled={guests.length === 0}
                  onPress={exportList}
                />
              </Stack>
            </Card>
          </Stack>

          {/* --- Import: load ----------------------------------------------- */}
          {!parsed ? (
            <Stack gap="sm">
              <SectionHeader
                title="Import guests"
                subtitle="From a spreadsheet with a header row: names, and anything else you have."
              />
              {CAN_PICK_FILES ? (
                <Button label="Choose a CSV file" iconLeft="plus" onPress={chooseFile} />
              ) : null}
              <TextField
                label={CAN_PICK_FILES ? 'Or paste the rows' : 'Paste the rows'}
                value={text}
                onChangeText={setText}
                multiline
                numberOfLines={8}
                placeholder={'First name,Last name,Email,RSVP\nMeera,Shah,meera@example.com,Yes'}
                helper="In Sheets or Excel, select the cells including the header row, copy, and paste here."
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Button
                label="Read these rows"
                variant="secondary"
                disabled={!text.trim()}
                onPress={() => load(text)}
              />
            </Stack>
          ) : null}

          {/* --- Import: columns -------------------------------------------- */}
          {parsed ? (
            <Stack gap="sm">
              <SectionHeader
                title="Check the columns"
                subtitle={fileName ? `From ${fileName}` : 'Tap a column to change what it holds.'}
                actionLabel="Start over"
                onActionPress={startOver}
              />
              {!mappingHasName(mapping) ? (
                <Card tone="sunken">
                  <Text variant="bodySm" color="danger">
                    Pick the column with first names, or a full name, to import.
                  </Text>
                </Card>
              ) : null}
              <Card padding="none">
                {parsed.headers.map((header, column) => (
                  <ListRow
                    key={`${column}-${header}`}
                    title={header || `Column ${column + 1}`}
                    subtitle={`e.g. ${parsed.rows[1]?.[column] || '(empty)'}`}
                    meta={GUEST_FIELD_META[mapping[column]].label}
                    onPress={() => setEditingColumn(column)}
                  />
                ))}
              </Card>
            </Stack>
          ) : null}

          {/* --- Import: preview -------------------------------------------- */}
          {preview ? (
            <Stack gap="sm">
              <SectionHeader
                title="Preview"
                subtitle={[
                  `${summary.ready} to add`,
                  summary.duplicate ? `${summary.duplicate} already on your list` : null,
                  summary.error ? `${summary.error} need a fix` : null,
                  summary.households ? `${summary.households} households` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              />
              <Card padding="none">
                {preview.rows.slice(0, PREVIEW_ROWS).map((row) => {
                  const badge = STATUS_BADGE[row.status];
                  return (
                    <ListRow
                      key={row.line}
                      title={guestFullName(row.draft) || `Row ${row.line}`}
                      subtitle={
                        row.errors.length
                          ? `Row ${row.line}: ${row.errors.join(', ')}`
                          : [row.household, row.draft.email].filter(Boolean).join(' · ') || `Row ${row.line}`
                      }
                      trailing={<Badge label={badge.label} tone={badge.tone} />}
                      showChevron={false}
                    />
                  );
                })}
              </Card>
              {preview.rows.length > PREVIEW_ROWS ? (
                <Text variant="caption" color="subtle">
                  Showing the first {PREVIEW_ROWS} of {preview.rows.length} rows.
                </Text>
              ) : null}
              {summary.error ? (
                <Text variant="caption" color="subtle">
                  Rows that need a fix are skipped. Correct them in the spreadsheet and import again - guests
                  already added are recognised and not doubled.
                </Text>
              ) : null}
            </Stack>
          ) : null}
        </Stack>

        <BottomSheet
          visible={editingColumn !== null}
          onClose={() => setEditingColumn(null)}
          title={editingColumn !== null ? `"${parsed?.headers[editingColumn] || 'Column'}" holds` : ''}
        >
          <Row gap="xs" wrap>
            {Object.values(GuestField).map((field) => (
              <Button
                key={field}
                label={GUEST_FIELD_META[field].label}
                size="sm"
                fullWidth={false}
                variant={editingColumn !== null && mapping[editingColumn] === field ? 'primary' : 'secondary'}
                onPress={() => setColumnField(editingColumn, field)}
              />
            ))}
          </Row>
        </BottomSheet>
      </Screen>
    </KeyboardAvoidingView>
  );
}

export default GuestSpreadsheetScreen;
