import React, { useMemo, useState } from 'react';

import {
  Stack,
  Row,
  Text,
  TextField,
  Chip,
  Button,
  SectionHeader,
} from '@/design-system/components';
import {
  TaskPriority,
  TASK_PRIORITY_META,
  Assignee,
  ASSIGNEE_META,
} from '@/models';
import { rules, validate } from '@/lib/validation';
import { DateField } from '@/features/shared/DateField';

/**
 * The add/edit form for a task.
 *
 * One component for both, because "add" and "edit" differ only in what they
 * start from and what the submit button says - and two copies of a form is
 * exactly how two screens end up validating differently.
 *
 * Validation runs on submit rather than on every keystroke: telling someone
 * their title is too short while they are still typing the first letter is
 * noise, not help.
 */
export function TaskForm({ initial, categories = [], submitLabel = 'Save', onSubmit, onCancel }) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? null);
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? null);
  const [priority, setPriority] = useState(initial?.priority ?? TaskPriority.NORMAL);
  const [assignee, setAssignee] = useState(initial?.assignee ?? Assignee.UNASSIGNED);
  const [errors, setErrors] = useState({});

  const titleRules = useMemo(
    () => [rules.required('A task name'), rules.maxLength(120, 'The task name')],
    []
  );

  const submit = () => {
    const titleError = validate(title, titleRules);
    if (titleError) {
      setErrors({ title: titleError });
      return;
    }

    setErrors({});
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      notes: notes.trim(),
      categoryId,
      dueDate,
      priority,
      assignee,
    });
  };

  return (
    <Stack gap="lg">
      <Stack gap="md">
        <TextField
          label="What needs doing?"
          value={title}
          onChangeText={(next) => {
            setTitle(next);
            if (errors.title) setErrors({});
          }}
          placeholder="Book the photographer"
          error={errors.title}
          autoCapitalize="sentences"
          autoFocus={!initial}
          required
        />

        <TextField
          label="Any detail"
          value={description}
          onChangeText={setDescription}
          placeholder="What does done look like?"
          multiline
          numberOfLines={3}
          autoCapitalize="sentences"
        />
      </Stack>

      <Stack gap="sm">
        <SectionHeader eyebrow="When" title="Due date" />
        <DateField label="Due" value={dueDate} onChange={setDueDate} />
      </Stack>

      {categories.length > 0 ? (
        <Stack gap="sm">
          <SectionHeader eyebrow="Where it belongs" title="Category" />
          <Row gap="xs" wrap align="flex-start">
            <Chip
              label="None"
              size="sm"
              selected={categoryId === null}
              onPress={() => setCategoryId(null)}
            />
            {categories.map((category) => (
              <Chip
                key={category.id}
                label={category.name}
                size="sm"
                selected={categoryId === category.id}
                onPress={() => setCategoryId(category.id)}
              />
            ))}
          </Row>
        </Stack>
      ) : null}

      <Stack gap="sm">
        <SectionHeader eyebrow="How urgent" title="Priority" />
        <Row gap="xs" wrap align="flex-start">
          {Object.entries(TASK_PRIORITY_META).map(([value, meta]) => (
            <Chip
              key={value}
              label={meta.label}
              selected={priority === value}
              onPress={() => setPriority(value)}
            />
          ))}
        </Row>
      </Stack>

      <Stack gap="sm">
        <SectionHeader eyebrow="Whose job" title="Assigned to" />
        <Row gap="xs" wrap align="flex-start">
          {Object.entries(ASSIGNEE_META).map(([value, meta]) => (
            <Chip
              key={value}
              label={meta.label}
              size="sm"
              selected={assignee === value}
              onPress={() => setAssignee(value)}
            />
          ))}
        </Row>
      </Stack>

      <Stack gap="sm">
        <SectionHeader eyebrow="Anything else" title="Notes" />
        <TextField
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Quotes, phone numbers, what you decided and why."
          multiline
          numberOfLines={4}
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

export default TaskForm;
