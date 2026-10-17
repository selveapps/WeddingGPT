import React, { useState } from 'react';
import { TextInput, View } from 'react-native';

import { Touchable, Icon, Row } from '@/design-system/components';
import { useTheme } from '@/design-system/theme';

const MAX_LENGTH = 2000;

/**
 * The message box. Grows with the text up to a few lines, sends on the arrow,
 * and is disabled (with the reason in its placeholder) while a reply is still
 * arriving - one question at a time keeps the conversation readable.
 */
export function Composer({ onSend, busy = false, autoFocus = false, placeholder = 'Ask anything about your wedding' }) {
  const { colors, spacing, radii, text: textStyles } = useTheme();
  const [value, setValue] = useState('');

  const canSend = value.trim().length > 0 && !busy;

  const send = () => {
    if (!canSend) return;
    onSend(value.trim());
    setValue('');
  };

  return (
    <Row gap="xs" align="flex-end">
      <View
        style={{
          flex: 1,
          minHeight: 48,
          maxHeight: 140,
          justifyContent: 'center',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        }}
      >
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder={busy ? 'WeddingGPT is replying...' : placeholder}
          placeholderTextColor={colors.inkSubtle}
          multiline
          maxLength={MAX_LENGTH}
          autoFocus={autoFocus}
          accessibilityLabel="Message WeddingGPT"
          style={[textStyles.body, { color: colors.ink, paddingVertical: 4, maxHeight: 124 }]}
          onSubmitEditing={send}
          blurOnSubmit={false}
          returnKeyType="send"
          submitBehavior="submit"
        />
      </View>

      <Touchable
        onPress={send}
        disabled={!canSend}
        haptic="light"
        accessibilityLabel="Send message"
        style={{
          width: 48,
          height: 48,
          borderRadius: radii.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: canSend ? colors.brand : colors.surfaceSunken,
        }}
      >
        <Icon name="send" size="md" color={canSend ? 'inkOnBrand' : 'inkSubtle'} />
      </Touchable>
    </Row>
  );
}

export default Composer;
