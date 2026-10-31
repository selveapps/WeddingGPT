import React, { useState } from 'react';
import { Image } from 'react-native';

import { Button, Chip, Row, Stack, Text, TextField, useToast } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { PHOTOS_SUPPORTED, photoUri, pickPhoto, removePhoto } from '@/services/photos';
import { MAX_VISION_PHOTOS, VISION_CATEGORIES, VISION_MOODS } from '../lib/visionConstants';
import { validateVisionIdea, visionPhotoAspect } from '../lib/visionHelpers';

const EMPTY_IDEA = { title: '', category: 'other', moods: [], note: '', photo: null };

const PICK_MESSAGES = {
  denied: 'Allow photo access for WeddingGPT in Settings to add photos.',
  failed: 'Could not add that photo. Try another one.',
};

/**
 * Add an idea. On a phone it can carry a photo from the library (J1), kept
 * on this phone with the wedding's other photos.
 */
export function VisionIdeaForm({ onSave, weddingId = null, photoCount = 0 }) {
  const toast = useToast();
  const { radii } = useTheme();
  const [values, setValues] = useState(EMPTY_IDEA);
  const [errors, setErrors] = useState({});
  const [picking, setPicking] = useState(false);
  const preview = values.photo ? photoUri(weddingId, values.photo.key) : null;
  const photosFull = photoCount >= MAX_VISION_PHOTOS;

  const addPhoto = async () => {
    setPicking(true);
    const result = await pickPhoto(weddingId);
    setPicking(false);
    if (result.status === 'picked') {
      // Choosing again replaces the photo this idea had.
      if (values.photo) removePhoto(weddingId, values.photo.key);
      setValues((current) => ({ ...current, photo: result.photo }));
    } else if (PICK_MESSAGES[result.status]) {
      toast.error(PICK_MESSAGES[result.status]);
    }
  };

  const dropPhoto = () => {
    removePhoto(weddingId, values.photo.key);
    setValues((current) => ({ ...current, photo: null }));
  };
  const toggleMood = (mood) => {
    setValues((current) => ({
      ...current,
      moods: current.moods.includes(mood)
        ? current.moods.filter((item) => item !== mood)
        : [...current.moods, mood],
    }));
  };

  const save = () => {
    const result = validateVisionIdea(values);
    setErrors(result.errors);
    if (!result.isValid) return;
    if (!onSave({ ...values, title: values.title.trim(), note: values.note.trim(), saved: false })) return;
    setValues(EMPTY_IDEA);
    setErrors({});
  };

  return (
    <Stack gap="sm">
      <TextField
        label="Idea"
        value={values.title}
        onChangeText={(title) => setValues((current) => ({ ...current, title }))}
        error={errors.title}
        placeholder="Warm lanterns along the garden path"
        maxLength={90}
      />
      <Stack gap="xs">
        <Text variant="label">Area</Text>
        <Row gap="xs" wrap>
          {VISION_CATEGORIES.map((category) => (
            <Chip
              key={category.value}
              label={category.label}
              selected={values.category === category.value}
              onPress={() => setValues((current) => ({ ...current, category: category.value }))}
            />
          ))}
        </Row>
      </Stack>
      <Stack gap="xs">
        <Text variant="label">Feeling</Text>
        <Row gap="xs" wrap>
          {VISION_MOODS.map((mood) => (
            <Chip
              key={mood.value}
              label={mood.label}
              selected={values.moods.includes(mood.value)}
              onPress={() => toggleMood(mood.value)}
            />
          ))}
        </Row>
      </Stack>
      {PHOTOS_SUPPORTED ? (
        <Stack gap="xs">
          {preview ? (
            <Image
              source={{ uri: preview }}
              accessibilityLabel="Photo for this idea"
              style={{ width: '100%', aspectRatio: visionPhotoAspect(values.photo), borderRadius: radii.md }}
            />
          ) : null}
          <Row gap="xs">
            <Button
              label={values.photo ? 'Choose another photo' : 'Add a photo'}
              iconLeft="camera"
              variant="secondary"
              size="sm"
              fullWidth={false}
              loading={picking}
              disabled={picking || (photosFull && !values.photo)}
              onPress={addPhoto}
            />
            {values.photo ? (
              <Button label="Remove photo" variant="ghost" size="sm" fullWidth={false} onPress={dropPhoto} />
            ) : null}
          </Row>
          {photosFull && !values.photo ? (
            <Text variant="caption" color="subtle">
              {`The board holds ${MAX_VISION_PHOTOS} photos. Remove one to add another.`}
            </Text>
          ) : null}
        </Stack>
      ) : null}
      <TextField
        label="Notes (optional)"
        value={values.note}
        onChangeText={(note) => setValues((current) => ({ ...current, note }))}
        error={errors.note}
        placeholder="Why does this feel like you? What would it take?"
        multiline
        numberOfLines={3}
        maxLength={600}
      />
      <Button label="Save idea" iconLeft="plus" size="sm" onPress={save} />
    </Stack>
  );
}

export default VisionIdeaForm;
