/**
 * Navigation helpers for extension modules.
 * Use from tools hub or home quick-actions.
 */

import { listExtensionModules, EXTENSION_MODULE_META } from './extensions';

/**
 * Build a list of quick-action entries for a tools / labs screen.
 */
export function buildExtensionQuickActions(router) {
  return listExtensionModules().map((mod) => ({
    id: mod.id,
    title: mod.title,
    subtitle: mod.description,
    emoji: mod.emoji,
    onPress: () => {
      if (router?.push) router.push(mod.route);
    },
  }));
}

/**
 * Group modules for a sectioned UI.
 */
export function groupExtensionsByPhase() {
  const groups = {};
  for (const mod of listExtensionModules()) {
    const key = `Phase ${mod.phase}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(mod);
  }
  return groups;
}

export function resolveExtensionRoute(idOrRoute) {
  if (!idOrRoute) return null;
  if (idOrRoute.startsWith('/')) {
    return listExtensionModules().find((m) => m.route === idOrRoute) || null;
  }
  return EXTENSION_MODULE_META[idOrRoute] || null;
}
