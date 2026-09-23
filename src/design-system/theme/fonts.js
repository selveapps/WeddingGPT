/**
 * The font map handed to `useFonts()`.
 *
 * Keys here MUST match `fontFamilies` in the typography tokens - that is the
 * only contract tying a style token to a real font file.
 *
 * Note the deep `require` paths rather than named imports from the package
 * root. The barrel index of an @expo-google-fonts package re-exports every
 * weight *and* every italic, and Metro has no way to tree-shake a `require`
 * graph - importing from the root pulled ~1.4MB of unused TTFs into the bundle.
 * Requiring each file directly keeps us to the eight faces we actually render.
 *
 * We load four weights per family and no italics: the brand leans on size and
 * colour for hierarchy, and every extra face is bundle weight the user waits on
 * at first launch.
 */
export const appFonts = {
  'Fraunces-Regular': require('@expo-google-fonts/fraunces/400Regular/Fraunces_400Regular.ttf'),
  'Fraunces-Medium': require('@expo-google-fonts/fraunces/500Medium/Fraunces_500Medium.ttf'),
  'Fraunces-SemiBold': require('@expo-google-fonts/fraunces/600SemiBold/Fraunces_600SemiBold.ttf'),
  'Fraunces-Bold': require('@expo-google-fonts/fraunces/700Bold/Fraunces_700Bold.ttf'),

  'DMSans-Regular': require('@expo-google-fonts/dm-sans/400Regular/DMSans_400Regular.ttf'),
  'DMSans-Medium': require('@expo-google-fonts/dm-sans/500Medium/DMSans_500Medium.ttf'),
  'DMSans-SemiBold': require('@expo-google-fonts/dm-sans/600SemiBold/DMSans_600SemiBold.ttf'),
  'DMSans-Bold': require('@expo-google-fonts/dm-sans/700Bold/DMSans_700Bold.ttf'),
};

export const appFontNames = Object.keys(appFonts);
