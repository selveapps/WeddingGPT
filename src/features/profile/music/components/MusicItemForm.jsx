import React, { useState } from 'react';
import { Button, Chip, Row, Stack, Text, TextField } from '@/design-system/components';
import { MUSIC_KINDS, MUSIC_STATUSES, normaliseMusicItem, validateMusicItem } from '../lib/musicHelpers';

const EMPTY = { title: '', artist: '', moment: '', kind: 'request', status: 'queued' };
const STATUS_LABEL = { queued: 'Queued', approved: 'Approved', played: 'Played' };

export function MusicItemForm({ initialValue, onSave, onCancel }) {
  const [values, setValues] = useState(() => ({ ...EMPTY, ...initialValue }));
  const [errors, setErrors] = useState({});
  const set = (key) => (value) => setValues((current) => ({ ...current, [key]: value }));
  const save = () => {
    const result = validateMusicItem(values);
    setErrors(result.errors);
    if (result.isValid && onSave(normaliseMusicItem(values))) setValues(EMPTY);
  };
  return (
    <Stack gap="sm" testID="music-item-form">
      <TextField
        label="Song title"
        value={values.title}
        onChangeText={set('title')}
        error={errors.title}
        maxLength={100}
        placeholder="Song name"
      />
      <TextField
        label="Artist"
        value={values.artist}
        onChangeText={set('artist')}
        error={errors.artist}
        maxLength={80}
        placeholder="Artist or performer"
      />
      <TextField
        label="Event moment"
        value={values.moment}
        onChangeText={set('moment')}
        error={errors.moment}
        maxLength={60}
        placeholder="First dance, dinner, open dance floor…"
      />
      <Text variant="label">Playlist guidance</Text>
      <Row gap="xs" wrap>
        {MUSIC_KINDS.map((kind) => (
          <Chip
            key={kind}
            label={kind === 'request' ? 'Request' : 'Do not play'}
            selected={values.kind === kind}
            onPress={() => set('kind')(kind)}
            testID={`music-kind-${kind}`}
          />
        ))}
      </Row>
      {errors.kind ? (
        <Text variant="caption" color="danger">
          {errors.kind}
        </Text>
      ) : null}
      <Text variant="label">Status</Text>
      <Row gap="xs" wrap>
        {MUSIC_STATUSES.map((status) => (
          <Chip
            key={status}
            label={STATUS_LABEL[status]}
            selected={values.status === status}
            onPress={() => set('status')(status)}
          />
        ))}
      </Row>
      <Row gap="sm">
        <Button
          label={initialValue ? 'Save changes' : 'Add song'}
          size="sm"
          onPress={save}
          testID="music-save"
        />
        {onCancel ? <Button label="Cancel" variant="ghost" size="sm" onPress={onCancel} /> : null}
      </Row>
    </Stack>
  );
}

export default MusicItemForm;
