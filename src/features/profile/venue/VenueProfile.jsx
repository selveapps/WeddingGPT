import React, { useEffect, useMemo, useState } from 'react';
import { Linking } from 'react-native';

import { Badge, Button, Card, Row, Stack, Text, TextField, useToast } from '@/design-system/components';
import { useWeddingStore, selectWedding } from '@/store/weddingStore';
import { shareText } from '@/services/share';

import {
  buildVenueProfilePatch,
  assessVenueReadiness,
  venueProfileFromWedding,
  venueProfileShareText,
  validateVenueProfile,
} from './lib/venueProfileHelpers';

export function VenueProfile() {
  const wedding = useWeddingStore(selectWedding);
  const updateWedding = useWeddingStore((state) => state.updateWedding);
  const toast = useToast();
  const savedValues = useMemo(() => venueProfileFromWedding(wedding), [wedding]);
  const readiness = useMemo(
    () => assessVenueReadiness(values, wedding?.guestCountEstimate),
    [values, wedding?.guestCountEstimate]
  );
  const [values, setValues] = useState(savedValues);
  const [errors, setErrors] = useState({});
  const [savedSnapshot, setSavedSnapshot] = useState(savedValues);

  useEffect(() => {
    setValues(savedValues);
    setSavedSnapshot(savedValues);
    setErrors({});
  }, [savedValues]);

  const dirty = Object.keys(savedSnapshot).some((key) => values[key] !== savedSnapshot[key]);

  const setField = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const save = () => {
    const result = validateVenueProfile(values);
    setErrors(result.errors);
    if (!result.isValid) return;

    updateWedding(buildVenueProfilePatch(values));
    toast.success('Venue details saved');
  };

  const openMaps = async () => {
    const address = [values.venueName, values.address].filter(Boolean).join(', ');
    if (!address) {
      toast.info('Add a venue name or address first.');
      return;
    }

    try {
      await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`);
    } catch {
      toast.error('Could not open maps.');
    }
  };

  const openPhone = async () => {
    const phone = values.contactPhone.trim();
    if (!phone) {
      toast.info('Add the venue phone number first.');
      return;
    }

    try {
      await Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`);
    } catch {
      toast.error('Could not open the phone app.');
    }
  };

  const shareVenueBrief = async () => {
    const shared = await shareText(venueProfileShareText(values), 'Wedding venue brief');
    if (shared) toast.success('Venue brief shared');
    else toast.error('Could not share the venue brief.');
  };

  return (
    <Stack gap="lg" testID="profile-venue-details">
      <Stack gap="xs">
        <Text variant="bodySm" color="muted">
          Keep practical venue information here so it is easy to find while planning and on the wedding day.
          These details stay in your wedding workspace on this device.
        </Text>
      </Stack>

      <Card tone={readiness.complete && !readiness.capacityExceeded ? 'brand' : 'plain'}>
        <Stack gap="sm">
          <Row gap="sm" align="center">
            <Text variant="bodyStrong" style={{ flex: 1 }}>
              Venue readiness
            </Text>
            <Badge
              label={
                readiness.capacityExceeded
                  ? 'Capacity check'
                  : readiness.complete
                    ? 'Details covered'
                    : `${readiness.missing.length} details to add`
              }
              tone={readiness.capacityExceeded ? 'warning' : readiness.complete ? 'success' : 'neutral'}
            />
          </Row>
          {readiness.capacityExceeded ? (
            <Text variant="bodySm" color="muted">
              Your estimated {readiness.estimatedGuests} guests exceed this venue’s capacity of{' '}
              {readiness.capacity}. Confirm the venue limit or update your guest estimate.
            </Text>
          ) : readiness.missing.length ? (
            <Text variant="bodySm" color="muted">
              Still to add: {readiness.missing.join(', ')}.
            </Text>
          ) : (
            <Text variant="bodySm" color={readiness.complete ? 'brandSoftInk' : 'muted'}>
              Venue contact details, address and a backup plan are ready to refer to.
            </Text>
          )}
          {readiness.capacity && readiness.estimatedGuests && !readiness.capacityExceeded ? (
            <Text variant="caption" color="subtle">
              {readiness.estimatedGuests} estimated guests · {readiness.capacity} venue capacity
            </Text>
          ) : null}
        </Stack>
      </Card>

      <Card>
        <Stack gap="md">
          <Text variant="bodyStrong">Venue contact</Text>
          <TextField
            label="Venue name"
            value={values.venueName}
            onChangeText={(value) => setField('venueName', value)}
            placeholder="Venue or property name"
            maxLength={120}
          />
          <TextField
            label="Street address"
            value={values.address}
            onChangeText={(value) => setField('address', value)}
            placeholder="Street, city, region and postal code"
            maxLength={240}
          />
          <Row gap="sm" wrap>
            <Button
              label="Open in maps"
              variant="secondary"
              size="sm"
              iconLeft="location"
              onPress={openMaps}
            />
          </Row>
          <TextField
            label="Venue contact name"
            value={values.contactName}
            onChangeText={(value) => setField('contactName', value)}
            placeholder="Coordinator or venue manager"
            maxLength={100}
          />
          <TextField
            label="Venue contact phone"
            value={values.contactPhone}
            onChangeText={(value) => setField('contactPhone', value)}
            placeholder="Phone number"
            keyboardType="phone-pad"
            error={errors.contactPhone}
            maxLength={30}
          />
          <Button label="Call venue" variant="secondary" size="sm" iconLeft="phone" onPress={openPhone} />
        </Stack>
      </Card>

      <Card>
        <Stack gap="md">
          <Text variant="bodyStrong">Day-of logistics</Text>
          <TextField
            label="Guest capacity"
            value={values.guestCapacity}
            onChangeText={(value) => setField('guestCapacity', value)}
            placeholder="Maximum number of guests"
            keyboardType="number-pad"
            error={errors.guestCapacity}
            maxLength={6}
          />
          <TextField
            label="Access and setup notes"
            value={values.accessNotes}
            onChangeText={(value) => setField('accessNotes', value)}
            placeholder="Load-in times, parking, accessibility or setup restrictions"
            multiline
            numberOfLines={4}
            maxLength={1000}
          />
          <TextField
            label="Venue rules and restrictions"
            value={values.restrictions}
            onChangeText={(value) => setField('restrictions', value)}
            placeholder="Noise limits, decor rules, curfew or approved suppliers"
            multiline
            numberOfLines={4}
            maxLength={1000}
          />
          <TextField
            label="Weather or contingency plan"
            value={values.contingencyPlan}
            onChangeText={(value) => setField('contingencyPlan', value)}
            placeholder="Rain plan, backup room, power or transport arrangements"
            multiline
            numberOfLines={4}
            maxLength={1000}
          />
        </Stack>
      </Card>

      <Button
        label={dirty ? 'Save venue details' : 'Venue details saved'}
        variant={dirty ? 'primary' : 'secondary'}
        iconLeft={dirty ? undefined : 'check'}
        disabled={!dirty}
        onPress={save}
        testID="profile-venue-save"
      />
      <Button
        label="Share venue brief"
        variant="secondary"
        iconLeft="send"
        disabled={!values.venueName.trim() && !values.address.trim()}
        onPress={shareVenueBrief}
      />
    </Stack>
  );
}

export default VenueProfile;
