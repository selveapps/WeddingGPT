// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const globals = require('globals');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      'dist/*',
      '.expo/*',
      'node_modules/*',
      'server/ai-proxy/node_modules/*',
      'WeddingGPT/*',
      // Unfinished extended-feature modules: files are missing and nothing
      // imports them (src/features/index.js leaves them out). Finish or
      // delete them, then take them off this list.
      'src/features/CocktailHourFlow/*',
      'src/features/LinenColorMatcher/*',
      'src/features/SeatingChartAIPro/**',
      'src/features/TulleDrapeDesigner/*',
    ],
  },
  {
    // Resolve the `@/` alias from jsconfig.json.
    settings: { 'import/resolver': { typescript: { project: './jsconfig.json' } } },
    rules: {
      // Default + named exports of the same component are a deliberate pattern here.
      'import/no-named-as-default': 'off',
      'react/no-unescaped-entities': 'warn',
      // React Compiler advice: worth fixing over time, not worth failing CI over.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
    },
  },
  {
    files: ['server/**/*.mjs', 'scripts/**/*.mjs', '*.config.js'],
    languageOptions: { globals: globals.node },
  },
  {
    // The proxy has its own package.json; CI installs only the app's deps.
    files: ['server/ai-proxy/**/*.mjs'],
    rules: { 'import/no-unresolved': ['error', { ignore: ['^@anthropic-ai/'] }] },
  },
  {
    files: ['**/__tests__/**', '**/*.test.js', 'jest.setup.js'],
    languageOptions: { globals: globals.jest },
  },
]);
