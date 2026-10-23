import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from '@/design-system/theme';
import { ToastProvider } from '@/design-system/components';

/**
 * Render a screen or component inside the providers the app wraps everything
 * in (safe area, theme, toasts), and helpers to find and press things the way
 * a screen reader would: by accessibility label.
 */

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

export async function renderWithProviders(element) {
  let tree;
  await act(async () => {
    tree = renderer.create(
      <SafeAreaProvider initialMetrics={METRICS}>
        <ThemeProvider>
          <ToastProvider>{element}</ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    );
  });
  return tree;
}

/** Every piece of text on screen. */
export function shownTexts(tree) {
  return tree.root
    .findAll((node) => typeof node.children?.[0] === 'string')
    .map((node) => node.children.join(''));
}

const isPressable = (label) => (node) =>
  node.props.accessibilityLabel === label && typeof node.props.onPress === 'function';

/**
 * All pressable elements with this accessibility label, one per control. The
 * test renderer shows both a component and the element it renders, so only
 * the outermost match of each nested chain is kept.
 */
export function pressables(tree, label) {
  const matches = isPressable(label);
  return tree.root.findAll(matches).filter((node) => {
    for (let parent = node.parent; parent; parent = parent.parent) {
      if (matches(parent)) return false;
    }
    return true;
  });
}

export function pressable(tree, label) {
  const [first] = pressables(tree, label);
  if (!first) throw new Error(`Nothing pressable labelled "${label}"`);
  return first;
}

export async function press(tree, label, index = 0) {
  const node = pressables(tree, label)[index];
  if (!node) throw new Error(`Nothing pressable labelled "${label}"`);
  await act(async () => node.props.onPress());
}

export { act };
