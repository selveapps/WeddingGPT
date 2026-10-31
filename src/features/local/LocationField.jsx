import React, { useState } from 'react';

import { Stack, Button, TextField, useToast } from '@/design-system/components';
import { getCurrentPlace, locationErrorMessage } from '@/services/location';
import haptics from '@/lib/haptics';

/**
 * Where the wedding is: a city field with a "Use my current location" button.
 *
 * `onChangeText` fires on every keystroke; `onLocate` fires once a location
 * lookup succeeds, with `{ label, city, region, country }`, so the caller can
 * save the whole place at once and move on. A failed lookup leaves the field
 * as it was and says so in a toast - typing the city always works.
 */
export function LocationField({
  value,
  onChangeText,
  onLocate,
  onSubmitEditing,
  autoFocus = false,
  label = 'City',
}) {
  const toast = useToast();
  const [locating, setLocating] = useState(false);

  const locate = async () => {
    if (locating) return;
    setLocating(true);
    const { place, error } = await getCurrentPlace();
    setLocating(false);
    if (error) {
      toast.error(locationErrorMessage(error));
      return;
    }
    haptics.success();
    onChangeText?.(place.label);
    onLocate?.(place);
  };

  return (
    <Stack gap="sm">
      <TextField
        label={label}
        value={value}
        onChangeText={onChangeText}
        placeholder="e.g. Austin, TX"
        autoCapitalize="words"
        autoCorrect={false}
        returnKeyType="done"
        onSubmitEditing={onSubmitEditing}
        autoFocus={autoFocus}
      />
      <Button
        label={locating ? 'Finding you...' : 'Use my current location'}
        variant="soft"
        size="md"
        iconLeft="location"
        loading={locating}
        onPress={locate}
      />
    </Stack>
  );
}

export default LocationField;
