import React, { useMemo } from 'react';
import { View } from 'react-native';

import { Text, Row } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';

/**
 * Renders assistant replies.
 *
 * Both providers write "markdown-lite": paragraphs, `- ` bullets, `1. ` lists,
 * `### ` headings, `**bold**` and `*italic*`. That subset covers every answer
 * the assistant gives, and parsing it here keeps us off a full markdown
 * dependency - and off raw asterisks showing up in a chat bubble.
 */

function parseBlocks(text) {
  const blocks = [];
  for (const raw of String(text ?? '').split('\n')) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      blocks.push({ type: 'gap' });
      continue;
    }
    const heading = line.match(/^#{1,4}\s+(.*)$/);
    if (heading) {
      blocks.push({ type: 'heading', text: heading[1] });
      continue;
    }
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    if (bullet) {
      blocks.push({ type: 'bullet', marker: '•', text: bullet[1] });
      continue;
    }
    const numbered = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
    if (numbered) {
      blocks.push({ type: 'bullet', marker: `${numbered[1]}.`, text: numbered[2] });
      continue;
    }
    blocks.push({ type: 'para', text: line });
  }
  // Collapse runs of blank lines, and drop leading/trailing ones.
  return blocks.filter(
    (block, i, all) => block.type !== 'gap' || (i > 0 && i < all.length - 1 && all[i - 1].type !== 'gap')
  );
}

/** Split `**bold**` and `*italic*` into styled runs. */
function Inline({ text, color, variant }) {
  const parts = String(text).split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g).filter(Boolean);
  return (
    <Text variant={variant} color={color} selectable>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <Text key={i} variant="bodyStrong" color={color}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
          return (
            <Text key={i} variant={variant} color={color} style={{ fontStyle: 'italic' }}>
              {part.slice(1, -1)}
            </Text>
          );
        }
        return part;
      })}
    </Text>
  );
}

export function MessageText({ text, color = 'default' }) {
  const { spacing } = useTheme();
  const blocks = useMemo(() => parseBlocks(text), [text]);

  return (
    <View>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'gap':
            return <View key={i} style={{ height: spacing.xs }} />;
          case 'heading':
            return (
              <Text key={i} variant="h4" color={color} style={{ marginTop: i ? spacing.xxs : 0 }}>
                {block.text}
              </Text>
            );
          case 'bullet':
            return (
              <Row key={i} gap="xs" align="flex-start" style={{ marginTop: spacing.hair }}>
                <Text variant="body" color="accent" style={{ minWidth: 14 }}>
                  {block.marker}
                </Text>
                <View style={{ flex: 1 }}>
                  <Inline text={block.text} color={color} variant="body" />
                </View>
              </Row>
            );
          default:
            return <Inline key={i} text={block.text} color={color} variant="body" />;
        }
      })}
    </View>
  );
}

export default MessageText;
