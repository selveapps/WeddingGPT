import React, { useState } from 'react';

import { Button, Stack, Text, TextField } from '@/design-system/components';
import { validateWeddingInquiry } from './weddingInquiryValidation';

/** Sample inquiry form demonstrating controlled fields and submit-time validation. */
export function Proto() {
	// Keep values together so validation and the submit result use one form snapshot.
	const [form, setForm] = useState({
		coupleNames: '',
		email: '',
		weddingDate: '',
		venue: '',
	});
	const [errors, setErrors] = useState({});
	const [submitted, setSubmitted] = useState(false);

	const updateField = (field, value) => {
		setForm((current) => ({ ...current, [field]: value }));
		// A previous success message no longer describes the edited form.
		setSubmitted(false);
	};

	const submit = () => {
		const nextErrors = validateWeddingInquiry(form);
		setErrors(nextErrors);
		// This prototype confirms locally; it does not send data to a server.
		if (Object.keys(nextErrors).length === 0) setSubmitted(true);
	};

	return (
		// Stack component with a gap between its children
		<Stack gap="lg">
			<Stack gap="xs">
				<Text variant="title">Wedding inquiry</Text>
				<Text variant="body" color="muted">
					Share a few details to get your planning started.
				</Text>
			</Stack>


			<Stack gap="md">
				<TextField
					label="Couple's names"
					value={form.coupleNames}
					onChangeText={(value) => updateField('coupleNames', value)}
					placeholder="Alex and Sam"
					autoCapitalize="words"
					error={errors.coupleNames}
					required
				/>
				<TextField
					label="Email address"
					value={form.email}
					onChangeText={(value) => updateField('email', value)}
					placeholder="you@example.com"
					keyboardType="email-address"
					autoCapitalize="none"
					autoCorrect={false}
					error={errors.email}
					required
				/>
				<TextField
					label="Wedding date"
					value={form.weddingDate}
					onChangeText={(value) => updateField('weddingDate', value)}
					placeholder="YYYY-MM-DD"
					error={errors.weddingDate}
					required
				/>
				<TextField
					label="Venue or city"
					value={form.venue}
					onChangeText={(value) => updateField('venue', value)}
					placeholder="Where are you celebrating?"
					autoCapitalize="words"
				/>
			</Stack>

			<Stack gap="sm">
				<Button label="Send inquiry" onPress={submit} />
				{submitted ? (
					<Text variant="body" color="success" accessibilityLiveRegion="polite">
						Inquiry ready for {form.coupleNames.trim()}.
					</Text>
				) : null}
			</Stack>
		</Stack>
	);
}

export default Proto;
