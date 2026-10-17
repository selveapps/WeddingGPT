import React, { useMemo, useState } from 'react';

import {
  Stack,
  Row,
  Text,
  TextField,
  Chip,
  Button,
  Checkbox,
  SectionHeader,
} from '@/design-system/components';
import {
  RsvpStatus,
  RSVP_STATUS_META,
  InvitationStatus,
  INVITATION_STATUS_META,
  PlusOneStatus,
  PLUS_ONE_STATUS_META,
  MealPreference,
  MEAL_PREFERENCE_META,
} from '@/models';
import { rules, validate } from '@/lib/validation';

/**
 * The add/edit form for a guest.
 *
 * Only the first name is required. A guest list starts as a list of names and
 * fills in over months - demanding an email before someone can be written down
 * is how half a guest list ends up in a notes app instead.
 */
export function GuestForm({
  initial,
  households = [],
  submitLabel = 'Save',
  onSubmit,
  onCancel,
}) {
  const [firstName, setFirstName] = useState(initial?.firstName ?? '');
  const [lastName, setLastName] = useState(initial?.lastName ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [householdId, setHouseholdId] = useState(initial?.householdId ?? null);
  const [rsvpStatus, setRsvpStatus] = useState(initial?.rsvpStatus ?? RsvpStatus.PENDING);
  const [invitationStatus, setInvitationStatus] = useState(
    initial?.invitationStatus ?? InvitationStatus.NOT_SENT
  );
  const [plusOneStatus, setPlusOneStatus] = useState(
    initial?.plusOneStatus ?? PlusOneStatus.NOT_ALLOWED
  );
  const [plusOneName, setPlusOneName] = useState(initial?.plusOneName ?? '');
  const [mealPreference, setMealPreference] = useState(
    initial?.mealPreference ?? MealPreference.UNSPECIFIED
  );
  const [dietaryNotes, setDietaryNotes] = useState(initial?.dietaryNotes ?? '');
  const [tagText, setTagText] = useState((initial?.tags ?? []).join(', '));
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [isChild, setIsChild] = useState(Boolean(initial?.isChild));
  const [errors, setErrors] = useState({});

  const nameRules = useMemo(
    () => [rules.required('A first name'), rules.maxLength(60, 'The first name')],
    []
  );

  const submit = () => {
    const nextErrors = {};

    const nameError = validate(firstName, nameRules);
    if (nameError) nextErrors.firstName = nameError;

    const emailError = validate(email, [rules.email()]);
    if (emailError) nextErrors.email = emailError;

    const phoneError = validate(phone, [rules.phone()]);
    if (phoneError) nextErrors.phone = phoneError;

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});

    onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      // Empty strings become null so "no email" is one value everywhere rather
      // than two that behave differently in every check downstream.
      email: email.trim() || null,
      phone: phone.trim() || null,
      householdId,
      rsvpStatus,
      invitationStatus,
      plusOneStatus,
      plusOneName: plusOneStatus === PlusOneStatus.NOT_ALLOWED ? '' : plusOneName.trim(),
      mealPreference,
      dietaryNotes: dietaryNotes.trim(),
      tags: tagText
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      notes: notes.trim(),
      isChild,
    });
  };

  return (
    <Stack gap="lg">
      <Stack gap="md">
        <TextField
          label="First name"
          value={firstName}
          onChangeText={(next) => {
            setFirstName(next);
            if (errors.firstName) setErrors((e) => ({ ...e, firstName: undefined }));
          }}
          placeholder="Meera"
          error={errors.firstName}
          autoCapitalize="words"
          autoFocus={!initial}
          required
        />

        <TextField
          label="Last name"
          value={lastName}
          onChangeText={setLastName}
          placeholder="Optional"
          autoCapitalize="words"
        />

        <TextField
          label="Email"
          value={email}
          onChangeText={(next) => {
            setEmail(next);
            if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
          }}
          placeholder="Optional"
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextField
          label="Phone"
          value={phone}
          onChangeText={(next) => {
            setPhone(next);
            if (errors.phone) setErrors((e) => ({ ...e, phone: undefined }));
          }}
          placeholder="Optional"
          error={errors.phone}
          keyboardType="phone-pad"
        />
      </Stack>

      {households.length > 0 ? (
        <Stack gap="sm">
          <SectionHeader
            eyebrow="Who they come with"
            title="Household"
            subtitle="Invitations go to households, not to people."
          />
          <Row gap="xs" wrap align="flex-start">
            <Chip
              label="On their own"
              size="sm"
              selected={householdId === null}
              onPress={() => setHouseholdId(null)}
            />
            {households.map((household) => (
              <Chip
                key={household.id}
                label={household.name}
                size="sm"
                selected={householdId === household.id}
                onPress={() => setHouseholdId(household.id)}
              />
            ))}
          </Row>
        </Stack>
      ) : null}

      <Stack gap="sm">
        <SectionHeader eyebrow="Have they replied" title="RSVP" />
        <Row gap="xs" wrap align="flex-start">
          {Object.entries(RSVP_STATUS_META).map(([value, meta]) => (
            <Chip
              key={value}
              label={meta.label}
              size="sm"
              selected={rsvpStatus === value}
              onPress={() => setRsvpStatus(value)}
            />
          ))}
        </Row>
      </Stack>

      <Stack gap="sm">
        <SectionHeader eyebrow="Have they been asked" title="Invitation" />
        <Row gap="xs" wrap align="flex-start">
          {Object.entries(INVITATION_STATUS_META).map(([value, meta]) => (
            <Chip
              key={value}
              label={meta.label}
              size="sm"
              selected={invitationStatus === value}
              onPress={() => setInvitationStatus(value)}
            />
          ))}
        </Row>
      </Stack>

      <Stack gap="sm">
        <SectionHeader eyebrow="Bringing someone" title="Plus one" />
        <Row gap="xs" wrap align="flex-start">
          {Object.entries(PLUS_ONE_STATUS_META).map(([value, meta]) => (
            <Chip
              key={value}
              label={meta.label}
              size="sm"
              selected={plusOneStatus === value}
              onPress={() => setPlusOneStatus(value)}
            />
          ))}
        </Row>

        {plusOneStatus !== PlusOneStatus.NOT_ALLOWED ? (
          <TextField
            label="Their plus one"
            value={plusOneName}
            onChangeText={setPlusOneName}
            placeholder="Name, once you know it"
            autoCapitalize="words"
          />
        ) : null}
      </Stack>

      <Stack gap="sm">
        <SectionHeader eyebrow="At the table" title="Meal" />
        <Row gap="xs" wrap align="flex-start">
          {Object.entries(MEAL_PREFERENCE_META).map(([value, meta]) => (
            <Chip
              key={value}
              label={meta.label}
              size="sm"
              selected={mealPreference === value}
              onPress={() => setMealPreference(value)}
            />
          ))}
        </Row>

        <TextField
          label="Dietary notes"
          value={dietaryNotes}
          onChangeText={setDietaryNotes}
          placeholder="Allergies, or anything the caterer must know"
          autoCapitalize="sentences"
        />

        <Checkbox
          checked={isChild}
          onChange={setIsChild}
          round={false}
          label="This guest is a child"
        />
      </Stack>

      <Stack gap="sm">
        <SectionHeader eyebrow="Anything else" title="Tags and notes" />
        <TextField
          label="Tags"
          value={tagText}
          onChangeText={setTagText}
          placeholder="Family, college, work - separated by commas"
          helper="Useful later for seating and for chasing replies in groups."
          autoCapitalize="none"
        />
        <TextField
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Anything worth remembering about them."
          multiline
          numberOfLines={3}
          autoCapitalize="sentences"
        />
      </Stack>

      <Stack gap="xs">
        <Button label={submitLabel} onPress={submit} />
        {onCancel ? <Button label="Cancel" variant="ghost" onPress={onCancel} /> : null}
      </Stack>
    </Stack>
  );
}

export default GuestForm;
