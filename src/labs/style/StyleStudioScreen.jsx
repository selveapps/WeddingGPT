import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Linking } from 'react-native';

import {
  Stack,
  Row,
  Text,
  Card,
  Badge,
  Chip,
  Button,
  TextField,
  ProgressBar,
  SectionHeader,
  SegmentedControl,
  Touchable,
  useToast,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';

import { LabScreen } from '../shared/LabScreen';
import { selectItems, selectMeta } from '../shared/createCollectionStore';
import { shareText } from '../shared/share';
import { useLabStyleStore } from './store';
import {
  STYLE_QUIZ,
  MoodItemKind,
  normaliseLink,
  quizProgress,
  quizResult,
  rankPalettes,
  styleBrief,
} from './model';

const EMPTY_ANSWERS = {};

export default function StyleStudioScreen() {
  const toast = useToast();
  const items = useLabStyleStore(selectItems);
  const meta = useLabStyleStore(selectMeta);
  const { answer, choosePalette, clearQuiz, add, remove } = useLabStyleStore.getState();

  const answers = meta.answers ?? EMPTY_ANSWERS;
  const progress = quizProgress(answers);
  const result = useMemo(() => quizResult(answers), [answers]);
  const top = result[0];
  const palettes = useMemo(() => rankPalettes(top?.key), [top?.key]);

  const [kind, setKind] = useState(MoodItemKind.NOTE);
  const [draft, setDraft] = useState('');

  const addItem = () => {
    const text = kind === MoodItemKind.LINK ? normaliseLink(draft) : draft.trim();
    if (!text) {
      toast.warning(kind === MoodItemKind.LINK ? 'That does not look like a link' : 'Write something first');
      return;
    }
    add({ kind, text });
    setDraft('');
  };

  const share = async () => {
    const ok = await shareText(styleBrief({ answers, paletteKey: meta.paletteKey, items }), 'Our wedding style');
    if (!ok) toast.error('Sharing is not available here');
  };

  return (
    <LabScreen
      title="Style studio"
      intro="Find your style in five taps, pick a palette, and keep a moodboard you can send to vendors."
    >
      <Stack gap="sm">
        <SectionHeader
          title="Style quiz"
          actionLabel={progress.answered ? 'Start over' : undefined}
          onActionPress={clearQuiz}
          actionIcon="refresh"
        />
        <ProgressBar
          value={progress.answered / progress.total}
          label={`${progress.answered} of ${progress.total} answered`}
        />
        {STYLE_QUIZ.map((question) => (
          <Card key={question.id}>
            <Stack gap="sm">
              <Text variant="bodyStrong">{question.prompt}</Text>
              <Row gap="xs" wrap>
                {question.options.map((option) => (
                  <Chip
                    key={option.key}
                    size="sm"
                    label={option.label}
                    selected={answers[question.id] === option.key}
                    onPress={() => answer(question.id, option.key)}
                  />
                ))}
              </Row>
            </Stack>
          </Card>
        ))}
      </Stack>

      {top ? (
        <Card tone="brand">
          <Stack gap="xs">
            <Text variant="eyebrow" color="muted">
              {progress.complete ? 'Your style' : 'Leaning towards'}
            </Text>
            <Text variant="h2">{top.name}</Text>
            <Text variant="body" color="muted">
              {top.blurb}
            </Text>
            {result.slice(1, 3).map((entry) => (
              <Text key={entry.key} variant="caption" color="muted">
                {`${entry.name} - ${Math.round(entry.share * 100)}%`}
              </Text>
            ))}
          </Stack>
        </Card>
      ) : null}

      <Stack gap="sm">
        <SectionHeader title="Palette" />
        {palettes.map((palette) => (
          <PaletteRow
            key={palette.key}
            palette={palette}
            selected={meta.paletteKey === palette.key}
            onPress={() => choosePalette(palette.key)}
          />
        ))}
      </Stack>

      <Stack gap="sm">
        <SectionHeader title="Moodboard" />
        <SegmentedControl
          options={[
            { value: MoodItemKind.NOTE, label: 'Note' },
            { value: MoodItemKind.LINK, label: 'Link' },
          ]}
          value={kind}
          onChange={setKind}
        />
        <TextField
          value={draft}
          onChangeText={setDraft}
          placeholder={kind === MoodItemKind.LINK ? 'pinterest.com/our-board' : 'Peonies, not roses'}
          autoCapitalize={kind === MoodItemKind.LINK ? 'none' : 'sentences'}
          onSubmitEditing={addItem}
        />
        <Button label="Add to moodboard" variant="secondary" iconLeft="plus" onPress={addItem} />
        {items.map((item) => (
          <Card
            key={item.id}
            tone="muted"
            onPress={item.kind === MoodItemKind.LINK ? () => Linking.openURL(item.text) : undefined}
            onLongPress={() => remove(item.id)}
            accessibilityHint="Long press to remove"
          >
            <Row gap="sm">
              <Text variant="body" style={{ flex: 1 }} numberOfLines={3}>
                {item.text}
              </Text>
              {item.kind === MoodItemKind.LINK ? <Badge label="Link" tone="info" /> : null}
            </Row>
          </Card>
        ))}
      </Stack>

      <Button label="Share our style brief" iconLeft="send" onPress={share} disabled={!top && !items.length} />
    </LabScreen>
  );
}

function PaletteRow({ palette, selected, onPress }) {
  const { radii, colors, borderWidths } = useTheme();

  return (
    <Touchable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${palette.name} palette`}
    >
      <Row
        gap="sm"
        style={{
          padding: 10,
          borderRadius: radii.md,
          borderWidth: selected ? borderWidths.thick : borderWidths.hairline,
          borderColor: selected ? colors.brand : colors.border,
        }}
      >
        <Row gap="hair">
          {palette.colors.map((hex) => (
            <View key={hex} style={[styles.swatch, { backgroundColor: hex, borderRadius: radii.sm }]} />
          ))}
        </Row>
        <Text variant="body" style={{ flex: 1 }}>
          {palette.name}
        </Text>
        {palette.suggested ? <Badge label="Suggested" tone="brand" /> : null}
      </Row>
    </Touchable>
  );
}

const styles = StyleSheet.create({
  swatch: {
    width: 22,
    height: 22,
  },
});
