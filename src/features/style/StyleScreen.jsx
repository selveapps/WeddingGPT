import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import {
  Badge,
  Button,
  Card,
  Chip,
  ListRow,
  ProgressBar,
  Row,
  Screen,
  ScreenHeader,
  SectionHeader,
  Stack,
  Text,
  Touchable,
  useToast,
} from '@/design-system/components';
import { useTheme } from '@/design-system/theme';
import { Routes } from '@/navigation/routes';
import { useWeddingStore, selectWedding } from '@/store';
import {
  STYLE_QUIZ,
  WEDDING_STYLES,
  quizProgress,
  quizResult,
  rankPalettes,
  styleBrief,
  topStyleKeys,
} from '@/models';
import { VISION_FIELD } from '@/features/profile/visionBoard/lib/visionConstants';
import { shareText } from '@/services/share';

import { importLabStyle } from './labsImport';

const EMPTY = {};

/**
 * Find your style (graduated from the Labs style studio): five quick
 * questions, a palette that suits the answer, and a brief to send the
 * planner or florist. Everything is saved on the wedding, so it syncs; ideas
 * live in the profile's vision board, and the brief includes them.
 */
export function StyleScreen() {
  const router = useRouter();
  const toast = useToast();
  const { spacing } = useTheme();
  const wedding = useWeddingStore(selectWedding);
  const updateWedding = useWeddingStore((state) => state.updateWedding);

  useEffect(() => {
    importLabStyle();
  }, [wedding?.id]);

  const answers = wedding?.styleQuizAnswers ?? EMPTY;
  const progress = quizProgress(answers);
  const result = useMemo(() => quizResult(answers), [answers]);
  const top = result[0];
  const palettes = useMemo(() => rankPalettes(top?.key), [top?.key]);
  const ideas = Array.isArray(wedding?.[VISION_FIELD]) ? wedding[VISION_FIELD] : [];
  const saved = new Set(wedding?.styleTags ?? []);
  const suggested = topStyleKeys(answers);
  const isSaved =
    suggested.length > 0 && suggested.every((key) => saved.has(key)) && saved.size === suggested.length;

  if (!wedding) {
    return (
      <Screen>
        <ScreenHeader eyebrow="Planning" title="Your style" />
        <Text variant="body" color="muted">
          Set up your wedding first, then come back to find your style.
        </Text>
      </Screen>
    );
  }

  const answer = (questionId, optionKey) =>
    updateWedding({ styleQuizAnswers: { ...answers, [questionId]: optionKey } });

  const saveStyle = () => {
    updateWedding({ styleTags: suggested });
    const names = suggested
      .map((key) => WEDDING_STYLES.find((style) => style.key === key)?.name)
      .filter(Boolean);
    toast.success(`Saved as your style: ${names.join(' and ')}`);
  };

  const share = async () => {
    const ok = await shareText(
      styleBrief({ answers, paletteKey: wedding.paletteKey, ideas }),
      'Our wedding style'
    );
    if (!ok) toast.error('Sharing is not available here');
  };

  return (
    <Screen
      bottomInset={spacing.xxl}
      footer={
        <Button
          label="Share our style brief"
          iconLeft="send"
          disabled={!top && !wedding.paletteKey && !ideas.length}
          onPress={share}
        />
      }
    >
      <Stack gap="lg">
        <ScreenHeader eyebrow="Planning" title="Your style" />

        <Stack gap="sm">
          <SectionHeader
            title="Style quiz"
            subtitle="Five taps. Pick what feels right, not what you think you should."
            actionLabel={progress.answered ? 'Start over' : undefined}
            actionIcon="refresh"
            onActionPress={() => updateWedding({ styleQuizAnswers: {} })}
          />
          <ProgressBar value={progress.answered / progress.total} />
          <Text variant="caption" color="subtle">
            {`${progress.answered} of ${progress.total} answered`}
          </Text>
          {STYLE_QUIZ.map((question) => (
            <Card key={question.id}>
              <Stack gap="sm">
                <Text variant="bodyStrong">{question.prompt}</Text>
                <Row gap="xs" wrap align="flex-start">
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
          <Card tone="raised">
            <Stack gap="xs">
              <Text variant="eyebrow" color="subtle">
                {progress.complete ? 'Your style' : 'Leaning towards'}
              </Text>
              <Text variant="h2" heading>
                {top.name}
              </Text>
              <Text variant="body" color="muted">
                {top.blurb}
              </Text>
              {result.slice(1, 3).map((entry) => (
                <Text key={entry.key} variant="caption" color="muted">
                  {`${entry.name} - ${Math.round(entry.share * 100)}%`}
                </Text>
              ))}
              {progress.complete ? (
                isSaved ? (
                  <Badge label="Saved as your style" tone="success" icon="check" />
                ) : (
                  <Button label="Save as our style" variant="secondary" size="sm" onPress={saveStyle} />
                )
              ) : null}
            </Stack>
          </Card>
        ) : null}

        <Stack gap="sm">
          <SectionHeader
            title="Palette"
            subtitle={
              top ? `The first ones suit ${top.name.toLowerCase()}.` : 'Answer the quiz to see suggestions.'
            }
          />
          {palettes.map((palette) => (
            <PaletteRow
              key={palette.key}
              palette={palette}
              selected={wedding.paletteKey === palette.key}
              onPress={() => updateWedding({ paletteKey: palette.key })}
            />
          ))}
        </Stack>

        <Card padding="none">
          <ListRow
            icon="vision"
            title="Vision board"
            subtitle={
              ideas.length
                ? `${ideas.length} ${ideas.length === 1 ? 'idea' : 'ideas'} saved - they go in the brief too`
                : 'Collect flowers, outfits and details you love'
            }
            onPress={() => router.push(Routes.profile)}
          />
        </Card>
      </Stack>
    </Screen>
  );
}

function PaletteRow({ palette, selected, onPress }) {
  const { radii, colors, borderWidths, spacing } = useTheme();
  return (
    <Touchable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${palette.name} palette`}
    >
      <Row
        gap="sm"
        align="center"
        style={{
          padding: spacing.sm,
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
        {selected ? (
          <Badge label="Chosen" tone="success" />
        ) : palette.suggested ? (
          <Badge label="Suggested" tone="brand" />
        ) : null}
      </Row>
    </Touchable>
  );
}

const styles = StyleSheet.create({
  swatch: { width: 22, height: 22 },
});

export default StyleScreen;
